const FISH_DATA = [
    { id: 'tilapia', name: '吳郭魚', rarity: '普通', price: 10, gps: 0.5, loc: 0, color: '#94a3b8' },
    { id: 'shoe', name: '沉底舊鞋', rarity: '垃圾', price: 2, gps: 0.1, loc: 0, color: '#78716c' },
    { id: 'coffee', name: '空咖啡杯', rarity: '搞笑', price: 25, gps: 1.2, loc: 0, color: '#ef4444' },
    { id: 'carp', name: '草魚', rarity: '普通', price: 18, gps: 0.8, loc: 0, color: '#10b981' },
    { id: 'salmon', name: '野生鮭魚', rarity: '稀有', price: 60, gps: 3.5, loc: 1, color: '#f97316' },
    { id: 'goldfish', name: '黃金鯉魚', rarity: '史詩', price: 150, gps: 10.0, loc: 1, color: '#fbbf24' },
    { id: 'pikachu_fish', name: '皮卡丘魚', rarity: '搞笑', price: 220, gps: 15.0, loc: 1, color: '#facc15' },
    { id: 'angler', name: '提燈魚', rarity: '稀有', price: 300, gps: 22.0, loc: 2, color: '#818cf8' },
    { id: 'shark', name: '大白鯊', rarity: '史詩', price: 800, gps: 60.0, loc: 2, color: '#38bdf8' },
    { id: 'liver', name: '工程師的肝', rarity: '傳奇', price: 2000, gps: 150.0, loc: 2, color: '#a855f7' },
    { id: 'cthulhu', name: '克蘇魯', rarity: '神話', price: 5000, gps: 400.0, loc: 2, color: '#22c55e' }
];

const LOCATIONS = [
    { name: '🏞️ 公司花園池塘', cost: 0 },
    { name: '⛵ 近海碼頭', cost: 500 },
    { name: '🐙 深海溝', cost: 3000 }
];

let state = {
    gold: 0,
    currentLoc: 0,
    unlockedLocs: [0],
    inventory: [],
    aquarium: [],
    fishdex: [],
    rodLevel: 1,
    autoBaitLevel: 0
};

let isBossMode = false;
let floatTexts = [];
let ripples = [];
let bobberY = 0;
let bobberTargetY = 0;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    bobberY = canvas.height / 2;
    bobberTargetY = canvas.height / 2;
}

window.addEventListener('resize', resizeCanvas);

function init() {
    resizeCanvas();
    loadSave();
    renderUpgrades();
    renderLocations();
    renderFishdex();
    updateUI();
    gameLoop();

    setInterval(secondTick, 1000);
    setInterval(autoSave, 5000);
}

// 側邊欄開關
function toggleSidebar() {
    const panel = document.getElementById('sidePanel');
    const btn = document.getElementById('toggleBtn');
    panel.classList.toggle('closed');
    btn.innerText = panel.classList.contains('closed') ? '◀' : '▶';
}

// Boss Key (ESC)
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        isBossMode = !isBossMode;
        document.getElementById('excelDisguise').style.display = isBossMode ? 'block' : 'none';
    }
});

function gameLoop() {
    drawScene();
    requestAnimationFrame(gameLoop);
}

function drawScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const poolRadiusX = 180;
    const poolRadiusY = 110;

    // 背景
    ctx.fillStyle = '#0f141c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 草地邊線柔光
    ctx.shadowBlur = 25;
    ctx.shadowColor = state.currentLoc === 2 ? '#4c1d95' : '#0284c7';

    // 池塘外圍
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, poolRadiusX + 15, poolRadiusY + 15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // 水面漸層
    const gradWater = ctx.createRadialGradient(centerX, centerY, 20, centerX, centerY, poolRadiusX);
    if (state.currentLoc === 2) {
        gradWater.addColorStop(0, '#1e1b4b');
        gradWater.addColorStop(1, '#09090b');
    } else {
        gradWater.addColorStop(0, '#38bdf8');
        gradWater.addColorStop(1, '#0369a1');
    }

    ctx.fillStyle = gradWater;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, poolRadiusX, poolRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    // 浮標動態
    bobberY += (bobberTargetY - bobberY) * 0.1;

    // 釣線
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, bobberY);
    ctx.stroke();

    // 浮標
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(centerX, bobberY - 3, 5, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, bobberY + 2, 5, 0, Math.PI);
    ctx.fill();

    // 水波紋
    ripples.forEach((r, i) => {
        ctx.strokeStyle = `rgba(255, 255, 255, ${r.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.rx, r.ry, 0, 0, Math.PI * 2);
        ctx.stroke();

        r.rx += 2;
        r.ry += 1.2;
        r.alpha -= 0.025;

        if (r.alpha <= 0) ripples.splice(i, 1);
    });

    // 獲益文字
    floatTexts.forEach((ft, i) => {
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 16px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);

        ft.y += ft.vy;
        ft.alpha -= 0.02;

        if (ft.alpha <= 0) floatTexts.splice(i, 1);
    });
}

function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    bobberTargetY = canvas.height / 2 + 15;
    setTimeout(() => { bobberTargetY = canvas.height / 2; }, 200);

    ripples.push({ x: clickX, y: clickY, rx: 8, ry: 5, alpha: 1 });
    catchFish(clickX, clickY);
}

function catchFish(spawnX, spawnY) {
    if (state.inventory.length >= 15) {
        floatTexts.push({
            text: '水桶已滿！',
            color: '#ef4444',
            x: spawnX,
            y: spawnY - 10,
            vy: -1,
            alpha: 1
        });
        return;
    }

    const availableFish = FISH_DATA.filter(f => f.loc === state.currentLoc);
    const caught = availableFish[Math.floor(Math.random() * availableFish.length)];

    state.inventory.push(caught);
    if (!state.fishdex.includes(caught.id)) {
        state.fishdex.push(caught.id);
    }

    floatTexts.push({
        text: `+ ${caught.name} ($${caught.price})`,
        color: caught.color,
        x: spawnX,
        y: spawnY - 15,
        vy: -1.2,
        alpha: 1
    });

    updateUI();
    renderFishdex();
}

function secondTick() {
    let passiveGold = 0;
    state.aquarium.forEach(fish => passiveGold += fish.gps);
    state.gold += passiveGold;

    if (state.autoBaitLevel > 0 && Math.random() < state.autoBaitLevel * 0.3) {
        catchFish(canvas.width / 2, canvas.height / 2);
    }

    updateUI();
}

function sellAllFish() {
    let total = 0;
    state.inventory.forEach(fish => total += fish.price);
    state.gold += total;
    state.inventory = [];
    updateUI();
}

function moveToAquarium(index) {
    if (state.aquarium.length >= 10) {
        alert('水族箱容量已滿 (上限 10 條)！');
        return;
    }
    const fish = state.inventory.splice(index, 1)[0];
    state.aquarium.push(fish);
    updateUI();
}

function updateUI() {
    document.getElementById('goldCount').innerText = `$${Math.floor(state.gold)}`;
    document.getElementById('bucketSize').innerText = `${state.inventory.length}/15`;

    let passiveGps = state.aquarium.reduce((sum, f) => sum + f.gps, 0);
    document.getElementById('passiveGps').innerText = `$${passiveGps.toFixed(1)}`;

    const invList = document.getElementById('inventoryList');
    invList.innerHTML = '';
    state.inventory.forEach((fish, i) => {
        invList.innerHTML += `
            <div class="item-card">
                <div>
                    <b style="color:${fish.color}">${fish.name}</b> 
                    <span style="font-size:11px; color:#64748b;">(${fish.rarity})</span>
                    <div style="font-size:12px; color:#94a3b8;">價值: $${fish.price}</div>
                </div>
                <button class="btn btn-small" onclick="moveToAquarium(${i})">放水族箱</button>
            </div>
        `;
    });

    const aquaList = document.getElementById('aquariumList');
    aquaList.innerHTML = '';
    state.aquarium.forEach((fish) => {
        aquaList.innerHTML += `
            <div class="item-card">
                <div>
                    <b style="color:${fish.color}">${fish.name}</b>
                    <div style="font-size:12px; color:var(--accent-color);">被動: +$${fish.gps}/s</div>
                </div>
            </div>
        `;
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');
}

function renderUpgrades() {
    const container = document.getElementById('upgradeList');
    container.innerHTML = `
        <div class="item-card">
            <div><b>強化釣竿 (Lv.${state.rodLevel})</b></div>
            <button class="btn btn-small" onclick="buyRod()">$${state.rodLevel * 100}</button>
        </div>
        <div class="item-card">
            <div><b>自動噴霧 (Lv.${state.autoBaitLevel})</b></div>
            <button class="btn btn-small" onclick="buyBait()">$${(state.autoBaitLevel + 1) * 250}</button>
        </div>
    `;
}

function buyRod() {
    let cost = state.rodLevel * 100;
    if (state.gold >= cost) {
        state.gold -= cost;
        state.rodLevel++;
        renderUpgrades();
        updateUI();
    }
}

function buyBait() {
    let cost = (state.autoBaitLevel + 1) * 250;
    if (state.gold >= cost) {
        state.gold -= cost;
        state.autoBaitLevel++;
        renderUpgrades();
        updateUI();
    }
}

function renderLocations() {
    const container = document.getElementById('locationList');
    container.innerHTML = '';
    LOCATIONS.forEach((loc, i) => {
        const isUnlocked = state.unlockedLocs.includes(i);
        container.innerHTML += `
            <div class="item-card">
                <div><b>${loc.name}</b></div>
                ${isUnlocked ? 
                    `<button class="btn btn-small" onclick="selectLoc(${i})">${state.currentLoc === i ? '目前' : '前往'}</button>` :
                    `<button class="btn btn-small" onclick="unlockLoc(${i})">$${loc.cost}</button>`
                }
            </div>
        `;
    });
}

function unlockLoc(index) {
    let cost = LOCATIONS[index].cost;
    if (state.gold >= cost) {
        state.gold -= cost;
        state.unlockedLocs.push(index);
        state.currentLoc = index;
        renderLocations();
        updateUI();
    }
}

function selectLoc(index) {
    state.currentLoc = index;
    renderLocations();
}

function renderFishdex() {
    const grid = document.getElementById('fishdexGrid');
    grid.innerHTML = '';
    FISH_DATA.forEach(fish => {
        const isDiscovered = state.fishdex.includes(fish.id);
        grid.innerHTML += `
            <div class="fish-card ${isDiscovered ? '' : 'locked'}">
                <div style="font-size:18px;">${isDiscovered ? '🐟' : '❓'}</div>
                <b>${isDiscovered ? fish.name : '???'}</b>
            </div>
        `;
    });
}

function autoSave() {
    localStorage.setItem('pixel_fishing_save', JSON.stringify(state));
}

function loadSave() {
    const save = localStorage.getItem('pixel_fishing_save');
    if (save) {
        try { state = Object.assign(state, JSON.parse(save)); } catch(e) {}
    }
}

init();