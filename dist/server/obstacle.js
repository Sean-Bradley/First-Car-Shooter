"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Obstacle {
    //public s = { x: 0, y: 0, z: 0 } //size
    constructor() {
        this.p = { x: 0, y: 0, z: 0 }; //position
        this.q = { x: 0, y: 0, z: 0, w: 0 }; //quaternion
    }
}
exports.default = Obstacle;
