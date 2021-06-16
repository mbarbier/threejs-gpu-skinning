import { Color, Group, Matrix4, MeshLambertMaterial, Scene, SkinnedMesh, Vector3 } from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { randInt } from "three/src/math/MathUtils";
import { GPUSkeleton } from "./GPUSkeleton";
import { GPUSkinnedMeshMaterialPatcher } from "./GPUSkinnedMeshMaterialPatcher";
import { InstancedSkinnedMesh } from "./InstancedSkinnedMesh";


export class CrowdManager {


    private instancedSkinnedMesh: InstancedSkinnedMesh;

    constructor(private scene: Scene) {


        // loading stickman https://sketchfab.com/3d-models/stickman-low-poly-12b31ea386ee4398a552d15c01615ae9

        const loader = new FBXLoader();
        // loader.load('assets/StandingClap.fbx', (object: Group) => {
        //     this.onAssetLoaded(object);
        // });
        loader.load('assets/Victory Idle.fbx', (object: Group) => {
            this.onAssetLoaded(object);
        });

    }

    private onAssetLoaded(fbx: Group) {

        // let mesh = fbx.getObjectByName("Alpha_Surface") as SkinnedMesh;
        let mesh: SkinnedMesh;
        fbx.traverse(o => {
            if (o instanceof SkinnedMesh) {
                mesh = o;
            }
        });

        // let material = mesh.material as MeshStandardMaterial;
        let material = new MeshLambertMaterial();
        let bones = mesh.skeleton.bones;

        let patch = new GPUSkinnedMeshMaterialPatcher(material);
        let skeleton = new GPUSkeleton(bones);
        skeleton.registerAnimation(fbx.animations[0]);
        skeleton.setMaterial(patch);


        let width = 75;
        let height = 20;

        this.instancedSkinnedMesh = new InstancedSkinnedMesh(mesh.geometry, material, width * height);
        this.instancedSkinnedMesh.bind(skeleton);

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
        let startx = -width * spacex / 2;


        let mat4 = new Matrix4();
        mat4.scale(new Vector3(0.005, 0.005, 0.005));
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                let index = y * width + x;
                mat4.setPosition(startx + x * spacex, starty + y * spacey, -y * spacez);
                this.instancedSkinnedMesh.setMatrixAt(index, mat4);
                this.instancedSkinnedMesh.setColorAt(index, colors[randInt(0, colors.length - 1)]);
                this.instancedSkinnedMesh.instancedSkeletonAnimationData[index].time = x * 0.05;
            }
        }

        this.scene.add(this.instancedSkinnedMesh);
    }

    update() {
        if (this.instancedSkinnedMesh != null) this.instancedSkinnedMesh.update();
    }

}