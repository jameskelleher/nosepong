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

        console.log(frameRate());

        this.rotation = 0;
        this.rotIncr = 0.01;
        this.maxRot = PI / 8;
        
        this.char = noseEmoji;

        for (let i = 0; i < numNoses; i++) {
            this.positions.push(this.perimeter * i / this.numNoses)
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