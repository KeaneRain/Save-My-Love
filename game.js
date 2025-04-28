// Game setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const healthBar = document.getElementById('healthBar');
const scoreDisplay = document.getElementById('scoreDisplay');
const messageElement = document.getElementById('message');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game variables
let score = 0;
let health = 100;
let gameOver = false;
let win = false;

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 20,
    color: '#ff6b9d',
    speed: 5,
    dx: 0,
    dy: 0
};

// Projectiles
const projectiles = [];
const projectileSpeed = 8;
const projectileRadius = 5;

// Enemies
const enemies = [];
let enemySpawnRate = 100; // frames
let enemySpawnCounter = 0;

// You (the one to save)
const you = {
    x: canvas.width - 100,
    y: canvas.height - 100,
    radius: 25,
    color: '#6495ed'
};

// Key states
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

// Event listeners
window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);
canvas.addEventListener('click', shoot);

function keyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        keys[e.key] = true;
    }
}

function keyUp(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        keys[e.key] = false;
    }
}

function shoot(e) {
    if (gameOver) return;
    
    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate angle between player and mouse
    const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    
    // Create projectile
    projectiles.push({
        x: player.x,
        y: player.y,
        radius: projectileRadius,
        color: '#ffcc00',
        speed: projectileSpeed,
        dx: Math.cos(angle) * projectileSpeed,
        dy: Math.sin(angle) * projectileSpeed
    });
}

function spawnEnemy() {
    // Random position on edges
    let x, y;
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 : canvas.width;
        y = Math.random() * canvas.height;
    } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? 0 : canvas.height;
    }
    
    enemies.push({
        x: x,
        y: y,
        radius: 15 + Math.random() * 10,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        speed: 1 + Math.random() * 2,
        health: 2
    });
}

function update() {
    if (gameOver) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update player position based on keys
    player.dx = 0;
    player.dy = 0;
    
    if (keys.ArrowUp) player.dy = -player.speed;
    if (keys.ArrowDown) player.dy = player.speed;
    if (keys.ArrowLeft) player.dx = -player.speed;
    if (keys.ArrowRight) player.dx = player.speed;
    
    // Normalize diagonal movement
    if (player.dx !== 0 && player.dy !== 0) {
        player.dx *= 0.7071;
        player.dy *= 0.7071;
    }
    
    player.x += player.dx;
    player.y += player.dy;
    
    // Keep player in bounds
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
    
    // Spawn enemies
    enemySpawnCounter++;
    if (enemySpawnCounter >= enemySpawnRate) {
        spawnEnemy();
        enemySpawnCounter = 0;
        // Increase spawn rate over time
        enemySpawnRate = Math.max(30, enemySpawnRate - 1);
    }
    
    // Update and draw projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        
        // Move projectile
        p.x += p.dx;
        p.y += p.dy;
        
        // Remove if out of bounds
        if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
            projectiles.splice(i, 1);
            continue;
        }
        
        // Draw projectile
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.closePath();
    }
    
    // Update and draw enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        
        // Move enemy toward player
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        e.x += Math.cos(angle) * e.speed;
        e.y += Math.sin(angle) * e.speed;
        
        // Check collision with player
        const dist = Math.hypot(player.x - e.x, player.y - e.y);
        if (dist < player.radius + e.radius) {
            health -= 5;
            healthBar.style.width = `${health}%`;
            if (health <= 0) {
                health = 0;
                gameOver = true;
                messageElement.textContent = "Game Over! You couldn't save me! :(";
            }
            enemies.splice(i, 1);
            continue;
        }
        
        // Check collision with projectiles
        for (let j = projectiles.length - 1; j >= 0; j--) {
            const p = projectiles[j];
            const dist = Math.hypot(p.x - e.x, p.y - e.y);
            if (dist < p.radius + e.radius) {
                e.health--;
                projectiles.splice(j, 1);
                if (e.health <= 0) {
                    enemies.splice(i, 1);
                    score += 10;
                    scoreDisplay.textContent = `Score: ${score}`;
                }
                break;
            }
        }
        
        // Draw enemy
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fillStyle = e.color;
        ctx.fill();
        ctx.closePath();
    }
    
    // Check if player reached you
    const distToYou = Math.hypot(player.x - you.x, player.y - you.y);
    if (distToYou < player.radius + you.radius) {
        win = true;
        gameOver = true;
        messageElement.textContent = "You saved me! I love you! ❤️";
    }
    
    // Draw player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.closePath();
    
    // Draw you
    ctx.beginPath();
    ctx.arc(you.x, you.y, you.radius, 0, Math.PI * 2);
    ctx.fillStyle = you.color;
    ctx.fill();
    ctx.closePath();
    
    // Draw heart above you
    drawHeart(you.x, you.y - 40, 15, '#ff6b9d');
    
    requestAnimationFrame(update);
}

function drawHeart(x, y, size, color) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x, y - size / 2, x - size, y - size, x - size, y - size / 2);
    ctx.bezierCurveTo(x - size, y, x, y + size, x, y + size);
    ctx.bezierCurveTo(x, y + size, x + size, y, x + size, y - size / 2);
    ctx.bezierCurveTo(x + size, y - size, x, y - size / 2, x, y);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
    ctx.restore();
}

// Start game
update();
