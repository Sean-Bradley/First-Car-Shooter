import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import Player from './player'
//import Bullet from './bullet'

export default class Car {
    public socketId: string
    public world: CANNON.World

    // private carObject: THREE.Object3D
    // private turretPivot: THREE.Object3D

    private player: Player
    //private mesh: THREE.Mesh
    public frame: CANNON.Body
    public turretBody: CANNON.Body
    //private wheelLFMesh: THREE.Mesh
    public wheelLFBody: CANNON.Body
    //private wheelRFMesh: THREE.Mesh
    public wheelRFBody: CANNON.Body
    //private wheelLBMesh: THREE.Mesh
    public wheelLBBody: CANNON.Body
    //private wheelRBMesh: THREE.Mesh
    public wheelRBBody: CANNON.Body
    public constraintLF: CANNON.HingeConstraint
    public constraintRF: CANNON.HingeConstraint
    public constraintLB: CANNON.HingeConstraint
    public constraintRB: CANNON.HingeConstraint
    private v = new THREE.Vector3()
    public thrusting = false
    public steering = false
    //keyMap: { [id: string]: boolean }
    public forwardVelocity = 0
    public rightVelocity = 0
    private earthSphere: THREE.Mesh
    //private groundHeight = new THREE.Vector3()
    //private matrix: number[][] = []
    //earthShape: CANNON.Heightfield
    private raycaster: THREE.Raycaster
    //private down = new THREE.Vector3(0, -1, 0)
    public camQuat = new THREE.Quaternion()
    public tmpVec = new THREE.Vector3()

    public bullet: CANNON.Body[] = []
    lastBulletCounter = [-1, -1, -1] //used to decide if a bullet should instantly be repositioned or smoothly lerped
    bulletId = -1

    public partIds: number[] = []
    public enabled = true

    // public bodyId = -1
    // public screenName = ''
    // //public canJump = true
    // public p = { x: 0, y: 0, z: 0 } //position
    // public q = { x: 0, y: 0, z: 0, w: 0 } //quaternion
    // public t = -1 //ping timestamp

    public score:number

