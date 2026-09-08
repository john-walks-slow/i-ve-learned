# 「What I've Learned」设计灵感调研

> **调研目标**：为个人学习记录网站（首页 = 学习时间线；一个"帅气"的知识图谱/云图入口；一个待学清单页）寻找世界范围内优秀的同类或相近网站设计，分析其优秀的原因与具体设计手法，总结可借鉴与应避免的要点。
>
> **用户设计要求原话**："ux 希望简洁、高技术力而有新意。不要千篇一律的 ai 风格，也不要没有审美的炫技。"
>
> **方法**：桌面调研（数字花园、开发者作品集、时间线、知识图谱可视化、交互式简历五个方向的代表作与评析）+ 对 Histography、roadmap.sh、Maggie Appleton 三站做了浏览器实地考察（DOM/样式检查）。调研日期：2026-09。

---

## 1. 核心结论（TL;DR）

1. **"简洁 + 高技术力"的真实样本有一个共同点：技术力藏在细节里而不是开场动画里。** Rauno（Vercel 设计工程师）的个人站几乎没有"特效"，但每个 token 都经过推敲（实测其间距为 8px 阶梯、动效统一为 `cubic-bezier(.2,.8,.2,1)`）；Gwern.net 十六年打磨的是排版与超文本本身（侧注、弹出预览、双向链接），视觉上反而是刻意的灰度极简。
2. **最受好评的"知识图谱"不是力导向物理图，而是编辑手工布局的图。** roadmap.sh（GitHub 星标第 6 的项目，300K+ stars）本质是用图表编辑器画出来的确定性 SVG，再叠加交互（实测其 Frontend 路线图 163 个节点、蓝色虚线连接）；力导向图的代表 Obsidian Graph View 被大量用户评为"漂亮但几乎没用"。**帅气来自可控的构图，不是物理模拟。**
3. **时间线的优秀范式是"可缩放的时间标尺"**：Histography 用底部可拖拽的 era 滑条让 140 亿年历史在"十年 ↔ 亿年"间平滑缩放；Wait But Why 用"人生格子"把有限时间变得可感知；GitHub 贡献图用日历热力图表达活动密度。时间线 ≠ 一根竖线。
4. **数字花园领域已总结出成熟的内容架构模式**（Maggie Appleton）：按关联组织而非按时间（topography over timelines）、成长阶段标签（🌱 seedling / 🌿 budding / 🌳 evergreen）、"种下/最近照料"双时间戳、双向链接 + 反链上下文。这套元数据体系几乎可以直接平移到"学过/在学/想学"模型上。
5. **AI 生成网站已经有可检测的"指纹"**（Inter 字体、Tailwind blue/indigo 紫蓝渐变、玻璃拟态导航、三列等宽卡片、rounded-2xl、居中 hero + 眉标题 badge……），机理是模型向训练数据统计中心收敛。规避方法不是"加点花活"，而是**用具体约束替代模糊形容词**（具体色值、具体字体、具体缓动曲线、真实内容）。
6. **"无审美炫技"的判定标准是：效果是否服务于理解与导航。** Bruno Simon 的 3D 驾车作品集是"炫技"的正面教材——因为他是 3D 创意开发者，媒介即信息，且提供 `/html` 纯文本降级页；反之，为学习记录站套一个 WebGL 星系，只会让读者找不到入口。
7. **最值得偷的三样东西**：Gwern 的"语义缩放"（同一页面可从标题到全文逐层下钻）、roadmap.sh 的节点状态系统（done / in progress / skip，节点即进度）、Maggie 的类型系统（essay / note / talk / podcast / smidgeon / pattern —— 与本项目的"文章/视频/论文/博客/课程"一一对应）。
8. **速度本身就是设计**。Gwern 四原则之一是 speed（核心阅读体验不依赖 JS）；roadmap.sh 前 7 年跑在 GitHub Pages 上零基础设施成本。个人站的第一印象 50% 来自"秒开"。
9. **配色上，蓝/紫是最拥挤的赛道**。Gwern 对 225 个网站主色的统计显示红蓝两极分化严重（红 > 蓝 > 绿 > 紫 > 黄棕），他建议探索黄棕色域；Brittany Chiang（被 fork 最多的开发者作品集，14K+ stars）示范了"单一强调色纪律"的威力（深藏青底 + 一个薄荷绿 `#64ffda` 承担所有交互态）。
10. **花园社区的自我警告同样适用于本项目**："不要把花园的技术特性误当成园艺的精神"（Maggie）。反向链接、悬浮预览、图谱都只是特性；站点真正的价值是持续生长的真实内容与诚实的元数据。

---

## 2. 同类网站案例研究

### 2.1 数字花园 / 个人知识库（与"学过的东西"最同构）

#### Maggie Appleton — maggieappleton.com/garden（数字花园的标杆）

**是什么**：产品设计师/人类学家，数字花园运动的布道者。实地考察其花园首页：166 个条目，顶部为**主题筛选条**（横滑 chips：Web Development / Design / Anthropology / AI…）、**成长阶段筛选**（All Growth Stages 下拉）与**类型筛选**（All Types 下拉），下方为卡片流。每张卡片：标题 + 一句话描述 + 类型徽标 + 相对时间（"18 days ago"）。

