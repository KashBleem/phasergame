// Declare background music variable
let backgroundMusic;
let bird, pipes, score = 0, scoreText, gameOverText, startText, restartButton, debugText;
let gameStarted = false;
let sounds = {};

// Phaser game configuration
const config = {
    type: Phaser.AUTO,
    width: 400, // Reduced width
    height: 300, // Reduced height
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
    this.load.spritesheet('birdstatic', 'assets/spritesheet/arianastatic_spritesheet.png', {
        frameWidth: 277,  // Adjust based on sprite sheet
        frameHeight: 305, // Adjust based on sprite sheet
        endFrame: 17       // Number of frames in the animation
    });
    this.load.spritesheet('birdfly', 'assets/spritesheet/arianafly3.png', {
        frameWidth: 307,  // Adjust based on sprite sheet
        frameHeight: 275, // Adjust based on sprite sheet
        endFrame: 4       // Number of frames in the animation
    });
    this.load.image('background', 'assets/background_and_road.png');
    this.load.image('bird', 'assets/bird.png');
    this.load.image('pipe', 'assets/pipe.png');
    this.load.audio('jump', 'assets/jump.mp3');
    this.load.audio('point', 'assets/point.mp3');
    this.load.audio('hit', 'assets/hit.mp3');
    this.load.audio('backgroundMusic', 'assets/bgm.mp3');
}

function create() {
    this.input.mouse.disableContextMenu();

    this.background1 = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'background')
    .setOrigin(0, 0)

    this.anims.create({
        key: 'playBirdStatic',
        frames: this.anims.generateFrameNumbers('birdstatic', { start: 0, end: 16 }),
        frameRate: 12,  // Speed of animation (adjust if needed)
        repeat: -1      // Loop infinitely
    });

    startText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 
        'TAP TO START ', { fontFamily: 'Arial', fontSize: '38px', color: '#333', stroke: '#fff', strokeThickness: 3 })
        .setOrigin(0.5);

    bird = this.add.sprite(200, 200, 'birdstatic').setScale(0.58);
    bird.play('playBirdStatic');

    pipes = this.physics.add.group();
    scoreText = this.add.text(10, 10, 'Score: 0', { fontFamily: 'Arial', fontSize: '22px', color: '#333', stroke: '#fff', strokeThickness: 2 }).setVisible(false);
    debugText = this.add.text(10, 30, 'Bird: (x: 0, y: 0)', { fontFamily: 'Arial', fontSize: '14px', color: '#ff0000' });

    sounds = {
        jump: this.sound.add('jump'),
        point: this.sound.add('point'),
        hit: this.sound.add('hit')
    };

    backgroundMusic = this.sound.add('backgroundMusic');
    backgroundMusic.setLoop(true);
    backgroundMusic.setVolume(0.25);

    this.input.on('pointerdown', () => {
        if (!gameStarted) {
            startGame(this);
        } else {
            bird.setVelocityY(-150);
            sounds.jump.play();
        }
    });
}

function startGame(scene) {
    gameStarted = true;
    startText.destroy();

    backgroundMusic.stop();
    backgroundMusic.play();

    bird.destroy();
    
    scene.anims.create({
        key: 'playBirdFlap',
        frames: scene.anims.generateFrameNumbers('birdfly', { start: 0, end: 3 }),
        frameRate: 5,  // Speed of animation (adjust if needed)
        repeat: -1      // Loop infinitely
    });

    bird = scene.physics.add.sprite(75, 150, 'birdfly').setScale(0.3);
    bird.play('playBirdFlap');

    bird.setSize(190, 250);  // Adjust width and height as needed
    bird.setOffset(20, 10); // Move the hitbox to better align with the visible part

    bird.setCollideWorldBounds(true);
    scene.physics.world.gravity.y = 400;

    scene.time.addEvent({ delay: 1750, callback: spawnPipes, callbackScope: scene, loop: true });
    scene.physics.add.collider(bird, pipes, () => gameOver(scene));
    scoreText.setVisible(true);
}

function update() {
    if (gameStarted) {
        this.background1.tilePositionX += 1.5; // Moves the background
        debugText.setText(`Bird: (x: ${Math.round(bird.x)}, y: ${Math.round(bird.y)})`);
        if (bird.y >= 570) {
            gameOver(this);
        }
    }

    pipes.getChildren().forEach(pipe => {
        if (!pipe.passed && pipe.x < bird.x) {
            pipe.passed = true;
            updateScore();
        }
    });
}

function spawnPipes() {
    if (!gameStarted) return;
    const pipeGap = 200;
    const pipeTopY = Phaser.Math.Between(150, 450);

    let topPipe = pipes.create(600, pipeTopY - pipeGap / 2, 'pipe').setOrigin(0, 1).setFlipY(true).setScale(0.7);
    let bottomPipe = pipes.create(600, pipeTopY + pipeGap / 2, 'pipe').setOrigin(0, 0).setScale(0.7);

    pipes.setVelocityX(-120);
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
    backgroundMusic.stop();

    gameOverText = scene.add.text(
        scene.cameras.main.centerX, 
        scene.cameras.main.centerY, 
        'GAME OVER WTF', 
        { fontFamily: 'Arial', fontSize: '40px', color: '#ff0000', stroke: '#fff', strokeThickness: 3 }
    ).setOrigin(0.5);

    restartButton = scene.add.text(
        scene.cameras.main.centerX, 
        scene.cameras.main.centerY + 50, 
        'TAP TO RESTART', 
        { fontFamily: 'Arial', fontSize: '40px', color: '#333', stroke: '#fff', strokeThickness: 2 }
    ).setOrigin(0.5);

    scene.input.once('pointerdown', () => restartGame(scene));
}

function restartGame(scene) {
    scene.scene.restart();
    score = 0;
    gameStarted = false;
    backgroundMusic.stop();
}

new Phaser.Game(config);
