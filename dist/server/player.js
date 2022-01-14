"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Player {
    constructor() {
        this.sn = ''; //screenName
        this.e = true; //enabled
        this.s = 0; //score
        this.v = 0; //forward velocity
        this.p = { x: 0, y: 0, z: 0 }; //position
        this.q = { x: 0, y: 0, z: 0, w: 0 }; //quaternion
        this.tp = { x: 0, y: 0, z: 0 }; //turret position
        this.tq = { x: 0, y: 0, z: 0, w: 0 }; //turret quaternion
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
