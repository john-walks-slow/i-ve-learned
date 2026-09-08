#!/usr/bin/env bash
# 性能预算（计划 §6）：构建产物体积门禁。CI 在 build 后运行。
set -euo pipefail

DIST=dist
fail=0

check() { # label actual_bytes budget_bytes
  local label=$1 actual=$2 budget=$3
  if (( actual > budget )); then
    echo "✗ $label: $((actual / 1024))KB > 预算 $((budget / 1024))KB"
    fail=1
  else
    echo "✓ $label: $((actual / 1024))KB / 预算 $((budget / 1024))KB"
  fi
}

gz() { gzip -c "$1" | wc -c; }

# 首屏阻塞 JS：入口内联脚本之外的所有同步 chunk（本站为 0——交互全动态加载）
blocking=$(find "$DIST/_astro" -name '*.js' ! -name 'command-palette*' ! -name 'renderer*' ! -name 'timeline-enhance*' ! -name 'preload-helper*' -print0 2>/dev/null | xargs -0 cat 2>/dev/null | wc -c || echo 0)
check "首屏阻塞 JS (raw)" "$blocking" 5120

# 延迟包预算
palette=$(gz "$DIST/_astro/"command-palette.*.js)
check "⌘K 面板包 (gzip)" "$palette" 61440

renderer=$(gz "$DIST/_astro/"renderer.*.js 2>/dev/null || echo 0)
check "Atlas 渲染器包 (gzip)" "$renderer" 256000

si=$(gz "$DIST/search-index.json")
check "搜索索引 (gzip)" "$si" 102400

gj=$(gz "$DIST/graph.json")
check "图谱数据 (gzip)" "$gj" 256000

# 单页 HTML 中位数（内容页应有健康的 HTML/JS 比例）
# 预算语义：每页 ≤ 80KB raw
biggest=$(find "$DIST" -name 'index.html' -exec du -b {} + | sort -rn | head -1 | cut -f1)
check "最大单页 HTML (raw)" "$biggest" 81920

exit $fail
