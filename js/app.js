const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let width, height;

const engine = new PhysicsEngine();
const audio = new AudioSynth();
const particles = new ParticleEmitter();
let terrain;
let lander;

let animationId;
let gameState = 'START'; // START, PLAYING, END

// --- Nivel y viento ---
let currentLevel = 1;
let wind = { force: 0, display: '→ 0.00' }; // fuerza horizontal constante

// --- Cámara con Zoom ---
const camera = {
    scale: 1,
    targetScale: 1,
    // No hay traslación horizontal, solo zoom vertical centrado en la nave
};

// UI Elements
const hud = document.getElementById('hud');
const startScreen = document.getElementById('start-screen');
const msgOverlay = document.getElementById('message-overlay');
const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');
const btnNextLevel = document.getElementById('btn-next-level');
const touchControls = document.getElementById('touch-controls');
const btnTouchLeft = document.getElementById('btn-touch-left');
const btnTouchThrust = document.getElementById('btn-touch-thrust');
const btnTouchRight = document.getElementById('btn-touch-right');

const elAlt = document.getElementById('altimeter');
const elVvel = document.getElementById('v-speed');
const elHvel = document.getElementById('h-speed');
const elFuel = document.getElementById('fuel-bar');
const elScore = document.getElementById('score');
const elLevel = document.getElementById('level-display');
const elWind = document.getElementById('wind-display');
const msgTitle = document.getElementById('message-title');
const msgSub = document.getElementById('message-subtitle');

let score = 0;

// ─── Resize ───────────────────────────────────────────────────────────────────
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    
    const dpr = window.devicePixelRatio || 1;
    // Resetear transformación antes de escalar para no acumular ctx.scale en cada resize
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ─── Viento ───────────────────────────────────────────────────────────────────
function generateWind(level) {
    // El viento máximo aumenta con el nivel
    const maxWind = Math.min(0.015, 0.003 * level);
    const force = (Math.random() * 2 - 1) * maxWind;
    const dir = force > 0 ? '→' : '←';
    wind = { force, display: `${dir} ${Math.abs(force).toFixed(3)}` };
}

// ─── Iniciar nivel ────────────────────────────────────────────────────────────
function initLevel(level, keepScore = false) {
    currentLevel = level;
    generateWind(level);

    terrain = new TerrainManager(width, height, level);
    
    // Spawn encima del pad con un pequeño offset aleatorio
    const padCenterX = (terrain.landingPad.startX + terrain.landingPad.endX) / 2;
    const spawnX = padCenterX + (Math.random() * 300 - 150);
    lander = new Lander(spawnX, height * 0.08);
    
    particles.particles = [];
    audio.init();
    
    gameState = 'PLAYING';
    camera.scale = 1;
    camera.targetScale = 1;

    startScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    msgOverlay.classList.add('hidden');
    msgOverlay.className = 'message-overlay hidden';
    btnNextLevel.classList.add('hidden');

    if (!keepScore) {
        score = 0;
    }
    elScore.innerText = score;
    elLevel.innerText = currentLevel;
    elWind.innerText = wind.display;

    // Mostrar controles táctiles si es dispositivo táctil
    if (window.matchMedia('(pointer: coarse)').matches) {
        touchControls.classList.remove('hidden');
    }
}

// ─── Game Loop ────────────────────────────────────────────────────────────────
function loop() {
    update();
    draw();
    animationId = requestAnimationFrame(loop);
}

