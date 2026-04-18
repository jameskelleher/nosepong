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
