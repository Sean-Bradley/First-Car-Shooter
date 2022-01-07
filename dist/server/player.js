"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Player {
    constructor() {
        //public bodyId = -1
        this.screenName = '';
        //public canJump = true
        this.s = 0; //score
        this.p = { x: 0, y: 0, z: 0 }; //position
        this.q = { x: 0, y: 0, z: 0, w: 0 }; //quaternion
        this.cq = { x: 0, y: 0, z: 0, w: 0 }; //camera quaternion, used for pointing turret
        this.v = 0;
        // public dp = { x: 0, y: 0, z: 0, w: 0 } //debug position
        // public dq = { x: 0, y: 0, z: 0, w: 0 } //debug quaternion
        this.w = [
            { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 } },
            { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 } },
            { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 } },
            { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 } },
        ]; //wheels
        this.b = [
            { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 }, c: -1 },
            { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 }, c: -1 },
            { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 }, c: -1 },
        ]; //bullets
        this.t = -1; //ping timestamp
    }
}
exports.default = Player;
