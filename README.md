# Elevator Problem

<kbd>中文</kbd> · <a href="README.en.md"><kbd>English</kbd></a>

在五楼按下行、想去二楼，电梯却先在上行途中接人，到八楼折返后又在五楼停一次。第一次开门后，下行按钮仍然亮着。

一个可能的原因是：**停靠不区分呼叫方向，但只有同方向停靠才清除呼叫。** 因此，人已上车，五楼的下行请求却保留到了回程。常见的选择集选控制则在下行时接人，避免这次重复停靠。

[**▶ 网页体验**](https://alex-cuhksz.github.io/elevator-problem/)：切换「常规 / 校园」，在五楼按 ↑／↓，上车后选择目的楼层。风景随海拔升高，从茂密林地逐渐变为高山草甸和冰雪。

参考：[MCE 控制规格，第 10 页](https://acim.nidec.com/elevators/-/media/Project/Nidec/NidecElevator/MCE/PDFs/Specifications/Element-Hydro-Specification.pdf) · [Nikovski & Brand，2004](https://www.merl.com/publications/TR2004-148)。
