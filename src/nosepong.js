import 'p5';

let video1, video2;
let faceMesh1, faceMesh2;
let vidW, vidH;
let player1, player2, winner;
let defaultWebcamWidth, defaultWebcamHeight, showWebcam;
let sunglasses, sadEyes, carhorn, goose, clown;
let currentState;
let ball = null;
let ballUpdateTs = 0;
let numPlayersDetected = 0;
let paddleW, paddleH;
let canPlay = false;
let canPlayTs = 0;
let now = 0;
let elapsed;
let buttons = [];
let playerZoneWidth;

let debug = false;
let paddleHeightRatio = 0.1;
let paddleShapeRatio = 0.5;
let canvasWidth = null; //1280;
let canvasHeight = null; //800;
let playerZoneWidthRatio = 0.25;
let paddleLerp = 0.4;
let targetScore = 5;

let faces = [null, null];

let noseEmoji = '👃';
let pigNoseEmoji = '🐽';

const PlayerColor = Object.freeze({
    RED: 'red',
    BLUE: 'blue'
});

const GameState = Object.freeze({
    ATTRACT: Symbol('attract'),
    CALIBRATE: Symbol('calibrate'),
    PLAY: Symbol('play'),
});

const PlaySubstate = Object.freeze({
    PLAY: Symbol('play'),
    GETREADY: Symbol('getready'),
    SCORE: Symbol('score'),
    GAMEOVER: Symbol('gameover')
});

function preload() {
    faceMesh1 = ml5.faceMesh({ maxFaces: 2, flipped: true });
    faceMesh2 = ml5.faceMesh({ maxFaces: 2, flipped: true });

    video1 = createCapture(VIDEO);
    video1.hide();
    video2 = createCapture(VIDEO);
    video2.hide();

    sunglasses = loadImage('sunglasses.png');
    sadEyes = loadImage('sadAnimeEyes.png');

    carhorn = loadSound('carhorn.mp3');
    goose = loadSound('goose.mp3');
    clown = loadSound('clown.mp3');
}

