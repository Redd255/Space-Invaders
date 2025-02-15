//======================
// General configuration
//======================
const tileSize = 40;
const rows = 20;
const columns = 20;
let gameOver = false;
let isPaused = false;
let gameStartTime = null;
let pausedTime = 0;
let isTimerRunning = false;
let totalElapsedTime = 0;

//====================
// Board configuration
//====================
let board;
let boardWidth = tileSize * columns;
let boardHeight = tileSize * rows;

//=======================
// Progress configuration
//=======================
let level = 1;
let score = 0;
const health = 3;

//===================
// Ship configuration
//====================
let shipWidth = tileSize * 2;
let shipHeight = tileSize;
let shipX = tileSize * columns / 2 - tileSize;
let shipY = tileSize * rows - tileSize * 2;
let ship = {
    x: shipX,
    y: shipY,
    width: shipWidth,
    height: shipHeight,
    health: health,
    element: null
};
let movingRight = false;
let movingLeft = false;
let shipVelocityX = 5;

//=====================
// Aliens configuration
//=====================
let alienArray = [];
let alienWidth = tileSize * 2;
let alienHeight = tileSize;
let alienX = tileSize;
let alienY = tileSize;
let alienRows = 2;
let alienColumns = 3;
let alienCount = 0;
let alienVelocityX = 1;

//====================
// Walls configuration
//====================
let walls = [];
let wallWidth = tileSize * 2;
let wallHeight = tileSize;
let wallRows = 1;
let wallColumns = 3;
let wallHealth = 3;

// ==========================
// Ship Bullets Configuration
// ==========================
let bulletArray = [];
let bulletVelocityY = -10;

// ============================
// Aliens Bullets Configuration
// ============================
let alienBulletArray = [];
let alienBulletVelocityY = 5;

// Sounds
const shootSound = new Audio("/music/shoot.wav");
const backgroundMusic = new Audio("/music/background.wav")


window.onload = function () {
    updateLevelStory(level);

    backgroundMusic.loop = true;
    backgroundMusic.play();

    board = document.getElementById("board");
    board.style.width = boardWidth + "px";
    board.style.height = boardHeight + "px";

    ship.element = document.createElement("div");
    ship.element.className = "ship";
    ship.element.style.width = shipWidth + "px";
    ship.element.style.height = shipHeight + "px";

    board.appendChild(ship.element);

    createAliens();
    createWalls();
    requestAnimationFrame(update);
    startTimer();
    scheduleAlienShoot();


    // Move
    document.addEventListener("keydown", moveShip);
    document.addEventListener("keyup", stopShip);

    // Shoot
    const debouncedShoot = debounce(shoot, 100);
    document.addEventListener("keyup", debouncedShoot);

    // Menu
    document.addEventListener("keydown", function (e) {
        if (e.code === "KeyP" && !gameOver) {
            togglePause();
        }
    });
};

function startTimer() {
    if (!isTimerRunning) {
        gameStartTime = Date.now() - pausedTime;
        isTimerRunning = true;
    }
}

