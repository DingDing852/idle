// 多國語言字典 (i18n)
const TRANSLATIONS = {
    zh: {
        bossHint: "按 <b>[ESC]</b> 瞬間切換至 Excel 報表",
        tabInv: "水桶", tabAqua: "水族箱", tabUpg: "升級", tabDex: "圖鑑",
        gold: "金幣餘額", sellAll: "一鍵賣魚", passive: "被動收益", perSec: "/秒",
        bucket: "水桶", aquaTitle: "辦公室水族箱", aquaDesc: "放進水族箱的魚會持續提供被動收益。",
        upgTitle: "裝備升級", locTitle: "切換漁場", dexTitle: "魚類圖鑑",
        toAqua: "放水族箱", rod: "強化釣竿", bait: "自動噴霧",
        current: "目前", move: "前往", unlock: "解鎖",
        fullBucket: "水桶已滿！",
        settings: "⚙️ 遊戲設定", langLabel: "語言 / Language", resetLabel: "重置進度",
        resetBtn: "重置遊戲數據", closeBtn: "關閉", resetConfirm: "確定要重置所有進度與金幣嗎？此操作不可逆！"
    },
    en: {
        bossHint: "Press <b>[ESC]</b> for Boss Key (Excel)",
        tabInv: "Bucket", tabAqua: "Aquarium", tabUpg: "Upgrades", tabDex: "Fishdex",
        gold: "Gold Balance", sellAll: "Sell All", passive: "Passive Income", perSec: "/s",
        bucket: "Bucket", aquaTitle: "Office Aquarium", aquaDesc: "Fish inside generate continuous passive gold.",
        upgTitle: "Equipment Upgrades", locTitle: "Fishing Locations", dexTitle: "Fishdex",
        toAqua: "To Tank", rod: "Fishing Rod", bait: "Auto Sprayer",
        current: "Current", move: "Go", unlock: "Unlock",
        fullBucket: "Bucket Full!",
        settings: "⚙️ Settings", langLabel: "Language", resetLabel: "Reset Game",
        resetBtn: "Reset Data", closeBtn: "Close", resetConfirm: "Are you sure you want to reset all progress? This cannot be undone!"
    }
};

const FISH_DATA = [
    { id: 'tilapia', nameZh: '吳郭魚', nameEn: 'Tilapia', rarity: 'Common', price: 10, gps: 0.5, loc: 0, color: '#94a3b8' },
    { id: 'shoe', nameZh: '沉底舊鞋', nameEn: 'Old Shoe', rarity: 'Junk', price: 2, gps: 0.1, loc: 0, color: '#78716c' },
    { id: 'coffee', nameZh: '空咖啡杯', nameEn: 'Coffee Cup', rarity: 'Meme', price: 25, gps: 1.2, loc: 0, color: '#ef4444' },
    { id: 'carp', nameZh: '草魚', nameEn: 'Carp', rarity: 'Common', price: 18, gps: 0.8, loc: 0, color: '#10b981' },
    { id: 'salmon', nameZh: '野生鮭魚', nameEn: 'Salmon', rarity: 'Rare', price: 60, gps: 3.5, loc: 1, color: '#f97316' },
    { id: 'goldfish', nameZh: '黃金鯉魚', nameEn: 'Golden Koi', rarity: 'Epic', price: 150, gps: 10.0, loc: 1, color: '#fbbf24' },
    { id: 'pikachu_fish', name: '皮卡丘魚', nameEn: 'Pikachu Fish', rarity: 'Meme', price: 220, gps: 15.0, loc: 1, color: '#facc15' },
    { id: 'angler', nameZh: '提燈魚', nameEn: 'Anglerfish', rarity: 'Rare', price: 300, gps: 22.0, loc: 2, color: '#818cf8' },
    { id: 'shark', nameZh: '大白鯊', nameEn: 'Great White', rarity: 'Epic', price: 800, gps: 60.0, loc: 2, color: '#38bdf8' },
    { id: 'liver', nameZh: '工程師的肝', nameEn: "Dev's Liver", rarity: 'Legendary', price: 2000, gps: 150.0, loc: 2, color: '#a855f7' },
    { id: 'cthulhu', nameZh: '克蘇魯', nameEn: 'Cthulhu', rarity: 'Mythic', price: 5000, gps: 400.0, loc: 2, color: '#22c55e' }
];