**为什么优秀**：
- 她定义了领域语言。其长文《A Brief History & Ethos of the Digital Garden》总结出核心模式：**按地形组织而非时间线**（topography over timelines）、**持续生长**（没有"最终版本"）、**不完美与进行中**（用成长阶段标记完成度）、**玩法化、个人化、实验性**（花园应当像真花园一样彼此不同）、**致密互链**、**自有空间**。
- **成长阶段系统**：🌱 Seedling（粗糙早期想法）/ 🌿 Budding（已清理澄清）/ 🌳 Evergreen（基本完整仍持续照料），并给每篇标注"种下"与"最近照料"两个日期——让读者一眼知道该内容值多认真对待。
- **类型系统**：Essay / Note / Talk / Podcast / Now Update / Smidgeon（碎片流）/ Pattern。她自述：notes 是"我还不确定我怎么想"，essays 是"我做过研究、相当确定我的观点"。类型 = 认知状态的对外声明。
- 在播客访谈中她坦承：**数字花园的导航与结构仍是未解决的设计问题**，没有哪家真正做到了"每页都呈现最相关的下一步内容"——这是诚实的领域现状，也是创新空间。

**可借鉴**：成长阶段与"种下/照料"双时间戳；类型徽标 + 一句话描述 + 相对时间的卡片模式；主题 chips + 阶段 + 类型的三维筛选。她后期新增的 "Smidgeon"（一条条微小想法的流）值得参考：**学习记录天然有"大块产出"和"碎片发现"两种颗粒度，应当区分对待**。

#### Gwern — gwern.net（单人网站工艺的天花板）

**是什么**：独立研究者的长文站点，自 2010 年持续迭代，有自己的设计手册、风格手册，甚至"设计坟场"页。

**为什么优秀**（来源：其《Design Of This Website》与《Manual of Style》）：
- **四条设计原则**：美学上的极简主义、无障碍/渐进增强、速度、超文本的"语义缩放"（semantic zoom）。"Everything here—color, type, iconography, popups, collapses, reader-mode, dark-mode, print—is downstream of those 4."（一切具体决策都是这四条的下游。）
- **排版为核心**：正文 Source Serif 4、UI 用 Source Sans 3、代码 IBM Plex Mono；首屏先用系统衬线字体（Baskerville 族）渲染，webfont 下载完成后 `font-display: swap` 无感替换——"The system font ships instantly, the webfont replaces it"。
- **语义缩放（冰山页面）**：一个页面可从 标题 → 摘要 → 目录/小节头 → 边注 → 正文 → 折叠区 → 链接弹出原文摘要 层层下钻。"一页可以看起来很短，但想深挖的读者永远能在水面下找到更多。" 这是对付"学习记录"这种信息密度极高的内容的最佳武器。
- **灰度实验**：调色板刻意限制为灰阶，作为"一致性约束能否支撑一个可读且美观的网站"的实验；强调用古典排版工具（首字下沉 dropcap、小型大写字母 smallcaps）完成。"One earns the right to add 'extraneous' details by first putting in the hard work of removing the actual extraneous details."（先努力删掉真正的多余之物，才挣得添加装饰性细节的权利。）
- **色彩研究**：《Website Colors: Red vs Blue》手工采集 225 个网站主色并可视化，发现红蓝两极分化、黄棕色域几乎无人使用，建议"如果你默认黑底，甚至可以不用单独做暗色模式"。
- **设计坟场（Design Graveyard）**：公开记录失败实验——红字强调（rubrication）让读者觉得像"吸血鬼粉丝站"而放弃；自动跟随系统的暗色模式因用户困惑而退回手动开关。**连最强的设计者也在杀特性，且把尸体展示出来。**
- **Demo-mode**：小动画（如主题切换器提示）只在访问计数前 n 次播放，之后自动关闭——既完成可发现性教育又不打扰老读者。

**可借鉴**：语义缩放作为图谱页/条目页的信息架构原则；排版优先的价值观；设计决策文档化（本项目可以直接维护一份 design.md，既是团队约束也是 AI 生成时代的"反套路锚点"）。

#### Tom Critchlow — tomcritchlow.com/wiki（数字花园理论另一半）

提出 Streams（流）/ Campfires（篝火）/ Gardens（花园）三分法：流是 Twitter 式时间流，篝火是博客式慢一点的讨论，花园是"跨越数十年、可培育演化的 wiki 层"。他把花园定义为 **"没有发布按钮的博客"（a blogging product without a publish button）** 与"收集点与点的地方（a space for collecting the dots）"。技术上他只用 Jekyll 文件夹 + Markdown——"复杂度都在布局与索引里，文件与文件夹永远保持纯文本以保证可移植性"。MIT Technology Review 引述他的话："写博客是对着大量观众说话；打理数字花园是**对你自己说话**——你专注于想长期培育什么。"

**可借鉴**：纯文本文件作为真相源（学习记录最容易丢失的是数据主权）；"没有发布按钮"的心态——学习条目天然是持续修订的，不该有"发完即弃"的心理。

#### Andy Matuschak — notes.andymatuschak.org

"Evergreen notes（常青笔记）"概念的提出者：笔记应当**为累积性个人知识而写，而非信息捕获**；笔记是原子化的、以概念命名、密集互链、随时间修订。Gwern 是更早给笔记附元数据（主题标签、起止日期、阶段、确定性标签）的实践者——"epistemic status（认识状态）"传统即源于此。

**可借鉴**：条目应该是"关于一个概念的常青页"而非"关于一次事件的日志页"。对学习站点：**学了什么（概念页，持续修订）与何时学的（时间线事件）应当分离**——前者构成图谱的节点，后者构成首页时间线的事件。

#### swyx — Learn in Public

"公开学习"理念的布道文。核心：把学习过程本身公开化——"the best way to learn is to teach"，做学习记录站的动机圣经。与本项目的关联：站点本身就是 learn in public 的载体，"待学清单"是它的前瞻面。

#### Innei / Shiro（中文圈的标杆）

