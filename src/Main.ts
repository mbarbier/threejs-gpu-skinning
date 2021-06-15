import { Clock } from "three";
import { SharedSkeletonScene } from "./Scene";


// let prev = WebGL2RenderingContext.prototype.shaderSource;
// WebGL2RenderingContext.prototype.shaderSource = function (shader, source: string) {
//     if (source.includes("MeshLambertMaterial")) {
//         console.log("shader:" + source);
//     }
//     return prev.call(this, shader, source);
// }


const scene = new SharedSkeletonScene();
const clock = new Clock();

// FPS
// const stats = new Stats();
// stats.showPanel(0);
// document.body.appendChild(stats.dom);

function animate() {

    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    scene.update(delta);

    // stats.update();
}

animate();
