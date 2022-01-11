import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import Physics from './physics'
import Player from './player'
import { Socket } from 'socket.io-client'
import Moon from './moon'

export default class Car {
    // upVector = new THREE.ArrowHelper()
    // downVector = new THREE.ArrowHelper()

    camera: THREE.PerspectiveCamera
    physics: Physics
    socket: Socket

    frameMesh = new THREE.Mesh()
    turretMesh = new THREE.Mesh()
    turretPivot = new THREE.Object3D()
    targetQuatTurret = new THREE.Quaternion()
    wheelLFMesh = new THREE.Group()
    wheelRFMesh = new THREE.Group()
    wheelLBMesh = new THREE.Group()
    wheelRBMesh = new THREE.Group()

    tmpVec = new THREE.Vector3()
    tmpQuat = new THREE.Quaternion()
    camPos = new THREE.Vector3()
    camQuat = new THREE.Quaternion()
    chaseCamPivot = new THREE.Object3D()
    chaseCam = new THREE.Object3D()

    frameBody: CANNON.Body
    turretBody: CANNON.Body
    wheelLFBody: CANNON.Body
    wheelRFBody: CANNON.Body
    wheelLBBody: CANNON.Body
    wheelRBBody: CANNON.Body
    constraintLF: CANNON.HingeConstraint
    constraintRF: CANNON.HingeConstraint
    constraintLB: CANNON.HingeConstraint
    constraintRB: CANNON.HingeConstraint

    bulletMesh = [new THREE.Mesh(), new THREE.Mesh(), new THREE.Mesh()]
    bulletBody: CANNON.Body[] = []
    //public lastBulletCounter = [-1, -1, -1] //used to decide if a bullet should instantly be repositioned or smoothly lerped
    bulletId = -1

    public thrusting = false
    public steering = false
    public forwardVelocity = 0
    public rightVelocity = 0

    //public partIds: number[] = []
    public enabled = true

    public score: number = 0

    players: { [id: string]: Player }
    moons: { [id: string]: Moon }

    upsideDownCounter = -1

    listener: THREE.AudioListener
    carSound: THREE.PositionalAudio
    shootSound: THREE.PositionalAudio

