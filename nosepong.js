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

    sunglasses = loadImage('media/sunglasses.png');
    sadEyes = loadImage('media/sadAnimeEyes.png');

    carhorn = loadSound('media/carhorn.mp3');
    goose = loadSound('media/goose.mp3');
    clown = loadSound('media/clown.mp3');
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

    if (debug) makeDebugButtons;

    // showWebcam = true;

}

function windowResized() {
    let w = canvasWidth ? canvasWidth : windowWidth;
    let h = canvasHeight ? canvasHeight : windowHeight;

    resizeCanvas(w, h);
}


function draw() {
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
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        let fs = fullscreen();
        fullscreen(!fs);
    }
}
// let lineCount = 0;
// let emojiW = 20;
// for (let y = 0; y < height; y += height / 37) {
//     let xOffset = lineCount % 2 == 0 ? 0 : off;
//     lineCount++;
//     for (let x = playerZoneWidth; x < width - playerZoneWidth + emojiW; x += (width - playerZoneWidth * 2) / 15) {
//         text(noseEmoji, x + xOffset, y);
//     }
// }