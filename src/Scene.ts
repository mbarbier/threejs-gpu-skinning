import {  Color, DirectionalLight, HemisphereLight, Mesh, MeshPhongMaterial, PerspectiveCamera, PlaneGeometry, Scene, WebGLRenderer } from "three";

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CrowdManager } from "./CrowdManager";


export class SharedSkeletonScene {

    private camera: PerspectiveCamera;
    private scene: Scene;
    private renderer: WebGLRenderer;

    private crowdManager: CrowdManager;

    constructor() {

        const container = document.createElement('div');
        document.body.appendChild(container);

        // setup scene and camera
        this.camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
        this.camera.near = 0.1;
        this.camera.far = 2000;
        this.camera.position.set(100, 200, 300);

        this.scene = new Scene();
        this.scene.background = new Color(0xa0a0a0);
        // this.scene.fog = new Fog(0xa0a0a0, 500, 1000);

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

        
        this.crowdManager = new CrowdManager(this.scene);
    }
    
    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    update() {
        this.crowdManager.update();
        this.renderer.render(this.scene, this.camera);
    }

}