    constructor(
        //scene: THREE.Scene,
        player: Player,
        world: CANNON.World,
        //chaseCam: THREE.Object3D,
        earthSphere: THREE.Mesh,
        wheelMaterial: CANNON.Material,
        socketId: string
    ) {
        this.socketId = socketId
        this.player = player
        this.world = world
        this.score = 0
        
        this.earthSphere = earthSphere

        this.raycaster = new THREE.Raycaster()

        // const outside = new THREE.Vector3(
        //     Math.random() * 2 - 1,
        //     Math.random() * 2 - 1,
        //     Math.random() * 2 - 1
        // ).normalize()
        const outside = new THREE.Vector3(
            Math.random() * 0.2 - 0.1,
            1,
            Math.random() * 0.2 - 0.1
        ).normalize()

        const inside = new THREE.Vector3()
            .subVectors(new THREE.Vector3(), outside)
            .normalize()
        outside.multiplyScalar(200)
        //console.log(outside)
        this.raycaster.set(outside, inside)

        // this.raycaster.set(new THREE.Vector3(0, 200, 0), this.down)

        const intersects = this.raycaster.intersectObject(this.earthSphere, false)
        let startPosition = new THREE.Vector3()
        if (intersects.length > 0) {
            //this.groundHeight = intersects[0].point
            startPosition = intersects[0].point.addScaledVector(
                outside.normalize(),
                2
            )
        }

        //console.log('groundHeight = ' + this.groundHeight.y)

        // this.carObject = new THREE.Object3D()
        // this.turretPivot = new THREE.Object3D()
        // this.turretPivot.position.y = 0.5
        // this.carObject.add(this.turretPivot)

        this.frame = new CANNON.Body({ mass: 0.1 })
        this.frame.addShape(new CANNON.Sphere(0.4), new CANNON.Vec3(0.5, 0.25, -1))
        this.frame.addShape(new CANNON.Sphere(0.4), new CANNON.Vec3(-0.5, 0.25, -1))
        this.frame.addShape(new CANNON.Sphere(0.4), new CANNON.Vec3(0.4, 0.25, 1))
        this.frame.addShape(new CANNON.Sphere(0.4), new CANNON.Vec3(-0.4, 0.25, 1))
        this.frame.addShape(new CANNON.Sphere(0.4), new CANNON.Vec3(0, 0.7, 0))
        // new CANNON.Box(new CANNON.Vec3(0.8, 0.3, 1))) //main frame
        this.world.addBody(this.frame)
        this.partIds.push(this.frame.id)

        //const turretShape = new CANNON.Box(new CANNON.Vec3(0.2, 0.2, 0.75))
        this.turretBody = new CANNON.Body({ mass: 0 })
        //this.turretBody.addShape(turretShape, new CANNON.Vec3(0, 0, -0.5))
        //this.turretBody.addShape(new CANNON.Sphere(0.5), new CANNON.Vec3(0, 0, 0))
        this.turretBody.addShape(
            new CANNON.Sphere(0.2),
            new CANNON.Vec3(0, 0, -1.0)
        )
        this.world.addBody(this.turretBody)
        this.partIds.push(this.turretBody.id)

        const wheelLFShape = new CANNON.Sphere(0.35)
        this.wheelLFBody = new CANNON.Body({ mass: 1, material: wheelMaterial })
        this.wheelLFBody.addShape(wheelLFShape)
        this.world.addBody(this.wheelLFBody)
        this.partIds.push(this.wheelLFBody.id)

        const wheelRFShape = new CANNON.Sphere(0.35)
        this.wheelRFBody = new CANNON.Body({ mass: 1, material: wheelMaterial })
        this.wheelRFBody.addShape(wheelRFShape)
        this.world.addBody(this.wheelRFBody)
        this.partIds.push(this.wheelRFBody.id)

        const wheelLBShape = new CANNON.Sphere(0.4)
        this.wheelLBBody = new CANNON.Body({ mass: 1, material: wheelMaterial })
        this.wheelLBBody.addShape(wheelLBShape)
        this.world.addBody(this.wheelLBBody)
        this.partIds.push(this.wheelLBBody.id)

        const wheelRBShape = new CANNON.Sphere(0.4)
        this.wheelRBBody = new CANNON.Body({ mass: 1, material: wheelMaterial })
        this.wheelRBBody.addShape(wheelRBShape)
        this.world.addBody(this.wheelRBBody)
        this.partIds.push(this.wheelRBBody.id)

        //add bullets
        for (let i = 0; i < 3; i++) {
            const bullet = new CANNON.Sphere(0.15)
            this.bullet[i] = new CANNON.Body({ mass: 1 }) //, material: wheelMaterial })
            this.bullet[i].addShape(bullet)
            //this.bullet.sleep()
            this.world.addBody(this.bullet[i])
        }

        const leftFrontAxis = new CANNON.Vec3(1, 0, 0)
        const rightFrontAxis = new CANNON.Vec3(1, 0, 0)
        const leftBackAxis = new CANNON.Vec3(1, 0, 0)
        const rightBackAxis = new CANNON.Vec3(1, 0, 0)

        this.constraintLF = new CANNON.HingeConstraint(
            this.frame,
            this.wheelLFBody,
            {
                pivotA: new CANNON.Vec3(-1, 0, -1),
                axisA: leftFrontAxis,
                maxForce: 0.999,
            }
        )
        world.addConstraint(this.constraintLF)
        this.constraintRF = new CANNON.HingeConstraint(
            this.frame,
            this.wheelRFBody,
            {
                pivotA: new CANNON.Vec3(1, 0, -1),
                axisA: rightFrontAxis,
                maxForce: 0.999,
            }
        )
        world.addConstraint(this.constraintRF)
        this.constraintLB = new CANNON.HingeConstraint(
            this.frame,
            this.wheelLBBody,
            {
                pivotA: new CANNON.Vec3(-1, 0, 1),
                axisA: leftBackAxis,
                maxForce: 0.999,
            }
        )
        world.addConstraint(this.constraintLB)
        this.constraintRB = new CANNON.HingeConstraint(
            this.frame,
            this.wheelRBBody,
            {
                pivotA: new CANNON.Vec3(1, 0, 1),
                axisA: rightBackAxis,
                maxForce: 0.999,
            }
        )
        world.addConstraint(this.constraintRB)

        //rear wheel drive
        this.constraintLB.enableMotor()
        this.constraintRB.enableMotor()

        const o = new THREE.Object3D()
        o.position.copy(startPosition)
        o.lookAt(new THREE.Vector3())
        o.rotateX(-Math.PI / 2)

        const q = new CANNON.Quaternion().set(
            o.quaternion.x,
            o.quaternion.y,
            o.quaternion.z,
            o.quaternion.w
        )

        this.frame.position.set(startPosition.x, startPosition.y, startPosition.z)
        this.frame.quaternion.copy(q)
        this.turretBody.position.set(
            startPosition.x,
            startPosition.y,
            startPosition.z
        )
        this.turretBody.quaternion.copy(q)
        this.wheelLFBody.position.set(
            startPosition.x,
            startPosition.y,
            startPosition.z
        )
        this.wheelLFBody.quaternion.copy(q)
        this.wheelRFBody.position.set(
            startPosition.x,
            startPosition.y,
            startPosition.z
        )
        this.wheelRFBody.quaternion.copy(q)
        this.wheelLBBody.position.set(
            startPosition.x,
            startPosition.y,
            startPosition.z
        )
        this.wheelLBBody.quaternion.copy(q)
        this.wheelRBBody.position.set(
            startPosition.x,
            startPosition.y,
            startPosition.z
        )
        this.wheelRBBody.quaternion.copy(q)
    }

    getNextBulletId(): number {
        this.bulletId += 1
        if (this.bulletId > 2) {
            this.bulletId = 0
        }
        this.lastBulletCounter[this.bulletId] += 1
        
        return this.bulletId
    }

