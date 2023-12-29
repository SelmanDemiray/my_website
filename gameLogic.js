const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const miniMapCanvas = document.getElementById('miniMapCanvas');
const miniMapCtx = miniMapCanvas.getContext('2d');
const startMenu = document.getElementById('startMenu');
const gameMenu = document.getElementById('menu');
const gathererList = document.getElementById('gathererList');
const soldierList = document.getElementById('soldierList');
const timerDiv = document.getElementById('timer');
const resourceTracker = document.getElementById('resourceTracker');

const GAME_AREA_WIDTH = 32000;
const GAME_AREA_HEIGHT = 24000;

let offsetX = GAME_AREA_WIDTH / 2 - canvas.width / 2;
let offsetY = GAME_AREA_HEIGHT / 2 - canvas.height / 2;

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

const gathererImg = new Image();
gathererImg.src = 'gatherer.gif';

const baseImg = new Image();
baseImg.src = 'base.gif';

const woodImg = new Image();
woodImg.src = 'wood.gif';

const stoneImg = new Image();
stoneImg.src = 'stone.gif';

const goldImg = new Image();
goldImg.src = 'gold.gif';

const foodImg = new Image();
foodImg.src = 'food.gif';

const soldierImg = new Image();
soldierImg.src = 'soldier.gif';

