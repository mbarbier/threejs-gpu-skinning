import { Color, DirectionalLight, HemisphereLight, Mesh, MeshPhongMaterial, PerspectiveCamera, PlaneGeometry, Scene, WebGLRenderer } from "three";

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CrowdManager } from "./CrowdManager";

import { GUI } from 'dat.gui';

export class SharedSkeletonScene {

    private camera: PerspectiveCamera;
    private scene: Scene;
    private crowdManager: CrowdManager;

    private rowCount = 20;
    private columnCount = 75;

    renderer: WebGLRenderer;

    constructor() {

        const gui = new GUI();
        gui.add(this, 'rows', 1, 50, 1);
        gui.add(this, 'columns', 10, 200, 10);

        const container = document.createElement('div');
        document.body.appendChild(container);

        // setup scene and camera
        this.camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
        this.camera.near = 0.1;
        this.camera.far = 1000;
        this.camera.position.set(0, 8, 25);

        this.scene = new Scene();
        this.scene.background = new Color(0xa0a0a0);

        // renderer
        this.renderer = new WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(this.renderer.domElement);

        window.addEventListener('resize', this.onWindowResize.bind(this));

        // controls
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        controls.target.set(0, 10, 0);
        controls.update();

        // lights
        const hemiLight = new HemisphereLight(0xffffff, 0x444444);
        hemiLight.position.set(0, 200, 0);
        this.scene.add(hemiLight);

        const dirLight = new DirectionalLight(0xffffff);
        dirLight.position.set(0, 200, 100);
        this.scene.add(dirLight);

        // ground
        const mesh = new Mesh(new PlaneGeometry(200, 50), new MeshPhongMaterial({ color: 0x999999 }));
        mesh.rotation.x = - Math.PI / 2;
        this.scene.add(mesh);

        this.crowdManager = new CrowdManager(this.scene);
        this.crowdManager.rebuild(this.rowCount, this.columnCount);

        (window as any)["_scene"] = this;
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

    get rows(): number {
        return this.rowCount;
    }
    set rows(r: number) {
        this.rowCount = r;
        this.crowdManager.rebuild(this.rowCount, this.columnCount);
    }
    get columns(): number {
        return this.columnCount;
    }
    set columns(r: number) {
        this.columnCount = r;
        this.crowdManager.rebuild(this.rowCount, this.columnCount);
    }
}