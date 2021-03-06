import { Color, Group, Matrix4, MeshLambertMaterial, Scene, SkinnedMesh, Vector3 } from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { randInt } from "three/src/math/MathUtils";
import { GPUSkeleton } from "./GPUSkeleton";
import { GPUSkinnedMeshMaterialPatcher } from "./GPUSkinnedMeshMaterialPatcher";
import { InstancedSkinnedMesh } from "./InstancedSkinnedMesh";


export class CrowdManager {

    private instancedSkinnedMesh: InstancedSkinnedMesh;
    private skeleton : GPUSkeleton;
    private mesh : SkinnedMesh;
    private material : MeshLambertMaterial;

    private onLoaded : () => void;

    constructor(private scene: Scene) {
        const loader = new FBXLoader();
        loader.load('assets/Victory Idle.fbx', (object: Group) => {
            this.onAssetLoaded(object);
        });
    }

    private onAssetLoaded(fbx: Group) {

        fbx.traverse(o => {
            if (o instanceof SkinnedMesh) {
                this.mesh = o;
            }
        });

        let bones = this.mesh.skeleton.bones;

        // Patch material to support GPU skinning
        this.material = new MeshLambertMaterial();
        let patch = new GPUSkinnedMeshMaterialPatcher(this.material);

        // Encode animation
        this.skeleton = new GPUSkeleton(bones);
        this.skeleton.registerAnimation(fbx.animations[0]);
        this.skeleton.setMaterial(patch);

        if(this.onLoaded != null) this.onLoaded();
    }

    update() {
        if (this.instancedSkinnedMesh != null) this.instancedSkinnedMesh.update();
    }


    rebuild(rows: number, columns: number) {
        if(this.skeleton == null) {
            this.onLoaded = () => {
                this.rebuild(rows, columns);
            }
            return;
        }

        if (this.instancedSkinnedMesh != null) {
            this.scene.remove(this.instancedSkinnedMesh);
        }

        // Spawn instance
        this.instancedSkinnedMesh = new InstancedSkinnedMesh(this.mesh.geometry, this.material, columns * rows);
        this.instancedSkinnedMesh.bind(this.skeleton, this.mesh.matrixWorld);

        let colors: Array<Color> = [];
        colors.push(new Color(0xffbe0b));
        colors.push(new Color(0xfb5607));
        colors.push(new Color(0xff006e));
        colors.push(new Color(0x8338ec));
        colors.push(new Color(0x3a86ff));

        let spacex = 1.1;
        let spacey = 1.1;
        let spacez = 1.1;

        let starty = 1.1;
        let startx = -columns * spacex / 2;

        let scale = new Vector3(1, 1, 1).multiplyScalar(0.005);
        let mat4 = new Matrix4();
        mat4.scale(scale);
        for (let x = 0; x < columns; x++) {
            for (let y = 0; y < rows; y++) {
                let index = y * columns + x;
                mat4.setPosition(startx + x * spacex, starty + y * spacey, -y * spacez);
                this.instancedSkinnedMesh.setMatrixAt(index, mat4);
                this.instancedSkinnedMesh.setColorAt(index, colors[randInt(0, colors.length - 1)]);

                 // shift animation start time for the hola effect
                this.instancedSkinnedMesh.instancedSkeletonAnimationData[index].time = x * 0.05;
            }
        }

        this.scene.add(this.instancedSkinnedMesh);
    }

}