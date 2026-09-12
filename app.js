// Lift Simulator — build a building with N floors and M lifts, call lifts from
// any floor, and watch the dispatcher assign them. Two strategies: send the
// first idle lift, or the nearest idle lift. Calls made while every lift is
// busy queue up and are served in order as lifts become free.

const floorInput = document.getElementById("floor-input");
const LiftInput = document.getElementById("lift-input");
const submitButton = document.getElementById("submit-btn");
const trafficButton = document.getElementById("traffic-btn");
const strategySelect = document.getElementById("strategy");
const speedSelect = document.getElementById("speed");
const container = document.getElementById("container");
const message = document.getElementById("message");

const MAX_FLOORS = 15;
const MAX_LIFTS = 4;
const SECONDS_PER_FLOOR = 2;   // travel time per floor at 1x speed
const DOOR_SECONDS = 1;        // time for doors to open (and to close)
const DWELL_SECONDS = 2;       // time doors stay open

// Height of one floor in pixels; read from CSS so the two can't drift apart
const floorHeight = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--floor-h"));
const speed = () => Number(speedSelect.value);

let lifts = [];            // { el, floor, engaged }
let targetFloors = [];     // queued calls: { floor, at }
let pending = new Map();   // floor -> time of the earliest unserved call
let trafficTimer = null;
const stats = { served: 0, waits: [], moves: 0 };

// ---------------------------------------------------------------- build
submitButton.addEventListener("click", build);

function build() {
  const floors = parseInt(floorInput.value);
  const nLifts = parseInt(LiftInput.value);
  if (!floors || !nLifts) return notify("Please enter the number of floors and lifts.");
  if (floors < 1 || floors > MAX_FLOORS) return notify(`Floors must be between 1 and ${MAX_FLOORS}.`);
  if (nLifts < 1 || nLifts > MAX_LIFTS) return notify(`Lifts must be between 1 and ${MAX_LIFTS}.`);
  notify("");
  stopTraffic();

  container.innerHTML = "";
  lifts = []; targetFloors = []; pending = new Map();
  stats.served = 0; stats.waits = []; stats.moves = 0;
  renderStats();

  // Floors are built top-down so floor 1 ends up at the bottom
  for (let f = floors; f >= 1; f--) createFloor(f, nLifts, floors);
}

// Function To Create Floors
function createFloor(floor, nLifts, totalFloors) {
  const row = document.createElement("div");
  row.className = "floor";
  row.dataset.floor = floor;

  const panel = document.createElement("div");
  panel.className = "floor-panel";
  const name = document.createElement("div");
  name.className = "floor-name";
  name.textContent = floor === 1 ? "Ground" : `Floor ${floor}`;
  const btns = document.createElement("div");
  btns.className = "btns";
  for (const [label, dir] of [["▲", "up"], ["▼", "down"]]) {
    const b = document.createElement("button");
    b.className = "up-down";
    b.textContent = label;
    b.dataset.floor = floor;
    b.dataset.dir = dir;
    // No "up" from the top floor, no "down" from the ground floor
    if ((dir === "up" && floor === totalFloors) || (dir === "down" && floor === 1)) b.disabled = true;
    btns.append(b);
  }
  panel.append(name, btns);

  const shafts = document.createElement("div");
  shafts.className = "shafts";
  for (let j = 0; j < nLifts; j++) {
    const shaft = document.createElement("div");
    shaft.className = "shaft";
    // Lifts live in the ground-floor shafts and translate upward from there
    if (floor === 1) {
      const lift = document.createElement("div");
      lift.className = "lift-div";
      lift.innerHTML = `<div class="display">1</div><div class="cabin"></div><div class="door left-door"></div><div class="door right-door"></div>`;
      shaft.append(lift);
      lifts.push({ el: lift, floor: 1, engaged: false });
    }
    shafts.append(shaft);
  }

  row.append(panel, shafts);
  container.append(row);
}

