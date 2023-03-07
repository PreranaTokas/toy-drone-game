const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const backgroundMusic = document.getElementById("background-music");
const placeDroneMsg =
  "Place the drone by pressing S or by clicking the PLACE button";
const droneMove = document.getElementById("droneMove");

const canvasRenderSize =
  window.innerHeight < window.innerWidth
    ? window.innerHeight * 0.8
    : window.innerWidth * 0.8;

canvas.height = canvasRenderSize;
canvas.width = canvasRenderSize;

const TILE_SIZE = canvasRenderSize / 10;
const GRID_SIZE = 10;

const directions = ["west", "south", "east", "north"];

const droneImg = new Image();
droneImg.src = "./assets/images/droneWhite.png";
const grassImg = new Image();
grassImg.src = "./assets/images/grass.jpg";
const explosionImg = new Image();
explosionImg.src = "./assets/images/explosionImg.png";

const drone = {
  x: null,
  y: null,
  facing: null,
  image: droneImg,
  rotation: 0,
};

const projectiles = [];
const explosions = [];

const surface = Array.from({ length: GRID_SIZE }, () =>
  new Array(GRID_SIZE).fill(null)
);

function init() {
  document.addEventListener("keydown", handleKeyPress);
  gameLoop();
}

function gameLoop() {
  draw();
  explosions.forEach((explosion) => {
    projectiles.forEach((projectile, index) => {
      if (projectile.x === explosion.x && projectile.y === explosion.y) {
        explode(projectile);
      } else if (projectile.frame < 5) {
        updateProjectilePosition(projectile);
        projectile.frame++;
      } else {
        projectiles.splice(index, 1);
      }
    });
  });
  requestAnimationFrame(gameLoop);
}

function draw() {
  clearCanvas();
  drawGrid();
  drawExplosions();
  drawProjectiles();
  if (drone.x !== null && drone.y !== null && drone.facing !== null) {
    drawDrone();
  }
}

function clearCanvas() {
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
  context.strokeStyle = "white";
  context.lineWidth = 1;

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      context.drawImage(
        grassImg,
        j * TILE_SIZE,
        i * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE
      );
    }
  }

  for (let x = 0; x < canvas.width; x += TILE_SIZE) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
  for (let y = 0; y < canvas.height; y += TILE_SIZE) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }
}

function drawExplosions() {
  explosions.forEach((explosion) => {
    context.drawImage(
      explosionImg,
      explosion.x * TILE_SIZE,
      explosion.y * TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE
    );
  });
}

function drawDrone() {
  context.save();
  context.translate(
    drone.x * TILE_SIZE + TILE_SIZE / 2,
    (GRID_SIZE - 1 - drone.y) * TILE_SIZE + TILE_SIZE / 2
  );
  context.rotate(drone.rotation);
  context.drawImage(
    drone.image,
    -TILE_SIZE / 2,
    -TILE_SIZE / 2,
    TILE_SIZE,
    TILE_SIZE
  );
  context.restore();
}

function drawProjectiles() {
  projectiles.forEach((projectile) => {
    context.save();
    context.translate(
      TILE_SIZE * (projectile.x + 0.5),
      canvas.height - TILE_SIZE * (projectile.y + 0.5)
    );
    context.rotate(getDirectionAngle(projectile.facing));
    context.drawImage(
      projectile.image,
      -TILE_SIZE / 2,
      -TILE_SIZE / 2,
      TILE_SIZE,
      TILE_SIZE
    );
    context.restore();
  });
}

function updateProjectilePosition(projectile) {
  switch (projectile.facing) {
    case "north":
      projectile.y += 1;
      break;
    case "east":
      projectile.x -= 1;
      break;
    case "south":
      projectile.y -= 1;
      break;
    case "west":
      projectile.x += 1;
      break;
  }
}

function handleKeyPress(e) {
  e.preventDefault();
  switch (e.keyCode) {
    case 38:
    case 87:
      moveDrone();
      break;
    case 37:
    case 65:
      rotateDrone("right");
      break;
    case 39:
    case 68:
      rotateDrone("left");
      break;
    case 32:
      attack();
      break;
    case 192:
      report();
      break;
    case 83:
    case 40:
      placeDrone();
      break;
    case 82:
      reset();
      break;
    default:
      return;
  }
}

function isDronePlaced() {
  return drone.x !== null && drone.y !== null && drone.facing !== null;
}

function placeDrone() {
  if (backgroundMusic.duration <= 0 || backgroundMusic.paused) {
    backgroundMusic.play();
  }
  const defaultCommand = "0,0,North";
  let command = prompt("Enter command in the format X,Y,F", defaultCommand);
  if (command) {
    let values = command.split(",");
    if (values.length === 3) {
      const x = parseInt(values[0].trim());
      const y = parseInt(values[1].trim());
      const facing = values[2].trim().toLowerCase();
      const xBetweenRange = x >= 0 && x < 10;
      const yBetweenrange = y >= 0 && y < 10;
      if (!isNaN(x) && !isNaN(y) && directions.includes(facing) && xBetweenRange && yBetweenrange) {
        drone.x = x;
        drone.y = y;
        drone.facing = facing;
        drone.rotation = (getDirectionAngle(drone.facing) * Math.PI) / 180;
      } else {
        showAlert("Enter command in the format X,Y,F where x and y varies from 0-9 integer and F north, south, east and west", 'info');
      }
    }
  }
}