Mix Space 后端 + Shiro 前端主题，README 自述"**纸的纯净、雪的清新**（the purity of paper and freshness of snow）"。作者自述重写站点时放弃二次元风格，采用浅中性色 + 可变强调色（如 `#69a6cc` 与 `#A0A7D4`）实现动态主题。在中文开发者个人站生态中被大量 fork（2026 年已演进为 Yohaku）。证明"极简 + 微妙色彩"路线在中文语境同样成立。

#### 小结

| 站点 | 最值得借的东西 |
|---|---|
| Maggie Appleton | 成长阶段、类型系统、三维筛选、双时间戳 |
| Gwern | 语义缩放、排版纪律、设计原则文档化、杀特性的勇气 |
| Tom Critchlow | 文件夹/纯文本数据模型、"没有发布按钮" |
| Andy Matuschak | 概念页与事件日志分离、常青笔记 |
| Innei Shiro | 浅色纸感 + 可变强调色的中文语境验证 |

---

### 2.2 高技术力个人站 / 开发者作品集（"简洁、高技术力、有新意"的样本）

#### Rauno Freiberg — rauno.me（细节工艺的代名词）

爱沙尼亚交互设计师（Vercel Staff Design Engineer）。其《Invisible Details of Interaction Design》是被引用最多的"微交互"文章之一。**实地抓取其站点 CSS 设计 token**：
- 间距：8px 基准的严格阶梯（8/16/24/32/40/48/56/64/72/80/88）
- 圆角：只有 4px / 8px / 16px / 全圆 四档
- 动效：全局唯一的缓动 `--transitions-snappy: cubic-bezier(.2,.8,.2,1)`
- 暗色模式：12 档 HSL 灰阶（8.5% → 93% 明度）、纯黑 `#000` 底、唯一强调色红 `#FF484C`
- 字体：系统 sans + JetBrains Mono（等宽作 UI 点缀）+ Georgia（衬线备用）

他的名言式实践："Love throwing a random 6px border radius on things to make it feel right"——**参数不是刻出来的，是感觉出来再固化为约束的**。他维护的 Web Interface Guidelines 里全是具体到像素的规则（输入框应如何包装、什么元素该有 hover 变化）。

**可借鉴**：把"手感"固化为少数几个 token（一个缓动曲线、一个间距基准、一个强调色），然后全局贯彻。**克制本身就是高技术力的展示**。

#### Josh Comeau — joshwcomeau.com（玩心与技术叙事）

以"交互式教程"著称（An Interactive Guide to CSS Grid 等），文章里布满可拖动的演示。他的博客细节被社区反复研究（如"Sneaky Header"的视差小把戏），暗色模式与日间模式的切换动画本身就是招牌。证明**网页作为媒介的表达力**：学习内容直接内嵌可交互 demo，读者"玩到"而非"读到"知识。

**可借鉴**：对"学过的东西"的条目，与其只放链接与摘录，不如在关键条目内嵌一个 10 秒能玩的最小演示——这是"高技术力而有新意"最安全的落点。

#### Bruno Simon — bruno-simon.com（3D 炫技的正面教材）

Three.js 驾车探索作品集：开一辆小卡车在 3D 世界里撞倒他的项目。现象级传播，直接孵化出他的课程 Three.js Journey。**为什么它不算"无审美炫技"**：
1. 媒介即信息——他是 3D 创意开发者，作品集用 3D 是技能的直接证明；
2. 物理手感一流（车辆的重量、漂移、碰撞），"玩"的动机与"读简历"的动机合一；
3. **提供 `/html` 纯文本降级页**（实地确认存在），尊重搜索引擎与低性能设备；
4. 内容与场景绑定，3D 不是壳而是目录本身。

**可借鉴**：判断"技术效果该不该上"的试金石——**它是不是内容本身**？对本项目：若做一个 3D 星系但点开后还是普通列表，就是炫技；若知识图谱的 3D 空间位置/距离/轨道本身承载语义（如按领域分星系、掌握度决定亮度），才配得上算力。

#### Brittany Chiang — brittanychiang.com（单一强调色纪律）

被 fork 最多的开发者作品集（v4 版 8K+ stars，衍生 fork 数以万计）。GitHub README 公开全部色板：Navy `#0a192f` / Light Navy `#112240` / Lightest Navy `#233554` / Slate `#8892b0` / Light Slate `#a8b2d1` / Lightest Slate `#ccd6f6` / White `#e6f1ff` / **Green `#64ffda`（唯一强调色）**。评析者的总结："一个薄荷绿承担所有交互态——hover、active 链接、CTA——**不需要设计规范文档就实现了自洽**"；"固定侧导航、等宽字体点缀、内容牢牢压过装饰"。

**可借鉴**：暗色主题的最佳实践是"一个背景色、一个表面色、一个强调色"的极端自我限制。这是对"AI 紫蓝渐变"最直接的反叛。

---

### 2.3 时间线设计（首页直接对标）

#### Histography — histography.io（交互时间线的巅峰之作）

Matan Stauber 的毕业作品，获 Information is Beautiful Awards 展示、CSS Nectar 等多项奖。140 亿年历史（宇宙大爆炸 → 2015），数据来自 Wikipedia 并每日自更新。**实地考察**：
- 视觉：单 `<canvas>` 渲染，Lato（sans）+ Bodoni 斜体（display），**中灰底（rgb(140,140,140)）上的黑点阵**——几乎单色，优雅克制；
- 核心交互：**每个点 = 一个历史事件，底部一个可拖拽缩放的时间标尺**，用户拖动边柄即可在"几十年 ↔ 数百万年"间连续缩放，整个点阵实时重排；
- 左侧：24 个分类图例（wars 1583 / politics 1096 / literature 1922…），点击即过滤——**图例即数据概览**（每个分类名后面直接标注事件数量）；
- 底部："The Beginning / Earth Formation / … / Information Age" 的纪元快捷导航 + "Feeling Lucky" 随机探索。