function setup() {
    let w = canvasWidth ? canvasWidth : windowWidth;
    let h = canvasHeight ? canvasHeight : windowHeight;

    let canvas = createCanvas(w, h);
    canvas.isHidden = false;

    playerZoneWidth = width * playerZoneWidthRatio;

    paddleH = height * paddleHeightRatio;
    paddleW = paddleH * paddleShapeRatio;

    faceMesh1.detectStart(video1, (results) => { gotFaces(results, 0); });
    faceMesh2.detectStart(video2, (results) => { gotFaces(results, 1); });


    player1 = new Player(new Face(0), PlayerColor.RED, video1, playerZoneWidth / 2, height / 2);
    player2 = new Player(new Face(1), PlayerColor.BLUE, video2, width - playerZoneWidth / 2, height / 2);

    currentState = GameState.ATTRACT;

    if (debug) makeDebugButtons();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

console.log("outside");
function draw() {
    console.log("inside");
    background(0);

    if (checkShowWebcam()) return;

    detectPlayers();

    switch (currentState) {
        case GameState.ATTRACT:
            drawAttract();
            break;
        case GameState.PLAY:
            drawPlay();
            break;
    }
}

function detectPlayers() {
    now = millis();
    numPlayersDetected = faces.filter((face) => face).length;
    if (numPlayersDetected == 2 && canPlay == false) {
        canPlay = true;
        canPlayTs = now;
    }
    if (numPlayersDetected < 2 && canPlay == true) {
        canPlay = false;
        canPlayTs = now;
    }
}

function drawAttract() {
    drawAttract.box = (drawAttract.box || new Nosebox(
        20, width / 2, height / 5 - 20, 660, 170
    ));

    let canvasAspectRatio = width / height;
    let videoAspectRatio = video1.width / video1.height;

    let x = 0;
    let y = 0;
    let w, h;

    if (videoAspectRatio > canvasAspectRatio) {
        w = width;
        h = video1.height * width / video1.width;
    }
    else {
        w = video1.width * height / video1.height;
        h = height;
    }

    elapsed = now - canPlayTs;

    let msg = '';

    const holdMs = debug ? 100 : 2000;
    const countdownSeconds = debug ? 1 : 3;
    const countdownMs = countdownSeconds * 1000;
    const welcomeMs = debug ? 500 : 4000;

    if (!canPlay || (canPlay && consume(holdMs)))
        // msg = `PLAYERS DETECTED: ${numPlayersDetected}`;
        msg = "A GAME FOR TWO\nPLAYERS WELCOME\nTAKE A SEAT TO JOIN";
    else if (consume(countdownMs)) {
        let remaining = countdownSeconds - Math.floor((elapsed) / 1000);
        msg = `GAME STARTING IN: ${remaining}`;
    }
    else if (consume(welcomeMs)) {
        msg = `WELCOME TO NOSEPONG.\nFIRST TO ${targetScore} WINS!`;
    }
    else {
        currentState = GameState.CALIBRATE;
        defaultWebcamWidth = video1.width;
        defaultWebcamHeight = video1.height;
        // ballUpdateTs = now;
        calibrate();
        return;
    }


    push();
    imageMode(CORNER);

    push();
    translate(w + (width - w) / 2, 0);
    scale(-1, 1);
    image(video1, x, y, w, h);
    pop();

    strokeJoin(ROUND);
    stroke('black');
    strokeWeight(5);
    fill('white');
    textSize(100);
    textAlign(CENTER);
    text('NOSEPONG', width / 2, height / 5);
    textSize(40);
    strokeWeight(5);
    textStyle(BOLD);
    text(msg, width / 2, height / 2);
    textSize(34);
    strokeWeight(5);
    textStyle(ITALIC);
    text('"It\'s pong played with your nose"', width / 2, height * 7 / 8);
    pop();

    drawAttract.box.draw();
}

function drawPlay() {
    drawPlay.state = (drawPlay.state || {
        substate: null,
        stateChangedAt: null,
        stateDuration: null
    });

    push();
    stroke(255);
    strokeWeight(3);
    // drawingContext.setLineDash([height/40, height/40])
    line(width / 2, 0, width / 2, height);
    pop();

    player1.draw();
    player2.draw();

    textAlign(CENTER);
    textSize(64);
    fill(255);

    let hsbValue = (frameCount * 5) % 255;

    push();
    if (player1.score >= targetScore - 1) {
        colorMode(HSB);
        fill(hsbValue, 100, 100);
    }
    text(player1.score, width / 2 - playerZoneWidth / 2, height / 8);
    pop();

    push();
    if (player2.score >= targetScore - 1) {
        colorMode(HSB);
        fill(hsbValue, 100, 100);
    }
    text(player2.score, width / 2 + playerZoneWidth / 2, height / 8);
    pop();

    let msg = '';
    let elapsedTime = now - drawPlay.state.stateChangedAt;

    push();
    switch (drawPlay.state.substate) {
        case PlaySubstate.PLAY:
            let scored = false;
            if (ball.x > width + ball.d) {
                scored = true;
                player1.score++;
                player1.hasSunglasses = true;
                player2.hasSadEyes = true;
                ball = null;
                ballUpdateTs = now;
                winner = player1;
            }
            else if (ball.x < 0 - ball.d) {
                scored = true;
                player2.score++;
                player1.hasSadEyes = true;
                player2.hasSunglasses = true;
                ball = null;
                ballUpdateTs = now;
                winner = player2;
            }
            else ball.draw();
            if (scored) {
                if (max(player1.score, player2.score) == targetScore) {
                    drawPlay.state = {
                        substate: PlaySubstate.GAMEOVER,
                        stateChangedAt: now,
                        stateDuration: debug ? 1000 : 3000
                    };
                } else {
                    drawPlay.state = {
                        substate: PlaySubstate.SCORE,
                        stateChangedAt: now,
                        stateDuration: debug ? 1000 : 3000
                    };
                }
            }
            break;
        case PlaySubstate.GETREADY:
            if (elapsedTime > drawPlay.state.stateDuration) {
                ball = new Ball();
                drawPlay.state = {
                    substate: PlaySubstate.PLAY,
                    stateChangedAt: now,
                    stateDuration: null
                };
            }
            else msg = 'GET READY!';
            break;
        case PlaySubstate.SCORE:
            if (elapsedTime > drawPlay.state.stateDuration) {
                ball = null;
                player1.resetCosmetics();
                player2.resetCosmetics();
                drawPlay.state = {
                    substate: PlaySubstate.GETREADY,
                    stateChangedAt: now,
                    stateDuration: 2000
                };
            }
            else msg = `${winner.color.toUpperCase()} SCORED!`;
            break;
        case PlaySubstate.GAMEOVER:
            if (elapsedTime > drawPlay.state.stateDuration)
                resetGame();
            else {
                fill(winner.color);
                msg = `${winner.color.toUpperCase()} WINS!\nTHEIR NOSE KNOWS!`;
            }
    }
    text(msg, width / 2, height / 2);
    pop();
}


function gotFaces(results, faceIx) {
    if (results.length == 0) { faces[faceIx] = null; return; }
    if (results.length == 1 && faceIx == 1 && !debug) { faces[1] = null; return; }

    results.sort((a, b) => {
        if (a.faceOval.centerX < b.faceOval.centerX) {
            return -1;
        } else return 1;
    });

    let resultIx = min(results.length - 1, faceIx);
    faces[faceIx] = results[resultIx];
}

function calibrate() {
    showWebcam = false;
    player1.scale();
    player2.scale();
    let timeoutLen = 500;
    setTimeout(() => {
        player1.translate();
        player2.translate();
        currentState = GameState.PLAY;
        drawPlay.state = {
            substate: PlaySubstate.GETREADY,
            stateChangedAt: now + timeoutLen,
            stateDuration: debug ? 100 : 1000,
        };
    }, timeoutLen);
}

function identifyKeypoints(offset = 0) {
    textSize(8);
    let face = faces[0];
    if (!face) return;
    for (let i = 0; i < face.keypoints.length; i++) {
        let keypoint = face.keypoints[i];
        text(i, keypoint.x + offset, keypoint.y);
    }
}

function consume(ms) {
    if (elapsed < ms) return true;
    elapsed -= ms;
    return;
}

function resetGame() {
    player1.reset();
    player2.reset();
    winner = null;
    currentState = GameState.ATTRACT;
    canPlay = false;
    canPlayTs = now;
}

function makeDebugButtons() {
    calibrateBtn = createButton('calibrate');
    calibrateBtn.position(10, height + 10);
    calibrateBtn.mousePressed(calibrate);

    ballBtn = createButton('new ball');
    ballBtn.position(calibrateBtn.x + calibrateBtn.width + 10, height + 10);
    ballBtn.mousePressed(() => { ball = new Ball(); });

    toggleFullWebcamBtn = createButton('toggle full webcam view');
    toggleFullWebcamBtn.position(ballBtn.x + ballBtn.width + 10, height + 10);
    toggleFullWebcamBtn.mousePressed(() => {
        if (canvas.isHidden) { canvas.show(); video1.hide(); }
        else { canvas.hide(); video1.size(w, h); video1.show(); }
        canvas.isHidden = !canvas.isHidden;
    });

    buttons.push(...[calibrateBtn, ballBtn, toggleFullWebcamBtn]);

}

function debugLog(msg) {
    if (debug) console.log(msg);
}

function checkShowWebcam() {
    if (!showWebcam) return false;
    let heightRatio = height / defaultWebcamHeight;
    video1.size(defaultWebcamWidth * heightRatio, height);
    push();
    translate(video1.width / 2 + width / 2, 0);
    scale(-1, 1);
    image(video1, 0, 0);
    pop();

    push();
    translate(500);
    pop();
    return true;
}

function mousePressed() {
    if (mouseButton !== LEFT) return;
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        let fs = fullscreen();
        fullscreen(!fs);
    }
}

