"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const CANNON = __importStar(require("cannon-es"));
const THREE = __importStar(require("three"));
class Moon {
    constructor(world) {
        const sphereShape = new CANNON.Sphere(10);
        this.sphereBody = new CANNON.Body({ mass: 1 });
        this.sphereBody.addShape(sphereShape);
        world.addBody(this.sphereBody);
        this.randomise();
    }
    randomise() {
        const outside = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
        outside.multiplyScalar(150);
        this.sphereBody.position.x = outside.x;
        this.sphereBody.position.y = outside.y;
        this.sphereBody.position.z = outside.z;
        this.sphereBody.velocity.set(Math.random() * 50 - 25, Math.random() * 50 - 25, Math.random() * 50 - 25);
        this.sphereBody.angularVelocity.set(Math.random() * 5 - 2.5, Math.random() * 5 - 2.5, Math.random() * 5 - 2.5);
    }
}
exports.default = Moon;
