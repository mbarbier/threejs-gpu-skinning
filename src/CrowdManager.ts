import { Group, Matrix4, MeshStandardMaterial, Scene, SkinnedMesh } from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { GPUSkeleton } from "./GPUSkeleton";
import { GPUSkinnedMeshMaterialPatcher } from "./GPUSkinnedMeshMaterialPatcher";


export class CrowdManager {

    constructor(private scene: Scene) {


        const loader = new FBXLoader();
        loader.load('assets/StandingClap.fbx', (object: Group) => {
            this.onAssetLoaded(object);
        });


    }

    private onAssetLoaded(fbx: Group) {

        let mesh = fbx.getObjectByName("Alpha_Surface") as SkinnedMesh;
        let mat = mesh.material as MeshStandardMaterial;
        let bones = mesh.skeleton.bones;

        let shaderController = new GPUSkinnedMeshMaterialPatcher(mat);
        let skeleton = new GPUSkeleton(bones);
        skeleton.registerAnimation(fbx.animations[0]);
        skeleton.setMaterial(shaderController);

        mesh.bind(skeleton, new Matrix4());
        mesh.bindMode = "detached";

        this.scene.add(mesh);
    }

    update() {

    }

}