// ─── Update ───────────────────────────────────────────────────────────────────
function update() {
    if (gameState !== 'PLAYING') return;

    // Gravedad
    engine.applyGravity(lander);

    // Viento: fuerza horizontal constante aplicada como aceleración
    if (lander.status === 'FLYING') {
        lander.applyForce(new Vector(wind.force, 0));
    }

    // Update nave
    lander.update();

    // Partículas y audio del motor
    const thrusting = lander.isThrusting && lander.fuel > 0;
    audio.setThrust(thrusting ? 1 : 0);
    if (thrusting) {
        const exhaustPos = Vector.fromAngle(lander.angle, -15);
        exhaustPos.add(lander.pos);
        particles.emitEngineThrust(exhaustPos.x, exhaustPos.y, lander.angle, lander.thrustPower);
    }

    // ─── Cámara / Zoom ─────────────────────────────────────────────────────
    // Altitude from terrain below the lander (approx)
    const groundY = terrain.landingPad.y;
    const altitude = Math.max(0, groundY - lander.pos.y);
    const altRatio = altitude / height; // 0 = muy cerca, 1 = lejos

    // Zoom in cuando la altitud es baja (< 30% de la pantalla)
    if (altRatio < 0.3) {
        camera.targetScale = 1 + (0.3 - altRatio) * 2.0; // max ~1.6×
    } else {
        camera.targetScale = 1;
    }
    // Suavizar el zoom (lerp)
    camera.scale += (camera.targetScale - camera.scale) * 0.05;

    // ─── Colisiones ────────────────────────────────────────────────────────
    const bounds = lander.getBounds();
    const prevPos = new Vector(bounds.x - lander.vel.x, bounds.y - lander.vel.y);
    
    const col = terrain.checkCollision(prevPos.x, prevPos.y, bounds.x, bounds.y);
    
    if (col.hit || bounds.y >= height) {
        handleCollision(col);
    } else {
        // Fallback: interpolación directa contra la superficie
        for (let i = 0; i < terrain.points.length - 1; i++) {
            const p1 = terrain.points[i];
            const p2 = terrain.points[i + 1];
            if (bounds.x >= p1.x && bounds.x <= p2.x) {
                const t = (bounds.x - p1.x) / (p2.x - p1.x);
                const terrainY = p1.y + t * (p2.y - p1.y);
                if (bounds.y >= terrainY) {
                    const isPad = (bounds.x >= terrain.landingPad.startX && bounds.x <= terrain.landingPad.endX);
                    handleCollision({ hit: true, isPad, padY: terrain.landingPad.y });
                }
            }
        }
    }

    updateHUD();
}

// ─── Colisión ─────────────────────────────────────────────────────────────────
function handleCollision(col) {
    if (lander.status !== 'FLYING') return;

    lander.status = 'CRASHED';
    audio.setThrust(0);

    const vSpeed = lander.vel.y;
    const hSpeed = Math.abs(lander.vel.x);
    const angleDev = Math.abs(lander.angle - (-Math.PI / 2));

    // Tolerancias que se vuelven más estrictas con el nivel
    const maxVSpeed = Math.max(1.0, 2.0 - (currentLevel - 1) * 0.08);
    const maxHSpeed = Math.max(0.5, 1.0 - (currentLevel - 1) * 0.04);
    const maxAngle  = Math.max(0.1, 0.2 - (currentLevel - 1) * 0.01);

    if (col.isPad && vSpeed < maxVSpeed && hSpeed < maxHSpeed && angleDev < maxAngle) {
        lander.status = 'LANDED';
        lander.pos.y = col.padY - lander.height / 2;
        lander.vel.mult(0);
        lander.angularVel = 0;
        lander.angle = -Math.PI / 2;

        audio.playSuccess();
        // Puntaje: combustible restante × multiplicador de nivel
        const levelBonus = Math.floor(lander.fuel * currentLevel);
        score += levelBonus;
        showEndScreen(true);
    } else {
        particles.emitExplosion(lander.pos.x, lander.pos.y);
        audio.playExplosion();
        showEndScreen(false);
    }

    updateHUD();
}

// ─── Fin de nivel ─────────────────────────────────────────────────────────────
function showEndScreen(success) {
    gameState = 'END';
    msgOverlay.classList.remove('hidden');
    touchControls.classList.add('hidden');

    if (success) {
        msgOverlay.classList.add('success');
        msgTitle.innerText = `LEVEL ${currentLevel} CLEARED`;
        msgSub.innerText = `Fuel bonus: ${Math.floor(lander.fuel)} × ${currentLevel} = ${Math.floor(lander.fuel * currentLevel)} pts  |  Total: ${score}`;
        btnNextLevel.classList.remove('hidden');
    } else {
        msgOverlay.classList.add('failure');
        msgTitle.innerText = 'VEHICLE DESTROYED';
        msgSub.innerText = `Crashed on level ${currentLevel}. Final score: ${score}`;
        btnNextLevel.classList.add('hidden');
    }
}

