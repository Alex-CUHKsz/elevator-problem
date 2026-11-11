# Elevator Problem

<a href="README.md"><kbd>中文</kbd></a> · <kbd>English</kbd>

You call down at floor 5, heading to floor 2. The lift picks you up while ascending, reaches floor 8, then stops at floor 5 again on the way down. The down-call light stays on after the first stop.

One possible explanation: **stopping ignores the call direction, but clearing a call requires a matching direction.** You board, yet the original down call remains pending until the return trip. A common selective collective policy picks you up while descending, avoiding the extra stop.

[**▶ Try the demo**](https://alex-cuhksz.github.io/elevator-problem/): switch between Standard and Campus, call ↑ or ↓ on the boy’s floor, then choose a destination after he boards. The lift defaults to the top floor and returns to floor 2. Girls use randomly selected dorm rooms on either side; the window views change with altitude.

References: [MCE control specification, p. 10](https://acim.nidec.com/elevators/-/media/Project/Nidec/NidecElevator/MCE/PDFs/Specifications/Element-Hydro-Specification.pdf) · [Nikovski & Brand, 2004](https://www.merl.com/publications/TR2004-148).
