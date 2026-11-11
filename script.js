
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("score");
const bestDisplay = document.getElementById("best");
const finalScore = document.getElementById("finalScore");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

let score = 0;
let best = Number(localStorage.getItem("starDashBest")) || 0;

let running = false;
let animationId = null;
let frame = 0;

let keys = {
    left: false,
    right: false
};

let player;
let meteors = [];
let stars = [];
let particles = [];
let backgroundStars = [];

// Recorde
bestDisplay.textContent = String(best).padStart(4, "0");

// Jogador
function createPlayer() {
    return {
        x: canvas.width / 2,
        y: canvas.height - 65,
        width: 38,
        height: 45,
        speed: 6
    };
}

// Estrelas do fundo
for (let i = 0; i < 80; i++) {
    backgroundStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1.5 + 0.3
    });
}

// Desenhar fundo
function drawBackground() {
    ctx.fillStyle = "#0c1029";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    backgroundStars.forEach(star => {
        ctx.fillStyle = "white";
        ctx.globalAlpha = Math.random() * 0.5 + 0.5;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        star.y += star.speed;

        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });

    ctx.globalAlpha = 1;
}

// Desenhar nave
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);

    // Brilho
    ctx.shadowColor = "#8c7bff";
    ctx.shadowBlur = 20;

    // Fogo
    ctx.fillStyle = "#ff9d42";
    ctx.beginPath();
    ctx.moveTo(-9, 18);
    ctx.lineTo(0, 34 + Math.random() * 8);
    ctx.lineTo(9, 18);
    ctx.fill();

    // Corpo
    ctx.fillStyle = "#8c7bff";
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(19, 20);
    ctx.lineTo(0, 12);
    ctx.lineTo(-19, 20);
    ctx.closePath();
    ctx.fill();

    // Janela
    ctx.shadowBlur = 5;
    ctx.fillStyle = "#b6f4ff";
    ctx.beginPath();
    ctx.arc(0, -5, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// Criar meteoro
function createMeteor() {
    meteors.push({
        x: Math.random() * (canvas.width - 50) + 25,
        y: -30,
        radius: Math.random() * 13 + 13,
        speed: Math.random() * 2 + 2 + score / 500
    });
}

// Criar estrela
function createStar() {
    stars.push({
        x: Math.random() * (canvas.width - 40) + 20,
        y: -20,
        radius: 11,
        speed: 2.5
    });
}

// Desenhar meteoros
function drawMeteors() {
    meteors.forEach(meteor => {
        ctx.save();

        ctx.shadowColor = "#ff7043";
        ctx.shadowBlur = 12;

        ctx.fillStyle = "#a65b58";
        ctx.beginPath();
        ctx.arc(meteor.x, meteor.y, meteor.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#d78b79";
        ctx.beginPath();
        ctx.arc(
            meteor.x - 5,
            meteor.y - 4,
            meteor.radius / 4,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.restore();

        meteor.y += meteor.speed;
    });

    meteors = meteors.filter(m => m.y < canvas.height + 40);
}

// Desenhar estrelas coletáveis
function drawStars() {
    stars.forEach(star => {
        ctx.save();

        ctx.shadowColor = "#ffe16a";
        ctx.shadowBlur = 20;

        ctx.fillStyle = "#ffe16a";
        ctx.font = "28px Arial";
        ctx.textAlign = "center";
        ctx.fillText("★", star.x, star.y + 9);

        ctx.restore();

        star.y += star.speed;
    });

    stars = stars.filter(s => s.y < canvas.height + 30);
}

// Efeito de partículas
function createParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x,
            y,
            dx: (Math.random() - 0.5) * 6,
            dy: (Math.random() - 0.5) * 6,
            life: 25,
            color
        });
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 25;
        ctx.fillStyle = p.color;

        ctx.fillRect(p.x, p.y, 4, 4);

        p.x += p.dx;
        p.y += p.dy;
        p.life--;
    });

    ctx.globalAlpha = 1;
    particles = particles.filter(p => p.life > 0);
}

// Colisão
function checkCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.sqrt(dx * dx + dy * dy) <
        (a.width / 2 + b.radius * 0.75);
}

// Atualizar jogo
function update() {
    frame++;

    // Movimentação
    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;

    player.x = Math.max(22, Math.min(canvas.width - 22, player.x));

    // Gerar objetos
    if (frame % 65 === 0) createMeteor();
    if (frame % 110 === 0) createStar();

    // Meteoros
    for (let meteor of meteors) {
        if (checkCollision(player, meteor)) {
            endGame();
            return;
        }
    }

    // Coletar estrelas
    stars = stars.filter(star => {
        if (checkCollision(player, star)) {
            score += 10;
            scoreDisplay.textContent = String(score).padStart(4, "0");

            createParticles(star.x, star.y, "#ffe16a");
            return false;
        }

        return true;
    });

    // Pontos por sobrevivência
    if (frame % 60 === 0) {
        score += 1;
        scoreDisplay.textContent = String(score).padStart(4, "0");
    }
}

// Loop principal
function gameLoop() {
    if (!running) return;

    drawBackground();
    update();

    if (!running) return;

    drawMeteors();
    drawStars();
    drawParticles();
    drawPlayer();

    animationId = requestAnimationFrame(gameLoop);
}

// Iniciar
function startGame() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    score = 0;
    frame = 0;

    scoreDisplay.textContent = "0000";

    player = createPlayer();
    meteors = [];
    stars = [];
    particles = [];

    keys.left = false;
    keys.right = false;

    running = true;

    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

    gameLoop();
}

// Finalizar
function endGame() {
    running = false;

    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    finalScore.textContent = score;

    if (score > best) {
        best = score;

        localStorage.setItem("starDashBest", best);

        bestDisplay.textContent = String(best).padStart(4, "0");
    }

    gameOverScreen.classList.remove("hidden");
}

// Teclado
document.addEventListener("keydown", event => {
    if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].includes(event.key)) {
        event.preventDefault();
    }

    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        keys.left = true;
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        keys.right = true;
    }
});

document.addEventListener("keyup", event => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        keys.left = false;
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        keys.right = false;
    }
});

// Controles para celular
function setupMobileButton(button, direction) {
    button.addEventListener("pointerdown", event => {
        event.preventDefault();
        keys[direction] = true;
    });

    button.addEventListener("pointerup", () => {
        keys[direction] = false;
    });

    button.addEventListener("pointerleave", () => {
        keys[direction] = false;
    });

    button.addEventListener("pointercancel", () => {
        keys[direction] = false;
    });
}

setupMobileButton(leftBtn, "left");
setupMobileButton(rightBtn, "right");

// Botões
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

// Desenhar tela inicial
drawBackground();
