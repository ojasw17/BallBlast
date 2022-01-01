var Player = function () {
    this.width = 80;
    this.height = 20;
    this.speed = 8;
    this.respawn = false;
    this.color = "white";
    this.left = false;
    this.right = false;
    this.x = Game.canvas.width / 2 - this.width / 2;
    this.y = Game.canvas.height - this.height;
};

Player.prototype.drawPlayer = function() {
    Game.context.fillStyle = this.color;
    Game.context.fillRect(this.x, this.y, this.width, this.height);
};

Player.prototype.startShooting = function () {
    Game.playerBullets[Game.playerBulletId] = new playerBullet(this.x + this.width / 2);
    Game.playerBulletId++;
}; 

Player.prototype.die = function () {
    if (Game.lifeCount < Game.maxLives) {
        Game.respawning(1500);
        Game.lifeCount++;
    } else {
        Game.pauseGame = true;
        Game.gameOver();
    }
};

Player.prototype.updateCurrFrame = function () {
    if (Game.shootingMode && Game.currFrame % 10 === 0) {
        this.startShooting();
    }
    if (this.right && this.x + this.width < Game.canvas.width) {
        this.x += this.speed;
    }
    if (this.left && this.x > 0) {
        this.x -= this.speed;
    }
    for (var i in Game.enemyBullets) {
        var currBullet = Game.enemyBullets[i];
        if (Game.curr_player.respawn === false && Game.checkCollision(currBullet, this)) {
            this.die();
            delete Game.enemyBullets[i];
        }
    }
};

var playerBullet = function (x) {
    this.width = 10;
    this.height = 20;
    this.x = x;
    this.y = Game.canvas.height - 10;
    this.vy = 8;
    this.id = Game.playerBulletId;
    this.active = true;
    this.color = "white";
};

playerBullet.prototype.drawBullet = function () {
    Game.context.fillStyle = this.color;
    Game.context.fillRect(this.x, this.y, this.width, this.height);
};

playerBullet.prototype.updateCurrFrame = function () {
    this.y -= this.vy;
    if (this.y < 0) {
        delete Game.playerBullets[this.id];
    }
};

var enemy = function () {
    this.width = 80;
    this.height = 20;
    this.x = Game.randomInRange(0, (Game.canvas.width - this.width));
    this.y = Game.randomInRange(10, 40);
    this.vy = Game.randomInRange(1, 3) * .1;
    this.id = Game.enemyId;
    Game.enemies[Game.enemyId] = this;
    Game.enemyId++;
    this.speed = Game.randomInRange(2, 3);
    this.shootingSpeed = Game.randomInRange(30, 80);
    this.left = false;
    if (Math.random() < 0.5) this.left = true;
    this.color = "hsl(" + Game.randomInRange(0, 360) + ", 60%, 50%)";
};

enemy.prototype.drawEnemy = function () {
    Game.context.fillStyle = this.color;
    Game.context.fillRect(this.x, this.y, this.width, this.height);
};

enemy.prototype.updateCurrFrame = function () {
    if (this.left) {
        if (this.x > 0) {
            this.x -= this.speed;
            this.y += this.vy;
        } else {
            this.left = false;
        }
    } else {
        if (this.x + this.width < Game.canvas.width) {
            this.x += this.speed;
            this.y += this.vy;
        } else {
            this.left = true;
        }
    }

    for (var i in Game.playerBullets) {
        var currBullet = Game.playerBullets[i];
        if (Game.checkCollision(currBullet, this)) {
            this.die();
            delete Game.playerBullets[i];
        }
    }
};

enemy.prototype.die = function () {
    this.explode();
    delete Game.enemies[this.id];
    Game.gameScore += 25;
    if (Game.enemiesLeft > 1) Game.enemiesLeft -= 1;
    else Game.enemiesLeft = 0;
    if (Game.enemiesLeft < Game.maxEnemies) {
        Game.enemiesLeft++;
        setTimeout(function () {
            new enemy();
        }, 2000);
    }
};

enemy.prototype.explode = function () {
    for (var i = 0; i < Game.maxParticles; i++) {
        new particleOnExplosion(this.x + this.width / 2, this.y, this.color);
    }
};

enemy.prototype.startShooting = function () {
    new enemyBullet(this.x + this.width / 2, this.y, this.color);
};

var enemyBullet = function (x, y, color) {
    this.width = 10;
    this.height = 25;
    this.x = x;
    this.y = y;
    this.vy = 6;
    this.color = color;
    this.id = Game.enemyBulletId;
    Game.enemyBullets[Game.enemyBulletId] = this;
    Game.enemyBulletId++;
};

enemyBullet.prototype.drawEnemyBullet = function () {
    Game.context.fillStyle = this.color;
    Game.context.fillRect(this.x, this.y, this.width, this.height);
};

enemyBullet.prototype.updateCurrFrame = function () {
    this.y += this.vy;
    if (this.y > Game.canvas.height) {
        delete Game.enemyBullets[this.id];
    }
};

var particleOnExplosion = function (x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = Game.randomInRange(-5, 5);
    this.vy = Game.randomInRange(-5, 5);
    this.color = color;
    Game.particlesOnExplosion[Game.particleId] = this;
    this.id = Game.particleId;
    Game.particleId++;
    this.life = 0;
    this.gravity = .05;
    this.size = 40;
    this.maxlife = 100;
}

particleOnExplosion.prototype.drawParticle = function () {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.size *= 0.89;
    Game.context.fillStyle = this.color;
    Game.context.fillRect(this.x, this.y, this.size, this.size);
    this.life++;
    if (this.life >= this.maxlife) {
        delete Game.particlesOnExplosion[this.id];
    }
};


