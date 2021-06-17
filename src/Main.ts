import { SharedSkeletonScene } from "./Scene";
import { Time } from "./Time";

// import Stats from "stats.js";

// let prev = WebGL2RenderingContext.prototype.shaderSource;
// WebGL2RenderingContext.prototype.shaderSource = function (shader, source: string) {
//     if (source.includes("MeshLambertMaterial")) {
//         console.log("shader:" + source);
//     }
//     return prev.call(this, shader, source);
// }


const scene = new SharedSkeletonScene();

// FPS
// const stats = new Stats();
// stats.showPanel(0);
// document.body.appendChild(stats.dom);

function animate() {

    requestAnimationFrame(animate);

    Time.getDelta();

    scene.update();

    // stats.update();
}

animate();


