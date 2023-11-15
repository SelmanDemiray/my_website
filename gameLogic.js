const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startMenu = document.getElementById('startMenu');
const gameMenu = document.getElementById('menu');
const gathererList = document.getElementById('gathererList');
const soldierList = document.getElementById('soldierList');
const timerDiv = document.getElementById('timer');
const resourceTracker = document.getElementById('resourceTracker');

let offsetX = 3200 / 2 - canvas.width / 2;  // Center the map
let offsetY = 2400 / 2 - canvas.height / 2;  // Center the map
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

    // Add gameStarted class to body to trigger the animation
    document.body.classList.add('gameStarted');

    // Spawn 3 gatherers automatically next to the base
    for (let i = 0; i < 3; i++) {
        spawnInitialGatherer();
    }
}

function spawnInitialGatherer() {
    // Constants for game area dimensions and base position
    const GAME_AREA_WIDTH = 3200;
    const GAME_AREA_HEIGHT = 2400;
    const BASE_POSITION_X = GAME_AREA_WIDTH / 2;
    const BASE_POSITION_Y = GAME_AREA_HEIGHT / 2;
    const SPACING_BETWEEN_GATHERERS = 15;

    // Calculate spawn position for the new gatherer
    const spawnX = BASE_POSITION_X + gatherers.length * SPACING_BETWEEN_GATHERERS;
    const spawnY = BASE_POSITION_Y; // Spawn at base Y position

    // Create a new gatherer object and add it to the gatherers array
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
    return baseResources.food >= 4; // Only check for 4 units of food
}


function spawnGatherer() {
    if (canSpawnGatherer()) {
        baseResources.food -= 4; // Deduct 4 units of food
        updateUnitLists();
        
        const x = (3200 / 2) + gatherers.length * 15;  // Spawn next to the base
        const y = (2400 / 2);
        gatherers.push({ x, y, state: 'searching' });
    }
}
function canSpawnSoldier() {
    // Check if there are at least 5 units of each resource type
    return baseResources.wood >= 5 && baseResources.stone >= 5 && baseResources.gold >= 5 && baseResources.food >= 5;
}
function spawnSoldier() {
    if (canSpawnSoldier()) {
        // Deduct 5 units of each resource
        baseResources.wood -= 5;
        baseResources.stone -= 5;
        baseResources.gold -= 5;
        baseResources.food -= 5;
        updateUnitLists();

        // Spawning logic for soldier
        const x = (3200 / 2) + soldiers.length * 15; // Adjust spawn position if necessary
        const y = (2400 / 2);
        soldiers.push({ x, y }); // Add additional properties if needed
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
    if (resourcesFiltered.length === 0) resourcesFiltered = resources; // Fallback if no preferred resource is available

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
        const base = { x: 3200 / 2, y: 2400 / 2 };
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

    ctx.drawImage(baseImg, (3200 / 2) - offsetX - 75, (2400 / 2) - offsetY - 75, 150, 150);

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

function gameLoop() {
    draw();
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
    // Optionally, you can add code here to reflect the change in the game UI.
}

function updateTimer() {
    const currentTime = new Date();
    const elapsedTime = Math.floor((currentTime - startTime) / 1000);
    timerDiv.innerHTML = 'Time: ' + elapsedTime + 's';
}

function spawnSoldier() {
    const x = (3200 / 2) + soldiers.length * 15;
    const y = (2400 / 2);
    soldiers.push({ x, y });
}
