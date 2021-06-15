import { Bone, DataTexture, FloatType, MathUtils, Matrix4, Quaternion, RGBAFormat, Skeleton, Vector3 } from "three";


const _offsetMatrix = new Matrix4();

export class GPUSkeleton extends Skeleton {

    public duration = 3;
    public fps = 30;
    public steps = this.duration * this.fps;

    constructor(bones: Bone[], boneInverses?: Matrix4[]) {
        super(bones, boneInverses);
    }

    buildAnimationTexture() {
        let rootBone = this.bones[0];
        while (rootBone.parent != null && rootBone.parent instanceof Bone) {
            rootBone = rootBone.parent;
        }

        this.boneMatrices = new Float32Array(this.bones.length * 16 * this.steps);

        for (let s = 0; s < this.steps; s++) {
            let time = s * (1 / this.fps);

            let a = Math.cos(time) * 0.1;
            let rotation = new Quaternion();
            rotation.setFromAxisAngle(new Vector3(0, 0, 1), a);
            this.bones.forEach(b => {
                b.quaternion.copy(rotation);
            });
            rootBone.updateMatrixWorld(true);


            for (let b = 0; b < this.bones.length; b++) {
                const matrix = this.bones[b].matrixWorld;
                _offsetMatrix.multiplyMatrices(matrix, this.boneInverses[b]);
                _offsetMatrix.toArray(this.boneMatrices, (s * this.bones.length + b) * 16);
            }
        }


        // Compute/update texture
        let size = Math.sqrt(this.bones.length * this.steps * 4); // 4 pixels needed for 1 matrix
        size = MathUtils.ceilPowerOfTwo(size);
        size = Math.max(size, 4);

        const boneMatrices = new Float32Array(size * size * 4); // 4 floats per RGBA pixel
        boneMatrices.set(this.boneMatrices); // copy current values

        const boneTexture = new DataTexture(boneMatrices, size, size, RGBAFormat, FloatType);
        boneTexture.needsUpdate = true;

        this.boneMatrices = boneMatrices;
        this.boneTexture = boneTexture;
        this.boneTextureSize = size;
    }

    update() {
        // do  nothing
        // for (let i = 0, il = this.bones.length; i < il; i++) {
        //     const matrix = this.bones[i].matrixWorld;
        //     _offsetMatrix.multiplyMatrices(matrix, this.boneInverses[i]);
        //     _offsetMatrix.toArray(this.boneMatrices, i * 16);
        // }
        // this.boneTexture.needsUpdate = true;
    }

}