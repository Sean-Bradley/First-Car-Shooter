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
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const cannonUtils_1 = __importDefault(require("./utils/cannonUtils"));
const THREE = __importStar(require("three"));
const OBJLoader_js_1 = require("./OBJLoader.js");
const car_1 = __importDefault(require("./car"));
const obstacle_1 = __importDefault(require("./obstacle"));
class Physics {
    constructor(io) {
        this.world = new CANNON.World();
        this.obstacles = {};
        this.cars = {};
        //public jewelBody: CANNON.Body = new CANNON.Body()
        this.earthSphere = new THREE.Mesh();
        this.earthBody = new CANNON.Body();
        this.io = io;
        //this.theCarGame = theCarGame
        this.world.gravity.set(0, -1, 0);
        this.groundMaterial = new CANNON.Material('groundMaterial');
        this.wheelMaterial = new CANNON.Material('wheelMaterial');
        this.wheelGroundContactMaterial = new CANNON.ContactMaterial(this.wheelMaterial, this.groundMaterial, {
            friction: 0.3,
            restitution: 0,
            contactEquationStiffness: 1000,
        });
        this.world.addContactMaterial(this.wheelGroundContactMaterial);
        //const scene = new THREE.Scene()
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
                    material: this.groundMaterial,
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
    createCar(socket, player) {
        this.cars[socket.id] = new car_1.default(player, this.world, this.earthSphere, this.wheelMaterial);
        this.cars[socket.id].bullet.addEventListener('collide', (e) => {
            //this.io.emit('explosion', this.cars[socket.id].bullet.position)
            Object.keys(this.obstacles).forEach((o, i) => {
                if (e.contact.bj.id === this.obstacles[o].id) {
                    console.log('bullet hit a moon');
                    this.io.emit('explosion', this.cars[socket.id].bullet.position);
                    const pointOfImpact = e.contact.bj.position.vadd(e.contact.rj); //e.contact.bj.pointToLocalFrame((e.contact.bj.position as CANNON.Vec3).vadd(e.contact.rj))
                    console.log('pointOfImpact = ' + pointOfImpact);
                    console.log(e.contact.bj.velocity);
                    //bounce of the earth and back intno orbit
                    //e.contact.bj.force.set(e.contact.bj.position.x, e.contact.bj.position.y, e.contact.bj.position.z).normalize()
                    const v = e.contact.bj.position.vsub(pointOfImpact);
                    //e.contact.bj.force.copy(pointOfImpact).normalize()
                    e.contact.bj.velocity = v.scale(Math.random() * 25);
                    //;(e.contact.bj.velocity as CANNON.Vec3)..vmul(e.contact.bj.velocity,)
                    //e.contact.bj.applyForce(e.contact.bj.velocity, pointOfImpact)
                    // e.contact.bj.velocity.x *= 10
                    // e.contact.bj.velocity.y *= 10
                    // e.contact.bj.velocity.z *= 10
                    // const up = new CANNON.Vec3()
                    // up.set(e.contact.bj.position.x, e.contact.bj.position.y, e.contact.bj.position.z).normalize()
                    // up.scale(100, e.contact.bj.force)
                    // e.contact.bj.applyLocalForce(up)
                    // e.contact.bj.force.y += e.contact.bj.mass //cancel out world gravity
                    //         // console.log(e.contact.bj.position)
                    //         // console.log(e.contact.rj)
                }
                //     //console.log(this.obstacles[e].id)
            });
            // console.log(e.contact.bi.id + ' ' + e.contact.bj.id)
        });
    }
    shoot(id) {
        this.cars[id].bullet.velocity.set(0, 0, 0);
        this.cars[id].bullet.angularVelocity.set(0, 0, 0);
        let v = new THREE.Vector3(0, 0, -1);
        const q = new THREE.Quaternion()
            .set(this.cars[id].turretBody.quaternion.x, this.cars[id].turretBody.quaternion.y, this.cars[id].turretBody.quaternion.z, this.cars[id].turretBody.quaternion.w)
            .normalize();
        v.applyQuaternion(q);
        v.multiplyScalar(3);
        v.add(new THREE.Vector3(this.cars[id].turretBody.position.x, this.cars[id].turretBody.position.y, this.cars[id].turretBody.position.z));
        this.cars[id].bullet.position.set(v.x, v.y, v.z);
        //console.log(this.cars[id].bullet.position)
        v = new THREE.Vector3(0, 0, -1);
        v.applyQuaternion(q);
        v.multiplyScalar(40);
        this.cars[id].bullet.velocity.set(v.x, v.y, v.z);
        this.cars[id].lastBulletCounter += 1;
    }
    generateObstacles(obstacles) {
        for (let i = 0; i < 10; i++) {
            const sphereShape = new CANNON.Sphere(10);
            const sphereBody = new CANNON.Body({ mass: 1 });
            sphereBody.addShape(sphereShape);
            const outside = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
            outside.multiplyScalar(250);
            sphereBody.position.x = outside.x;
            sphereBody.position.y = outside.y;
            sphereBody.position.z = outside.z;
            sphereBody.velocity.set(Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50);
            sphereBody.angularVelocity.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
            obstacles[i] = new obstacle_1.default();
            if (this.obstacles['obstacle_' + i]) {
                this.world.removeBody(this.obstacles['obstacle_' + i]); //remove old
            }
            this.world.addBody(sphereBody); // add new
            this.obstacles['obstacle_' + i] = sphereBody;
        }
    }
}
exports.default = Physics;