**为什么优秀**：它把"时间线"从"一串事件列表"升级为"**可伸缩的时间显微镜**"。信息密度的表达方式不是塞更多卡片，而是让尺度本身可交互。

#### Wait But Why — "Your Life in Weeks" 系列（格子化时间）

Tim Urban 2014 年的爆款：把一生画成 52 × 90 的格子墙，每格一周；衍生作《The Tail End》（按月/周/天三张图 + "你一生还能再吃多少次最爱的菜"的倒数计次）、《100 Blocks a Day》（一天 = 100 个 10 分钟格子）。衍生出 lifeweeks.app 等大量产品。**为什么优秀**：把抽象的"时间总量"变成**一眼可见、有情绪冲击的有限网格**——"Those are your weeks and they're all you've got."（这就是你的星期，你只有这些。）

#### GitHub 贡献图（活动密度的环境化表达）

日历热力图：不精确、不可缩放，但作为**环境级时间线**（ambient timeline）无出其右——扫一眼就知道"最近在不在状态"。大量开发者主页的第二身份。

#### Maggie Appleton 的 Now 页面（叙事流）

每月一篇"Now Update"混在花园卡片流里。数字花园理论对此的立场值得注意：**花园反的是"只有时间流"**，但并不否认时间流的价值——Tom Critchlow 的三分法里流/篝火/花园是共存的。

#### 时间线的四种模式（提炼）

| 模式 | 代表 | 适用 |
|---|---|---|
| **可缩放标尺 + 点阵** | Histography | 事件多、跨度大、想支持探索 |
| **有限格子墙** | Your Life in Weeks | 制造情绪冲击、唤起珍惜感 |
| **日历热力图** | GitHub Contributions | 一瞥式活动密度、零阅读成本 |
| **叙事流（含 now 页）** | 数字花园 / blog | 有故事性、按时间阅读自然 |

**对本项目首页的启示**：学习时间线天然适合"**叙事流为主体 + 热力图/密度条为概览 + 尺度可切换（年/月/全部）**"的混合方案，而不是单选一种。

---

### 2.4 知识图谱 / 关系网络可视化（"帅气"入口直接对标）

#### roadmap.sh（图谱式学习站的世界第一样本）

Kamran Ahmed 的项目，现为 GitHub 全站星标第 6（300K+ stars、3M+ 注册用户、900 万月 PV）。**演化史本身就是教案**：2017 年只是三张 Balsamiq 画的静态图片发到 GitHub，一周 10K stars；后来逆向 Balsamiq 的 JSON 导出，把图片渲染成交互 SVG；再进化为带编辑器（editor.roadmap.sh）、进度追踪、AI 导师的完整平台。**实地考察其 Frontend 路线图**：163 个带 `data-node-id` 的节点，SVG rect + text 渲染，节点间为蓝色（`#2B78E4`）圆头虚线，支持平移缩放；点击节点打开资源面板，登录后可标记 done / in progress / skip，**节点即进度载体**。

**为什么优秀**：
1. **布局是编辑手工确定的，不是物理模拟算出来的**——箭头方向、分组、留白全部经过人工排布，读者可以"顺着读"；交互（缩放/点击/进度）叠加在确定性构图之上；
2. 静态图片时代就获得了第一波爆发——**先有可读性，再有交互性**；
3. 技术栈"刻意无聊"：Astro + Node.js + MongoDB，前 7 年零基础设施成本跑在 GitHub Pages 上。创始人访谈原话："I mean it's not super exciting, keep it boring."

#### Obsidian Graph View（力导向图的反面教材）

把每条笔记画成节点、每个 wikilink 画成边，用力导向布局渲染成星座状。它是这个领域最广为人知的"知识图谱"，但社区评价两极：Obsidian 官方论坛热帖《What's the point of the graph view?》直言"除了一堆点你什么也做不了"；专文《Obsidian's Graph View Is Beautiful and Almost Completely Useless》总结：**它渲染了你画下的每条线，却没有告诉你任何你不知道的东西**。真正让图谱有用的做法（来自新一代工具如 Knovya 等的宣传语，恰好是对 Obsidian/Roam/Logseq 的批评）：桥接节点识别、聚类自动命名、语义邻近建议、语义缩放（远看星云、中看结构、近看细节）。Roam 的图被形容为"a wall of grey nodes"（一面灰色的墙）。

**教训**：力导向物理图好看、好写（d3-force 一把梭）、好 demo，但**默认状态下是装饰而非阅读工具**。要用它，必须补齐语义层（过滤、hover 局部子图、聚类标签、缩放分级）。

#### Open Syllabus Galaxy — galaxy.opensyllabus.org

把 3290 万份教学大纲中的书目共现关系（co-assignment graph）画成"星系"：11 个学科领域的书目聚合成颜色不同的星团。官方文案即定位："titles in 11 fields, grouped into beautiful galaxies." **位置本身携带语义**（学科亲缘度），这是"帅气且诚实"的图谱样本。

#### Connected Papers — connectedpapers.com

输入一篇论文，生成相似论文的图谱。关键设计：**按相似度而非直接引用布局**——"即使两篇论文互不引用，只要相似就会被拉近"；图中用颜色深浅区分年份、节点大小区分引用量，且区分 prior works（前驱）与 derivative works（后继）两个方向。研究者的实际工具而非摆设。

#### 图谱的三条路线（提炼）

| 路线 | 代表 | 优点 | 风险 |
|---|---|---|---|
| **编辑手工布局** | roadmap.sh | 可读性最强、可"顺着读"、适合百级节点 | 节点多时维护成本高；需要编辑器/工具链 |
| **力导向物理图** | Obsidian / Roam | 自动生成、零维护、有"生命感" | 默认无语义，易沦为装饰 |
| **语义/相似度布局** | Open Syllabus Galaxy / Connected Papers | 位置即含义，探索价值高 | 需要数据支撑（共现/相似度计算） |

