import type {
  AtlasGraph,
  AtlasMaterialNode,
  AtlasNode,
} from "../../lib/graph/builder";

/**
 * Atlas 渲染器 —— 手写 Canvas 2D（spike 决策的主实现）。
 *
 * 设计意图（计划 §3.2）：
 * - 纸面墨点星座：全部视觉来自 3-4 档墨色 + 唯一强调色，无发光、无渐变
 * - 状态编码用填充度：实心=done、半填=learning、空心=todo
 * - hover = 自我中心子图点亮；click = 侧栏详情
 * - LOD：远看星系名 → 中看子分类 → 近看材料名
 * - 事件驱动重绘（无连续 rAF 循环），prefers-reduced-motion 跳过入场
 */

export interface AtlasColors {
  ink: string;
  inkMid: string;
  inkFaint: string;
  line: string;
  accent: string;
}

export interface AtlasRendererOptions {
  canvas: HTMLCanvasElement;
  graph: AtlasGraph;
  colors: AtlasColors;
  onSelect?: (node: AtlasNode | null) => void;
  onStatus?: (text: string) => void;
  reducedMotion?: boolean;
}

interface Camera {
  x: number;
  y: number;
  zoom: number;
}

// 入场缓动 = easeOutCubic，与全局 --ease-snap cubic-bezier(0.2,0.8,0.2,1) 的手感一致
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

const LOD = {
  topLabel: 0, // 顶层分类标签：始终显示
  subLabel: 0.62, // 子分类标签
  materialLabel: 1.18, // 材料标签
} as const;

const ENTRANCE_MS = 900;

