export default class Player {
    sn = '' //screenName
    e = true //enabled
    s = 0 //score
    v = 0 //forward velocity

    p = { x: 0, y: 0, z: 0 } //position
    q = { x: 0, y: 0, z: 0, w: 0 } //quaternion
    tp = { x: 0, y: 0, z: 0 } //turret position
    tq = { x: 0, y: 0, z: 0, w: 0 } //turret quaternion

    w = [
        { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 } },
        { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 } },
        { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 } },
        { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 } },
    ] //wheels

    b = [
        { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 }, c: -1 },
        { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 }, c: -1 },
        { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 0 }, c: -1 },
    ] //bullets

    t = -1 //ping timestamp

    constructor() {}
}
