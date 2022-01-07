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
//import { Vec3 } from 'math/Vec3'
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
            friction: 0.66,
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
        this.cars[socket.id] = new car_1.default(player, this.world, this.earthSphere, this.wheelMaterial, socket.id);
        for (let i = 0; i < 3; i++) {
            this.cars[socket.id].bullet[i].addEventListener('collide', (e) => {
                //this.io.emit('explosion', this.cars[socket.id].bullet.position)
                let contactBody;
                let contactPoint;
                if (this.cars[socket.id].bullet[i].id === e.contact.bi.id) {
                    contactBody = e.contact.bj;
                    contactPoint = e.contact.rj;
                }
                else if (this.cars[socket.id].bullet[i].id === e.contact.bj.id) {
                    contactBody = e.contact.bi;
                    contactPoint = e.contact.ri;
                }
                Object.keys(this.cars).forEach((c) => {
                    if (this.cars[c].socketId != socket.id) {
                        if (this.cars[c].enabled) {
                            if (this.cars[c].partIds.includes(contactBody.id)) {
                                console.log('bullet hit a car');
                                this.io.emit('explosion', this.cars[socket.id].bullet[i].position);
                                this.cars[socket.id].score += 100;
                                const pointOfImpact = contactBody.position.vadd(contactPoint);
                                const v = contactBody.position.vsub(pointOfImpact);
                                if (this.cars[c].enabled) {
                                    this.cars[c].explode(v);
                                }
                            }
                        }
                    }
                });
                Object.keys(this.obstacles).forEach((o) => {
                    //console.log(e.contact.bi.id === this.obstacles[o].id)
                    if (contactBody.id === this.obstacles[o].id) {
                        console.log('bullet hit a moon');
                        this.io.emit('explosion', this.cars[socket.id].bullet[i].position);
                        this.cars[socket.id].score += 10;
                        const pointOfImpact = contactBody.position.vadd(contactPoint);
                        //console.log('pointOfImpact = ' + pointOfImpact)
                        //console.log(e.contact.bj.velocity)
                        const v = contactBody.position.vsub(pointOfImpact);
                        contactBody.velocity = v.scale(Math.random() * 25);
                    }
                    //     //console.log(this.obstacles[e].id)
                });
                // console.log(e.contact.bi.id + ' ' + e.contact.bj.id)
            });
        }
    }
    shoot(id) {
        if (this.cars[id].enabled) {
            const bulletId = this.cars[id].getNextBulletId();
            this.cars[id].bullet[bulletId].velocity.set(0, 0, 0);
            this.cars[id].bullet[bulletId].angularVelocity.set(0, 0, 0);
            let v = new THREE.Vector3(0, 0, -1);
            const q = new THREE.Quaternion()
                .set(this.cars[id].turretBody.quaternion.x, this.cars[id].turretBody.quaternion.y, this.cars[id].turretBody.quaternion.z, this.cars[id].turretBody.quaternion.w)
                .normalize();
            v.applyQuaternion(q);
            v.multiplyScalar(7);
            v.add(new THREE.Vector3(this.cars[id].turretBody.position.x, this.cars[id].turretBody.position.y, this.cars[id].turretBody.position.z));
            this.cars[id].bullet[bulletId].position.set(v.x, v.y, v.z);
            //console.log(this.cars[id].bullet.position)
            v = new THREE.Vector3(0, 0, -1);
            v.applyQuaternion(q);
            v.multiplyScalar(40);
            this.cars[id].bullet[bulletId].velocity.set(v.x, v.y, v.z);
        }
    }
    regenerateObstacles(obstacles) {
        for (let i = 0; i < 10; i++) {
            const sphereShape = new CANNON.Sphere(10);
            const sphereBody = new CANNON.Body({ mass: 1 });
            sphereBody.addShape(sphereShape);
            const outside = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
            outside.multiplyScalar(250);
            sphereBody.position.x = outside.x;
            sphereBody.position.y = outside.y;
            sphereBody.position.z = outside.z;
            sphereBody.velocity.set(Math.random() * 50 - 25, Math.random() * 50 - 25, Math.random() * 50 - 25);
            sphereBody.angularVelocity.set(Math.random() * 5 - 2.5, Math.random() * 5 - 2.5, Math.random() * 5 - 2.5);
            // setTimeout(() => {
            //     sphereBody.velocity.set(
            //         Math.random() * 10 - 5,
            //         Math.random() * 10 - 5,
            //         Math.random() * 10 - 5
            //     )
            // }, 2000)
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