export class AtlasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private graph: AtlasGraph;
  private colors: AtlasColors;
  private opts: AtlasRendererOptions;

  private cam: Camera = { x: 0, y: 0, zoom: 0.42 };

  private hovered: AtlasNode | null = null;
  private selected: AtlasNode | null = null;

  private tagLinksVisible = true;
  private learnedOnly = false;

  private width = 0;
  private height = 0;
  private dpr = 1;
  private raf = 0;
  private entrance: { start: number } | null = null;

  // 交互状态机
  private dragging = false;
  private dragMoved = false;
  private lastPointer = { x: 0, y: 0 };
  private pointers = new Map<number, { x: number; y: number }>();
  private pinchStart = 0;

  private neighbors = new Map<string, Set<string>>();
  private cleanupFns: (() => void)[] = [];

  constructor(options: AtlasRendererOptions) {
    this.opts = options;
    this.canvas = options.canvas;
    this.graph = options.graph;
    this.colors = options.colors;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d unavailable");
    this.ctx = ctx;

    for (const link of this.graph.links) {
      let n1 = this.neighbors.get(link.source);
      if (!n1) {
        n1 = new Set();
        this.neighbors.set(link.source, n1);
      }
      n1.add(link.target);
      let n2 = this.neighbors.get(link.target);
      if (!n2) {
        n2 = new Set();
        this.neighbors.set(link.target, n2);
      }
      n2.add(link.source);
    }

    this.bindEvents();
    this.resize();
    this.fitToViewport(0.82);

    if (!options.reducedMotion) {
      this.entrance = { start: performance.now() };
      this.animate();
    } else {
      this.requestDraw();
    }
  }

  /** 初始视口自适应：整幅星图收进画布（留 padding 系数） */
  private fitToViewport(padding = 0.85): void {
    let maxX = 0;
    let maxY = 0;
    for (const n of this.graph.nodes) {
      maxX = Math.max(maxX, Math.abs(n.x));
      maxY = Math.max(maxY, Math.abs(n.y));
    }
    if (maxX === 0 && maxY === 0) return;
    const zoom = Math.min(
      ((this.width / 2) * padding) / (maxX + 40),
      ((this.height / 2) * padding) / (maxY + 40),
      1,
    );
    this.cam = { x: 0, y: 0, zoom };
  }

  /* ---------------- 公共 API ---------------- */

  setTagLinksVisible(v: boolean): void {
    this.tagLinksVisible = v;
    this.requestDraw();
  }

  setLearnedOnly(v: boolean): void {
    this.learnedOnly = v;
    this.requestDraw();
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    for (const fn of this.cleanupFns) fn();
    this.cleanupFns = [];
  }

  /* ---------------- 事件 ---------------- */

  private bindEvents(): void {
    const c = this.canvas;

    const onResize = () => this.resize();
    const ro = new ResizeObserver(onResize);
    ro.observe(c);
    this.cleanupFns.push(() => ro.disconnect());

    c.addEventListener("pointerdown", this.onPointerDown);
    c.addEventListener("pointermove", this.onPointerMove);
    c.addEventListener("pointerup", this.onPointerUp);
    c.addEventListener("pointercancel", this.onPointerUp);
    c.addEventListener("wheel", this.onWheel, { passive: false });
    c.addEventListener("click", this.onClick);
    // 触控默认手势（滚动/缩放）交给自定义处理
    c.style.touchAction = "none";
    this.cleanupFns.push(() => {
      c.removeEventListener("pointerdown", this.onPointerDown);
      c.removeEventListener("pointermove", this.onPointerMove);
      c.removeEventListener("pointerup", this.onPointerUp);
      c.removeEventListener("pointercancel", this.onPointerUp);
      c.removeEventListener("wheel", this.onWheel);
      c.removeEventListener("click", this.onClick);
    });
  }

  private onPointerDown = (e: PointerEvent): void => {
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.dragging = this.pointers.size === 1;
    this.dragMoved = false;
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.canvas.setPointerCapture(e.pointerId);
    if (this.pointers.size === 2) {
      this.pinchStart = this.pointerDistance();
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (this.pointers.has(e.pointerId)) {
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    // 双指捏合：距离比 → 以中点为锚缩放（手感微调属 M4）
    if (this.pointers.size === 2 && this.pinchStart > 0) {
      const dist = this.pointerDistance();
      if (dist > 0) {
        this.dragging = false; // 捏合期间不拖拽
        const mid = this.pointerMidpoint();
        this.zoomAt(mid.x, mid.y, dist / this.pinchStart);
        this.pinchStart = dist;
      }
      return;
    }
    if (this.dragging) {
      const dx = e.clientX - this.lastPointer.x;
      const dy = e.clientY - this.lastPointer.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) this.dragMoved = true;
      this.cam.x -= dx / this.cam.zoom;
      this.cam.y -= dy / this.cam.zoom;
      this.lastPointer = { x: e.clientX, y: e.clientY };
      this.requestDraw();
    } else {
      const node = this.hitTest(e.clientX, e.clientY);
      if (node !== this.hovered) {
        this.hovered = node;
        this.canvas.style.cursor = node ? "pointer" : "grab";
        this.requestDraw();
      }
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    this.pointers.delete(e.pointerId);
    if (this.pointers.size < 2) this.pinchStart = 0;
    this.dragging = this.pointers.size === 1;
    if (this.dragging) {
      const p = [...this.pointers.values()][0];
      this.lastPointer = { x: p.x, y: p.y };
    }
    this.canvas.style.cursor = this.hovered ? "pointer" : "grab";
  };

  private pointerDistance(): number {
    const [a, b] = [...this.pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  private pointerMidpoint(): { x: number; y: number } {
    const [a, b] = [...this.pointers.values()];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.0016);
    this.zoomAt(e.clientX, e.clientY, factor);
  };

  private onClick = (e: MouseEvent): void => {
    if (this.dragMoved) return; // 拖拽结束不触发选择
    const node = this.hitTest(e.clientX, e.clientY);
    this.selected = node;
    this.opts.onSelect?.(node);
    this.requestDraw();
  };

  private zoomAt(clientX: number, clientY: number, factor: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const px = clientX - rect.left - this.width / 2;
    const py = clientY - rect.top - this.height / 2;
    const zoom = Math.min(6, Math.max(0.12, this.cam.zoom * factor));
    // 缩放到指针位置：指针下的世界点保持不动
    //   wx = px/zoomOld + cam.x = px/zoomNew + cam.x'
    //   → cam.x' = cam.x + px/zoomOld - px/zoomNew
    this.cam.x = this.cam.x + px / this.cam.zoom - px / zoom;
    this.cam.y = this.cam.y + py / this.cam.zoom - py / zoom;
    this.cam.zoom = zoom;
    this.requestDraw();
  }

  /* ---------------- 坐标 ---------------- */

  private worldToScreen(x: number, y: number): [number, number] {
    return [
      (x - this.cam.x) * this.cam.zoom + this.width / 2,
      (y - this.cam.y) * this.cam.zoom + this.height / 2,
    ];
  }

  private screenToWorld(sx: number, sy: number): [number, number] {
    return [
      (sx - this.width / 2) / this.cam.zoom + this.cam.x,
      (sy - this.height / 2) / this.cam.zoom + this.cam.y,
    ];
  }

  /* ---------------- 命中测试 ---------------- */

  private hitTest(clientX: number, clientY: number): AtlasNode | null {
    const rect = this.canvas.getBoundingClientRect();
    const [wx, wy] = this.screenToWorld(
      clientX - rect.left,
      clientY - rect.top,
    );
    let best: AtlasNode | null = null;
    let bestD = Infinity;
    for (const node of this.graph.nodes) {
      if (!this.nodeVisible(node)) continue;
      const r = this.nodeRadius(node) + 5 / this.cam.zoom; // 命中容差（触控友好）
      const d = Math.hypot(node.x - wx, node.y - wy);
      if (d < r && d < bestD) {
        best = node;
        bestD = d;
      }
    }
    return best;
  }

  private nodeRadius(node: AtlasNode): number {
    if (node.kind === "category") return node.top ? 9 : 5;
    return (node as AtlasMaterialNode).size;
  }

  /** 屏幕半径：世界半径 × 部分缩放补偿（远看不至于消失，近看仍会变大） */
  private screenRadius(node: AtlasNode): number {
    const k = Math.max(0.9, Math.min(2.2, 0.75 + this.cam.zoom * 0.6));
    return this.nodeRadius(node) * k;
  }

  private nodeVisible(node: AtlasNode): boolean {
    if (this.learnedOnly && node.kind === "material") {
      return (node as AtlasMaterialNode).status === "done";
    }
    return true;
  }

  /* ---------------- 绘制 ---------------- */

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.max(1, Math.round(rect.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * this.dpr));
    this.requestDraw();
  }

  private requestDraw(): void {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.draw());
  }

  private animate(): void {
    const step = () => {
      if (!this.entrance) return;
      const t = Math.min(
        1,
        (performance.now() - this.entrance.start) / ENTRANCE_MS,
      );
      this.draw(easeOutCubic(t));
      if (t < 1) this.raf = requestAnimationFrame(step);
      else this.entrance = null;
    };
    this.raf = requestAnimationFrame(step);
  }

  /** 入场插值：节点从中心散开归位 */
  private posOf(node: AtlasNode, t: number): [number, number] {
    if (t >= 1) return [node.x, node.y];
    return [node.x * t, node.y * t];
  }

  private alphaOf(id: string, t: number): number {
    const base = t >= 1 ? 1 : 0.25 + 0.75 * t;
    const focus = this.hovered ?? this.selected;
    if (!focus) return base;
    if (focus.id === id) return base;
    const n = this.neighbors.get(focus.id);
    if (n?.has(id)) return base;
    return base * 0.13; // 非邻接淡出
  }

  private draw(t = 1): void {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);

    const positions = new Map<string, [number, number]>();
    for (const node of this.graph.nodes) {
      positions.set(node.id, this.posOf(node, t));
    }

    // 1) tag 边（虚线、最弱）——唯一用强调色的元素：跨星系的连线值得被看见
    if (this.tagLinksVisible) {
      ctx.save();
      ctx.setLineDash([3, 5]);
      ctx.lineWidth = 1;
      for (const link of this.graph.links) {
        if (link.kind !== "tag") continue;
        const a = positions.get(link.source);
        const b = positions.get(link.target);
        if (!a || !b) continue;
        const na = this.graph.nodes.find((n) => n.id === link.source);
        const nb = this.graph.nodes.find((n) => n.id === link.target);
        if (!na || !nb || !this.nodeVisible(na) || !this.nodeVisible(nb))
          continue;
        const alpha = Math.min(
          this.alphaOf(link.source, t),
          this.alphaOf(link.target, t),
        );
        const [ax, ay] = this.worldToScreen(a[0], a[1]);
        const [bx, by] = this.worldToScreen(b[0], b[1]);
        // 轻弧：弦中点沿垂直方向外弓（统一逆时针 → 与放射结构同向的螺旋感）
        const mx = (ax + bx) / 2;
        const my = (ay + by) / 2;
        const dx = bx - ax;
        const dy = by - ay;
        const len = Math.hypot(dx, dy) || 1;
        const bow = len * 0.14;
        const cx0 = mx + (-dy / len) * bow;
        const cy0 = my + (dx / len) * bow;
        ctx.strokeStyle = this.withAlpha(this.colors.accent, 0.45 * alpha);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(cx0, cy0, bx, by);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2) member 边（实、发丝）
    ctx.lineWidth = 1;
    for (const link of this.graph.links) {
      if (link.kind !== "member") continue;
      const a = positions.get(link.source);
      const b = positions.get(link.target);
      if (!a || !b) continue;
      const na = this.graph.nodes.find((n) => n.id === link.source);
      const nb = this.graph.nodes.find((n) => n.id === link.target);
      if (!na || !nb || !this.nodeVisible(na) || !this.nodeVisible(nb))
        continue;
      const alpha = Math.min(
        this.alphaOf(link.source, t),
        this.alphaOf(link.target, t),
      );
      const [ax, ay] = this.worldToScreen(a[0], a[1]);
      const [bx, by] = this.worldToScreen(b[0], b[1]);
      ctx.strokeStyle = this.withAlpha(this.colors.inkMid, 0.16 * alpha);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }

    // 3) 节点
    for (const node of this.graph.nodes) {
      if (!this.nodeVisible(node)) continue;
      const [x, y] = this.worldToScreen(
        ...(positions.get(node.id) ?? [node.x, node.y]),
      );
      const r = this.screenRadius(node);
      const alpha = this.alphaOf(node.id, t);
      const isSel = this.selected?.id === node.id;

      if (node.kind === "category") {
        if (node.top) {
          // 顶层：靶心（环 + 中点）
          ctx.strokeStyle = this.withAlpha(this.colors.inkMid, 0.85 * alpha);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = this.withAlpha(this.colors.ink, 0.9 * alpha);
          ctx.beginPath();
          ctx.arc(x, y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // 子分类：菱形（结构节点，与空心材料点区分）
          ctx.strokeStyle = this.withAlpha(this.colors.inkMid, 0.8 * alpha);
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(x, y - r);
          ctx.lineTo(x + r, y);
          ctx.lineTo(x, y + r);
          ctx.lineTo(x - r, y);
          ctx.closePath();
          ctx.stroke();
        }
      } else {
        const m = node as AtlasMaterialNode;
        switch (m.status) {
          case "done":
            ctx.fillStyle = this.withAlpha(this.colors.ink, 0.92 * alpha);
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
            break;
          case "learning":
            ctx.strokeStyle = this.withAlpha(this.colors.ink, 0.92 * alpha);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = this.withAlpha(this.colors.accent, 0.95 * alpha);
            ctx.beginPath();
            ctx.arc(x, y, r - 0.4, -Math.PI / 2, Math.PI / 2); // 右半填充 = 进行中
            ctx.closePath();
            ctx.fill();
            break;
          default: // todo：空心
            ctx.strokeStyle = this.withAlpha(this.colors.inkFaint, 0.9 * alpha);
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.stroke();
        }
      }

      // 选中环（唯一强调色的另一处用途）
      if (isSel) {
        ctx.strokeStyle = this.colors.accent;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(x, y, r + 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4) 标签（LOD 分级）
      this.drawLabel(node, x, y, r, alpha);
    }
  }

  private drawLabel(
    node: AtlasNode,
    x: number,
    y: number,
    r: number,
    alpha: number,
  ): void {
    const z = this.cam.zoom;
    if (node.kind === "category") {
      if (!node.top && z < LOD.subLabel) return;
      const fontSize = node.top ? 13 : 10.5;
      this.ctx.font = node.top
        ? `600 ${fontSize}px "Source Serif 4", "Noto Serif SC", serif`
        : `400 ${fontSize}px "IBM Plex Mono", monospace`;
      this.ctx.fillStyle = this.withAlpha(
        node.top ? this.colors.ink : this.colors.inkMid,
        (node.top ? 0.9 : 0.72) * alpha,
      );
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "top";
      const label = node.top ? node.label.toUpperCase() : node.label;
      if (node.top && "letterSpacing" in this.ctx) {
        (
          this.ctx as CanvasRenderingContext2D & { letterSpacing: string }
        ).letterSpacing = "2.5px";
      }
      this.ctx.fillText(label, x, y + r + 5);
      if ("letterSpacing" in this.ctx) {
        (
          this.ctx as CanvasRenderingContext2D & { letterSpacing: string }
        ).letterSpacing = "0px";
      }
      return;
    }
    if (z < LOD.materialLabel) return;
    const m = node as AtlasMaterialNode;
    const focused = this.hovered?.id === m.id || this.selected?.id === m.id;
    if (!focused && z < LOD.materialLabel + 0.25) return; // 未聚焦的材料标签需要更深一级
    this.ctx.font = '400 11px "Source Serif 4", "Noto Serif SC", serif';
    this.ctx.fillStyle = this.withAlpha(
      focused ? this.colors.ink : this.colors.inkMid,
      0.85 * alpha,
    );
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "top";
    this.ctx.fillText(m.label, x, y + r + 4);
  }

  private withAlpha(color: string, alpha: number): string {
    // color 形如 #rrggbb
    const r = Number.parseInt(color.slice(1, 3), 16);
    const g = Number.parseInt(color.slice(3, 5), 16);
    const b = Number.parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
  }
}
