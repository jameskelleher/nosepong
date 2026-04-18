class Ball {
    constructor() {
        this.minXSpeed = width / (4 * frameRate());
        this.maxXSpeed = width / (1.5 * frameRate());
        this.maxYSpeed = height / (1 * frameRate());
        this.xSpeedup = 1.03;

        this.x = width / 2;
        this.y = height / 2;

        let xMult = random(1) > 0.5 ? 1 : -1;

        this.xSpeed = random(this.minXSpeed, this.maxXSpeed * 0.5) * xMult;
        this.ySpeed = random(-this.maxYSpeed, this.maxYSpeed) * 0.25;
        this.color = this.xSpeed > 0 ? PlayerColor.RED : PlayerColor.BLUE;
        this.lastCollidedWith = null;

        this.d = paddleH * 0.333;
        this.xDamp = 0.7;

        ballUpdateTs = now;

        player1.hasSunglasses = false;
        player1.hasSadEyes = false;
        player2.hasSunglasses = false;
        player2.hasSadEyes = false;
    }

    bounceSound() {
        let rate = random(0.75, 1.25);
        goose.rate(rate);
        goose.play();
    }

    draw() {

        fill(this.color);
        circle(this.x, this.y, this.d);

        this.x += this.xSpeed;
        this.y += this.ySpeed;


        if (this.y <= this.d / 2 || height - this.d / 2 <= this.y) {
            this.ySpeed *= -1;
            this.lastCollidedWith = null;
            this.bounceSound();
        }

        this.checkCollisions(player1);
        this.checkCollisions(player2);
    }

    checkCollisions(player) {
        if (this.lastCollidedWith == player.color) return;

        let bounds = {
            xMin: player.noseX - player.truePaddleWidth / 2,
            xMax: player.noseX + player.truePaddleWidth / 2,
            yMin: player.noseY - player.truePaddleHeight / 2,
            yMax: player.noseY + player.truePaddleHeight / 2,
        };

        let didCollide = false;
        
        if (collideLineCircle(bounds.xMin, bounds.yMin, bounds.xMin, bounds.yMax, this.x, this.y, this.d)) {
            debugLog(`${player.color} left`);
            this.xSpeed = -abs(this.xSpeed) * this.xDamp + player.xVel();
            this.ySpeed += player.yVel();
            didCollide = true;
        }    
        else if (collideLineCircle(bounds.xMax, bounds.yMin, bounds.xMax, bounds.yMax, this.x, this.y, this.d)) {
            debugLog(`${player.color} right`);
            this.xSpeed = abs(this.xSpeed) * this.xDamp * this.xDamp + player.xVel();
            this.ySpeed += player.yVel();
            didCollide = true;
        }    
        else if (collideLineCircle(bounds.xMin, bounds.yMin, bounds.xMax, bounds.yMin, this.x, this.y, this.d)) {
            debugLog(`${player.color} top`);
            this.ySpeed = -abs(this.ySpeed) + min(0, player.yVel());
            this.xSpeed += player.xVel() * 0.2;
            didCollide = true;
        }    
        else if (collideLineCircle(bounds.xMin, bounds.yMax, bounds.xMax, bounds.yMax, this.x, this.y, this.d)) {
            debugLog(`${player.color} bottom`);
            this.ySpeed = abs(this.ySpeed) + max(0, player.yVel());
            this.xSpeed += player.xVel() * 0.2;
            didCollide = true;
        }    
        // general collision, in case paddle is moving really really fast
        else if (collideRectCircle(bounds.xMin, bounds.yMin, player.truePaddleWidth, player.truePaddleHeight, this.x, this.y, this.d)) {
            debugLog(`${player.color} rect`);
            if (player.color == PlayerColor.RED) this.xSpeed = abs(this.xSpeed) * this.xDamp + player.xVel();
            else this.xSpeed = -abs(this.xSpeed) * this.xDamp + player.xVel();
            this.ySpeed += player.yVel();
            didCollide = true;
        }    

        if (didCollide) {
            this.minXSpeed *= this.xSpeedup;
            this.maxXSpeed *= this.xSpeedup;
            this.color = player.color;
            this.lastCollidedWith = player.color;
            this.bounceSound();
        }

        if (this.xSpeed < 0)
            this.xSpeed = constrain(this.xSpeed, -this.maxXSpeed, -this.minXSpeed);
        else
            this.xSpeed = constrain(this.xSpeed, this.minXSpeed, this.maxXSpeed);
        this.ySpeed = constrain(this.ySpeed, -this.maxYSpeed, this.maxYSpeed);
    }
}
