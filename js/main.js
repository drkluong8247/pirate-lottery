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
        game.load.audio( 'blastSound', 'assets/cannonshot.wav');
        game.load.audio( 'roarSound', 'assets/roar.wav');
        game.load.audio( 'backgroundMusic', 'assets/AnimalCrossing-TownHall.ogg');
    }
    
    //background image
    var world;
    
    //player sprite
    var player;
    
    //pirate ships and variables to control creation
    var enemies;
    var enemyTimer = 2200;
    var nextEnemy = 0;
    var enemyCount = 0;
    var minEnemyTimer = 700;
    
    //controls enemy ship firing
    var eCannons;
    var nextEnemyFire = 0;
    var enemyFireRate = 1500;
    
    //the sea serpent/leviathan/giant monster
    var seaSerpent;
    var serpentTimer = 15000;
    var nextSerpent = 0;
    var warning;
    var warnTimer = 2000;
    var warnDisappear = 0;
    
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
    var skill1Button;
    
    //sounds
    var fx;
    var music;
    var coinfx;
    var roar;
    
    //related to firing
    var cannons;
    var nextFire = 0;
    var fireRate = 500;
    
    
    //related to skills
    var skill1Cooldown = 3000;
    var skill1Timer = 0;
    var skill1Ready;
    var skill1Text;
    var skill1Seconds;
    
    var skill2Cooldown = 30000;
    var skill2Timer = 0;
    var skill2Ready;
    var skill2Text;
    var skill2Seconds;
    
    function create() {
        game.physics.startSystem(Phaser.Physics.ARCADE);
        
        // creates background
        world = game.add.tileSprite(0, 0, 1200, 800, 'world');
        
        
        // creates player sprite, and enables physics for player
        player = game.add.sprite( game.world.centerX, game.world.centerY, 'player');
        player.anchor.setTo(0.5, 0.5);
        game.physics.enable(player, Phaser.Physics.ARCADE );
        player.body.collideWorldBounds = true;
        
        
        // adds cannonballs (to be used by player)
        cannons = game.add.group();
        cannons.enableBody = true;
        cannons.physicsBodyType = Phaser.Physics.ARCADE;
        cannons.createMultiple(50, 'cannonball', 0, false);
        cannons.setAll('anchor.x', 0.5);
        cannons.setAll('anchor.y', 0.5);
        cannons.setAll('outOfBoundsKill', true);
        cannons.setAll('checkWorldBounds', true);
        
        // adds cannonballs (to be used by enemies)
        eCannons = game.add.group();
        eCannons.enableBody = true;
        eCannons.physicsBodyType = Phaser.Physics.ARCADE;
        eCannons.createMultiple(50, 'cannonball', 0, false);
        eCannons.setAll('anchor.x', 0.5);
        eCannons.setAll('anchor.y', 0.5);
        eCannons.setAll('outOfBoundsKill', true);
        eCannons.setAll('checkWorldBounds', true);
        
        // adds enemies
        enemies = game.add.group();
        enemies.enableBody = true;
        enemies.physicsBodyType = Phaser.Physics.ARCADE;
        enemies.createMultiple(50, 'monster', 0, false);
        enemies.setAll('anchor.x', 0.5);
        enemies.setAll('anchor.y', 0.5);
        enemies.setAll('outOfBoundsKill', true);
        enemies.setAll('checkWorldBounds', true);
        
        
        //adds sea serpent and warning indicator (rawr)
        seaSerpent = game.add.sprite(-10000, -10000, 'monster2');
        seaSerpent.anchor.setTo(0.5, 0.5);
        game.physics.enable( seaSerpent, Phaser.Physics.ARCADE );
        nextSerpent = game.time.now + serpentTimer;
        
        warning = game.add.sprite(-9000, -9000, 'alert');
        warning.alive = false;
        warning.anchor.setTo(0.5, 0.5);
        
        
        // Player controls
        cursors = game.input.keyboard.createCursorKeys();
        fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        skill1Button = game.input.keyboard.addKey(Phaser.Keyboard.ONE);
        
        
        // Adds sound
        fx = game.add.audio('blastSound');
        music = game.add.audio('backgroundMusic', 1, true);
        music.play('', 0, 1, true);
        roar = game.add.audio('roarSound');
        
        //initializes score and player's health
        score = 0;
        isAlive = true;
        health = 100;
        
        //initializes player's skills
        skill1Ready = true;
        skill1Text = "Multi-shot:\nREADY";
        skill1Seconds = 0;
        
        skill2Ready = true;
        skill2Text = "Seagull Frenzy:\nREADY";
        skill2Seconds = 0;
        
        //creates game over font
        style = { font: "65px Arial", fill: "#ff0044", align: "center" };
    }
    
    function update()
    {
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
        
        //controls player skills
        if ((skill1Button.isDown) && isAlive)
        {
                skill1();
        }
        
        //controls enemy creation
        createEnemy();
        summonLeviathan();
        
        
        //now to check collision
        game.physics.arcade.overlap(cannons, enemies, shotHandler, null, this);
        game.physics.arcade.overlap(eCannons, player, cannonHandler, null, this);
        game.physics.arcade.overlap(enemies, player, monsterHandler, null, this);
        game.physics.arcade.overlap(seaSerpent, player, leviathanHandler, null, this);
        game.physics.arcade.overlap(cannons, seaSerpent, invincibleMonster, null, this);
        game.physics.arcade.overlap(eCannons, seaSerpent, invincibleMonster, null, this);
        game.physics.arcade.overlap(enemies, seaSerpent, leviathanEatsAll, null, this);
        
        //controls enemy firing
        if (game.time.now > nextEnemyFire)
        {
            enemies.forEachAlive(enemyShoot, this);
            nextEnemyFire = game.time.now + enemyFireRate;
        }
        
        //updates skill timers
        skillUpdater();
    }
    
    //controls player firing
    function shoot()
    {
        if (game.time.now > nextFire && cannons.countDead() > 0)
        {
            nextFire = game.time.now + fireRate;

            var bullet = cannons.getFirstExists(false);

            bullet.reset(player.x + 30, player.y);

            bullet.body.velocity.x = 400;
            
            fx.play();
        }
    }
    
    //player's first special skill (a multi-shot)
    function skill1()
    {
        if (skill1Ready && cannons.countDead() > 2)
        {
            skill1Timer = game.time.now + skill1Cooldown;
            skill1Ready = false;

            var bullet = cannons.getFirstExists(false);
            bullet.reset(player.x + 30, player.y-40);
            bullet.body.velocity.x = 400;
            var bullet2 = cannons.getFirstExists(false);
            bullet2.reset(player.x + 30, player.y);
            bullet2.body.velocity.x = 400;
            var bullet3 = cannons.getFirstExists(false);
            bullet3.reset(player.x + 30, player.y+40);
            bullet3.body.velocity.x = 400;
            
            fx.play();
        }
    }
    
    function skillUpdater()
    {
        if(game.time.now > skill1Timer)
        {
            skill1Ready = true;
            skill1Text = "Multi-shot:\nREADY";
        }
        
        if(!skill1Ready)
        {
            skill1Seconds = parseInt((skill1Timer - game.time.now) / 1000);
            skill1Text = "Multi-shot:\n0:0" + skill1Seconds;
        }
    }
    
    //controls enemy firing
    function enemyShoot(enemy)
    {
        var decideShoot = game.rnd.integer() % 5;
        if((eCannons.countDead() > 0) && (decideShoot < 3))
        {
            var bullet = eCannons.getFirstExists(false);

            bullet.reset(enemy.x - 30, enemy.y);

            bullet.body.velocity.x = -400;
            
            fx.play();
        }
    }
    
    //controls creation of enemy ships
    function createEnemy()
    {
        if (game.time.now > nextEnemy && enemies.countDead() > 0)
        {
            if(enemyTimer > minEnemyTimer)
            {
                enemyCount += 1;
                if(enemyCount >= 5)
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
    
    
    //controls sea serpent attacks and alerts
    function summonLeviathan()
    {
        if (game.time.now > nextSerpent)
        {
            nextSerpent = game.time.now + serpentTimer;
            warnDisappear = game.time.now + warnTimer;
            var decision = game.rnd.integer() % 2;
            var leviathanX = game.rnd.integer() % 1100 + 50;
            seaSerpent.kill();
            
            if(decision === 0)
            {
                seaSerpent.reset(leviathanX, -1200); 
                warning.reset(leviathanX, 50);
                seaSerpent.body.velocity.y = 300;
                seaSerpent.angle = 180;
            }
            else
            {
                seaSerpent.reset(leviathanX, 2000); 
                warning.reset(leviathanX, 750);
                seaSerpent.body.velocity.y = -300;
                seaSerpent.angle = 0;
            }
        }
        
        if((warning.alive == true) && (game.time.now > warnDisappear))
        {
            warning.kill();
            roar.play();
        }
    }
    
    //handles cannonfire to enemy ships
    function shotHandler(enemy, bullet)
    {
        bullet.kill();
        enemy.kill();
        score += 50;
    }
    
    function cannonHandler(player, bullet)
    {
        bullet.kill()
        health -= 10;
        if(health <= 0)
        {
            defeat();
        }
    }
    
    //handles enemy ship to player collision
    function monsterHandler(player, enemy)
    {
        enemy.kill();
        health -= 20;
        
        if(health <= 0)
        {
            defeat();
        }
    }
    
    //handles sea serpent to player collsion (instant death)
    function leviathanHandler(player, enemy)
    {
        defeat();
    }
    
    //handles cannonfire to the leviathan (no damage)
    function invincibleMonster(enemy, bullet)
    {
        bullet.kill();
    }
    
    //leviathans are indiscriminating, and eat all ships
    function leviathanEatsAll(leviathan, enemy)
    {
        enemy.kill();
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
        game.debug.text(skill1Text, 500, 760);
    }
};