**对本项目图谱页的启示**：条目为百级的学习图谱，**首选手工/半手工编辑布局**（按领域分区、连线人工把关），把力导向只作为入场动画或彩蛋；规模上千再考虑力导向 + 聚类标签。

---

### 2.5 交互式简历（"个人记录 + 游戏化"的极限样本）

#### Robby Leonardi — rleonardi.com/interactive-resume

简历做成横版平台跳跃游戏：滚动条驱动小人向右跑，跑过技能、经历、兴趣各关卡。获 Awwwards、FWA、CSS Design Awards；媒体称"Best CV ever?"。社区讨论的两个价值判断值得注意：
1. 它被当作"**技能即证据**"的样本——"网站本身就是 Leonardi 设计能力的证明"（ucreative 评语），与 Bruno Simon 同理：**媒介即信息**；
2. it's nicethat 的洞察："人们喜欢'完成'一个东西"——把浏览变成有完成感的旅程。

**对本项目的启示**：不必做游戏，但可以借"**完成感**"——例如待学清单的进度环、图谱页的"已点亮区域"，让访客（和站长自己）都获得"越读越接近完整"的激励。这是 roadmap.sh 进度系统的心理内核。

---

## 3. 横向设计语言分析

### 3.1 排版

- **衬线正文 + 无衬线 UI** 是"书卷气"站点的通行解：Gwern 正文 Source Serif 4 / UI Source Sans 3；Rauno 保留 Georgia 作衬线备用。学习记录站的内容以长文摘录与笔记为主，**正文用衬线能立刻与"AI 生成 SaaS 页"拉开气质差距**。
- **等宽字体作"技术口音"**：Rauno（JetBrains Mono）、Brittany（monospace 点缀编号与小标题）、Gwern（IBM Plex Mono）。开发者个人站的标志性手法——等宽用于元数据（日期、状态、类型徽标）而非正文。
- **古典排版工具的复兴**：Gwern 用首字下沉、smallcaps、侧注（sidenotes，宽屏时替代脚注）营造"书"的感觉。学习笔记站非常适合侧注：原文摘录放边栏，正文保持干净。
- **字号阶梯要少**：Rauno 只有 10/12/14/16/20/24/32/40/48 十档；行高按字号 1.2~1.6 成对定义。**先定尺度再动手，是反套路的第一步**。

### 3.2 色彩

- **单一强调色纪律**（Brittany：深藏青系 5 档灰蓝 + `#64ffda` 一色承担全部交互态）是最可复制的配色方案。
- **灰阶实验**（Gwern）：连彩色都可以不要，语义差异交给字重、字距、小型大写与边注线。
- **避开蓝紫红海**：Gwern 的 225 站主色统计显示红蓝严重两极分化，黄棕色域（amber/ochre）几乎空白且"更百搭"。对想避开 AI 紫蓝渐变的本项目，**暖色域（琥珀/赭石/苔绿）+ 纸感底色**是数据支持下的差异化方向。
- **非纯黑非纯白**：AI 生成页爱用 `#fff`/`#000`；手工感的做法是暖黑 `#1a1612` 或冷黑 `#141820`、纸白 `#faf9f7`（Sailop 拆解报告把纯黑白列为 slop 指纹之一）。
- **Shiro 的可变强调色**：浅中性底 + 每篇可换的强调色（`#69a6cc`/`#A0A7D4`）——低成本实现"每页微差异"。

### 3.3 动效

- **一条缓动曲线走天下**：Rauno 的 `cubic-bezier(.2,.8,.2,1)`（快出慢停的"snappy"）。AI 生成页的标志恰恰是千篇一律的 `transition-all 300ms ease-in-out`。
- **微交互 > 大动画**：交互细节文章的核心论点——真正的手感来自 hover 即时反馈、按压 `:active` 缩放、焦点环不消失、光标跟随的细微磁性，而不是开场 5 秒的 hero 动画。AI 生成页普遍**只有 hover 没有 active**（拆解报告列为指纹）。
- **动效要有教养**：Gwern 的 demo-mode（提示动画播放 n 次后自动关闭）；Bruno 的场景可被键盘直接操作；全部案例都尊重 `prefers-reduced-motion`。
- **物理感是加分项但不是必需项**：Bruno 的车辆物理、Histography 的点阵重排、roadmap.sh 的平滑缩放——共同点是**动效与信息变化绑定**（动的是数据不是装饰）。

### 3.4 信息架构

- **按地形组织 + 时间作为其中一个视图**：花园运动的核心主张。落到本项目：数据模型以"概念/主题/条目"为主键，时间线只是其中一个投影视图——这同时解释了为什么图谱页与时间线首页共享同一份数据。
- **元数据即界面**（Gwern/Maggie）：阶段（seedling→evergreen）、确定性、种下/照料时间、类型。学习站的对应物：**掌握度（入门/会用/精熟）、来源类型（文章/视频/论文/博客/课程）、学习时间、复习时间**。
- **语义缩放**：从年表 → 领域 → 条目 → 原文摘录，每层都提供"够了"的出口与"更深"的入口。图谱页尤其需要：远景看全貌、中景看聚类、近景看单条目关系。
- **筛选是第一公民**：Maggie 的三维筛选（主题/阶段/类型）、Histography 的分类图例（带计数）、roadmap.sh 的角色/技能双入口。

### 3.5 交互细节