function updateTimer() {
    if (gameOver || !isTimerRunning) return;

    const currentTime = Date.now();
    totalElapsedTime = currentTime - gameStartTime;

    const minutes = Math.floor(totalElapsedTime / 60000);
    const seconds = Math.floor((totalElapsedTime % 60000) / 1000);

    document.getElementById("gameTimer").textContent =
        `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        // Pause timer
        isTimerRunning = false;
        pausedTime = Date.now() - gameStartTime;
        backgroundMusic.pause();
        document.getElementById("pauseMenu").style.display = "block";
    } else {
        // Resume timer
        scheduleAlienShoot();
        gameStartTime = Date.now() - pausedTime;
        isTimerRunning = true;
        backgroundMusic.play();
        document.getElementById("pauseMenu").style.display = "none";
    }
}

function resumeGame() {
    isPaused = false;
    document.getElementById("pauseMenu").style.display = "none";
    backgroundMusic.play();
}

function restartGame() {
    gameOver = false;
    isPaused = false;
    level = 1;
    score = 0;
    ship.health = health;
    ship.x = tileSize * columns / 2 - tileSize;
    ship.y = tileSize * rows - tileSize * 2;
    alienVelocityX = 1;
    alienColumns = 3;
    alienRows = 2;

    gameStartTime = Date.now();
    pausedTime = 0;
    totalElapsedTime = 0;
    isTimerRunning = true;

    bulletArray.forEach(bullet => bullet.element.remove());
    bulletArray = [];
    alienBulletArray.forEach(bullet => bullet.element.remove());
    alienBulletArray = [];

    alienArray.forEach(alien => alien.element.remove());
    alienArray = [];
    walls.forEach(wall => wall.element.remove());
    walls = [];

    board.innerHTML = `
        <div class="progress">
            <p id="level">Level: 1</p>
            <p id="score">Score: 0</p>
            <p id="gameTimer">Time: 00:00</p>
            <p id="health">Health: ${ship.health}</p>
        </div>
        <div id="pauseMenu" class="gameOverScreen" style="display: none;">
            <h2>Game Paused</h2>
            <button onclick="resumeGame()">Resume</button>
            <button onclick="restartGame()">Restart</button>
        </div>
    `;

    document.getElementById("gameOver").style.display = "none";

    ship.element = document.createElement("div");
    ship.element.className = "ship";
    ship.element.style.width = shipWidth + "px";
    ship.element.style.height = shipHeight + "px";
    board.appendChild(ship.element);

    createAliens();
    createWalls();
    updateLevelStory(level);

    backgroundMusic.currentTime = 0;
    backgroundMusic.play();
    startTimer();
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

function createWalls() {
    walls = [];
    let startX = (boardWidth - wallColumns * (wallWidth + tileSize)) / 2;
    let startY = shipY - tileSize * 4;

    for (let c = 0; c < wallColumns; c++) {
        let wall = {
            x: startX + c * (wallWidth + tileSize),
            y: startY,
            width: wallWidth,
            height: wallHeight,
            health: wallHealth,
            element: document.createElement("div")
        };

        wall.element.className = "wall";
        wall.element.style.width = wall.width + "px";
        wall.element.style.height = wall.height + "px";
        wall.element.style.left = wall.x + "px";
        wall.element.style.top = wall.y + "px";

        board.appendChild(wall.element);
        walls.push(wall);
    }
}

function update() {
    requestAnimationFrame(update);
    if (gameOver || isPaused) return;
    updateTimer()
    // Update the ship position
    if (movingRight && ship.x + shipVelocityX + ship.width <= boardWidth) {
        ship.x += shipVelocityX;
    }
    if (movingLeft && ship.x - shipVelocityX >= 0) {
        ship.x -= shipVelocityX;
    }
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

        // Check collision with walls
        for (let j = 0; j < walls.length; j++) {
            let wall = walls[j];
            if (wall.health > 0 && detectCollision(bullet, wall)) {
                bullet.used = true;
                wall.health--;

                if (wall.health === 0) {
                    wall.element.remove();
                } else {
                    wall.element.style.opacity = wall.health / wallHealth;
                }

                bullet.element.remove();
                bulletArray.splice(i, 1);
                break;
            }
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

    // Update alien bullets
    for (let i = alienBulletArray.length - 1; i >= 0; i--) {
        let alienBullet = alienBulletArray[i];
        alienBullet.y += alienBulletVelocityY;
        alienBullet.element.style.top = alienBullet.y + "px";

        // Remove out of bounds alien bullets
        if (alienBullet.y > boardHeight) {
            alienBullet.element.remove();
            alienBulletArray.splice(i, 1);
            continue;
        }

        // Check collision with walls
        for (let j = 0; j < walls.length; j++) {
            let wall = walls[j];
            if (wall.health > 0 && detectCollision(alienBullet, wall)) {
                alienBullet.used = true;
                wall.health--;

                if (wall.health === 0) {
                    wall.element.remove();
                } else {
                    wall.element.style.opacity = wall.health / wallHealth;
                }

                alienBullet.element.remove();
                alienBulletArray.splice(i, 1);
                break;
            }
        }
        // Check collision with ship
        if (detectCollision(alienBullet, ship)) {
            ship.health--;
            document.getElementById("health").textContent = "Health: " + ship.health;

            alienBullet.element.remove();
            alienBulletArray.splice(i, 1);

            if (ship.health === 0) {
                gameOver = true;
                document.getElementById("gameOver").style.display = "block";
                document.getElementById("finalScore").textContent = score;
            }
            continue;
        }
    }

    // Next level
    if (alienCount === 0) {
        level++
        document.getElementById("level").textContent = "Level: " + level
        score += alienColumns * alienRows * 100;
        alienColumns = Math.min(alienColumns + 1, columns / 2 - 2);
        alienRows = Math.min(alienRows + 1, rows - 4);
        alienVelocityX += alienVelocityX > 0 ? 0.2 : -0.2;
        createAliens();
        updateLevelStory(level);
    }
}


function moveShip(e) {
    if (gameOver) return;
    if (e.code === "ArrowLeft") {
        movingLeft = true;
    } else if (e.code === "ArrowRight") {
        movingRight = true;
    }
}

function stopShip(e) {
    if (gameOver) return;
    if (e.code === "ArrowLeft") {
        movingLeft = false;
    } else if (e.code === "ArrowRight") {
        movingRight = false;
    }
}


function detectCollision(a, b) {
    return a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
}

function shoot(e) {
    if (gameOver || e.code !== "Space") return;
    let bulletSound = shootSound.cloneNode();
    bulletSound.play(); let bullet = {
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

function alienShoot() {
    // Choose a random alien to shoot
    let randomAlien = alienArray[Math.floor(Math.random() * alienArray.length)];

    // If the alien is alive, create a bullet
    if (randomAlien.alive) {
        let alienBullet = {
            x: randomAlien.x + randomAlien.width / 2 - tileSize / 16,
            y: randomAlien.y + randomAlien.height,
            width: tileSize / 8,
            height: tileSize / 2,
            used: false,
            element: document.createElement("div")
        };

        alienBullet.element.className = "alienBullet";
        alienBullet.element.style.width = alienBullet.width + "px";
        alienBullet.element.style.height = alienBullet.height + "px";
        alienBullet.element.style.left = alienBullet.x + "px";
        alienBullet.element.style.top = alienBullet.y + "px";

        board.appendChild(alienBullet.element);
        alienBulletArray.push(alienBullet);
    }
}

// Helper function for Aliens shoots 
function scheduleAlienShoot() {
    setTimeout(() => {
        alienShoot();
        if (isTimerRunning){
            scheduleAlienShoot();
        }
    }, 1000 + Math.random() * 3000);
}


// Helper function for Ship shoots 
function debounce(func, delay) {
    let timer;
    return function (...args) {
        if (timer) return;
        func.apply(this, args);
        timer = setTimeout(() => {
            timer = null;
        }, delay);
    };
}

// Function to update level story
function updateLevelStory(level) {
    const storyDiv = document.getElementById('levelStory');
    const content = getLevelContent(level);
    storyDiv.innerHTML = `
        <h2>Level ${level}: ${content.title}</h2>
        <p>${content.story}</p>
    `;
}

// Level stories configuration
const levelStories = {
    1: {
        title: "The Beginning",
        story: "Earth's first line of defense. You command humanity's prototype space fighter against the initial alien scouts. They're testing our defenses - show them we're ready."
    },
    2: {
        title: "Rising Threat",
        story: "The aliens have called for reinforcements. More ships, tighter formations. The real battle for Earth begins now."
    },
    3: {
        title: "Strategic Formation",
        story: "The invaders have analyzed our tactics. They've adopted a new attack pattern with strengthened defenses. Stay alert, pilot."
    },
    4: {
        title: "Elite Squadron",
        story: "You've gained their respect. The aliens have dispatched their elite warriors. Their ships are faster and their aim deadlier."
    },
    5: {
        title: "The Commander",
        story: "Intelligence reports a commanding officer among the invasion force. Defeat them, and we might just turn the tide of this war."
    },
    6: {
        title: "Full Invasion",
        story: "The entire alien armada has arrived. Earth's fate rests in your hands. Show them the true spirit of humanity."
    },
    7: {
        title: "Final Stand",
        story: "This is it. Their supreme leader has joined the battle. Victory here means survival for Earth. Defeat means extinction."
    }
};

// Function to get level content
function getLevelContent(level) {
    return levelStories[level] || {
        title: `Unknown Level ${level}`,
        story: "New challenges await in uncharted space."
    };
}
