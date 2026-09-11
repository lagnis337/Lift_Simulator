# Lift Simulator

A browser-based simulation of a building with multiple lifts. You choose how many floors (1–15) and lifts (1–4) the building has, then press the Up/Down buttons on any floor and watch a lift travel there, open its doors, close them, and become available again. Requests made while every lift is busy are queued and served in order.

Written in plain **HTML, CSS and JavaScript** — no frameworks, no build step, no dependencies.

![Lift Simulator with 4 floors and 3 lifts; the lift on floor 3 has its doors open](screenshot.png)

## Running it

Clone the repo and open `index.html` in any browser — that's it.

```bash
git clone https://github.com/lagnis337/Lift_Simulator.git
cd Lift_Simulator
open index.html          # macOS; on Linux use xdg-open, on Windows just double-click the file
```

## Trying it out

1. Enter **5** floors and **2** lifts, press **Submit**. Five floors are drawn with both lifts parked on floor 1.
2. Press **UP** on floor 4 — the first lift travels up (2 seconds per floor, so 6 s), its doors open for a moment, then close.
3. While it's moving, press **UP** on floor 3 — the second (idle) lift goes there.
4. While both are busy, press **UP** on floor 5 — nothing moves yet; the request is queued. Once a lift finishes its door cycle it heads to floor 5.
5. Press a button on a floor a lift is already on — nothing happens, since a lift is already there.

Input validation: blank, zero, negative or out-of-range values are rejected with a message.

## How it works

| File         | Purpose                                                                  |
|--------------|--------------------------------------------------------------------------|
| `index.html` | Input form and the container the building is rendered into              |
| `app.js`     | Builds the floors/lifts in the DOM and implements the lift logic         |
| `styles.css` | Layout, colours, door animations, responsive breakpoints                 |

**Rendering.** On submit, `createFloors()` builds the floors from the top down so floor 1 sits at the bottom of the page; all lifts are appended to floor 1. Each lift is a `div` containing two door `div`s.

**Dispatching** (`LiftStatus`). When a button is pressed the code first checks whether any lift is already on, or heading to, that floor — if so the request is ignored. Otherwise the first lift *not* marked `engaged` is sent. If every lift is engaged, the floor is pushed onto a `targetFloors` queue.

**Movement** (`MoveLift`). A lift's position is a CSS `transform: translateY(...)`; the travel time is `|target − current| × 2 s`, applied as the CSS `transition` duration so the animation speed matches the distance. Three `setTimeout`s then open the doors on arrival, close them 3 s later, and finally clear the `engaged` flag and pull the next request off the queue.

State lives in the DOM: each lift's `onfloor` attribute records where it is (or is going), and the `engaged` class marks it as busy.

## Limitations / what I'd do next

- **Nearest-lift scheduling.** Currently the first idle lift is chosen; picking the lift closest to the requested floor would be more realistic.
- **Direction-aware requests.** UP and Down currently behave identically; a real controller would batch requests going the same direction.
- **Queue serving.** Queued floors are served by whichever lift frees up first, in FIFO order.
- Timings are driven by `setTimeout` rather than `transitionend` events, so they'd drift if the CSS durations were changed independently.
