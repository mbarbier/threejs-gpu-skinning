import { AnimationClip, AnimationMixer, Bone, DataTexture, FloatType, MathUtils, Matrix4, RGBAFormat, Skeleton } from "three";
import { GPUSkinnedMeshMaterialPatcher } from "./GPUSkinnedMeshMaterialPatcher";


const _offsetMatrix = new Matrix4();

export class GPUSkeleton extends Skeleton {

    public fps = 60;
    public interpolateFrame = false;

    public duration = 0;
    public steps = 0;


    private rootBone: Bone;
    private material: GPUSkinnedMeshMaterialPatcher;

    constructor(bones: Bone[], boneInverses?: Matrix4[]) {
        super(bones, boneInverses);

        this.rootBone = this.bones[0];
        while (this.rootBone.parent != null && this.rootBone.parent instanceof Bone) {
            this.rootBone = this.rootBone.parent;
        }
    }

    setMaterial(m: GPUSkinnedMeshMaterialPatcher) {
        this.material = m;
        this.material.patchShader(this);
    }

    registerAnimation(clip: AnimationClip) {
        let mixer = new AnimationMixer(this.rootBone);

        clip.optimize();

        let animAction = mixer.clipAction(clip);
        animAction.play();

        this.duration = clip.duration;
        this.steps = Math.ceil(this.duration * this.fps);

        this.boneMatrices = new Float32Array(this.bones.length * 16 * this.steps);

        let stepDuration = 1 / this.fps;
        mixer.update(0);
        for (let s = 0; s < this.steps; s++) {
            mixer.update(stepDuration);

            this.rootBone.updateMatrixWorld(true);

            // Compute for each animation step the bones matrices
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
        // no need for super.update()
    }


}