// ─── HUD ─────────────────────────────────────────────────────────────────────
function updateHUD() {
    elAlt.innerText = Math.max(0, Math.floor(height - lander.pos.y)).toString().padStart(4, '0');

    const vs = lander.vel.y;
    elVvel.innerText = vs.toFixed(2);
    if (vs > 2.0) elVvel.parentElement.classList.add('warning');
    else elVvel.parentElement.classList.remove('warning');

    const hs = lander.vel.x;
    elHvel.innerText = Math.abs(hs).toFixed(2);
    if (Math.abs(hs) > 1.0) elHvel.parentElement.classList.add('warning');
    else elHvel.parentElement.classList.remove('warning');

    const fuelPct = (lander.fuel / lander.maxFuel) * 100;
    elFuel.style.width = `${Math.max(0, fuelPct)}%`;
    if (fuelPct < 20) elFuel.style.background = 'var(--c-warning)';
    else elFuel.style.background = 'linear-gradient(90deg, var(--c-warning), var(--c-success))';

    elScore.innerText = score;
}

// ─── Draw ─────────────────────────────────────────────────────────────────────
function draw() {
    ctx.clearRect(0, 0, width, height);

    // Guardia: no dibujar nada si el juego aún no ha iniciado
    if (!terrain || !lander) return;

    // Aplicar zoom de cámara centrado en la nave
    ctx.save();
    if (camera.scale > 1.001) {
        const cx = lander.pos.x;
        const cy = lander.pos.y;
        ctx.translate(cx, cy);
        ctx.scale(camera.scale, camera.scale);
        ctx.translate(-cx, -cy);
    }

    terrain.draw(ctx);
    lander.draw(ctx);
    particles.updateAndDraw(ctx);

    ctx.restore();

    // Indicador visual del viento en pantalla (flecha)
    if (gameState === 'PLAYING') drawWindIndicator();
}

function drawWindIndicator() {
    if (Math.abs(wind.force) < 0.001) return;

    const x = width / 2;
    const y = 30;
    const len = Math.min(60, Math.abs(wind.force) * 4000);
    const dir = wind.force > 0 ? 1 : -1;

    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = 'hsl(190, 80%, 70%)';
    ctx.fillStyle = 'hsl(190, 80%, 70%)';
    ctx.lineWidth = 2;

    // Línea
    ctx.beginPath();
    ctx.moveTo(x - dir * len / 2, y);
    ctx.lineTo(x + dir * len / 2, y);
    ctx.stroke();

    // Punta de flecha
    ctx.beginPath();
    ctx.moveTo(x + dir * len / 2, y);
    ctx.lineTo(x + dir * (len / 2 - 8), y - 5);
    ctx.lineTo(x + dir * (len / 2 - 8), y + 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// ─── Input: Teclado ───────────────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
    if (gameState !== 'PLAYING') return;
    if (e.code === 'ArrowUp'    || e.code === 'KeyW') lander.isThrusting     = true;
    if (e.code === 'ArrowLeft'  || e.code === 'KeyA') lander.isRotatingLeft  = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') lander.isRotatingRight = true;
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowUp'    || e.code === 'KeyW') lander.isThrusting     = false;
    if (e.code === 'ArrowLeft'  || e.code === 'KeyA') lander.isRotatingLeft  = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') lander.isRotatingRight = false;
});

// ─── Input: Táctil ───────────────────────────────────────────────────────────
function addTouchControl(btn, onPress, onRelease) {
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); btn.classList.add('pressed'); onPress(); }, { passive: false });
    btn.addEventListener('touchend',   (e) => { e.preventDefault(); btn.classList.remove('pressed'); onRelease(); }, { passive: false });
    btn.addEventListener('touchcancel',(e) => { e.preventDefault(); btn.classList.remove('pressed'); onRelease(); }, { passive: false });
}

// Callbacks láziles: verifican que lander exista antes de actuar
addTouchControl(btnTouchThrust, () => { if (lander) lander.isThrusting     = true;  }, () => { if (lander) lander.isThrusting     = false; });
addTouchControl(btnTouchLeft,   () => { if (lander) lander.isRotatingLeft  = true;  }, () => { if (lander) lander.isRotatingLeft  = false; });
addTouchControl(btnTouchRight,  () => { if (lander) lander.isRotatingRight = true;  }, () => { if (lander) lander.isRotatingRight = false; });

// ─── Botones de UI ────────────────────────────────────────────────────────────
btnStart.addEventListener('click', () => {
    initLevel(1, false);
});

btnRestart.addEventListener('click', () => {
    initLevel(1, false);
});

btnNextLevel.addEventListener('click', () => {
    initLevel(currentLevel + 1, true);
});

// ─── Init ────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
    resize();
    // Re-generar terreno si el juego estaba en marcha para ajustar al nuevo tamaño
    if (gameState === 'PLAYING') {
        initLevel(currentLevel, true);
    }
});
resize();
loop();
