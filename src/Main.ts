import { SharedSkeletonScene } from "./Scene";
import { Time } from "./Time";

import Stats from "stats.js";

const scene = new SharedSkeletonScene();

// FPS
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);



function animate() {

    requestAnimationFrame(animate);

    Time.getDelta();

    scene.update();

    stats.update();
}

animate();