- **hover 预览**（Gwern 的弹出摘要是全站灵魂）：鼠标悬停链接即弹出原文摘要/上下文，摩擦为零的下钻。学习条目的链接（论文/文章）非常适合。
- **命令面板**（⌘K）：现代个人站标配（Rauno 参与的 cmdk 库下载量每周百万级）。
- **键盘可达**：roadmap.sh 全键盘操作；Robby Leonardi 的滚动驱动本质是零学习成本的交互。
- **进度即内容**：roadmap.sh 的 done/in-progress/skip 三态；图谱节点用颜色/填充表达状态——**学习图谱的"帅气"应该首先来自状态可视化**（已点亮 vs 待探索），而不是布局花哨。

---

## 4. 应避免 A：AI 生成网站的"指纹"清单与机理

### 4.1 机理：为什么 AI 生成的网站长得一样

多个 2025–2026 年的分析收敛到同一解释（Superdesign 称之为 **distributional convergence / 分布收敛**）：
- 语言模型按训练数据的统计中心预测下一个 token，**无约束的开放设计问题必然落在"最常见答案"上**；
- 训练数据被 Tailwind 默认值浸透——Tailwind 作者 Adam Wathan 本人对 `bg-indigo-500` 起源的说明：那只是"一个中性、不得罪人的占位色"，却被训练循环放大成了"现代按钮"的统计真相；
- Show HN 拆解（Developers Digest）发现**超过一半**的新发布产品带同一套指纹；Stanford/Internet Archive 的研究（2026-04 发表）发现到 2025 年中约 35% 新站为 AI 生成或 AI 辅助，AI 内容的语义相似度高出 33%。

### 4.2 指纹清单（对照自查表）

| 维度 | AI 默认值（避开） | 有主见的替代（参考） |
|---|---|---|
| 字体 | Inter / system-ui 通吃全站（某拆解称出现在 ~73% 的 AI 前端） | 衬线正文 + 等宽点缀；具体命名一款 display 字体 |
| 主色 | blue-500 `#3b82f6` / indigo / violet（200–290° 色相带） | 黄棕/琥珀/苔绿等冷门色域（Gwern 数据）；一个强调色纪律 |
| Hero | 居中大标题 + 渐变 + 双 CTA + 底部波浪 SVG | 左对齐编辑式排版；不对称 5fr/3fr 网格；CLI/终端块 |
| 渐变 | `from-blue-600 to-purple-600` 多段渐变铺主视觉 | 纯色底 + 单点径向光晕或 4–6% 噪点纹理 |
| 卡片 | `grid-cols-3` 三张等宽卡 + Lucide 图标 + rounded-2xl + shadow-md | 一主多副的非对称布局；不同内容类型用不同卡片结构 |
| 导航 | `backdrop-blur-md` 玻璃拟态 | 实色边框导航；细线分隔 |
| 徽标 | H1 上方的居中 eyebrow badge、"Most Popular" 渐变胶囊 | 去掉徽标；用字重/留白表达层级 |
| 动效 | `transition-all 300ms ease-in-out`；IntersectionObserver 统一时长上滑 | 单一自定义缓动（如 `.2,.8,.2,1`）；时长与元素面积挂钩 |
| 状态 | 只有 hover，无 :active；无 prefers-reduced-motion | 完整的 hover/active/focus 三态；reduced-motion 全局支持 |
| 文案 | "Transform how you work" / "effortlessly" / "Welcome to Our Platform" | 具体动词 + 真实数字；第一人称的学习口吻 |
| 结构 | nav→hero→features→testimonials→pricing→faq→cta→footer 固定顺序 | 由内容决定章节顺序；学习站天然不需要 pricing/testimonials |

### 4.3 对策（这些资料的共识）

1. **用名字替代形容词**："简洁现代"必然得到平均值；"dense, calm, editorial + 参考 Gwern 的灰阶 + Bitter 衬线标题 + `cubic-bezier(.22,1,.36,1)`"才会得到决策。
2. **先写 token 再生成**：一页 design.md（色值、字阶、间距、圆角、缓动），每次会话注入——本文档第 6 节可直接充当。
3. **真内容驱动**：占位文案（"Lorem"式的"学习资源 A"）是 slop 的温床；真实的学习条目（"读完《Designing Data-Intensive Applications》第 5 章，笔记 3 条"）天然不可复制。
4. **生成后验证**：对比度、层级、字号阶梯、动效时长逐项过一遍再发布。

---

## 5. 应避免 B：无审美炫技的边界

**判定标准一句话：技术效果是否服务于理解与导航；去掉它，站点是否损失了信息。**

- **Obsidian 图谱之诫**：物理模拟的星云图在默认状态下不传递任何新信息（"a wall of grey nodes"）。若本项目做图谱，先问：这个图能回答"我接下来该学什么"或"这两个领域怎么连起来"吗？
- **Gwern 设计坟场之诫**：红字强调被用户感知为"吸血鬼粉丝站"、自动暗色模式让用户困惑——**连最讲究的作者也会看走眼，且看走眼的比率不低**。上线前给每个特效准备"删除它的勇气"，并记录为什么删（设计坟场本身成了 gwern.net 最有价值的设计文档之一）。
- **Bruno 的对照**：3D 是内容本身 + 有 `/html` 降级 + 物理手感投入了审美劳动。炫技与作品之间的区别是**劳动的可见性与媒介的必要性**。
- **常见反模式清单**（社区共识，多来自 Awwwards 圈与可访问性社区）：
  - 无目的 WebGL/canvas hero（首屏 3 秒加载后是一个旋转的不可交互物体）
  - 全站自定义光标（拖慢指向、破坏可达性）
  - 滚动劫持（scroll hijacking）与 100vh 强制分屏叙事
  - 视频上压低对比度文字；自动播放声音
  - 图标/emoji 代替一切文字标签
  - "为了动而动"的入场动画序列（每次进站都要看一遍）
  - 隐藏导航（"点击右下角发光球展开菜单"）
