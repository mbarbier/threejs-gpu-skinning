import { BufferGeometry, InstancedBufferAttribute, InstancedMesh, Material, MathUtils, Matrix4 } from "three";
import { GPUSkeleton } from "./GPUSkeleton";
import { Time } from "./Time";

export class InstancedSkinnedMesh<TGeometry extends BufferGeometry = BufferGeometry, TMaterial extends Material | Material[] = Material | Material[]> extends InstancedMesh {

    public readonly isSkinnedMesh = true;
    public readonly bindMode = "detached";

    public readonly bindMatrix = new Matrix4();
    public readonly bindMatrixInverse = new Matrix4();


    public skeleton: GPUSkeleton;

    public instancedSkeletonAnimationData: Array<InstancedSkeletonData> = [];
    private instanceFrameData: InstancedBufferAttribute;


    constructor(geometry: TGeometry, material: TMaterial, count: number) {
        super(geometry, material, count);

        this.instanceFrameData = new InstancedBufferAttribute(new Float32Array(this.count * 3), 3);

        geometry.attributes["instanceFrameData"] = this.instanceFrameData;

    }

    public bind(skeleton: GPUSkeleton) {
        this.skeleton = skeleton;

        for (let i = 0; i < this.count; i++) {
            this.instancedSkeletonAnimationData.push(new InstancedSkeletonData(i, this, skeleton));
        }
    }

    public setFrameDataAt(index: number, frame: number, nextFrame: number, lerp: number) {
        this.instanceFrameData.setXYZ(index, frame, nextFrame, lerp);
        this.instanceFrameData.needsUpdate = true;
    }

    update() {
        for (let i = 0; i < this.count; i++) {
            this.instancedSkeletonAnimationData[i].update();
        }
    }
}


export class InstancedSkeletonData {
    public playing = true;
    public time = 0;

    constructor(public index: number, public mesh: InstancedSkinnedMesh, public skeleton: GPUSkeleton) {
    }

    update() {
        let dt = Time.deltaTime;

        this.time += dt;
        this.time = MathUtils.clamp(this.time - Math.floor(this.time / this.skeleton.duration) * this.skeleton.duration, 0, this.skeleton.duration);

        let frame = Math.floor(this.time * this.skeleton.fps);
        frame = frame % this.skeleton.steps;

        let nextFrame = 0;
        let frameLerp = 0;
        if (this.skeleton.interpolateFrame) {

            nextFrame = (frame + 1) % this.skeleton.steps;
            let frameTime = frame * (1 / this.skeleton.fps);
            let nextFrameTime = nextFrame * (1 / this.skeleton.fps);
            frameLerp = MathUtils.inverseLerp(frameTime, nextFrameTime, this.time);
            frameLerp = MathUtils.clamp(frameLerp, 0, 1);
        }

        this.mesh.setFrameDataAt(this.index, frame, nextFrame, frameLerp);
    }
}