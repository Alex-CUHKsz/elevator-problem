# Elevator Problem

**同一段旅程，为什么多停一次？ / Same journey. One extra stop.**

[在线演示 / Live demo](https://alex-cuhksz.github.io/elevator-problem/)

## 中文

一个源于校园观察的电梯调度小实验。电梯从二楼上行去八楼；乘客在五楼按“↓”，想去二楼。学校电梯上行先停五楼，回程又停五楼。

**已知观察**：第一次停靠没有轿厢内五楼请求；没有人重新按五楼按钮；第一次开门后，五楼下行按钮仍亮着。上述信息来自乘客观察，未获取控制器日志。

**基线与解释**：常见选择集选控制会在下行回程接这位乘客 [1]。本项目的假设模型则让上行电梯也响应下行呼叫，但仅在下行停靠时清除它，因此复现两次停靠。按钮仍亮与请求保留相符，尚不能排除指示灯、参数配置或其他控制状态问题，不能确认学校源码存在某个具体错误。

```text
基线：2 → 8（停）→ 5（停，上车，清除下行请求）→ 2（停）
观察：2 → 5（停，上车，保留下行请求）→ 8（停）→ 5（再停，清除请求）→ 2（停）
```

模型把请求分成 `carCalls`（轿厢选层）和 `hallPending`（五楼下行呼叫）。简化的规则差别：

```text
基线停靠：有本站轿厢请求，或有本站且同方向的厅外呼叫
假设停靠：有本站轿厢请求，或有本站厅外呼叫（不区分方向）
两者销号：仅在下行停五楼时，清除五楼下行呼叫
乘客上车：才登记轿厢内二楼请求
```

**比较结果**：固定每层 2 秒、每次停靠 6 秒，包括开关门与停留。均为教学参数，不是实测；模型忽略加减速，停靠时间从开门服务开始计时。

| 指标 | 按方向响应 | 观察复现 |
|---|---:|---:|
| 候梯至开始上车 | 24 s | 6 s |
| 上车至二楼开始开门 | 12 s | 36 s |
| 从呼叫至到达二楼 | 36 s | 42 s |
| 全程停靠次数，含终点 | 3 | 4 |

提前上车减少候梯，却增加乘梯时间和一次停靠；到达时间晚一个停靠周期。候梯时间不能代替完整体验评价，[2] 提供了等待时间建模的研究背景，但研究对象是群梯，并不验证本案例。没有能耗测量，不给出节电比例。**直接在第一次开门时清除下行呼叫，也可能漏接仍想等下行的乘客，不能据此作为修复方案。**

演示支持中英切换、播放/暂停、下一事件、时间轴、重置和倍速；八层楼有不同风景。下一事件包括两模型的到层和开关门服务边界。固定为单梯、单个下行乘客和已有八楼目的请求，不代表完整电梯调度或安全控制系统。进一步确认需要在正常乘梯中记录方向指示、按钮状态与停靠顺序，并请校方或维保人员核查配置及日志。

## English

A small elevator dispatch experiment inspired by a campus observation. A lift travels from floor 2 to floor 8. A passenger calls **down** at floor 5, heading to floor 2. The reported lift stops at floor 5 on both the upward and downward journeys.

**Reported facts:** no car call for floor 5, no repeated hall-button press, and the down-call light remains on after the first stop. No controller logs are available.

**Baseline and hypothesis:** directional selective collective service picks up the passenger on the return trip [1]. Our alternative model stops for the opposite-direction call while ascending, but clears it only on a downward stop. This reproduces the observation; it does not identify the campus controller's implementation. Indicator faults, configuration and other control states remain alternatives.

Separate car calls and hall calls explain the mechanism: boarding registers floor 2 as a car call, while the original floor-5 down call remains pending. The model generates the journey from these rules rather than a hand-written stop sequence.

With illustrative travel of **2 s per floor** and **6 s per stop**, the baseline has 3 stops and reaches floor 2 at 36 s; the alternative has 4 stops and arrives at 42 s. Waiting drops from 24 s to 6 s, but time on board rises from 12 s to 36 s. Arrival means the start of the destination stop; boarding time includes the pickup dwell. Both routes cover the same distance. Travel ignores acceleration; these are not field measurements or energy estimates.

The waiting-time study [2] informs evaluation, not diagnosis. Clearing an opposite-direction hall call merely because doors opened could leave other passengers unserved, so it is not a validated repair. Verification requires normal-use observations and qualified maintenance review of configuration/logs.

The bilingual demo includes play/pause, next event, scrub, reset and playback speed. Each floor has a distinct landscape. It models one car, one down-call passenger and an existing floor-8 car request; it is not a production or safety controller.

## References / 参考资料

1. **Motion Control Engineering.** *Element Hydraulic Elevator Control*, specification SD0xx A1, 2/15, p. 10, “Simplex Selective Collective Operation.” [Manufacturer PDF](https://acim.nidec.com/elevators/-/media/Project/Nidec/NidecElevator/MCE/PDFs/Specifications/Element-Hydro-Specification.pdf). Supports the directional-service baseline, not a diagnosis of the campus lift.
2. **Daniel Nikovski and Matthew Brand.** “Exact Calculation of Expected Waiting Times for Group Elevator Control.” *IEEE Transactions on Automatic Control*, 49(10), 1820–1823, 2004. [MERL publication record and abstract](https://www.merl.com/publications/TR2004-148). Consulted for waiting-time evaluation context; this project does not implement its algorithm.

## Run / 运行

No dependencies or build step. / 无依赖，无需构建。

```sh
python3 -m http.server 8000
```

Open / 打开 `http://localhost:8000`. Uses browser modules; serve over HTTP rather than opening the file directly. / 请通过本地服务打开。

For GitHub Pages: **Settings → Pages → Deploy from a branch → main → / (root)**. / GitHub Pages 选择 `main` 分支根目录发布。

Four source files: `index.html`, `style.css`, `app.js`, `README.md`. One local image atlas (`worlds.png`) supplies the eight landscapes; characters and controls use SVG/CSS. No remote image or font dependency. / 四个源文件加一张本地风景图集，不依赖远程图片或字体。

Landscape artwork was generated with OpenAI’s built-in image tool. / 风景图集使用 OpenAI 内置图像工具生成。

<details>
<summary>Artwork prompt / 风景生成提示词</summary>

Use case: stylized-concept. Asset type: one background sprite atlas for a simple elevator educational webpage. Create a square image containing EXACTLY EIGHT equal-height horizontal landscape strips stacked edge to edge, each strip one eighth of the full height, absolutely no gutters or border. Each strip is a panoramic miniature world in charming Pixar-inspired stylized 3D animated film style: rounded sculpted shapes, soft tactile materials, ambient occlusion, cinematic gentle light, restrained sage/cream palette, appealing dimensional forms, clean composition. Ordered TOP TO BOTTOM: 1 midnight sky with crescent moon and soft rounded mountains; 2 peach sunset with sun and rolling hills; 3 snowcapped alpine mountains and pale blue sky; 4 lush rounded forest with large soft green tree canopies and a clearing; 5 grassy meadow with rounded small trees and distant hills; 6 warm golden desert dunes and tiny distant cactus; 7 turquoise seacoast with small rounded rocks and cream beach; 8 peaceful garden with flowers and low shrubs. Each band must have its OWN independent horizon, sky and ground, horizon near vertical midpoint of its band. Keep middle-right areas clear for elevator overlay, scenery concentrated on left and background. Straight-on panoramic landscape view, not isometric. No elevator, no building, no people, no UI, NO text, NO logos, no frames. Maintain precise equal strip divisions. The eight scenes should read as a cohesive set of tiny worlds.

</details>