    explode(v: CANNON.Vec3) {
        //removes all constraints for this car so that parts separate
        this.world.removeConstraint(this.constraintLF)
        this.world.removeConstraint(this.constraintRF)
        this.world.removeConstraint(this.constraintLB)
        this.world.removeConstraint(this.constraintRB)
        this.enabled = false

        this.wheelLFBody.velocity = v.scale(Math.random() * 100)
        this.wheelRFBody.velocity = v.scale(Math.random() * 100)
        this.wheelLBBody.velocity = v.scale(Math.random() * 100)
        this.wheelRBBody.velocity = v.scale(Math.random() * 100)
        this.frame.velocity = v.scale(Math.random() * 100)
    }

    dispose() {
        this.world.removeConstraint(this.constraintLF)
        this.world.removeConstraint(this.constraintRF)
        this.world.removeConstraint(this.constraintLB)
        this.world.removeConstraint(this.constraintRB)
        for (let i = 0; i < 3; i++) {
            this.world.removeBody(this.bullet[i])
        }
        this.world.removeBody(this.turretBody)
        this.world.removeBody(this.wheelLFBody)
        this.world.removeBody(this.wheelRFBody)
        this.world.removeBody(this.wheelLBBody)
        this.world.removeBody(this.wheelRBBody)
        this.world.removeBody(this.frame)
        this.partIds = []
        console.log('disposed car')
    }

    update() {
        // debug
        // this.player.dp.x = this.turretBody.position.x
        // this.player.dp.y = this.turretBody.position.y
        // this.player.dp.z = this.turretBody.position.z
        // this.player.dq.x = this.turretBody.quaternion.x
        // this.player.dq.y = this.turretBody.quaternion.y
        // this.player.dq.z = this.turretBody.quaternion.z
        // this.player.dq.w = this.turretBody.quaternion.w

        this.player.s = this.score

        this.player.p.x = this.frame.position.x
        this.player.p.y = this.frame.position.y
        this.player.p.z = this.frame.position.z

        this.player.q.x = this.frame.quaternion.x
        this.player.q.y = this.frame.quaternion.y
        this.player.q.z = this.frame.quaternion.z
        this.player.q.w = this.frame.quaternion.w

        this.player.w[0].p.x = this.wheelLFBody.position.x
        this.player.w[0].p.y = this.wheelLFBody.position.y
        this.player.w[0].p.z = this.wheelLFBody.position.z
        this.player.w[0].q.x = this.wheelLFBody.quaternion.x
        this.player.w[0].q.y = this.wheelLFBody.quaternion.y
        this.player.w[0].q.z = this.wheelLFBody.quaternion.z
        this.player.w[0].q.w = this.wheelLFBody.quaternion.w

        this.player.w[1].p.x = this.wheelRFBody.position.x
        this.player.w[1].p.y = this.wheelRFBody.position.y
        this.player.w[1].p.z = this.wheelRFBody.position.z
        this.player.w[1].q.x = this.wheelRFBody.quaternion.x
        this.player.w[1].q.y = this.wheelRFBody.quaternion.y
        this.player.w[1].q.z = this.wheelRFBody.quaternion.z
        this.player.w[1].q.w = this.wheelRFBody.quaternion.w

        this.player.w[2].p.x = this.wheelLBBody.position.x
        this.player.w[2].p.y = this.wheelLBBody.position.y
        this.player.w[2].p.z = this.wheelLBBody.position.z
        this.player.w[2].q.x = this.wheelLBBody.quaternion.x
        this.player.w[2].q.y = this.wheelLBBody.quaternion.y
        this.player.w[2].q.z = this.wheelLBBody.quaternion.z
        this.player.w[2].q.w = this.wheelLBBody.quaternion.w

        this.player.w[3].p.x = this.wheelRBBody.position.x
        this.player.w[3].p.y = this.wheelRBBody.position.y
        this.player.w[3].p.z = this.wheelRBBody.position.z
        this.player.w[3].q.x = this.wheelRBBody.quaternion.x
        this.player.w[3].q.y = this.wheelRBBody.quaternion.y
        this.player.w[3].q.z = this.wheelRBBody.quaternion.z
        this.player.w[3].q.w = this.wheelRBBody.quaternion.w

        this.player.cq.x = this.camQuat.x
        this.player.cq.y = this.camQuat.y
        this.player.cq.z = this.camQuat.z
        this.player.cq.w = this.camQuat.w

        for (let i = 0; i < 3; i++) {
            this.player.b[i].p.x = this.bullet[i].position.x
            this.player.b[i].p.y = this.bullet[i].position.y
            this.player.b[i].p.z = this.bullet[i].position.z
            this.player.b[i].q.x = this.bullet[i].quaternion.x
            this.player.b[i].q.y = this.bullet[i].quaternion.y
            this.player.b[i].q.z = this.bullet[i].quaternion.z
            this.player.b[i].q.w = this.bullet[i].quaternion.w
            this.player.b[i].c = this.lastBulletCounter[i]
        }

        this.constraintLB.setMotorSpeed(this.forwardVelocity)
        this.constraintRB.setMotorSpeed(this.forwardVelocity)
        this.constraintLF.axisA.z = this.rightVelocity
        this.constraintRF.axisA.z = this.rightVelocity

        this.player.v = this.forwardVelocity
    }
}
