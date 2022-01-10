"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CANNON = __importStar(require("cannon-es"));
const cannonUtils_1 = __importDefault(require("./utils/cannonUtils"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const THREE = __importStar(require("three"));
const OBJLoader_js_1 = require("./OBJLoader.js");
const moon_1 = __importDefault(require("./moon"));
class Physics {
    constructor(io) {
        this.world = new CANNON.World();
        this.earthSphere = new THREE.Mesh();
        this.earthBody = new CANNON.Body();
        this.moons = {};
        this.io = io;
        const loader = new OBJLoader_js_1.OBJLoader();
        const data = fs_1.default.readFileSync(path_1.default.resolve(__dirname, '../client/models/topoEarth_3.obj'), { encoding: 'utf8', flag: 'r' });
        const obj = loader.parse(data);
        obj.traverse((child) => {
            if (child.isMesh) {
                const m = child;
                this.earthSphere = m;
                const shape = cannonUtils_1.default.CreateTrimesh(this.earthSphere.geometry);
                this.earthBody = new CANNON.Body({
                    mass: 0,
                });
                this.earthBody.addShape(shape);
                this.earthBody.position.x = m.position.x;
                this.earthBody.position.y = m.position.y;
                this.earthBody.position.z = m.position.z;
                this.earthBody.quaternion.x = m.quaternion.x;
                this.earthBody.quaternion.y = m.quaternion.y;
                this.earthBody.quaternion.z = m.quaternion.z;
                this.earthBody.quaternion.w = m.quaternion.w;
                this.world.addBody(this.earthBody);
            }
        });
        for (let i = 0; i < 10; i++) {
            this.moons[i] = new moon_1.default(this.world);
        }
        this.world.addEventListener('postStep', () => {
            // Gravity towards (0,0,0)
            this.world.bodies.forEach((b) => {
                const v = new CANNON.Vec3();
                v.set(-b.position.x, -b.position.y, -b.position.z).normalize();
                v.scale(9.8, b.force);
                b.applyLocalForce(v);
                b.force.y += b.mass; //cancel out world gravity
            });
        });
    }
}
exports.default = Physics;
