export default class Player {
    //public bodyId = -1
    public sn = '' //screenName
    public e = true //enabled
    public s = 0 //score

    public p = { x: 0, y: 0, z: 0 } //position
    public q = { x: 0, y: 0, z: 0, w: 0 } //quaternion
    public tp = { x: 0, y: 0, z: 0 } //turret position
    public tq = { x: 0, y: 0, z: 0, w: 0 } //turret quaternion
    //public cq = { x: 0, y: 0, z: 0, w: 0 } //camera quaternion, used for pointing turret
    //public v = 0
    // public dp = { x: 0, y: 0, z: 0, w: 0 } //debug position
    // public dq = { x: 0, y: 0, z: 0, w: 0 } //debug quaternion

    public w = [
        { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 } },
        { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 } },
        { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 } },
        { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 } },
    ] //wheels

    public b = [
        { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 } },
        { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 } },
        { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 } },
    ] //bullets

    public t = -1 //ping timestamp

    constructor() {}
}