    constructor(
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        physics: Physics,
        players: { [id: string]: Player },
        moons: { [id: string]: Moon },
        socket: Socket,
        listener: THREE.AudioListener
    ) {
        this.camera = camera
        this.physics = physics
        this.players = players
        this.moons = moons
        this.socket = socket
        this.listener = listener

        const audioLoader = new THREE.AudioLoader()
        const carSound = new THREE.PositionalAudio(this.listener)
        audioLoader.load('sounds/engine.wav', (buffer) => {
            carSound.setBuffer(buffer)
            carSound.setVolume(0.5)
        })
        this.carSound = carSound

        const shootSound = new THREE.PositionalAudio(this.listener)
        audioLoader.load('sounds/rocket.ogg', (buffer) => {
            shootSound.setBuffer(buffer)
            shootSound.setVolume(2)
        })
        this.shootSound = shootSound

        const pipesMaterial = new THREE.MeshStandardMaterial()
        pipesMaterial.color = new THREE.Color('#ffffff')
        pipesMaterial.refractionRatio = 0
        pipesMaterial.roughness = 0.2
        pipesMaterial.metalness = 1

        const loader = new GLTFLoader()
        loader.load(
            'models/frame.glb',
            (gltf) => {
                this.frameMesh = gltf.scene.children[0] as THREE.Mesh
                this.frameMesh.material = pipesMaterial
                this.frameMesh.castShadow = true
                scene.add(this.frameMesh)
                this.carSound.loop = true
                this.frameMesh.add(this.carSound)
                this.frameMesh.add(this.shootSound)

                // this.upVector = new THREE.ArrowHelper(
                //     new THREE.Vector3(0, 1, 0),
                //     new THREE.Vector3(0, 0, 0),
                //     1,
                //     0x00ff00
                // )
                // scene.add(this.upVector)

                // this.downVector = new THREE.ArrowHelper(
                //     new THREE.Vector3(0, -1, 0),
                //     new THREE.Vector3(0, 0, 0),
                //     1,
                //     0xff0000
                // )
                // scene.add(this.downVector)

                this.turretPivot = new THREE.Object3D()
                this.turretPivot.position.y = 1.0
                this.turretPivot.position.z = 0.5
                this.frameMesh.add(this.turretPivot)

                const turretGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5)
                turretGeometry.rotateX(Math.PI / 2)
                turretGeometry.translate(0, 0, -0.5)
                this.turretMesh = new THREE.Mesh(turretGeometry, pipesMaterial)
                this.turretMesh.castShadow = true
                scene.add(this.turretMesh)

                this.chaseCam.position.set(0, 1.5, 4)
                this.chaseCamPivot.add(this.chaseCam)
                this.frameMesh.add(this.chaseCamPivot)

                //bullets
                for (let i = 0; i < 3; i++) {
                    this.bulletMesh[i].geometry = new THREE.SphereGeometry(0.2)
                    this.bulletMesh[i].material = new THREE.MeshBasicMaterial({
                        color: 0x00ff00,
                        wireframe: true,
                    })
                    this.bulletMesh[i].castShadow = true
                    scene.add(this.bulletMesh[i])
                }

                loader.load(
                    'models/tyre.glb',
                    (gltf) => {
                        this.wheelLFMesh = gltf.scene
                        this.wheelLFMesh.children[0].castShadow = true
                        this.wheelRFMesh = this.wheelLFMesh.clone()
                        this.wheelLBMesh = this.wheelLFMesh.clone()
                        this.wheelRBMesh = this.wheelLFMesh.clone()
                        this.wheelLFMesh.scale.setScalar(0.87)
                        this.wheelRFMesh.scale.setScalar(0.87)
                        scene.add(this.wheelLFMesh)
                        scene.add(this.wheelRFMesh)
                        scene.add(this.wheelLBMesh)
                        scene.add(this.wheelRBMesh)
                    },
                    (xhr) => {
                        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
                    },
                    (error) => {
                        console.log(error)
                    }
                )
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
            },
            (error) => {
                console.log(error)
            }
        )
        this.frameBody = new CANNON.Body({ mass: 0.1 })
        this.frameBody.addShape(
            new CANNON.Sphere(0.1),
            new CANNON.Vec3(0, 0.8, 0.4)
        )
        this.frameBody.addShape(
            new CANNON.Sphere(0.1),
            new CANNON.Vec3(0, -0.1, -1.3)
        )
        this.frameBody.addShape(
            new CANNON.Sphere(0.1),
            new CANNON.Vec3(0, -0.1, 1.3)
        )
        this.frameBody.addShape(new CANNON.Sphere(0.1), new CANNON.Vec3(1, -0.1, 0))
        this.frameBody.addShape(
            new CANNON.Sphere(0.1),
            new CANNON.Vec3(-1, -0.1, 0)
        )
        this.frameBody.position.set(0, 1, 0)
        this.physics.world.addBody(this.frameBody)
        //this.partIds.push(this.frameBody.id)

        this.turretBody = new CANNON.Body({ mass: 0 })
        this.turretBody.addShape(
            new CANNON.Sphere(0.2),
            new CANNON.Vec3(0, 0, -1.0)
        )
        //this.turretBody.sleep()
        this.turretBody.position.set(0, 3, 0)
        this.physics.world.addBody(this.turretBody)
        //this.partIds.push(this.turretBody.id)

        const wheelLFShape = new CANNON.Sphere(0.35)
        this.wheelLFBody = new CANNON.Body({
            mass: 1,
            material: this.physics.wheelMaterial,
        })
        this.wheelLFBody.addShape(wheelLFShape)
        this.wheelLFBody.position.set(-2, 0, -2)
        this.physics.world.addBody(this.wheelLFBody)
        //this.partIds.push(this.wheelLFBody.id)

        const wheelRFShape = new CANNON.Sphere(0.35)
        this.wheelRFBody = new CANNON.Body({
            mass: 1,
            material: this.physics.wheelMaterial,
        })
        this.wheelRFBody.addShape(wheelRFShape)
        this.wheelRFBody.position.set(2, 0, -2)
        this.physics.world.addBody(this.wheelRFBody)
        //this.partIds.push(this.wheelRFBody.id)

        const wheelLBShape = new CANNON.Sphere(0.4)
        this.wheelLBBody = new CANNON.Body({
            mass: 1,
            material: this.physics.wheelMaterial,
        })
        this.wheelLBBody.addShape(wheelLBShape)
        this.wheelLBBody.position.set(-2, 0, 2)
        this.physics.world.addBody(this.wheelLBBody)
        //this.partIds.push(this.wheelLBBody.id)