- **性能即审美**：Gwern 把 speed 列为四原则之一；roadmap.sh 用"无聊"的技术栈跑了 7 年 GitHub Pages。炫技的第一牺牲品永远是加载时间。

---

## 6. 对本项目三个页面的落地建议

### 6.0 全局基调（先定约束）

- **气质关键词**：editorial（编辑感）、calm（克制）、dense（信息密）、handmade（手工感）——避免"modern / clean / sleek"这类 AI 平均值词汇。
- **排版**：正文衬线（如 Source Serif 4 / 思源宋体），UI 与元数据等宽（IBM Plex Mono / JetBrains Mono），标题可选一款有性格的 display 字体；行宽 65–72 字符。
- **色彩**：纸感浅底（`#faf9f7` 类）或深暖黑底（`#1a1612` 类）二选一；**唯一强调色**承担全部交互态，色相避开 200–290° 蓝紫带（参考 Gwern 建议：琥珀/赭石/苔绿色域，或 Shiro 的可变强调色方案）；状态色不超过 3 个（已学/在学/待学）。
- **token 纪律**：间距 8px 阶梯；圆角 ≤ 3 档；**一条缓动曲线**全局复用（推荐 `cubic-bezier(.2,.8,.2,1)`）；hover/active/focus 三态齐全；`prefers-reduced-motion` 支持。
- **数据模型**（决定一切视图）：条目 = { 概念/主题（图谱节点）、类型（文章/视频/论文/博客/课程）、来源链接、掌握度阶段、学下时间、最近复习时间、一句话笔记、关联条目 }。时间线与图谱是同一数据的两个投影。

### 6.1 首页：学习时间线

- **主体**：纵向叙事流（Maggie 式卡片：标题 + 一句话笔记 + 类型徽标 + 相对时间），月份/年份分组。
- **概览层**：顶部一条**日历热力带**（GitHub 贡献图式，一行 12 个月）或"学习密度条"——零成本回答"这人最近在学吗"。
- **尺度切换**：年 / 月 / 全部 三档（Histography 的缩放精神的最小实现：切换时卡片聚合/展开，而非只做一根滚动竖线）。
- **筛选条**：类型 chips（带计数，学 Histography 的"图例即概览"）+ 主题 chips。
- **情绪锚点**（可选加分项）：一个"人生格子"式的统计块——"今年已学 n 篇 / 累计 m 个概念"，用有限感制造回访动机（Wait But Why 心理学）。

### 6.2 知识图谱入口

- **布局优先选编辑手工排布**（roadmap.sh 路线）：按领域分区着色、连线人工确认，保证"可以顺着读"；百级节点完全可行（roadmap.sh 单图 163 节点）。
- **入场可用力导向动画**（节点从中心散开归位），**落定后是确定性布局**——既"帅气"又保证可读；重复访问跳过动画。
- **节点编码状态**：填充色 = 掌握度（空心 = 待学、半填充 = 在学、实心 = 已学）——图谱直接成为时间线与待学清单的桥。
- **hover = 局部子图高亮**（该节点邻接点亮、其余淡出）+ **click = 侧栏详情**（来源、笔记、关联），这两条是从 Obsidian 批评中学到的最小必要语义层。
- **语义缩放**：远景只见领域分区标签，中景见节点群，近景见节点文字（Gwern 原则 + 现代图谱工具共识）。
- **技术选型参考**：
  - 手工布局：直接 SVG（roadmap.sh 同款思路，可用 Excalidraw/draw.io 起稿导出坐标）或 React Flow；
  - 需要力导向时：d3-force（Obsidian 同款内核）、sigma.js（WebGL，千级节点）、Cytoscape.js（通用功能最全）、AntV G6（功能丰富的国产库）、react-force-graph（2D/3D，vasturiano）、Cosmograph（GPU 大图）；
  - 思维导图式替代：markmap（Markdown 直接转思维导图）、Obsidian Canvas 式白板。
  - 结论倾向：**SVG + 手工/半手工布局起步**，规模与需求升级后再引入 WebGL 渲染库。

### 6.3 待学清单页

- **roadmap.sh 的三态进度模型**（待学 / 在学 / 已学，可选"放弃+原因"）直接复用；每条支持勾选，勾选动作顺滑回写首页时间线（两个视图同一数据）。
- **每条一句话动机**（Maggie 卡片的描述行精神）："为什么想学它"比标题更重要——这是数字花园"对自己说话"的气质来源，也让页面区别于任何 todo 工具。
- **排序即价值观**：按优先级/领域/加入时间多视图切换；置顶机制（Tom Critchlow 的 pin）。
- **完成感设计**（Robby Leonardi 启示）：顶部进度环、按领域的小进度条；从"待学"移入"已学"时给一个克制的动效（数字 +1、图谱节点点亮的心跳）。
- **防止腐烂**：显示"加入于 n 个月前"；太久未动的条目给"还想学吗？"的诚实提示——比无限堆积的 backlog 更有审美。

### 6.4 内容类型系统（与 Maggie 的映射）

| 本项目类型 | Maggie 对应 | 图谱中的角色 |
|---|---|---|
| 文章 / 博客 | Essay / Note | 概念节点的深度注解 |
| 论文 | （她的 Zotero→Tana 笔记流） | 概念节点 + 引用关系边 |
| 视频 | Talk / Podcast | 概念节点，来源徽标区分 |
| 课程 | （Smidgeon 式的持续流） | 领域子图（一门课 = 一组节点） |
| 碎片想法 | Smidgeon | 不进图谱，只在时间线 |

### 6.5 一页纸反 checklist（上线前过一遍）

