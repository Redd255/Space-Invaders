// Board configuration
let tileSize = 30;
let rows = 20;
let columns = 20;

let board;
let boardWidth = tileSize * columns;
let boardHeight = tileSize * rows;

// Ship configuration
let shipWidth = tileSize * 2;
let shipHeight = tileSize;
let shipX = tileSize * columns / 2 - tileSize;
let shipY = tileSize * rows - tileSize * 2;

let ship = {
    x: shipX,
    y: shipY,
    width: shipWidth,
    height: shipHeight,
    element: null
};

let shipVelocityX = tileSize;

// Aliens configuration
let alienArray = [];
let alienWidth = tileSize * 2;
let alienHeight = tileSize;
let alienX = tileSize;
let alienY = tileSize;

let alienRows = 2;
let alienColumns = 3;
let alienCount = 0;
let alienVelocityX = 1;

// Bullets configuration
let bulletArray = [];
let bulletVelocityY = -10;

let score = 0;
let gameOver = false;

window.onload = function () {
    board = document.getElementById("board");
    board.style.width = boardWidth + "px";
    board.style.height = boardHeight + "px";

    // Create ship element
    ship.element = document.createElement("div");
    ship.element.className = "ship";
    ship.element.style.width = shipWidth + "px";
    ship.element.style.height = shipHeight + "px";
    board.appendChild(ship.element);

    createAliens();
    requestAnimationFrame(update);

    document.addEventListener("keydown", moveShip);
    document.addEventListener("keyup", shoot);
};

function update() {
    requestAnimationFrame(update);
    if (gameOver) return;

    // Update ship position
    ship.element.style.left = ship.x + "px";
    ship.element.style.top = ship.y + "px";

    // Update aliens
    let edgeReached = false;
    for (let i = 0; i < alienArray.length; i++) {
        let alien = alienArray[i];
        if (!alien.alive) continue;

        alien.x += alienVelocityX;
        alien.element.style.left = alien.x + "px";
        alien.element.style.top = alien.y + "px";

        // Check screen edges
        if (alien.x + alien.width >= boardWidth || alien.x <= 0) {
            edgeReached = true;
        }

        // Check collision with ship
        if (alien.y + alien.height >= ship.y) {
            gameOver = true;
            document.getElementById("gameOver").style.display = "block";
            document.getElementById("finalScore").textContent = score;
        }
    }

    // Move aliens down if edge reached
    if (edgeReached) {
        alienVelocityX *= -1;
        for (let alien of alienArray) {
            if (alien.alive) {
                alien.y += alienHeight;
                alien.element.style.top = alien.y + "px";
            }
        }
    }

    // Update bullets
    for (let i = bulletArray.length - 1; i >= 0; i--) {
        let bullet = bulletArray[i];
        bullet.y += bulletVelocityY;
        bullet.element.style.top = bullet.y + "px";

        // Remove out-of-bounds bullets
        if (bullet.y < 0 || bullet.used) {
            bullet.element.remove();
            bulletArray.splice(i, 1);
            continue;
        }

        // Check collisions
        for (let j = 0; j < alienArray.length; j++) {
            let alien = alienArray[j];
            if (alien.alive && detectCollision(bullet, alien)) {
                bullet.used = true;
                alien.alive = false;
                alien.element.remove();
                alienCount--;
                score += 100;
                document.getElementById("score").textContent = "Score: " + score;
            }
        }
    }

    // Next level
    if (alienCount === 0) {
        score += alienColumns * alienRows * 100;
        alienColumns = Math.min(alienColumns + 1, columns / 2 - 2);
        alienRows = Math.min(alienRows + 1, rows - 4);
        alienVelocityX += alienVelocityX > 0 ? 0.2 : -0.2;
        createAliens();
    }
}

function moveShip(e) {
    if (gameOver) return;

    if (e.code === "ArrowLeft" && ship.x - shipVelocityX >= 0) {
        ship.x -= shipVelocityX;
    } else if (e.code === "ArrowRight" && ship.x + shipVelocityX + ship.width <= boardWidth) {
        ship.x += shipVelocityX;
    }
}

function createAliens() {
    // Clear existing aliens
    alienArray.forEach(alien => alien.element.remove());
    alienArray = [];

    // Create new aliens
    for (let c = 0; c < alienColumns; c++) {
        for (let r = 0; r < alienRows; r++) {
            let alien = {
                x: alienX + c * alienWidth,
                y: alienY + r * alienHeight,
                width: alienWidth,
                height: alienHeight,
                alive: true,
                element: document.createElement("div")
            };

            alien.element.className = "alien";
            alien.element.style.width = alienWidth + "px";
            alien.element.style.height = alienHeight + "px";
            alien.element.style.left = alien.x + "px";
            alien.element.style.top = alien.y + "px";

            board.appendChild(alien.element);
            alienArray.push(alien);
        }
    }
    alienCount = alienArray.length;
}

function shoot(e) {
    if (gameOver || e.code !== "Space") return;

    let bullet = {
        x: ship.x + shipWidth / 2 - tileSize / 16,
        y: ship.y,
        width: tileSize / 8,
        height: tileSize / 2,
        used: false,
        element: document.createElement("div")
    };

    bullet.element.className = "bullet";
    bullet.element.style.width = bullet.width + "px";
    bullet.element.style.height = bullet.height + "px";
    bullet.element.style.left = bullet.x + "px";
    bullet.element.style.top = bullet.y + "px";

    board.appendChild(bullet.element);
    bulletArray.push(bullet);
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
}