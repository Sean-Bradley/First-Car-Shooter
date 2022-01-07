export default class Player {
    public bodyId = -1
    public screenName = ''
    //public canJump = true

    public p = { x: 0, y: 0, z: 0 } //position
    public q = { x: 0, y: 0, z: 0, w: 0 } //quaternion
    public cq = { x: 0, y: 0, z: 0, w: 0 } //camera quaternion, used for pointing turret

    // public dp = { x: 0, y: 0, z: 0, w: 0 } //debug position
    // public dq = { x: 0, y: 0, z: 0, w: 0 } //debug quaternion


    public w = [
        { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 } },
        { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 } },
        { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 } },
        { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 } },
    ] //wheels

    public b = [{ p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 }, c: -1 }] //bullets

    public t = -1 //ping timestamp

    constructor() {}
}
