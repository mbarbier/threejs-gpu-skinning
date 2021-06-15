import { AnimationMixer, AxesHelper, Color, DirectionalLight, Fog, Group, HemisphereLight, Material, MathUtils, Mesh, MeshLambertMaterial, MeshPhongMaterial, PerspectiveCamera, PlaneGeometry, Scene, Skeleton, SkinnedMesh, TextureLoader, WebGLRenderer } from "three";

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { ProceduralSkinnedMesh } from "./ProceduralSkinnedMesh";


export type BodyPartInfo = {
    meshes: Array<SkinnedMesh>,
    guiElement: HTMLElement,
    current: number,
}

export class SharedSkeletonScene {

    private camera: PerspectiveCamera;
    private scene: Scene;
    private renderer: WebGLRenderer;

    private mixer: AnimationMixer;

    private sharedSkeleton: Skeleton;
    private characterMaterial: Material;

    private character: Group;
    private bodyParts: Array<BodyPartInfo> = [];

    constructor() {

        const self = this;
        const container = document.createElement('div');
        document.body.appendChild(container);

        // setup scene and camera
        this.camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
        this.camera.near = 0.1;
        this.camera.far = 2000;
        this.camera.position.set(100, 200, 300);

        this.scene = new Scene();
        this.scene.background = new Color(0xa0a0a0);
        this.scene.fog = new Fog(0xa0a0a0, 500, 1000);

        // renderer
        this.renderer = new WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        container.appendChild(this.renderer.domElement);

        window.addEventListener('resize', this.onWindowResize.bind(this));

        // controls
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        controls.target.set(0, 100, 0);
        controls.update();

        // lights
        const hemiLight = new HemisphereLight(0xffffff, 0x444444);
        hemiLight.position.set(0, 200, 0);
        this.scene.add(hemiLight);

        const dirLight = new DirectionalLight(0xffffff);
        dirLight.position.set(0, 200, 100);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 180;
        dirLight.shadow.camera.bottom = - 100;
        dirLight.shadow.camera.left = - 120;
        dirLight.shadow.camera.right = 120;
        this.scene.add(dirLight);

        // ground
        const mesh = new Mesh(new PlaneGeometry(2000, 2000), new MeshPhongMaterial({ color: 0x999999, depthWrite: false }));
        mesh.rotation.x = - Math.PI / 2;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        // const loader = new FBXLoader();
        // loader.load('assets/StandingClap.fbx', function (object: Group) {
        //     self.onAssetLoaded(object);
        // });
        this.procSkinnedMesh = new ProceduralSkinnedMesh();
        // this.procSkinnedMesh.mesh.position.set(150, 55, -29);
        //this.procSkinnedMesh.mesh.rotateY(40 * MathUtils.DEG2RAD);
        this.scene.add(this.procSkinnedMesh.mesh);

        let axe = new AxesHelper(100);
        this.scene.add(axe);
    }

    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private procSkinnedMesh: ProceduralSkinnedMesh;

    update(dt: number) {

        if (this.mixer != null) {
            this.mixer.update(dt);
        }
        if (this.procSkinnedMesh != null) {
            this.procSkinnedMesh.update(dt);
        }

        this.renderer.render(this.scene, this.camera);
    }


    // private onAssetLoaded(fbx: Group) {

    //     fbx.traverse(o => {
    //         if (o instanceof SkinnedMesh) {
    //             console.log("skinned mesh: " + o);
    //         }
    //     })

    //     this.scene.add(fbx);
    //     this.mixer = new AnimationMixer(fbx);

    //     const action = this.mixer.clipAction(fbx.animations[0]);
    //     action.play();
    // }



}