var Game = {
   
    start: function() {
        this.color = "rgba(20,20,20,.7)";
        this.canvas = document.getElementById("game");
        this.context = this.canvas.getContext("2d");
        this.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
        this.canvas.width = this.canvas.width;
        this.canvas.height = this.canvas.height;
        this.pauseGame = false;
        this.curr_player = new Player();
        this.playerBullets = [];
        this.playerBulletId = 0;
        this.shootingMode = false;
        this.enemies = [];
        this.enemyId = 0;
        this.enemyBullets = [];
        this.enemyBulletId = 0;
        this.particlesOnExplosion = [];
        this.particleId = 0;
        this.maxEnemies = 7;
        this.maxLives = 4;
        this.maxParticles = 10;
        this.lifeCount = 0;
        this.enemiesLeft = 0;
        this.gameScore = 0;
        this.gameFinished = false;
        this.initialShot = false;
        this.currFrame = 0;
        this.keyControls();

        for (var i = 0; i < this.maxEnemies; i++) {
            new enemy();
            this.enemiesLeft++;
        } 

        this.respawning(2000);
        this.recurse(); 
    },

    keyControls: function () {
        window.addEventListener("keydown", this.buttonDown);
        window.addEventListener("keyup", this.buttonUp);
        window.addEventListener("keypress", this.keyPressed);
        this.canvas.addEventListener("click", this.clicked);
    },

    clicked: function () {
        if (!Game.pauseGame) {
            Game.pauseGame = true;;
        } else {
            if (Game.gameFinished) {
                Game.start();
            } else {
                Game.pauseGame = false;
                Game.recurse();
                Game.respawning(1000);
            }
        }
    },

    keyPressed: function (e) {
        if (e.keyCode === 32) {
            if (!Game.curr_player.respawn && !Game.initialShot) {
                Game.curr_player.startShooting();
                Game.initialShot = true;
            }
            e.preventDefault();
        }
    }, 

    buttonUp: function (e) {
        if (e.keyCode === 32) {
            Game.shootingMode = false;
            Game.initialShot = false;
            e.preventDefault();
        }
        if (e.keyCode === 37) {
            Game.curr_player.left = false;
        }
        if (e.keyCode === 39) {
            Game.curr_player.right = false;
        }
    }, 

    buttonDown: function (e) {
        if (e.keyCode === 32) {
            Game.shootingMode = true;
        }
        if (e.keyCode === 37) {
            Game.curr_player.left = true;
        }
        if (e.keyCode === 39) {
            Game.curr_player.right = true;
        }
    },

    randomInRange: function (l, r) {
        return Math.floor(Math.random() * (r - l) + l);
    },

    respawning: function (s) {
        this.curr_player.respawn = true;
        setTimeout(function () {
            Game.curr_player.respawn = false;
        }, s);
    },

    checkCollision: function (a, b) {
        return !(
            ((a.y + a.height) < (b.y)) ||
            (a.y > (b.y + b.height)) ||
            ((a.x + a.width) < b.x) ||
            (a.x > (b.x + b.width))
        )
    },

    resetScreen: function () {
        this.context.fillStyle = Game.color;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    gameOver: function () {
        this.gameFinished = true;
        this.resetScreen();
        var endingStats = "Game Over";
        var endingStats2 = "Score: " + Game.gameScore;
        var endingStats3 = "Click to Play Again";
        Game.pauseGame = true;
        this.context.fillStyle = "white";
        this.context.font = "bold 30px Lato, sans-serif";
        this.context.fillText(endingStats, this.canvas.width / 2 - this.context.measureText(endingStats).width / 2, this.canvas.height / 2 - 50);
        this.context.fillText(endingStats2, this.canvas.width / 2 - this.context.measureText(endingStats2).width / 2, this.canvas.height / 2 - 5);
        this.context.font = "bold 16px Lato, sans-serif";
        this.context.fillText(endingStats3, this.canvas.width / 2 - this.context.measureText(endingStats3).width / 2, this.canvas.height / 2 + 30);
    },

    updateScore: function () {
        this.context.fillStyle = "white";
        this.context.font = "16px Lato, sans-serif";
        this.context.fillText("Score: " + this.gameScore, 8, 20);
        this.context.fillText("Lives: " + (this.maxLives - this.lifeCount), 8, 40);
    },

    recurse: function () {
        if (!Game.pauseGame) {
            Game.resetScreen();
            for (var i in Game.enemies) {
                var currEnemy = Game.enemies[i];
                currEnemy.drawEnemy();
                currEnemy.updateCurrFrame();
                if (Game.currFrame % currEnemy.shootingSpeed === 0) {
                    currEnemy.startShooting();
                }
            }
            for (var j in Game.enemyBullets) {
                Game.enemyBullets[j].drawEnemyBullet();
                Game.enemyBullets[j].updateCurrFrame();
            }
            for (var k in Game.playerBullets) {
                Game.playerBullets[k].drawBullet();
                Game.playerBullets[k].updateCurrFrame();
            }
            if (Game.curr_player.respawn) {
                if (Game.currFrame % 20 === 0) {
                    Game.curr_player.drawPlayer();
                }
            } else {
                Game.curr_player.drawPlayer();
            }

            for (var i in Game.particlesOnExplosion) {  
                Game.particlesOnExplosion[i].drawParticle();
            }
            Game.curr_player.updateCurrFrame();
            Game.updateScore();
            Game.currFrame = Game.requestAnimationFrame.call(window, Game.recurse);
        }
    }
};

  Game.start();