class Player {
    constructor(face, color, video, centerX, centerY) {
        this.face = face;
        this.color = color;
        this.video = video;
        this.centerX = centerX;
        this.centerY = centerY;

        this.score = 0;

        this.tx = 0;
        this.ty = 0;

        this.noseX = null;
        this.noseY = null;
        this.lastX = null;
        this.lastY = null;

        this.sizeMult = 1;
        this.truePaddleWidth = paddleW;
        this.truePaddleHeight = paddleH;

        this.hasSunglasses = false;
        this.hasSadEyes = false;

        this.Sides = Object.freeze({
            LEFT: Symbol('left'),
            RIGHT: Symbol('right'),
            TOP: Symbol('top'),
            BOTTOM: Symbol('bottom')
        });

    }

    draw() {
        push();
        clip(() => rect(this.centerX - playerZoneWidth / 2, this.centerY / height / 2, playerZoneWidth, height));
        rectMode(CORNER);
        push();
        translate(this.video.width + this.tx, this.ty);
        scale(-1, 1);
        image(this.video, 0, 0);
        pop();
        // push();
        // translate(this.tx, this.ty);
        // identifyKeypoints();
        // pop();

        this.truePaddleWidth = paddleW * this.sizeMult;
        this.truePaddleHeight = paddleH * this.sizeMult;

        let nose = this.face.nose();
        if (nose) {
            this.lastX = this.noseX;
            this.lastY = this.noseY;

            let xLo = this.centerX - playerZoneWidth / 2 + this.truePaddleWidth / 2;
            let xHi = this.centerX + playerZoneWidth / 2 - this.truePaddleWidth / 2;
            this.noseX = constrain(this.tx + nose.x, xLo, xHi);
            if (this.lastX) this.noseX = lerp(this.lastX, this.noseX, paddleLerp);

            let yLo = this.truePaddleHeight / 2;
            let yHi = height - this.truePaddleHeight / 2;
            this.noseY = constrain(this.ty + nose.y, yLo, yHi);
            if (this.lastY) this.noseY = lerp(this.lastY, this.noseY, paddleLerp);
        }
        else {
            this.noseX = this.lastX;
            this.noseY = this.lastY;
        };

        push();
        rectMode(CENTER);
        fill(this.color);
        rect(this.noseX, this.noseY, this.truePaddleWidth, this.truePaddleHeight);
        pop();

        let face = this.face.face();
        let faceOval = this.face.faceOval();

        if (!face || !faceOval) { pop(); return; }

        let mouthSizeRatio = (face.keypoints[14].y - face.keypoints[13].y)/height
        this.sizeMult = map(mouthSizeRatio, 0, 0.2, 1, 1.3)

        if (this.hasSunglasses) {
            let x = this.tx + faceOval.centerX;
            let y = this.ty + (face.leftEye.centerY + face.rightEye.centerY) / 2;
            let sunglassesW = face.keypoints[356].x - face.keypoints[93].x;
            let sunglassesH = face.keypoints[5].y - face.keypoints[151].y;
            imageMode(CENTER);
            image(sunglasses, x, y, sunglassesW, sunglassesH);
        }
        else if (this.hasSadEyes) {
            let x = this.noseX;
            let y = this.ty + (face.leftEye.centerY + face.rightEye.centerY) / 2;
            let eyesW = faceOval.width * 0.91;
            let eyesH = face.keypoints[1].y - face.keypoints[151].y;
            imageMode(CENTER);
            image(sadEyes, x, y, eyesW, eyesH);
        }
        pop();
    }

