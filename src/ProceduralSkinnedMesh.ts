import { Bone, CylinderGeometry, Float32BufferAttribute, Mesh, MeshLambertMaterial, Quaternion, Skeleton, SkinnedMesh, Uint16BufferAttribute, Vector3 } from "three";
import { GPUSkeleton } from "./GPUSkeleton";
import { GPUSkinnedMeshMaterialPatcher } from "./GPUSkinnedMeshMaterialPatcher";

export class ProceduralSkinnedMesh {

    mesh: Mesh;
    bones: Array<Bone>

    private ellapsed = 0;

    constructor() {

        const segmentHeight = 2;
        const segmentCount = 20;
        const height = segmentHeight * segmentCount;
        const halfHeight = height / 2;

        // Bones
        const bones: Array<Bone> = [];
        let prevBone = new Bone();
        bones.push(prevBone);
        prevBone.position.y = -halfHeight;
        for (let i = 0; i < segmentCount; i++) {
            const bone = new Bone();
            bone.position.y = segmentHeight;
            bones.push(bone);
            prevBone.add(bone);
            prevBone = bone;
        }


        // create the skin indices and skin weights
        const geometry = new CylinderGeometry(5, 5, height, 8, segmentCount);
        const position = geometry.attributes.position;

        const vertex = new Vector3();
        const skinIndices = [];
        const skinWeights = [];
        for (let i = 0; i < position.count; i++) {

            vertex.fromBufferAttribute(position, i);

            // compute skinIndex and skinWeight based on some configuration data
            const y = (vertex.y + halfHeight);
            const skinIndex = Math.floor(y / segmentHeight);
            const skinWeight = (y % segmentHeight) / segmentHeight;
            skinIndices.push(skinIndex, skinIndex + 1, 0, 0);
            skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
        }
        geometry.setAttribute('skinIndex', new Uint16BufferAttribute(skinIndices, 4));
        geometry.setAttribute('skinWeight', new Float32BufferAttribute(skinWeights, 4));

        // create skinned mesh and skeleton
        const mat = new MeshLambertMaterial({ color: 0xff0066 });
        const mesh = new SkinnedMesh(geometry, mat);
        const skeleton = new GPUSkeleton(bones);
        skeleton.buildAnimationTexture();

        // see example from THREE.Skeleton
        const rootBone = skeleton.bones[0];
        mesh.add(rootBone);

        // bind the skeleton to the mesh
        mesh.bind(skeleton);

        const shaderController = new GPUSkinnedMeshMaterialPatcher(mat, skeleton);

        this.mesh = mesh;
        this.bones = bones;
        this.shaderController = shaderController;
    }

    private shaderController: GPUSkinnedMeshMaterialPatcher;

    update(dt: number) {
        this.ellapsed += dt;

        this.mesh.position.x = Math.cos(this.ellapsed) * 50;
        this.mesh.rotateY(dt);

        if (this.shaderController != null) {
            this.shaderController.update(dt);
        }
        // let a = Math.cos(this.ellapsed) * 0.1;
        // let rotation = new Quaternion();
        // rotation.setFromAxisAngle(new Vector3(0, 0, 1), a);
        // this.bones.forEach(b => {
        //     b.quaternion.copy(rotation);
        // });
    }

}