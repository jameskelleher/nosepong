
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