const LOCATIONS = [
    { nameZh: '🏞️ 公司花園池塘', nameEn: '🏞️ Office Garden Pond', cost: 0 },
    { nameZh: '⛵ 近海碼頭', nameEn: '⛵ Coastal Pier', cost: 500 },
    { nameZh: '🐙 深海溝', nameEn: '🐙 Abyssal Trench', cost: 3000 }
];

let state = {
    gold: 0,
    currentLoc: 0,
    unlockedLocs: [0],
    inventory: [],
    aquarium: [],
    fishdex: [],
    rodLevel: 1,
    autoBaitLevel: 0,
    lang: 'zh',
    theme: 'dark'
};

let isBossMode = false;
let floatTexts = [];
let ripples = [];
let bobberY = 0;
let bobberTargetY = 0;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const gamePanel = document.getElementById('gamePanel');
    canvas.width = gamePanel.clientWidth;
    canvas.height = gamePanel.clientHeight;
    bobberY = canvas.height / 2;
    bobberTargetY = canvas.height / 2;
}

window.addEventListener('resize', resizeCanvas);

function init() {
    loadSave();
    applyTheme(state.theme);
    applyLanguage();
    resizeCanvas();

    renderUpgrades();
    renderLocations();
    renderFishdex();
    updateUI();
    gameLoop();

    setInterval(secondTick, 1000);
    setInterval(autoSave, 5000);
}

// 側邊欄開關與池塘動態居中
function toggleSidebar() {
    const panel = document.getElementById('sidePanel');
    const btn = document.getElementById('toggleBtn');
    panel.classList.toggle('closed');
    btn.innerText = panel.classList.contains('closed') ? '◀' : '▶';

    // 側邊欄開合動畫完成後重新計算 Canvas 寬度，確保池塘永遠在畫布中央
    setTimeout(resizeCanvas, 305);
}

// 主題切換 (Dark / Light Mode)
function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(state.theme);
}

function applyTheme(theme) {
    document.body.className = `${theme}-mode`;
    document.getElementById('themeBtn').innerText = theme === 'dark' ? '☀️' : '🌙';
}

