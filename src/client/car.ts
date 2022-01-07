import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export default class Car {
    //debugMesh: THREE.Mesh
    frame: THREE.Object3D | THREE.Group
    wheelLFMesh = new THREE.Group()
    wheelRFMesh = new THREE.Group()
    wheelLBMesh = new THREE.Group()
    wheelRBMesh = new THREE.Group()
    bullet: THREE.Mesh[] = []
    turretMesh: THREE.Mesh
    lastC = [-1, -1, -1] //used to decide if a bullet should instantly be repositioned or smoothly lerped

    v = new THREE.Vector3()
    thrusting = false
    forwardVelocity = 0
    rightVelocity = 0
    matrix: number[][] = []
    down = new THREE.Vector3(0, -1, 0)

    name = ''

    targetPosFrame = new THREE.Vector3()
    targetQuatFrame = new THREE.Quaternion()
    targetPosLFWheel = new THREE.Vector3()
    targetQuatLFWheel = new THREE.Quaternion()
    targetPosRFWheel = new THREE.Vector3()
    targetQuatRFWheel = new THREE.Quaternion()
    targetPosLBWheel = new THREE.Vector3()
    targetQuatLBWheel = new THREE.Quaternion()
    targetPosRBWheel = new THREE.Vector3()
    targetQuatRBWheel = new THREE.Quaternion()

    targetPosBullet = [
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
    ]
    targetQuatBullet = [
        new THREE.Quaternion(),
        new THREE.Quaternion(),
        new THREE.Quaternion(),
    ]

    turretPivot = new THREE.Object3D()
    targetQuatTurret = new THREE.Quaternion()

    tmpVec = new THREE.Vector3()
    tmpQuat = new THREE.Quaternion()

    listener: THREE.AudioListener
    carSound: THREE.PositionalAudio
    shootSound: THREE.PositionalAudio

    carFullySetup = false

    constructor(scene: THREE.Scene, listener: THREE.AudioListener) {
        this.listener = listener

        //const phongMaterial = new THREE.MeshNormalMaterial()
        const pipesMaterial = new THREE.MeshStandardMaterial()
        //const pipesMaterial = new THREE.MeshPhysicalMaterial()
        pipesMaterial.color = new THREE.Color('#ffffff')
        //pipesMaterial.reflectivity = 0
        pipesMaterial.refractionRatio = 0
        pipesMaterial.roughness = 0.2
        pipesMaterial.metalness = 1
        //pipesMaterial.clearcoat = 0.15
        //pipesMaterial.clearcoatRoughness = 0.5

        const loader = new GLTFLoader()

        const carFrameGeometry = new THREE.BoxGeometry(1.5, 0.5, 2.5) //something temp
        this.frame = new THREE.Mesh(carFrameGeometry, pipesMaterial)
        this.frame.castShadow = true
        scene.add(this.frame)

        this.turretPivot = new THREE.Object3D()
        this.turretPivot.position.y = 1.0
        this.turretPivot.position.z = 0.5
        this.frame.add(this.turretPivot)

        //turret
        const turretGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5)
        turretGeometry.rotateX(Math.PI / 2)
        turretGeometry.translate(0, 0, -0.5)
        this.turretMesh = new THREE.Mesh(turretGeometry, pipesMaterial)
        this.turretMesh.castShadow = true
        scene.add(this.turretMesh)

        // //debug
        // //const debugGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.5)
        // const debugGeo = new THREE.SphereGeometry(0.2)
        // //debugGeo.rotateX(Math.PI / 2)
        // debugGeo.translate(0, 0, -1.0)
        // this.debugMesh = new THREE.Mesh(
        //     debugGeo,
        //     new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
        // )
        // scene.add(this.debugMesh)

        const audioLoader = new THREE.AudioLoader()
        const carSound = new THREE.PositionalAudio(this.listener)
        audioLoader.load('sounds/engine.wav', (buffer) => {
            carSound.setBuffer(buffer)
            carSound.setVolume(.5)
        })
        this.carSound = carSound

        const shootSound = new THREE.PositionalAudio(this.listener)
        audioLoader.load('sounds/rocket.ogg', (buffer) => {
            shootSound.setBuffer(buffer)
            shootSound.setVolume(2)
        })
        this.shootSound = shootSound

        

        loader.load(
            'models/frame.glb',
            (gltf) => {
                // gltf.scene.traverse((child: THREE.Object3D) => {
                //     console.log(child)
                // })
                ;(this.frame as THREE.Mesh).geometry = (
                    gltf.scene.children[0] as THREE.Mesh
                ).geometry
                this.frame.castShadow = true
                this.carSound.loop = true
                this.frame.add(this.carSound)
                this.frame.add(this.shootSound)

                loader.load(
                    'models/tyre.glb',
                    (gltf) => {
                        this.wheelLFMesh = gltf.scene
                        this.wheelLFMesh.children[0].castShadow = true
                        this.wheelRFMesh = this.wheelLFMesh.clone()
                        this.wheelLBMesh = this.wheelLFMesh.clone()
                        this.wheelRBMesh = this.wheelLFMesh.clone()
                        this.wheelLFMesh.scale.setScalar(0.9)
                        this.wheelRFMesh.scale.setScalar(0.9)
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
        // const wheelLFGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.33, 16)
        // wheelLFGeometry.rotateZ(Math.PI / 2)
        // this.wheelLFMesh = new THREE.Mesh(wheelLFGeometry, phongMaterial)
        // this.wheelLFMesh.castShadow = true
        // scene.add(this.wheelLFMesh)

        // //front right wheel
        // const wheelRFGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.33, 16)
        // wheelRFGeometry.rotateZ(Math.PI / 2)
        // this.wheelRFMesh = new THREE.Mesh(wheelRFGeometry, phongMaterial)
        // this.wheelRFMesh.castShadow = true
        // scene.add(this.wheelRFMesh)

        // //back left wheel
        // const wheelLBGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.33, 16)
        // wheelLBGeometry.rotateZ(Math.PI / 2)
        // this.wheelLBMesh = new THREE.Mesh(wheelLBGeometry, phongMaterial)
        // this.wheelLBMesh.castShadow = true
        // scene.add(this.wheelLBMesh)

        // //back right wheel
        // const wheelRBGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.33, 16)
        // wheelRBGeometry.rotateZ(Math.PI / 2)
        // this.wheelRBMesh = new THREE.Mesh(wheelRBGeometry, phongMaterial)
        // this.wheelRBMesh.castShadow = true
        // scene.add(this.wheelRBMesh)

        //bullets
        for (let i = 0; i < 3; i++) {
            this.bullet[i] = new THREE.Mesh(
                new THREE.SphereGeometry(0.2),
                new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
            )
            this.bullet[i].castShadow = true
            scene.add(this.bullet[i])
        }

        this.carFullySetup = true
    }

    updateData(gameData: any) {
        //console.log(gameData)
        this.targetPosFrame.set(gameData.p.x, gameData.p.y, gameData.p.z)
        this.targetQuatFrame.set(
            gameData.q.x,
            gameData.q.y,
            gameData.q.z,
            gameData.q.w
        )
        this.targetPosLFWheel.set(
            gameData.w[0].p.x,
            gameData.w[0].p.y,
            gameData.w[0].p.z
        )
        this.targetQuatLFWheel.set(
            gameData.w[0].q.x,
            gameData.w[0].q.y,
            gameData.w[0].q.z,
            gameData.w[0].q.w
        )
        this.targetPosRFWheel.set(
            gameData.w[1].p.x,
            gameData.w[1].p.y,
            gameData.w[1].p.z
        )
        this.targetQuatRFWheel.set(
            gameData.w[1].q.x,
            gameData.w[1].q.y,
            gameData.w[1].q.z,
            gameData.w[1].q.w
        )
        this.targetPosLBWheel.set(
            gameData.w[2].p.x,
            gameData.w[2].p.y,
            gameData.w[2].p.z
        )
        this.targetQuatLBWheel.set(
            gameData.w[2].q.x,
            gameData.w[2].q.y,
            gameData.w[2].q.z,
            gameData.w[2].q.w
        )
        this.targetPosRBWheel.set(
            gameData.w[3].p.x,
            gameData.w[3].p.y,
            gameData.w[3].p.z
        )
        this.targetQuatRBWheel.set(
            gameData.w[3].q.x,
            gameData.w[3].q.y,
            gameData.w[3].q.z,
            gameData.w[3].q.w
        )

        this.targetQuatTurret.set(
            gameData.cq.x,
            gameData.cq.y,
            gameData.cq.z,
            gameData.cq.w
        )

        for (let i = 0; i < 3; i++) {
            //console.log(gameData.bc > this.lastBC)
            if (gameData.b[i].c > this.lastC[i]) {
                //set pos and quat now
                this.lastC[i] = gameData.b[i].c
                this.bullet[i].position.copy(this.turretMesh.position)
                this.bullet[i].quaternion.copy(this.turretMesh.quaternion)

                //
                if(this.shootSound.isPlaying){
                    this.shootSound.stop()
                }
                this.shootSound.play()

            }
            this.targetPosBullet[i].set(
                gameData.b[i].p.x,
                gameData.b[i].p.y,
                gameData.b[i].p.z
            )
            this.targetQuatBullet[i].set(
                gameData.b[i].q.x,
                gameData.b[i].q.y,
                gameData.b[i].q.z,
                gameData.b[i].q.w
            )
        }

        this.carSound.setPlaybackRate(
            Math.abs(gameData.v / 50) + Math.random() / 9
        )

        // //debug cannon shape
        // this.debugMesh.position.set(gameData.dp.x, gameData.dp.y, gameData.dp.z)
        // this.debugMesh.quaternion.set(
        //     gameData.dq.x,
        //     gameData.dq.y,
        //     gameData.dq.z,
        //     gameData.dq.w
        // )
    }

    updatePositionQuaternion() {
        this.frame.position.lerp(this.targetPosFrame, 0.1)
        this.frame.quaternion.slerp(this.targetQuatFrame, 0.1)

        this.wheelLFMesh.position.lerp(this.targetPosLFWheel, 0.1)
        this.wheelLFMesh.quaternion.slerp(this.targetQuatLFWheel, 0.5)
        this.wheelRFMesh.position.lerp(this.targetPosRFWheel, 0.1)
        this.wheelRFMesh.quaternion.slerp(this.targetQuatRFWheel, 0.5)
        this.wheelLBMesh.position.lerp(this.targetPosLBWheel, 0.1)
        this.wheelLBMesh.quaternion.slerp(this.targetQuatLBWheel, 0.5)
        this.wheelRBMesh.position.lerp(this.targetPosRBWheel, 0.1)
        this.wheelRBMesh.quaternion.slerp(this.targetQuatRBWheel, 0.5)

        this.turretPivot.getWorldPosition(this.tmpVec)
        this.turretMesh.position.copy(this.tmpVec)
        this.turretMesh.quaternion.slerp(this.targetQuatTurret, 0.05)
        //this.turretMesh.quaternion.copy(this.targetQuatTurret)

        //console.log(this.turretMesh.position.x)

        for (let i = 0; i < 3; i++) {
            this.bullet[i].position.lerp(this.targetPosBullet[i], 0.2)
            this.bullet[i].quaternion.slerp(this.targetQuatBullet[i], 0.2)
            //this.bullet.position.copy(this.targetPosBullet)
            //this.bullet.quaternion.copy(this.targetQuatBullet)
        }
    }
}