- [ ] 全站字体是否 ≤ 3 款且无 Inter 独挑大梁？
- [ ] 主色是否在 200–290° 色相带之外？渐变是否只在 1 处以内？
- [ ] 是否存在任何 `grid-cols-3` 等宽卡 + Lucide 图标的组合？
- [ ] 每个可交互元素是否有 hover / active / focus 三态？
- [ ] 动效是否全局共用一条缓动曲线？是否支持 reduced-motion？
- [ ] 图谱去掉动画后是否仍可读、可导航？每个效果能否回答"它帮我理解了什么"？
- [ ] 首屏是否在 1 秒内可用（无 JS 也能读到核心内容）？
- [ ] 文案里有没有 "transform / effortlessly / welcome to"？
- [ ] 有没有一处"只有这个站才有"的东西（一种只属于你的内容颗粒度、一个手工布局的图谱、一句只有你会写的注释）？

---

## 7. 参考资料

**数字花园 / 知识库**
- Maggie Appleton《A Brief History & Ethos of the Digital Garden》: https://maggieappleton.com/garden-history
- Maggie Appleton 的花园（实地考察）: https://maggieappleton.com/garden
- Maggie Appleton 访谈（结构与导航的未解问题）: https://theinformed.life/2023/07/16/episode-118-maggie-appleton/
- Gwern《Design Of This Website》: https://gwern.net/design
- Gwern《Manual of Style》: https://gwern.net/style-guide
- Gwern《Design Graveyard》: https://gwern.net/design-graveyard
- Gwern《Website Colors: Red vs Blue》: https://gwern.net/web-color
- Tom Critchlow《Of Digital Streams, Campfires and Gardens》: https://tomcritchlow.com/2018/10/10/of-gardens-and-wikis/
- Tom Critchlow《Building a digital garden》: https://tomcritchlow.com/2019/02/17/building-digital-garden/
- MIT Technology Review《Digital gardens let you cultivate your own little bit of the internet》: https://www.technologyreview.com/2020/09/03/1007716/digital-gardens-let-you-cultivate-your-own-little-bit-of-the-internet/
- swyx《Learn In Public》: https://swyx.io/learn-in-public
- Maggie Appleton《Digital Gardening for Non-Technical Folks》（"特性≠精神"警告）: https://maggieappleton.com/nontechnical-gardening
- 数字花园清单（找更多样本）: https://github.com/lyz-code/best-of-digital-gardens 、https://joel.is/notes/List_of_digital_garden_personal_website_examples 、https://docs.jacobg.co/personal/misc/garden-examples
- Innei/Shiro 主题: https://github.com/Innei/Shiro 、设计自述 https://innei.in/posts/design/new-website-design-about-shiro

**开发者作品集 / 工艺**
- Rauno Freiberg: https://rauno.me （craft 系列: https://rauno.me/craft/interaction-design ；token 为实地抓取）
- Rauno 访谈: https://ui.land/interviews/rauno-freiberg
- Josh W. Comeau: https://www.joshwcomeau.com
- Bruno Simon: https://bruno-simon.com （纯文本降级页: https://bruno-simon.com/html）
- Brittany Chiang 作品集与色板: https://brittanychiang.com 、https://github.com/bchiang7/v4

**时间线**
- Histography（实地考察）: https://histography.io 、https://www.informationisbeautifulawards.com/showcase/771-histography
- Wait But Why《Your Life in Weeks》: https://waitbutwhy.com/2014/05/life-weeks.html
- Wait But Why《100 Blocks a Day》: https://waitbutwhy.com/2016/10/100-blocks-day.html
- Wait But Why《The Tail End》: https://waitbutwhy.com/2015/12/the-tail-end.html

**知识图谱 / 路线图**
- roadmap.sh（实地考察）: https://roadmap.sh 、https://github.com/kamranahmedse/developer-roadmap
- roadmap.sh 创始人访谈（静态图→交互的演化史）: https://www.starterstory.com/roadmap-sh-breakdown 、https://newsletter.dominuskelvin.dev/p/he-built-a-125m-user-platform-for
- Open Syllabus Galaxy: https://galaxy.opensyllabus.org 、https://www.opensyllabus.org
- Connected Papers: https://www.connectedpapers.com
- Obsidian 图谱批评: https://forum.obsidian.md/t/whats-the-point-of-the-graph-view-how-are-you-using-it/71316 、https://codeculture.store/blogs/developer-culture/obsidian-graph-view-useful
- 图谱库对比: https://www.pkgpulse.com/guides/cytoscape-vs-vis-network-vs-sigma-graph-visualization-2026 、https://www.cylynx.io/blog/a-comparison-of-javascript-graph-network-visualisation-libraries 、https://cosmograph.app/library/compare

**交互式简历**
- Robby Leonardi Interactive Resume: http://www.rleonardi.com/interactive-resume/
- 报道与讨论: https://www.itsnicethat.com/articles/animation-robby-leonardi 、https://dev.to/_bigblind/what-do-you-think-about-interactive-resumes-1154

**AI 套路化设计（slop）**
- Sailop《Why Every AI-Generated Website Looks the Same》: https://sailop.com/blog/why-every-ai-generated-website-looks-the-same
- Sailop《AI Slop: The Definitive 2026 Guide》: https://sailop.com/blog/ai-slop-definitive-guide-2026
- Superdesign《Why AI Design Looks Generic》(distributional convergence): https://superdesign.dev/blog/why-ai-design-looks-generic
- Booplex《What Is AI Design Slop?》(Tailwind indigo 起源与研究综述): https://booplex.com/blog/what-is-ai-design-slop
- SmoothUI《AI Design Slop》: https://smoothui.dev/blog/ai-design-slop
