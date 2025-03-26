// Declare background music variable
let backgroundMusic;
let bird, pipes, score = 0, scoreText, gameOverText, startText, restartButton;
let gameStarted = false;
let sounds = {};

// Phaser game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'game-container',
        width: '100%',
        height: '100%'
    },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: { preload, create, update }
};

function preload() {
    // Load assets
    this.load.image('bird', 'assets/bird.png');
    this.load.image('pipe', 'assets/pipe.png');
    
    // Load sound files
    this.load.audio('jump', 'assets/jump.mp3');
    this.load.audio('point', 'assets/point.mp3');
    this.load.audio('hit', 'assets/hit.mp3');
    this.load.audio('backgroundMusic', 'assets/bgm.mp3'); // Load background music
}

function create() {
    this.input.mouse.disableContextMenu();
    
    // Stylish background gradient
    const gradient = this.add.graphics();
    const colors = [0x87CEEB, 0xE0F6FF];
    gradient.fillGradientStyle(colors[0], colors[0], colors[1], colors[1], 1);
    gradient.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    // Display start text with larger size
    startText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 
        'TAP TO START', { fontFamily: 'Press Start 2P', fontSize: '120px', color: '#333', stroke: '#fff', strokeThickness: 6 })
        .setOrigin(0.5);

    // Stationary bird
    bird = this.add.sprite(150, 300, 'bird').setScale(0.1);

    pipes = this.physics.add.group();
    scoreText = this.add.text(20, 20, 'Score: 0', { fontFamily: 'Press Start 2P', fontSize: '100px', color: '#333', stroke: '#fff', strokeThickness: 4 }).setVisible(false);

    sounds = {
        jump: this.sound.add('jump'),
        point: this.sound.add('point'),
        hit: this.sound.add('hit')
    };

    // **Load background music and loop it**
    backgroundMusic = this.sound.add('backgroundMusic');
    backgroundMusic.setLoop(true); // Loop the music
    backgroundMusic.setVolume(0.25); // Adjust the volume (optional)

    // Set the click event handler
    this.input.on('pointerdown', () => {
        if (!gameStarted) {
            startGame(this); // Start the game
        } else {
            // Make the bird jump directly here
            bird.setVelocityY(-300); // Make the bird jump
            sounds.jump.play(); // Play jump sound
        }
    });

    document.addEventListener('touchmove', (e) => {
        if (e.scale !== 1) e.preventDefault();
    }, { passive: false });
}

function startGame(scene) {
    gameStarted = true;
    startText.destroy(); // Remove the start text

    // Play background music when the game starts
    backgroundMusic.stop(); // Stop any existing music and restart it
    backgroundMusic.play();

    // Create a physics-enabled bird
    bird.destroy();
    bird = scene.physics.add.sprite(150, 300, 'bird').setScale(0.1);
    bird.setCollideWorldBounds(true);
    scene.physics.world.gravity.y = 800; // Set gravity to simulate jumping

    // Spawn pipes every 2 seconds
    scene.time.addEvent({ 
        delay: 1500, 
        callback: spawnPipes, 
        callbackScope: scene, 
        loop: true 
    });

    // Set collision detection with pipes
    scene.physics.add.collider(bird, pipes, () => gameOver(scene));

    // Show score text
    scoreText.setVisible(true);
}

function update() {
    if (gameStarted && bird && (bird.y > this.cameras.main.height || bird.y < 10)) {
        gameOver(this); // End game if the bird hits the floor
    }

    // Score update: Check if pipes have been passed
    pipes.getChildren().forEach(pipe => {
        if (!pipe.passed && pipe.x < bird.x) {
            pipe.passed = true;
            updateScore();
        }
    });
}

function spawnPipes() {
    if (!gameStarted) return;

    const pipeGap = 300;
    const pipeTopY = Phaser.Math.Between(100, 400);

    let topPipe = pipes.create(1200, pipeTopY - pipeGap / 2, 'pipe')
        .setOrigin(0, 1)
        .setFlipY(true)
        .setScale(1);

    let bottomPipe = pipes.create(1200, pipeTopY + pipeGap / 2, 'pipe')
        .setOrigin(0, 0)
        .setScale(1);

    pipes.setVelocityX(-200);

    topPipe.setImmovable(true);
    bottomPipe.setImmovable(true);
    topPipe.body.allowGravity = false;
    bottomPipe.body.allowGravity = false;

    topPipe.passed = false;
    bottomPipe.passed = false;
}

function updateScore() {
    score += 1;
    scoreText.setText('Score: ' + score);
    sounds.point.play();
}

function gameOver(scene) {
    scene.physics.pause();
    bird.setTint(0xff0000);
    gameStarted = false;
    sounds.hit.play();
    backgroundMusic.stop(); // Stop the background music when the game ends

    const fontConfig = {
        fontFamily: 'Press Start 2P',
        fontSize: '200px', // Increased size for game over text
        color: '#ff0000',
        stroke: '#fff',
        strokeThickness: 6
    };

    gameOverText = scene.add.text(
        scene.cameras.main.centerX, 
        scene.cameras.main.centerY, 
        'GAME OVER', 
        fontConfig
    ).setOrigin(0.5);

    const restartConfig = {
        fontFamily: 'Press Start 2P',
        fontSize: '180px', // Increased size for restart text
        color: '#333',
        stroke: '#fff',
        strokeThickness: 4
    };

    restartButton = scene.add.text(
        scene.cameras.main.centerX, 
        scene.cameras.main.centerY + 100, 
        'TAP TO RESTART', 
        restartConfig
    )
    .setOrigin(0.5);

    // Allow restarting by clicking anywhere
    scene.input.once('pointerdown', () => restartGame(scene));
}

function restartGame(scene) {
    scene.scene.restart();
    score = 0;
    gameStarted = false;
    backgroundMusic.stop(); // Stop music and reset before restarting
}

// Add Google Font link for Press Start 2P
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);

// Create a new Phaser game instance with the `config` object
new Phaser.Game(config);