        const wheelRBShape = new CANNON.Sphere(0.4)
        this.wheelRBBody = new CANNON.Body({
            mass: 1,
            material: this.physics.wheelMaterial,
        })
        this.wheelRBBody.addShape(wheelRBShape)
        this.wheelRBBody.position.set(2, 0, 2)
        this.physics.world.addBody(this.wheelRBBody)
        //this.partIds.push(this.wheelRBBody.id)

        const leftFrontAxis = new CANNON.Vec3(1, 0, 0)
        const rightFrontAxis = new CANNON.Vec3(1, 0, 0)
        const leftBackAxis = new CANNON.Vec3(1, 0, 0)
        const rightBackAxis = new CANNON.Vec3(1, 0, 0)

        this.constraintLF = new CANNON.HingeConstraint(
            this.frameBody,
            this.wheelLFBody,
            {
                pivotA: new CANNON.Vec3(-1, 0, -1),
                axisA: leftFrontAxis,
                maxForce: 0.66,
            }
        )
        this.physics.world.addConstraint(this.constraintLF)
        this.constraintRF = new CANNON.HingeConstraint(
            this.frameBody,
            this.wheelRFBody,
            {
                pivotA: new CANNON.Vec3(1, 0, -1),
                axisA: rightFrontAxis,
                maxForce: 0.66,
            }
        )
        this.physics.world.addConstraint(this.constraintRF)
        this.constraintLB = new CANNON.HingeConstraint(
            this.frameBody,
            this.wheelLBBody,
            {
                pivotA: new CANNON.Vec3(-1, 0, 1),
                axisA: leftBackAxis,
                maxForce: 0.66,
            }
        )
        this.physics.world.addConstraint(this.constraintLB)
        this.constraintRB = new CANNON.HingeConstraint(
            this.frameBody,
            this.wheelRBBody,
            {
                pivotA: new CANNON.Vec3(1, 0, 1),
                axisA: rightBackAxis,
                maxForce: 0.66,
            }
        )
        this.physics.world.addConstraint(this.constraintRB)

        // //rear wheel drive
        this.constraintLB.enableMotor()
        this.constraintRB.enableMotor()

        //add bullets
        for (let i = 0; i < 3; i++) {
            this.bulletBody[i] = new CANNON.Body({ mass: 1 }) //, material: wheelMaterial })
            this.bulletBody[i].addShape(new CANNON.Sphere(0.15))
            this.bulletBody[i].sleep()
            this.physics.world.addBody(this.bulletBody[i])

            this.bulletBody[i].addEventListener('collide', (e: any) => {
                let contactBody: CANNON.Body
                let contactPoint: CANNON.Vec3
                if (this.bulletBody[i].id === e.contact.bi.id) {
                    contactBody = e.contact.bj
                    contactPoint = e.contact.rj
                } else if (this.bulletBody[i].id === e.contact.bj.id) {
                    contactBody = e.contact.bi
                    contactPoint = e.contact.ri
                }

                Object.keys(this.players).forEach((p) => {
                    if (this.players[p].enabled) {
                        if (
                            this.players[p].collisionPartIds.includes(
                                contactBody.id
                            )
                        ) {
                            console.log('bullet hit a car')

                            //this.score += 100  // score is awarded server side

                            const pointOfImpact = (
                                contactBody.position as CANNON.Vec3
                            ).vadd(contactPoint)
                            const v = contactBody.position.vsub(pointOfImpact)

                            if (this.players[p].enabled) {
                                this.socket.emit(
                                    'hitCar',
                                    p,
                                    this.bulletMesh[i].position,
                                    v
                                )
                                this.players[p].enabled = false
                            }
                        }
                    }
                })

                Object.keys(this.moons).forEach((m) => {
                    if (this.moons[m].enabled) {
                        if (contactBody.id === this.moons[m].body.id) {
                            console.log('bullet hit a moon')

                            //this.score += 10 // points awarded server side
                            const pointOfImpact = (
                                contactBody.position as CANNON.Vec3
                            ).vadd(contactPoint)

                            const v = contactBody.position.vsub(pointOfImpact)

                            this.socket.emit(
                                'hitMoon',
                                m,
                                this.bulletMesh[i].position,
                                v
                            )
                        }
                    }
                })
            })
        }

