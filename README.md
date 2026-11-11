# Elevator Problem

<kbd>中文</kbd> · <a href="README.en.md"><kbd>English</kbd></a>

[问题](#问题) · [运行差异](#运行差异) · [核心代码](#核心代码) · [网页体验](#网页体验) · [参考资料](#参考资料)

## 问题

在五楼按下行、想去二楼，电梯正从二楼上行去八楼。学校电梯会先在五楼接人，到八楼折返后，又在五楼停一次。

第一次停靠没有轿厢内的五楼选层，也没有人重新呼叫；但第一次开门后，五楼下行按钮仍亮着。这个项目用两种调度逻辑复现并比较这段旅程。

## 运行差异

| 场景 | 常规模式 | 校园模式 |
| --- | --- | --- |
| 上行经过五楼，只有下行呼叫 | 经过，不停靠 | 停靠，主人公上车 |
| 上行经过五楼后，下行呼叫 | 保留，等待回程服务 | 同样保留，尽管人已上车 |
| 八楼折返后经过五楼 | 接人，清除呼叫 | 再停一次，清除呼叫 |
| 最终结果 | 3 次停靠 | 4 次停靠 |

```text
常规：2 → 8（停）→ 5（停，上车）→ 2（停）
校园：2 → 5（停，上车）→ 8（停）→ 5（再停）→ 2（停）
```

**关键在于：开过门，不一定代表对应的呼叫已经被清除。** 校园模式让主人公提前上车，却多出一次五楼停靠。

## 核心代码

程序分别记录轿厢选层 `calls`、厅外呼叫 `hall` 和运行方向 `direction`（`1` 上行，`-1` 下行）。两种模式共用运行流程，主要区别在于**停靠判断是否匹配呼叫方向**。

[停靠判断 → `Lift.tick()`](app.js#L59)，核心条件等价展开为：

```js
const hall = this.hall.get(boundary);
const shouldStop = this.calls.has(boundary) || (
  hall && (
    this.policy === 'observed' || // 校园：有呼叫就停
    hall.has(this.direction)     // 常规：只响应同方向呼叫
  )
);
```

[清除呼叫 → `Lift.open()`](app.js#L49)，两种模式使用同一条规则：

```js
hall.delete(this.direction);
if (!hall.size) this.hall.delete(floor);
```

因此，上行停五楼时，删除的是 `1`，而原来的下行请求是 `-1`，仍留在队列中。回程下行时，它再次触发停靠。这是对观察现象的一个可能解释。

完整实现：[调度与动画](app.js) · [页面结构](index.html) · [界面样式](style.css)。

## 网页体验

[**▶ 打开演示**](https://alex-cuhksz.github.io/elevator-problem/)

切换「常规 / 校园」，在主人公所在层按 ↑／↓，上车后选择目的楼层。复现原始问题时，在五楼按 ↓，上车后按 2，观察五楼按钮和回程停靠。

方向屏在运行时显示 ↑／↓，停靠或待机时显示 —。五楼只有男孩主人公，其余楼层的女孩随机进出两侧宿舍；左侧窗景随海拔变化。电梯默认上行到顶楼，最后返回二楼待机，主人公留在到达层。

## 参考资料

- [MCE · Element Hydraulic Elevator Control，第 10 页](https://acim.nidec.com/elevators/-/media/Project/Nidec/NidecElevator/MCE/PDFs/Specifications/Element-Hydro-Specification.pdf)：选择集选控制的同方向服务规则。
- [Nikovski & Brand，2004](https://www.merl.com/publications/TR2004-148)：电梯候梯时间建模，启发我们同时关注候梯和完整旅程。