// ---------------------------------------------------------------- calls
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("up-down") && !e.target.disabled) {
    requestLift(parseInt(e.target.dataset.floor));
  }
});

function requestLift(floor) {
  if (!lifts.length) return;
  if (pending.has(floor)) return;                       // already called
  if (lifts.some((l) => !l.engaged && l.floor === floor)) return;  // a lift is already here, idle
  pending.set(floor, performance.now());
  setPending(floor, true);
  dispatch(floor);
}

// Decide which lift should serve the call, or queue it if all are busy
function dispatch(floor) {
  const idle = lifts.filter((l) => !l.engaged);
  if (!idle.length) { targetFloors.push(floor); renderStats(); return; }
  let chosen = idle[0];
  if (strategySelect.value === "nearest") {
    chosen = idle.reduce((best, l) => Math.abs(l.floor - floor) < Math.abs(best.floor - floor) ? l : best, idle[0]);
  }
  moveLift(chosen, floor);
}

// Animate a lift to the floor, open and close the doors, then take the next queued call
function moveLift(lift, floor) {
  const distance = Math.abs(floor - lift.floor);
  const travel = (distance * SECONDS_PER_FLOOR) / speed();
  const door = DOOR_SECONDS / speed();
  const dwell = DWELL_SECONDS / speed();

  lift.engaged = true;
  lift.el.classList.add("engaged");
  lift.el.querySelector(".display").textContent = `${lift.floor} ${floor > lift.floor ? "▲" : floor < lift.floor ? "▼" : ""} ${floor}`;
  lift.el.style.setProperty("--door-t", `${door}s`);
  lift.el.style.transitionDuration = `${travel}s`;
  lift.el.style.transform = `translateY(-${(floor - 1) * floorHeight()}px)`;
  stats.moves += distance;
  lift.floor = floor;

  setTimeout(() => {                      // arrived: open doors, clear the call
    lift.el.querySelector(".display").textContent = String(floor);
    lift.el.classList.add("open");
    if (pending.has(floor)) {
      stats.waits.push((performance.now() - pending.get(floor)) / 1000);
      stats.served += 1;
      pending.delete(floor);
      setPending(floor, false);
    }
    renderStats();
  }, travel * 1000);

  setTimeout(() => lift.el.classList.remove("open"), (travel + door + dwell) * 1000);

  setTimeout(() => {                      // free again: serve the queue
    lift.engaged = false;
    lift.el.classList.remove("engaged");
    if (targetFloors.length) dispatch(targetFloors.shift());
    renderStats();
  }, (travel + door + dwell + door) * 1000);
}

function setPending(floor, on) {
  document.querySelectorAll(`.up-down[data-floor="${floor}"]`).forEach((b) => b.classList.toggle("pending", on));
}

// ---------------------------------------------------------------- traffic
trafficButton.addEventListener("click", () => (trafficTimer ? stopTraffic() : startTraffic()));

function startTraffic() {
  if (!lifts.length) return notify("Build a building first.");
  const floors = document.querySelectorAll(".floor").length;
  trafficTimer = setInterval(() => requestLift(1 + Math.floor(Math.random() * floors)), 1800 / speed());
  trafficButton.textContent = "Random traffic: on";
  trafficButton.classList.add("on");
}

function stopTraffic() {
  clearInterval(trafficTimer);
  trafficTimer = null;
  trafficButton.textContent = "Random traffic: off";
  trafficButton.classList.remove("on");
}

// ---------------------------------------------------------------- misc
function renderStats() {
  document.getElementById("stat-served").textContent = stats.served;
  document.getElementById("stat-queue").textContent = pending.size;
  document.getElementById("stat-wait").textContent = stats.waits.length
    ? (stats.waits.reduce((a, b) => a + b, 0) / stats.waits.length).toFixed(1) : "–";
  document.getElementById("stat-moves").textContent = stats.moves;
}

function notify(text) {
  message.textContent = text;
  message.hidden = !text;
}

// Start with a building on the page so there's something to click
build();