// 設定 Modal
function openSettings() {
    document.getElementById('settingsModal').style.display = 'flex';
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

function changeLanguage(lang) {
    state.lang = lang;
    applyLanguage();
    updateUI();
    renderUpgrades();
    renderLocations();
    renderFishdex();
}

function applyLanguage() {
    const lang = state.lang;
    const t = TRANSLATIONS[lang];
    document.getElementById('langSelect').value = lang;

    document.getElementById('bossHint').innerHTML = t.bossHint;
    document.getElementById('tabBtn-inventory').innerText = t.tabInv;
    document.getElementById('tabBtn-aquarium').innerText = t.tabAqua;
    document.getElementById('tabBtn-upgrades').innerText = t.tabUpg;
    document.getElementById('tabBtn-fishdex').innerText = t.tabDex;
    document.getElementById('lbl-gold').innerText = t.gold;
    document.getElementById('btn-sell').innerText = t.sellAll;
    document.getElementById('lbl-passive').innerText = t.passive;
    document.getElementById('lbl-per-sec').innerText = t.perSec;
    document.getElementById('lbl-bucket').innerText = t.bucket;
    document.getElementById('lbl-aqua-title').innerText = t.aquaTitle;
    document.getElementById('lbl-aqua-desc').innerText = t.aquaDesc;
    document.getElementById('lbl-upg-title').innerText = t.upgTitle;
    document.getElementById('lbl-loc-title').innerText = t.locTitle;
    document.getElementById('lbl-dex-title').innerText = t.dexTitle;

    document.getElementById('modal-title').innerText = t.settings;
    document.getElementById('lbl-lang').innerText = t.langLabel;
    document.getElementById('lbl-reset').innerText = t.resetLabel;
    document.getElementById('btn-reset').innerText = t.resetBtn;
    document.getElementById('btn-close').innerText = t.closeBtn;
}

function resetGame() {
    const t = TRANSLATIONS[state.lang];
    if (confirm(t.resetConfirm)) {
        localStorage.removeItem('pixel_fishing_save');
        location.reload();
    }
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

    // 隨畫布寬高動態計算池塘圓心
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const poolRadiusX = 180;
    const poolRadiusY = 110;

    const isDark = state.theme === 'dark';

    // 背景
    ctx.fillStyle = isDark ? '#0f141c' : '#e2e8f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 池塘外圍邊界陰影
    ctx.shadowBlur = 25;
    ctx.shadowColor = state.currentLoc === 2 ? '#4c1d95' : (isDark ? '#0284c7' : '#38bdf8');

    ctx.fillStyle = isDark ? '#1e293b' : '#cbd5e1';
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
        gradWater.addColorStop(0, isDark ? '#38bdf8' : '#7dd3fc');
        gradWater.addColorStop(1, isDark ? '#0369a1' : '#0284c7');
    }

    ctx.fillStyle = gradWater;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, poolRadiusX, poolRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    // 浮標平滑運動
    bobberY += (bobberTargetY - bobberY) * 0.1;

    // 釣線
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
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

    // 水波紋效果
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

    // 飄浮獲利文字
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
    const t = TRANSLATIONS[state.lang];
    if (state.inventory.length >= 15) {
        floatTexts.push({
            text: t.fullBucket,
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

    const fishName = state.lang === 'zh' ? caught.nameZh : caught.nameEn;
    floatTexts.push({
        text: `+ ${fishName} ($${caught.price})`,
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
        alert(state.lang === 'zh' ? '水族箱容量已滿 (上限 10 條)！' : 'Aquarium is full (Max 10)!');
        return;
    }
    const fish = state.inventory.splice(index, 1)[0];
    state.aquarium.push(fish);
    updateUI();
}

function updateUI() {
    const t = TRANSLATIONS[state.lang];
    document.getElementById('goldCount').innerText = `$${Math.floor(state.gold)}`;
    document.getElementById('bucketSize').innerText = `${state.inventory.length}/15`;

    let passiveGps = state.aquarium.reduce((sum, f) => sum + f.gps, 0);
    document.getElementById('passiveGps').innerText = `$${passiveGps.toFixed(1)}`;

    const invList = document.getElementById('inventoryList');
    invList.innerHTML = '';
    state.inventory.forEach((fish, i) => {
        const name = state.lang === 'zh' ? fish.nameZh : fish.nameEn;
        invList.innerHTML += `
            <div class="item-card">
                <div>
                    <b style="color:${fish.color}">${name}</b> 
                    <span style="font-size:11px;" class="sub-text">(${fish.rarity})</span>
                    <div style="font-size:12px;" class="sub-text">$${fish.price}</div>
                </div>
                <button class="btn btn-small" onclick="moveToAquarium(${i})">${t.toAqua}</button>
            </div>
        `;
    });

    const aquaList = document.getElementById('aquariumList');
    aquaList.innerHTML = '';
    state.aquarium.forEach((fish) => {
        const name = state.lang === 'zh' ? fish.nameZh : fish.nameEn;
        aquaList.innerHTML += `
            <div class="item-card">
                <div>
                    <b style="color:${fish.color}">${name}</b>
                    <div style="font-size:12px; color:var(--accent-color);">+$${fish.gps}${t.perSec}</div>
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
    const t = TRANSLATIONS[state.lang];
    const container = document.getElementById('upgradeList');
    container.innerHTML = `
        <div class="item-card">
            <div><b>${t.rod} (Lv.${state.rodLevel})</b></div>
            <button class="btn btn-small" onclick="buyRod()">$${state.rodLevel * 100}</button>
        </div>
        <div class="item-card">
            <div><b>${t.bait} (Lv.${state.autoBaitLevel})</b></div>
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
    const t = TRANSLATIONS[state.lang];
    const container = document.getElementById('locationList');
    container.innerHTML = '';
    LOCATIONS.forEach((loc, i) => {
        const isUnlocked = state.unlockedLocs.includes(i);
        const name = state.lang === 'zh' ? loc.nameZh : loc.nameEn;
        container.innerHTML += `
            <div class="item-card">
                <div><b>${name}</b></div>
                ${isUnlocked ? 
                    `<button class="btn btn-small" onclick="selectLoc(${i})">${state.currentLoc === i ? t.current : t.move}</button>` :
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
        const name = state.lang === 'zh' ? fish.nameZh : fish.nameEn;
        grid.innerHTML += `
            <div class="fish-card ${isDiscovered ? '' : 'locked'}">
                <div style="font-size:18px;">${isDiscovered ? '🐟' : '❓'}</div>
                <b>${isDiscovered ? name : '???'}</b>
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