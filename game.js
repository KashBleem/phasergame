const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false } // No gravity until game starts
    },
    scene: { preload, create, update }
};

let bird, pipes, score = 0, scoreText, gameOverText, startText, restartButton;
let gameStarted = false;

function preload() {
    this.load.image('bird', 'assets/bird.png');
    this.load.image('pipe', 'assets/pipe.png');
}

function create() {
    // White background
    this.cameras.main.setBackgroundColor('#ffffff');

    // Display start text
    startText = this.add.text(250, 250, 'Click to Start', { fontSize: '40px', fill: '#000' }).setInteractive();

    // Create stationary bird (no physics yet)
    bird = this.add.sprite(150, 300, 'bird').setScale(0.1);

    // Pipes group
    pipes = this.physics.add.group();

    // Display score
    scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '32px', fill: '#000' }).setVisible(false);

    // Start game on click
    startText.on('pointerdown', () => startGame(this));
}

function startGame(scene) {
    gameStarted = true;
    startText.destroy(); // Remove start text

    // Destroy the static bird sprite and create a physics-enabled one
    bird.destroy();
    bird = scene.physics.add.sprite(150, 300, 'bird').setScale(0.1);
    bird.setCollideWorldBounds(true);
    scene.physics.world.gravity.y = 800; // Gravity starts now

    // Click to jump
    scene.input.on('pointerdown', () => bird.setVelocityY(-300));

    // Spawn pipes every 2 seconds
    scene.time.addEvent({ delay: 2000, callback: spawnPipes, callbackScope: scene, loop: true });

    // Collision detection
    scene.physics.add.collider(bird, pipes, () => gameOver(scene));

    // Show score
    scoreText.setVisible(true);
}

function update() {
    if (gameStarted && bird && (bird.y > 600 || bird.y < 0)) {
        gameOver(this);
    }

    // Score update: Check if pipes have been passed
    pipes.getChildren().forEach(pipe => {
        if (!pipe.passed && pipe.x < bird.x) {
            pipe.passed = true; // Mark as passed
            updateScore();
        }
    });
}

function spawnPipes() {
    if (!gameStarted) return;

    const pipeGap = 200;
    const pipeTopY = Phaser.Math.Between(100, 400);

    let topPipe = pipes.create(800, pipeTopY - pipeGap / 2, 'pipe')
        .setOrigin(0, 1)
        .setFlipY(true)
        .setScale(0.5);

    let bottomPipe = pipes.create(800, pipeTopY + pipeGap / 2, 'pipe')
        .setOrigin(0, 0)
        .setScale(0.5);

    pipes.setVelocityX(-200);

    topPipe.setImmovable(true);
    bottomPipe.setImmovable(true);
    topPipe.body.allowGravity = false;
    bottomPipe.body.allowGravity = false;

    // Mark pipes for scoring
    topPipe.passed = false;
    bottomPipe.passed = false;
}

function updateScore() {
    score += 1;
    scoreText.setText('Score: ' + score);
}

function gameOver(scene) {
    scene.physics.pause();
    bird.setTint(0xff0000);
    gameStarted = false;

    gameOverText = scene.add.text(250, 250, 'Game Over', { fontSize: '40px', fill: '#ff0000' });

    restartButton = scene.add.text(300, 350, 'Restart', { fontSize: '32px', fill: '#000' })
        .setInteractive()
        .on('pointerdown', () => restartGame(scene));
}

function restartGame(scene) {
    scene.scene.restart();
    score = 0;
    gameStarted = false;
}

new Phaser.Game(config);
