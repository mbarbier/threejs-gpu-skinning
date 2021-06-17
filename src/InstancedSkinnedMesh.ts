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

    private debugAnim = false;

    constructor(geometry: TGeometry, material: TMaterial, count: number) {
        super(geometry, material, count);

        this.instanceFrameData = new InstancedBufferAttribute(new Float32Array(this.count), 1);

        geometry.attributes["instanceFrameData"] = this.instanceFrameData;


        if (this.debugAnim) {
            let forceFrameFn = (frame: number) => {
                frame = MathUtils.euclideanModulo(frame, this.skeleton.steps);
                for (let i = 0; i < this.count; i++) {
                    this.instancedSkeletonAnimationData[i].mesh.setFrameDataAt(i, frame);
                }
                console.log("show frame: " + frame);
            }

            let debugFrame = 0;
            document.addEventListener("keydown", (ev) => {
                if (ev.key == "ArrowLeft") {
                    debugFrame--;
                    forceFrameFn(debugFrame);
                }
                if (ev.key == "ArrowRight") {
                    debugFrame++;
                    forceFrameFn(debugFrame);
                }
            });
        }
    }

    public bind(skeleton: GPUSkeleton, bindMatrix: Matrix4) {
        this.skeleton = skeleton;

        this.bindMatrix.copy(bindMatrix);
        this.bindMatrixInverse.copy(bindMatrix).invert();

        for (let i = 0; i < this.count; i++) {
            this.instancedSkeletonAnimationData.push(new InstancedSkeletonData(i, this, skeleton));
        }
    }

    public setFrameDataAt(index: number, frame: number) {
        this.instanceFrameData.setX(index, frame);
        this.instanceFrameData.needsUpdate = true;
    }

    update() {

        if (this.debugAnim) return;

        for (let i = 0; i < this.count; i++) {
            this.instancedSkeletonAnimationData[i].update();
        }
    }
}


// Keep track of passed time for each instance
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

        this.mesh.setFrameDataAt(this.index, frame);
    }
}