        setInterval(() => {
            if (this.isUpsideDown()) {
                this.upsideDownCounter += 1
                if (this.upsideDownCounter > 3) {
                    this.spawn(this.frameMesh.position)
                    console.log('flipped car')
                }
                console.log('car is upside down')
            } else {
                this.upsideDownCounter = 0
            }
        }, 1000)
    }

    getNextBulletId(): number {
        this.bulletId += 1
        if (this.bulletId > 2) {
            this.bulletId = 0
        }
        //this.lastBulletCounter[this.bulletId] += 1

        return this.bulletId
    }

    shoot() {
        if (this.enabled) {
            const bulletId = this.getNextBulletId()
            this.bulletBody[bulletId].velocity.set(0, 0, 0)
            this.bulletBody[bulletId].angularVelocity.set(0, 0, 0)
            let v = new THREE.Vector3(0, 0, -1)
            const q = new THREE.Quaternion()
                .set(
                    this.turretBody.quaternion.x,
                    this.turretBody.quaternion.y,
                    this.turretBody.quaternion.z,
                    this.turretBody.quaternion.w
                )
                .normalize()
            v.applyQuaternion(q)
            v.multiplyScalar(1.5)
            v.add(
                new THREE.Vector3(
                    this.turretBody.position.x,
                    this.turretBody.position.y,
                    this.turretBody.position.z
                )
            )

            this.bulletBody[bulletId].position.set(v.x, v.y, v.z)
            //console.log(this.cars[id].bullet.position)
            v = new THREE.Vector3(0, 0, -1)
            v.applyQuaternion(q)
            v.multiplyScalar(40)
            this.bulletBody[bulletId].velocity.set(v.x, v.y, v.z)
            this.bulletBody[bulletId].wakeUp()

            if (this.shootSound.isPlaying) {
                this.shootSound.stop()
            }
            this.shootSound.play()
        }
    }

    isUpsideDown() {
        const bodyUp = new THREE.Vector3()
        bodyUp.copy(this.frameMesh.up).applyQuaternion(this.frameMesh.quaternion)
        const down = this.frameMesh.position.clone().negate().normalize()
        //console.log(down.dot(bodyUp))
        if (down.dot(bodyUp) > 0) {
            return true
        } else {
            return false
        }
    }

    spawn(startPosition: THREE.Vector3) {
        console.log('Spawn Car')
        //console.log(startPosition)

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

        this.frameBody.position.set(
            startPosition.x,
            startPosition.y,
            startPosition.z
        )
        this.frameBody.quaternion.copy(q)
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

        //console.log(this.wheelRBBody.quaternion)
        //this.enabled = true
    }

    update() {
        this.chaseCam.getWorldPosition(this.camPos)
        this.camera.position.lerpVectors(this.camera.position, this.camPos, 0.1)

        this.chaseCam.getWorldQuaternion(this.camQuat)
        this.camera.quaternion.slerp(this.camQuat, 0.1)

        //console.log(this.frameBody.position.x)
        this.frameMesh.position.x = this.frameBody.position.x
        this.frameMesh.position.y = this.frameBody.position.y
        this.frameMesh.position.z = this.frameBody.position.z
        this.frameMesh.quaternion.x = this.frameBody.quaternion.x
        this.frameMesh.quaternion.y = this.frameBody.quaternion.y
        this.frameMesh.quaternion.z = this.frameBody.quaternion.z
        this.frameMesh.quaternion.w = this.frameBody.quaternion.w

        // this.upVector.position.copy(this.frameMesh.position)
        // this.upVector.setDirection(bodyUp)
        // this.downVector.position.copy(this.frameMesh.position)
        // this.downVector.setDirection(down)

        this.turretPivot.getWorldPosition(this.tmpVec)
        this.turretMesh.position.copy(this.tmpVec)
        this.turretMesh.quaternion.slerp(this.camQuat, 0.05)

        this.turretBody.position.set(
            this.turretMesh.position.x,
            this.turretMesh.position.y,
            this.turretMesh.position.z
        )
        this.turretBody.quaternion.set(
            this.turretMesh.quaternion.x,
            this.turretMesh.quaternion.y,
            this.turretMesh.quaternion.z,
            this.turretMesh.quaternion.w
        )

        this.wheelLFMesh.position.x = this.wheelLFBody.position.x
        this.wheelLFMesh.position.y = this.wheelLFBody.position.y
        this.wheelLFMesh.position.z = this.wheelLFBody.position.z
        this.wheelLFMesh.quaternion.x = this.wheelLFBody.quaternion.x
        this.wheelLFMesh.quaternion.y = this.wheelLFBody.quaternion.y
        this.wheelLFMesh.quaternion.z = this.wheelLFBody.quaternion.z
        this.wheelLFMesh.quaternion.w = this.wheelLFBody.quaternion.w

        this.wheelRFMesh.position.x = this.wheelRFBody.position.x
        this.wheelRFMesh.position.y = this.wheelRFBody.position.y
        this.wheelRFMesh.position.z = this.wheelRFBody.position.z
        this.wheelRFMesh.quaternion.x = this.wheelRFBody.quaternion.x
        this.wheelRFMesh.quaternion.y = this.wheelRFBody.quaternion.y
        this.wheelRFMesh.quaternion.z = this.wheelRFBody.quaternion.z
        this.wheelRFMesh.quaternion.w = this.wheelRFBody.quaternion.w

        this.wheelLBMesh.position.x = this.wheelLBBody.position.x
        this.wheelLBMesh.position.y = this.wheelLBBody.position.y
        this.wheelLBMesh.position.z = this.wheelLBBody.position.z
        this.wheelLBMesh.quaternion.x = this.wheelLBBody.quaternion.x
        this.wheelLBMesh.quaternion.y = this.wheelLBBody.quaternion.y
        this.wheelLBMesh.quaternion.z = this.wheelLBBody.quaternion.z
        this.wheelLBMesh.quaternion.w = this.wheelLBBody.quaternion.w

        this.wheelRBMesh.position.x = this.wheelRBBody.position.x
        this.wheelRBMesh.position.y = this.wheelRBBody.position.y
        this.wheelRBMesh.position.z = this.wheelRBBody.position.z
        this.wheelRBMesh.quaternion.x = this.wheelRBBody.quaternion.x
        this.wheelRBMesh.quaternion.y = this.wheelRBBody.quaternion.y
        this.wheelRBMesh.quaternion.z = this.wheelRBBody.quaternion.z
        this.wheelRBMesh.quaternion.w = this.wheelRBBody.quaternion.w

        this.constraintLB.setMotorSpeed(this.forwardVelocity)
        this.constraintRB.setMotorSpeed(this.forwardVelocity)
        this.constraintLF.axisA.z = this.rightVelocity
        this.constraintRF.axisA.z = this.rightVelocity

        for (let i = 0; i < 3; i++) {
            this.bulletMesh[i].position.x = this.bulletBody[i].position.x
            this.bulletMesh[i].position.y = this.bulletBody[i].position.y
            this.bulletMesh[i].position.z = this.bulletBody[i].position.z
            // this.bulletMesh[i].quaternion.x = this.bulletBody[i].quaternion.x
            // this.bulletMesh[i].quaternion.y = this.bulletBody[i].quaternion.y
            // this.bulletMesh[i].quaternion.z = this.bulletBody[i].quaternion.z
            // this.bulletMesh[i].quaternion.w = this.bulletBody[i].quaternion.w
            //this.player.b[i].c = this.lastBulletCounter[i]
        }
        //console.log(this.bulletMesh[0].position.x)

        this.carSound.setPlaybackRate(
            Math.abs(this.forwardVelocity / 50) + Math.random() / 9
        )
    }

    explode(v: CANNON.Vec3) {
        //removes all constraints for this car so that parts separate
        this.physics.world.removeConstraint(this.constraintLF)
        this.physics.world.removeConstraint(this.constraintRF)
        this.physics.world.removeConstraint(this.constraintLB)
        this.physics.world.removeConstraint(this.constraintRB)
        this.enabled = false

        this.wheelLFBody.velocity = v.scale(Math.random() * 25)
        this.wheelRFBody.velocity = v.scale(Math.random() * 25)
        this.wheelLBBody.velocity = v.scale(Math.random() * 25)
        this.wheelRBBody.velocity = v.scale(Math.random() * 25)
        this.frameBody.velocity = v.scale(Math.random() * 100)
    }

    fix() {
        if (this.physics.world.constraints.length === 0) {
            this.physics.world.addConstraint(this.constraintLF)
            this.physics.world.addConstraint(this.constraintRF)
            this.physics.world.addConstraint(this.constraintLB)
            this.physics.world.addConstraint(this.constraintRB)
            this.enabled = true

            this.socket.emit('enable')
        }
    }
}
