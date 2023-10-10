const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startMenu = document.getElementById('startMenu');
const gameMenu = document.getElementById('menu');
const gathererList = document.getElementById('gathererList');
const soldierList = document.getElementById('soldierList');
const timerDiv = document.getElementById('timer');

const resourceColors = {
  wood: 'brown',
  stone: 'gray',
  gold: 'gold',
  food: 'green'
};

let offsetX = 0;
let offsetY = 0;
let gatherers = [];
let soldiers = [];
let resources = [];
let startTime;

let baseResources = {
  wood: 0,
  stone: 0,
  gold: 0,
  food: 0
};

function generateResources() {
  const types = ['wood', 'stone', 'gold', 'food'];
  for (let i = 0; i < 50; i++) {
    const x = Math.floor(Math.random() * 3200);
    const y = Math.floor(Math.random() * 2400);
    const type = types[Math.floor(Math.random() * types.length)];
    resources.push({ x, y, type });
  }
}

function startGame() {
  startMenu.style.display = 'none';
  canvas.style.display = 'block';
  gameMenu.style.display = 'block';
  generateResources();
  startTime = new Date();
  updateUnitLists();
  gameLoop();
  document.addEventListener('keydown', handleKeydown);
}

function handleKeydown(e) {
  const speed = 50;
  if (e.key === 'w') offsetY -= speed;
  if (e.key === 's') offsetY += speed;
  if (e.key === 'a') offsetX -= speed;
  if (e.key === 'd') offsetX += speed;
}

function updateUnitLists() {
  gathererList.innerHTML = 'Gatherers: ' + gatherers.length;
  soldierList.innerHTML = 'Soldiers: ' + soldiers.length;
}

function distance(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function closestResource(unit) {
  let minDist = Infinity;
  let closestRes = null;
  resources.forEach(r => {
    const dist = distance(unit, r);
    if (dist < minDist) {
      minDist = dist;
      closestRes = r;
    }
  });
  return closestRes;
}

function moveTowards(unit, target) {
  const dx = target.x - unit.x;
  const dy = target.y - unit.y;
  const dist = distance(unit, target);
  if (dist > 1) {
    unit.x += dx / dist;
    unit.y += dy / dist;
  }
}

function gathererBehavior(g) {
  if (g.state === 'searching') {
    const resource = closestResource(g);
    if (resource && distance(g, resource) <= 20) {
      g.state = 'gathering';
      setTimeout(() => {
        resource.useCount = (resource.useCount || 0) + 1;
        if (resource.useCount >= 5) {
          const index = resources.indexOf(resource);
          resources.splice(index, 1);
        }
        g.state = 'returning';
      }, 1000); // 1 second to gather
    } else if (resource) {
      moveTowards(g, resource);
    }
  } else if (g.state === 'returning') {
    const base = { x: 1600, y: 1200 };
    if (distance(g, base) <= 50) {
      baseResources[g.gatheredType]++;
      updateResourceTracker();
      g.state = 'searching';
      delete g.gatheredType;
    } else {
      moveTowards(g, base);
    }
  } else if (g.state === 'gathering') {
    const resource = closestResource(g);
    if (resource) {
      g.gatheredType = resource.type;
      moveTowards(g, resource);
    }
  }
}

function updateResourceTracker() {
  document.getElementById('woodCount').innerText = baseResources.wood;
  document.getElementById('stoneCount').innerText = baseResources.stone;
  document.getElementById('goldCount').innerText = baseResources.gold;
  document.getElementById('foodCount').innerText = baseResources.food;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw Base
  ctx.fillStyle = 'purple';
  ctx.fillRect(1600 - offsetX, 1200 - offsetY, 50, 50);

  // Draw gatherers
  ctx.fillStyle = 'blue';
  gatherers.forEach(g => {
    if (!g.state) g.state = 'searching';
    gathererBehavior(g);
    ctx.fillRect(g.x - offsetX, g.y - offsetY, 10, 10);
  });

  // Draw soldiers
  ctx.fillStyle = 'red';
  soldiers.forEach(s => {
    ctx.fillRect(s.x - offsetX, s.y - offsetY, 10, 10);
  });

  // Draw resources
  resources.forEach(r => {
    ctx.fillStyle = resourceColors[r.type];
    ctx.fillRect(r.x - offsetX, r.y - offsetY, 20, 20);
  });
}

function gameLoop() {
  draw();
  updateTimer();
  requestAnimationFrame(gameLoop);
}

function updateTimer() {
  const currentTime = new Date();
  const elapsedTime = Math.floor((currentTime - startTime) / 1000);
  timerDiv.innerHTML = 'Time: ' + elapsedTime + 's';
}

function spawnGatherer() {
  const x = 1605 + gatherers.length * 15;
  const y = 1205;
  gatherers.push({x, y, state: 'searching'});
  updateUnitLists();
}

function spawnSoldier() {
  const x = 1605 + soldiers.length * 15;
  const y = 1205;
  soldiers.push({x, y});
  updateUnitLists();
}