function generateResources() {
    const types = ['wood', 'stone', 'gold', 'food'];
    for (let i = 0; i < 500; i++) {
        const x = Math.floor(Math.random() * GAME_AREA_WIDTH);
        const y = Math.floor(Math.random() * GAME_AREA_HEIGHT);
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

    document.body.classList.add('gameStarted');
    for (let i = 0; i < 3; i++) {
        spawnInitialGatherer();
    }
}

function spawnInitialGatherer() {
    const BASE_POSITION_X = GAME_AREA_WIDTH / 2;
    const BASE_POSITION_Y = GAME_AREA_HEIGHT / 2;
    const SPACING_BETWEEN_GATHERERS = 15;

    const spawnX = BASE_POSITION_X + gatherers.length * SPACING_BETWEEN_GATHERERS;
    const spawnY = BASE_POSITION_Y;

    const newGatherer = {
        x: spawnX,
        y: spawnY,
        state: 'searching'
    };
    gatherers.push(newGatherer);
}

function handleKeydown(e) {
    const speed = 50;
    if (e.key === 'w') offsetY -= speed;
    if (e.key === 's') offsetY += speed;
    if (e.key === 'a') offsetX -= speed;
    if (e.key === 'd') offsetX += speed;
}

function canSpawnGatherer() {
    return baseResources.food >= 4;
}

function spawnGatherer() {
    if (canSpawnGatherer()) {
        baseResources.food -= 4;
        updateUnitLists();

        const x = GAME_AREA_WIDTH / 2 + gatherers.length * 15;
        const y = GAME_AREA_HEIGHT / 2;
        gatherers.push({ x, y, state: 'searching' });
    }
}

function canSpawnSoldier() {
    return baseResources.wood >= 5 && baseResources.stone >= 5 && baseResources.gold >= 5 && baseResources.food >= 5;
}

function spawnSoldier() {
    if (canSpawnSoldier()) {
        baseResources.wood -= 5;
        baseResources.stone -= 5;
        baseResources.gold -= 5;
        baseResources.food -= 5;
        updateUnitLists();

        const x = GAME_AREA_WIDTH / 2 + soldiers.length * 15;
        const y = GAME_AREA_HEIGHT / 2;
        soldiers.push({ x, y });
    }
}

function updateUnitLists() {
    gathererList.innerHTML = 'Gatherers: ' + gatherers.length;
    soldierList.innerHTML = 'Soldiers: ' + soldiers.length;
    resourceTracker.innerHTML = `Wood: ${baseResources.wood} | Stone: ${baseResources.stone} | Gold: ${baseResources.gold} | Food: ${baseResources.food}`;

    const gathererButton = document.getElementById('spawnGathererButton');
    if (canSpawnGatherer()) {
        gathererButton.disabled = false;
        gathererButton.title = "Click to spawn a gatherer";
    } else {
        gathererButton.disabled = true;
        gathererButton.title = "Gather 3 of each resource to spawn a gatherer";
    }
}

function distance(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function closestResource(unit) {
    let resourcesFiltered = unit.preferredResource ? resources.filter(r => r.type === unit.preferredResource) : resources;
    if (resourcesFiltered.length === 0) resourcesFiltered = resources;

    return resourcesFiltered.reduce((closest, resource) => {
        const dist = distance(unit, resource);
        return dist < distance(unit, closest) ? resource : closest;
    }, resourcesFiltered[0]);
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
            g.carrying = resource.type;
            setTimeout(() => {
                resource.useCount = (resource.useCount || 0) + 1;
                if (resource.useCount >= 5) {
                    const index = resources.indexOf(resource);
                    resources.splice(index, 1);
                }
                g.state = 'returning';
            }, 1000);
        } else if (resource) {
            moveTowards(g, resource);
        }
    } else if (g.state === 'returning') {
        const base = { x: GAME_AREA_WIDTH / 2, y: GAME_AREA_HEIGHT / 2 };
        if (distance(g, base) <= 75) {
            baseResources[g.carrying]++;
            g.carrying = null;
            g.state = 'searching';
            updateUnitLists();
        } else {
            moveTowards(g, base);
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(baseImg, GAME_AREA_WIDTH / 2 - offsetX - 75, GAME_AREA_HEIGHT / 2 - offsetY - 75, 150, 150);

    gatherers.forEach(g => {
        if (!g.state) g.state = 'searching';
        gathererBehavior(g);
        ctx.drawImage(gathererImg, g.x - offsetX, g.y - offsetY, 10, 10);
    });

    soldiers.forEach(s => {
        ctx.drawImage(soldierImg, s.x - offsetX, s.y - offsetY, 10, 10);
    });

    resources.forEach(r => {
        let img;
        switch (r.type) {
            case 'wood':
                img = woodImg;
                break;
            case 'stone':
                img = stoneImg;
                break;
            case 'gold':
                img = goldImg;
                break;
            case 'food':
                img = foodImg;
                break;
        }
        ctx.drawImage(img, r.x - offsetX, r.y - offsetY, 20, 20);
    });
}

function drawMiniMap() {
    miniMapCtx.clearRect(0, 0, miniMapCanvas.width, miniMapCanvas.height);

    const scaleX = miniMapCanvas.width / GAME_AREA_WIDTH;
    const scaleY = miniMapCanvas.height / GAME_AREA_HEIGHT;

    // Draw the base
    miniMapCtx.fillStyle = 'blue';
    miniMapCtx.fillRect(
        (GAME_AREA_WIDTH / 2) * scaleX - 8,
        (GAME_AREA_HEIGHT / 2) * scaleY - 8,
        16, 16
    );

    // Draw gatherers
    gatherers.forEach(g => {
        miniMapCtx.fillStyle = 'green';
        miniMapCtx.fillRect(
            g.x * scaleX - 1,
            g.y * scaleY - 1,
            2, 2
        );
    });

    // Draw soldiers
    soldiers.forEach(s => {
        miniMapCtx.fillStyle = 'red';
        miniMapCtx.fillRect(
            s.x * scaleX - 1,
            s.y * scaleY - 1,
            2, 2
        );
    });

    // Draw resources
    resources.forEach(r => {
        switch (r.type) {
            case 'wood':
                miniMapCtx.fillStyle = 'brown';
                break;
            case 'stone':
                miniMapCtx.fillStyle = 'gray';
                break;
            case 'gold':
                miniMapCtx.fillStyle = 'yellow';
                break;
            case 'food':
                miniMapCtx.fillStyle = 'orange';
                break;
            default:
                miniMapCtx.fillStyle = 'black'; // Default color for any undefined resource
        }
        miniMapCtx.fillRect(
            r.x * scaleX - 1,
            r.y * scaleY - 1,
            2, 2 // Small squares for each resource
        );
    });
}



function gameLoop() {
    draw();
    drawMiniMap();
    updateTimer();
    requestAnimationFrame(gameLoop);
}

function updateResourcePreference() {
    const selectedResource = document.getElementById('resourcePreferenceSelect').value;
    setGathererPreference(selectedResource);
}

function setGathererPreference(resourceType) {
    gatherers.forEach(gatherer => {
        gatherer.preferredResource = resourceType;
    });
}

function updateTimer() {
    const currentTime = new Date();
    const elapsedTime = Math.floor((currentTime - startTime) / 1000);
    timerDiv.innerHTML = 'Time: ' + elapsedTime + 's';
}

window.onload = startGame;