    calibrate() {
        this.scale();
        setTimeout(() => this.translate(), 500);
    }

    scale() {
        let faceOval = this.face.faceOval();
        let faceScale = (height * 0.9) / faceOval.height;
        this.video.size(this.video.width * faceScale, this.video.height * faceScale);
    }

    translate() {
        let nose = this.face.nose();
        this.lastNose = nose;

        this.tx = this.centerX - nose.x;
        this.ty = this.centerY - nose.y - 30;
    }


    xVel() {
        return this.noseX - this.lastX;
    }

    yVel() {
        return this.noseY - this.lastY;
    }

    reset() {
        this.score = 0;
        this.video.size(defaultWebcamWidth, defaultWebcamHeight);
        this.resetCosmetics();

    }

    resetCosmetics() {
        this.hasSadEyes = false;
        this.hasSunglasses = false;
    }
}

class Face {
    constructor(faceIx) {
        this.faceIx = faceIx;
    }

    face() {
        return faces[this.faceIx];
    }

    nose() {
        let face = this.face();
        if (face) return face.keypoints[4];
        else return null;
    }

    faceOval() {
        let face = this.face();
        if (face) return face.faceOval;
        else return null;
    }
}

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

class Nosebox {
    constructor(numNoses, x, y, w, h) {
        this.numNoses = numNoses;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;

        this.perimeter = this.w * 2 + this.h * 2;
        this.positions = [];
        this.secondsPerOrbit = this.numNoses;

        this.rotation = 0;
        this.rotIncr = 0.01;
        this.maxRot = PI / 8;
        
        this.char = noseEmoji;

        for (let i = 0; i < numNoses; i++) {
            this.positions.push(this.perimeter * i / this.numNoses);
        }
    }

    draw() {
        let positionIncr = frameRate() ? this.perimeter / (this.secondsPerOrbit * frameRate()) : 0;
        let x, y;

        if (abs(this.rotation + this.rotIncr) >= this.maxRot) this.rotIncr *= -1;
        this.rotation += this.rotIncr;

        this.positions = this.positions.map(pos => (pos + positionIncr) % this.perimeter);

        this.positions.forEach(pos => {
            // top
            if (pos < this.w) {
                let offset = pos;
                x = this.x - this.w / 2 + offset;
                y = this.y - this.h / 2;
            }
            // right side
            else if (pos < this.w + this.h) {
                let offset = pos - this.w;
                x = this.x + this.w / 2;
                y = this.y - this.h / 2 + offset;
            }
            // bottom
            else if (pos < this.w * 2 + this.h) {
                let offset = pos - this.w - this.h;
                x = this.x + this.w / 2 - offset;
                y = this.y + this.h / 2;
            }
            // left side
            else {
                let offset = pos - this.w * 2 - this.h;
                x = this.x - this.w / 2;
                y = this.y + this.h / 2 - offset;
            }
            push();
            textSize(48);
            textAlign(CENTER);
            translate(x, y);
            rotate(this.rotation);
            text(this.char, 0, 0);
            pop();

            if (this.char == noseEmoji) this.char = pigNoseEmoji;
            else this.char = noseEmoji;
        });
    }
}
