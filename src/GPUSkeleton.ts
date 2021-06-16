import { AnimationClip, AnimationMixer, Bone, DataTexture, FloatType, MathUtils, Matrix4, RGBAFormat, Skeleton } from "three";
import { GPUSkinnedMeshMaterialPatcher } from "./GPUSkinnedMeshMaterialPatcher";
import { Time } from "./Time";


const _offsetMatrix = new Matrix4();

export class GPUSkeleton extends Skeleton {

    public fps = 60;
    public interpolateFrame = false;

    public duration = 0;
    public steps = 0;

    private ellapsed = 0;

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

        let animAction = mixer.clipAction(clip);
        animAction.play();

        this.duration = clip.duration;
        this.steps = Math.floor(this.duration * this.fps);

        this.boneMatrices = new Float32Array(this.bones.length * 16 * this.steps);

        for (let s = 0; s < this.steps; s++) {
            mixer.update(1 / this.fps);

            this.rootBone.updateMatrixWorld(true);

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
        let dt = Time.deltaTime;

        this.ellapsed += dt;
        this.ellapsed = MathUtils.clamp(this.ellapsed - Math.floor(this.ellapsed / this.duration) * this.duration, 0, this.duration);

        let frame = Math.floor(this.ellapsed * this.fps);
        frame = frame % this.steps;

        let nextFrame = (frame + 1) % this.steps;

        let frameTime = frame * (1 / this.fps);
        let nextFrameTime = nextFrame * (1 / this.fps);
        let frameLerp = MathUtils.inverseLerp(frameTime, nextFrameTime, this.ellapsed);
        frameLerp = MathUtils.clamp(frameLerp, 0, 1);

        this.material.currentStep = frame;
        this.material.nextStep = nextFrame;
        this.material.stepLerp = frameLerp;
    }

    
}