function rotateDrone(direction) {
  if (isDronePlaced()) {
    let index = directions.indexOf(drone.facing);
    if (direction === "left") {
      index--;
      if (index < 0) {
        index = directions.length - 1;
      }
    } else {
      index++;
      if (index >= directions.length) {
        index = 0;
      }
    }
    drone.facing = directions[index];
    drone.rotation = (getDirectionAngle(drone.facing) * Math.PI) / 180;
  } else {
    showAlert(placeDroneMsg, "warning");
  }
}

function getDirectionAngle(facing) {
  switch (facing) {
    case "north":
      return 0;
    case "east":
      return 90;
    case "south":
      return 180;
    case "west":
      return -90;
    default:
      return 0;
  }
}

function attack() {
  if (isDronePlaced()) {
    const [targetX, targetY] = getAttackCoords();
    if (isFreeSpace(targetX, targetY)) {
      projectiles.push({
        x: targetX,
        y: targetY,
        facing: drone.facing,
        image: explosionImg,
        frame: 0,
      });
      const attackSound = document.getElementById("attackSound");
      attackSound.play();
      gameLoop();
    } else {
      const attackDenied = document.getElementById("attackDenied");
      attackDenied.play();
      console.log(
        "No free space to attack in the direction of drone",
        "danger"
      );
    }
  } else {
    showAlert(placeDroneMsg, "warning");
  }
}

function getAttackCoords() {
  let targetX, targetY;
  switch (drone.facing) {
    case "north":
      targetX = drone.x;
      targetY = drone.y + 2;
      break;
    case "east":
      targetX = drone.x + 2;
      targetY = drone.y;
      break;
    case "south":
      targetX = drone.x;
      targetY = drone.y - 2;
      break;
    case "west":
      targetX = drone.x - 2;
      targetY = drone.y;
      break;
  }
  return [targetX, targetY];
}

function isFreeSpace(x, y) {
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
    return false;
  }
  return surface[y][x] === null;
}

function moveDrone() {
  if (isDronePlaced()) {
    switch (drone.facing) {
      case "north":
        if (drone.y < GRID_SIZE - 1 && !isOccupied(drone.x, drone.y + 1)) {
          drone.y++;
        }
        break;
      case "east":
        if (drone.x < GRID_SIZE - 1 && !isOccupied(drone.x + 1, drone.y)) {
          drone.x++;
        }
        break;
      case "south":
        if (drone.y > 0 && !isOccupied(drone.x, drone.y - 1)) {
          drone.y--;
        }
        break;
      case "west":
        if (drone.x > 0 && !isOccupied(drone.x - 1, drone.y)) {
          drone.x--;
        }
        break;
    }

    if (drone.x < 0) {
      drone.x = 0;
    } else if (drone.x >= GRID_SIZE) {
      drone.x = GRID_SIZE - 1;
    }

    if (drone.y < 0) {
      drone.y = 0;
    } else if (drone.y >= GRID_SIZE) {
      drone.y = GRID_SIZE - 1;
    }
    endX = drone.x * TILE_SIZE;
    endY = (GRID_SIZE - drone.y - 1) * TILE_SIZE;
    droneMove.play();
    droneMove.playbackRate = 2.0;
  } else {
    showAlert(placeDroneMsg, "warning");
  }
}

function isOccupied(x, y) {
  return surface[y][x] !== null;
}

function report() {
  if (isDronePlaced()) {
    showAlert(
      `Drone position: ${drone.x},${drone.y},${drone.facing.toUpperCase()}`,
      "info"
    );
  } else {
    showAlert(placeDroneMsg, "warning");
  }
}

function explode(projectile) {
  let explosion = { x: projectile.x, y: projectile.y };
  projectiles.splice(projectiles.indexOf(projectile), 1);
  explosions.push(explosion);
  setTimeout(() => {
    explosions.splice(explosions.indexOf(explosion), 1);
  }, 500);
  draw();
}

function reset() {
  const confirmed = confirm("Are you sure you want to reset the game?");
  if (confirmed) {
    window.location.reload();
  }
}

function showAlert(message, type) {
  let toast = document.createElement("div");
  toast.classList.add("toast");
  toast.classList.add(type);
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");

  let toastHeader = document.createElement("div");
  toastHeader.classList.add("toast-header");

  let toastTitle = document.createElement("strong");
  toastTitle.classList.add("me-auto");
  toastTitle.textContent = type.toUpperCase();

  let toastCloseButton = document.createElement("button");
  toastCloseButton.classList.add("btn-close");
  toastCloseButton.setAttribute("type", "button");
  toastCloseButton.setAttribute("data-bs-dismiss", "toast");
  toastCloseButton.setAttribute("aria-label", "Close");

  let toastBody = document.createElement("div");
  toastBody.classList.add("toast-body");
  toastBody.textContent = message;
  toastHeader.appendChild(toastTitle);
  toastHeader.appendChild(toastCloseButton);
  toast.appendChild(toastHeader);
  toast.appendChild(toastBody);
  let container = document.getElementById("toast-container");
  container.appendChild(toast);
  setTimeout(function() {
    toast.classList.add("show");
  }, 100);

  setTimeout(function() {
    toast.classList.remove("show");
    setTimeout(function() {
      container.removeChild(toast);
    }, 500);
  }, 4000);
}

init();
