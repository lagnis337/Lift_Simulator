const floorInput = document.getElementById("floor-input");
const LiftInput = document.getElementById("lift-input");
const submitButton = document.getElementById("submit-btn");
const container = document.getElementById("container");
const liftContainer = document.createElement("div");

const MAX_FLOORS = 15;
const MAX_LIFTS = 4;

// Height of one floor in pixels; must match .floor height in styles.css
const FLOOR_HEIGHT = 100;

// Seconds a lift takes to travel one floor
const SECONDS_PER_FLOOR = 2;

// Floors requested while every lift was busy, served in order
let targetFloors = [];

// Last floor that was requested, used to ignore repeated clicks on the same button
let lastRequestedFloor = null;

// On Submit button add values
submitButton.addEventListener("click", () => {
  const floors = parseInt(floorInput.value);
  const lifts = parseInt(LiftInput.value);

  if (!LiftInput.value && !floorInput.value) {
    alert("Please Enter number to generate Floors and Lifts");
  } else if (!floorInput.value) {
    alert(`Please enter floor number in range 1-${MAX_FLOORS}`);
  } else if (!LiftInput.value) {
    alert(`Please enter lift number in range 1-${MAX_LIFTS}`);
  } else if (lifts > MAX_LIFTS) {
    alert(`Maximum ${MAX_LIFTS} lifts are allowed!`);
  } else if (lifts === 0 || floors === 0) {
    alert("Value cannot be zero");
  } else if (floors > MAX_FLOORS) {
    alert(`Maximum no of floors is ${MAX_FLOORS}!`);
  } else if (lifts < 0 || floors < 0) {
    alert("No negative values are allowed");
  } else {
    container.innerHTML = "";
    liftContainer.innerHTML = "";
    targetFloors = [];
    lastRequestedFloor = null;

    // Build floors top-down so floor 1 ends up at the bottom of the page
    for (let i = floors; i > 0; i--) {
      createFloors(i, lifts);
    }

    // Remove the values after submitting
    LiftInput.value = "";
    floorInput.value = "";
  }
});

// Function To Create Floors
function createFloors(floors, lifts) {
  const floorDiv = document.createElement("div");
  floorDiv.classList.add("floordiv");

  const floorContainer = document.createElement("div");
  floorContainer.classList.add("floor");
  floorContainer.dataset.floor = floors;

  // Button container
  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("btn-div");

  const UpButton = document.createElement("button");
  const DownButton = document.createElement("button");

  UpButton.classList.add("up-down");
  DownButton.classList.add("up-down");

  UpButton.innerText = "UP";
  DownButton.innerText = "Down";

  UpButton.dataset.floor = floors;
  DownButton.dataset.floor = floors;

  buttonContainer.append(UpButton);
  buttonContainer.append(DownButton);

  const floorNumber = document.createElement("p");
  floorNumber.classList.add("floorName");
  floorNumber.innerText = `No ${floors}`;

  buttonContainer.append(floorNumber);
  floorContainer.append(buttonContainer);
  floorDiv.append(floorContainer);
  container.append(floorDiv);

  // Logic to generate Lifts: all lifts start on the ground floor (floor 1)
  if (floors === 1) {
    for (let j = 0; j < lifts; j++) {
      const Lifts = document.createElement("div");
      Lifts.classList.add("lift-div");
      Lifts.setAttribute("onfloor", 1);

      const leftDoor = document.createElement("div");
      const RightDoor = document.createElement("div");

      leftDoor.classList.add("left-door");
      RightDoor.classList.add("right-door");

      Lifts.appendChild(leftDoor);
      Lifts.appendChild(RightDoor);

      liftContainer.appendChild(Lifts);
    }

    liftContainer.classList.add("lift");
    floorContainer.append(liftContainer);
  }
}

// Up / Down button getting clicked
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("up-down")) {
    const clickedFloor = parseInt(e.target.dataset.floor);

    // Ignore a second click on the floor that was just requested
    if (clickedFloor === lastRequestedFloor) {
      return;
    }

    LiftStatus(clickedFloor);
    lastRequestedFloor = clickedFloor;
  }
});

// Decide which lift should serve the request for clickedFloor
function LiftStatus(clickedFloor) {
  const lifts = document.querySelectorAll(".lift-div");

  // If a lift is already on (or heading to) this floor, nothing to do
  for (let i = 0; i < lifts.length; i++) {
    const onFloorVal = parseInt(lifts[i].getAttribute("onfloor"));
    if (onFloorVal === clickedFloor) {
      return;
    }
  }

  // Otherwise send the first idle lift
  for (let i = 0; i < lifts.length; i++) {
    if (!lifts[i].classList.contains("engaged")) {
      MoveLift(clickedFloor, i);
      return;
    }
  }

  // Every lift is busy: queue the request
  targetFloors.push(clickedFloor);
}

// Animate lift number `pos` to clickedFloor, open and close the doors,
// then pick up the next queued request if there is one
function MoveLift(clickedFloor, pos) {
  const elevators = document.getElementsByClassName("lift-div");
  const elevator = elevators[pos];

  const currentFloor = parseInt(elevator.getAttribute("onfloor"));
  const duration = Math.abs(clickedFloor - currentFloor) * SECONDS_PER_FLOOR;

  elevator.setAttribute("onfloor", clickedFloor);

  elevator.style.transition = `transform ${duration}s linear`;
  elevator.style.transform = `translateY(-${FLOOR_HEIGHT * (clickedFloor - 1)}px)`;
  elevator.classList.add("engaged");

  // Open doors once the lift arrives
  setTimeout(() => {
    elevator.children[0].style.transform = "translateX(-100%)";
    elevator.children[1].style.transform = "translateX(100%)";
  }, duration * 1000 + 1000);

  // Close doors
  setTimeout(() => {
    elevator.children[0].style.transform = "none";
    elevator.children[1].style.transform = "none";
  }, duration * 1000 + 4000);

  // Remove the busy status and serve the next queued floor
  setTimeout(() => {
    elevator.classList.remove("engaged");

    if (targetFloors.length) {
      MoveLift(targetFloors.shift(), pos);
    }
  }, duration * 1000 + 7000);
}
