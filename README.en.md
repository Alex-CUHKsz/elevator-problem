# Elevator Problem

<a href="README.md"><kbd>中文</kbd></a> · <kbd>English</kbd>

[Observation](#observation) · [Behavior](#behavior) · [Core code](#core-code) · [Try it](#try-it) · [References](#references)

## Observation

You call down at floor 5, heading to floor 2. The lift is ascending from floor 2 to floor 8. The campus lift picks you up on the way up, then stops at floor 5 again on its return.

There was no car call for floor 5 and no repeated hall call. The down-call light stayed on after the first stop. This project reproduces and compares the journey using two dispatch policies.

## Behavior

| Situation | Standard | Campus |
| --- | --- | --- |
| Ascending past F5 with a down call | Pass without stopping | Stop and pick up the boy |
| F5 down call after the upward pass | Pending until the return trip | Still pending, even after boarding |
| Descending past F5 after F8 | Pick up and clear the call | Stop again and clear the call |
| Result | 3 stops | 4 stops |

```text
Standard: 2 → 8 (stop) → 5 (stop, board) → 2 (stop)
Campus:   2 → 5 (stop, board) → 8 (stop) → 5 (stop again) → 2 (stop)
```

**Opening the doors does not necessarily clear the corresponding call.** The Campus policy boards the passenger earlier but adds another stop at floor 5.

## Core code

The model tracks car requests in `calls`, hall requests in `hall`, and travel direction in `direction` (`1` up, `-1` down). Both policies share the same controller; the key difference is **whether stopping requires a matching hall-call direction**.

[Stopping → `Lift.tick()`](app.js#L59), with the core condition expanded equivalently:

```js
const hall = this.hall.get(boundary);
const shouldStop = this.calls.has(boundary) || (
  hall && (
    this.policy === 'observed' || // Campus: either call direction
    hall.has(this.direction)     // Standard: matching direction
  )
);
```

[Clearing → `Lift.open()`](app.js#L49) uses the same rule in both policies:

```js
hall.delete(this.direction);
if (!hall.size) this.hall.delete(floor);
```

An upward stop deletes `1`, while the original down request is `-1`. That request remains pending and triggers another stop on the descent. This is one possible explanation of the observation.

Full implementation: [controller and animation](app.js) · [page](index.html) · [styles](style.css).

## Try it

[**▶ Open the demo**](https://alex-cuhksz.github.io/elevator-problem/)

Choose Standard or Campus, call ↑ or ↓ on the boy’s floor, then select a destination after boarding. To reproduce the original case, call ↓ at floor 5 and select 2; watch the F5 call light and the return trip.

The indicator shows ↑ or ↓ while moving, and — while stopped. Floor 5 has only the boy; girls use randomly chosen dorm rooms on the other floors. The window views change with altitude. The lift defaults to the top floor, then returns to floor 2; the boy stays on his destination floor.

## References

- [MCE · Element Hydraulic Elevator Control, p. 10](https://acim.nidec.com/elevators/-/media/Project/Nidec/NidecElevator/MCE/PDFs/Specifications/Element-Hydro-Specification.pdf): directional service in selective collective control.
- [Nikovski & Brand, 2004](https://www.merl.com/publications/TR2004-148): waiting-time modeling, informing our comparison of waiting and the whole journey.
