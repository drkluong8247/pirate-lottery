window.onload = function() {
    // You might want to start with a template that uses GameStates:
    //     https://github.com/photonstorm/phaser/tree/master/resources/Project%20Templates/Basic
    
    // You can copy-and-paste the code from any of the examples at http://examples.phaser.io here.
    // You will need to change the fourth parameter to "new Phaser.Game()" from
    // 'phaser-example' to 'game', which is the id of the HTML element where we
    // want the game to go.
    // The assets (and code) can be found at: https://github.com/photonstorm/phaser/tree/master/examples/assets
    // You will need to change the paths you pass to "game.load.image()" or any other
    // loading functions to reflect where you are putting the assets.
    // All loading functions will typically all be found inside "preload()".
    
    "use strict";
    
    var game = new Phaser.Game( 1200, 800, Phaser.AUTO, 'game', { preload: preload, create: create, update: update, render: render } );
    
    function preload() {
        // Loads images
        game.load.image( 'world', 'assets/OceanBackground.png' );
        game.load.image( 'player', 'assets/PlayerShip.png');
        game.load.image( 'monster', 'assets/PirateShip.png');
        game.load.image( 'cannonball', 'assets/Cannonball.png');
        game.load.image( 'monster2', 'assets/SeaSerpent.png');
        game.load.image( 'alert', 'assets/Sign.png');
        
        // loads sound
        game.load.audio( 'castSound', 'assets/magicshot.mp3');
        game.load.audio( 'backgroundMusic', 'assets/AnimalCrossing-TownHall.ogg');
    }
    
    //background image
    var world;
    
    //player sprite
    var player;
    
    //controls enemy creation
    var enemies;
    var enemyTimer = 2200;
    var nextEnemy = 0;
    var enemyCount = 0;
    var minEnemyTimer = 700;
    
    
    //player's current score
    var score;
    
    //game over message (and player death)
    var lost;
    var style;
    var health;
    var isAlive;
    
    //player input
    var cursors;
    var fireButton;
    
    //sounds
    var fx;
    var music;
    var coinfx;
    
    //related to firing
    var cannons;
    var nextFire = 0;
    var fireRate = 500;
    
    function create() {
        game.physics.startSystem(Phaser.Physics.ARCADE);
        
        // creates background
        world = game.add.tileSprite(0, 0, 1200, 800, 'world');
        
        // creates player sprite, and enables physics for player
        player = game.add.sprite( game.world.centerX, game.world.centerY, 'player');
        player.anchor.setTo( 0.5, 0.5 );
        game.physics.enable( player, Phaser.Physics.ARCADE );
        player.body.collideWorldBounds = true;
        
        // adds cannonballs (to be used by player and enemies
        cannons = game.add.group();
        cannons.enableBody = true;
        cannons.physicsBodyType = Phaser.Physics.ARCADE;
        cannons.createMultiple(50, 'cannonball', 0, false);
        cannons.setAll('anchor.x', 0.5);
        cannons.setAll('anchor.y', 0.5);
        cannons.setAll('outOfBoundsKill', true);
        cannons.setAll('checkWorldBounds', true);
        
        
        // adds enemies
        enemies = game.add.group();
        enemies.enableBody = true;
        enemies.physicsBodyType = Phaser.Physics.ARCADE;
        enemies.createMultiple(50, 'monster', 0, false);
        enemies.setAll('anchor.x', 0.5);
        enemies.setAll('anchor.y', 0.5);
        enemies.setAll('outOfBoundsKill', true);
        enemies.setAll('checkWorldBounds', true);
        
        // Player controls
        cursors = game.input.keyboard.createCursorKeys();
        fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        
        // Adds sound
        fx = game.add.audio('castSound');
        music = game.add.audio('backgroundMusic', 1, true);
        music.play('', 0, 1, true);
        
        //initializes score and player's health
        score = 0;
        isAlive = true;
        health = 100;
        
        //creates game over
        style = { font: "65px Arial", fill: "#ff0044", align: "center" };
    }
    
    function update() {
        //controls background movement
        world.tilePosition.x -= 2;
        
        // Controls movement of the player
        player.body.velocity.setTo(0, 0);
        if (cursors.left.isDown)
        {
            player.body.velocity.x = -200;
        }
        else if (cursors.right.isDown)
        {
            player.body.velocity.x = 200;
        }
        if (cursors.up.isDown)
        {
            player.body.velocity.y = -200;
        }
        else if (cursors.down.isDown)
        {
            player.body.velocity.y = 200;
        }
        
        //controls player firing
        if ((fireButton.isDown) && isAlive)
        {
                shoot();
        }
        
        //controls enemy creation
        createEnemy();
        
        //now to check collision
        game.physics.arcade.overlap(cannons, enemies, shotHandler, null, this);
        game.physics.arcade.overlap(enemies, player, monsterHandler, null, this);
    }
    
    function shoot() {
        if (game.time.now > nextFire && cannons.countDead() > 0)
        {
            nextFire = game.time.now + fireRate;

            var bullet = cannons.getFirstExists(false);

            bullet.reset(player.x + 30, player.y);

            bullet.body.velocity.x = 400;
            
            fx.play();
        }
    }
    
    function createEnemy() {
        if (game.time.now > nextEnemy && enemies.countDead() > 0)
        {
            if(enemyTimer > minEnemyTimer)
            {
                enemyCount += 1;
                if(enemyCount >= 10)
                {
                    enemyCount = 0;
                    enemyTimer -= 300;
                }
            }
            
            nextEnemy = game.time.now + enemyTimer;

            var enemy = enemies.getFirstExists(false);

            enemy.reset(1300, game.world.randomY);

            enemy.body.velocity.x = -250;
        }
    }
    
    function shotHandler (enemy, bolt) {

        bolt.kill();
        enemy.kill();
        score += 50;
    }
    
    //handles enemy ship to player collision
    function monsterHandler(player, enemy)
    {
        enemy.kill();
        if(health > 0)
            health -= 20;
        
        if(health <= 0)
        {
            defeat();
        }
    }
    
    //handles if the player loses (no victory, game is endless)
    function defeat()
    {
        player.kill();
        health = 0;
        isAlive = false;
        lost = game.add.text(game.world.centerX, game.world.centerY, "GAME OVER!", style);
        lost.anchor.setTo( 0.5, 0.5);
    }
    
    //updates score and health
    function render() {    
        game.debug.text('Score: ' + score, 32, 780);
        game.debug.text('Health: ' + health, 32, 760);
    }
};
