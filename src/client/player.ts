import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import Physics from './physics'

export default class Player {
    scene: THREE.Scene
    physics: Physics
    frameMesh = new THREE.Mesh()
    turretPivot = new THREE.Object3D()
    turretMesh = new THREE.Mesh()
    wheelLFMesh = new THREE.Group()
    wheelRFMesh = new THREE.Group()
    wheelLBMesh = new THREE.Group()
    wheelRBMesh = new THREE.Group()
    bulletMesh = [new THREE.Mesh(), new THREE.Mesh(), new THREE.Mesh()]
    //lastBulletCounter = [-1, -1, -1] //used to decide if a bullet should instantly be repositioned or smoothly lerped

    partIds: number[] = []
    public collisionPartIds: number[] = []

    frameBody: CANNON.Body
    wheelLFBody: CANNON.Body
    wheelRFBody: CANNON.Body
    wheelLBBody: CANNON.Body
    wheelRBBody: CANNON.Body

    public enabled = false
    public screenName = ''

    constructor(scene: THREE.Scene, physics: Physics) {
        this.scene = scene
        this.physics = physics

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
                // this.carSound.loop = true
                // this.frame.add(this.carSound)
                // this.frame.add(this.shootSound)

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

                // bullets
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
                        this.wheelLFMesh.scale.setScalar(0.85)
                        this.wheelRFMesh.scale.setScalar(0.85)
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

        this.frameBody = new CANNON.Body({ mass: 1 })
        //this.frameBody.addShape(new CANNON.Sphere(0.3), new CANNON.Vec3(0, 0, -1.2))
        this.frameBody.addShape(
            new CANNON.Sphere(0.9),
            new CANNON.Vec3(0, 0.5, 0.2)
        )
        // this.frameBody.addShape(new CANNON.Sphere(0.1), new CANNON.Vec3(1, 0, 0))
        // this.frameBody.addShape(new CANNON.Sphere(0.1), new CANNON.Vec3(-1, 0, 0))
        //this.frameBody.sleep()
        this.frameBody.position.set(0, 0, 0)
        this.physics.world.addBody(this.frameBody)
        this.partIds.push(this.frameBody.id)

        const wheelLFShape = new CANNON.Sphere(0.35)
        this.wheelLFBody = new CANNON.Body({
            mass: 1,
            material: this.physics.wheelMaterial,
        })
        this.wheelLFBody.addShape(wheelLFShape)
        this.wheelLFBody.position.set(-2, 0, -2)
        this.physics.world.addBody(this.wheelLFBody)
        this.partIds.push(this.wheelLFBody.id)

        const wheelRFShape = new CANNON.Sphere(0.35)
        this.wheelRFBody = new CANNON.Body({
            mass: 1,
            material: this.physics.wheelMaterial,
        })
        this.wheelRFBody.addShape(wheelRFShape)
        this.wheelRFBody.position.set(2, 0, -2)
        this.physics.world.addBody(this.wheelRFBody)
        this.partIds.push(this.wheelRFBody.id)

        const wheelLBShape = new CANNON.Sphere(0.4)
        this.wheelLBBody = new CANNON.Body({
            mass: 1,
            material: this.physics.wheelMaterial,
        })
        this.wheelLBBody.addShape(wheelLBShape)
        this.wheelLBBody.position.set(-2, 0, 2)
        this.physics.world.addBody(this.wheelLBBody)
        this.partIds.push(this.wheelLBBody.id)

        const wheelRBShape = new CANNON.Sphere(0.4)
        this.wheelRBBody = new CANNON.Body({
            mass: 1,
            material: this.physics.wheelMaterial,
        })
        this.wheelRBBody.addShape(wheelRBShape)
        this.wheelRBBody.position.set(2, 0, 2)
        this.physics.world.addBody(this.wheelRBBody)
        this.partIds.push(this.wheelRBBody.id)

        //to stop collisions occurring when objects being created, delay the partIds reference to a second after initialisation
        setTimeout(() => {
            this.collisionPartIds = this.partIds.slice(0) // a simple clone technique
            this.enabled = true
        }, 1000)
    }

    updateLerps(data: any) {
        this.enabled = data.e

        this.frameMesh.position.lerp(
            new THREE.Vector3(data.p.x, data.p.y, data.p.z),
            0.2
        )
        this.frameMesh.quaternion.slerp(
            new THREE.Quaternion(data.q._x, data.q._y, data.q._z, data.q._w),
            0.2
        )

        this.turretMesh.position.lerp(
            new THREE.Vector3(data.tp.x, data.tp.y, data.tp.z),
            0.2
        )
        this.turretMesh.quaternion.slerp(
            new THREE.Quaternion(data.tq._x, data.tq._y, data.tq._z, data.tq._w),
            0.2 //faster
        )
        this.wheelLFMesh.position.lerp(
            new THREE.Vector3(data.w[0].p.x, data.w[0].p.y, data.w[0].p.z),
            0.2
        )
        this.wheelLFMesh.quaternion.slerp(
            new THREE.Quaternion(
                data.w[0].q._x,
                data.w[0].q._y,
                data.w[0].q._z,
                data.w[0].q._w
            ),
            0.2
        )
        this.wheelRFMesh.position.lerp(
            new THREE.Vector3(data.w[1].p.x, data.w[1].p.y, data.w[1].p.z),
            0.2
        )
        this.wheelRFMesh.quaternion.slerp(
            new THREE.Quaternion(
                data.w[1].q._x,
                data.w[1].q._y,
                data.w[1].q._z,
                data.w[1].q._w
            ),
            0.2
        )
        this.wheelLBMesh.position.lerp(
            new THREE.Vector3(data.w[2].p.x, data.w[2].p.y, data.w[2].p.z),
            0.2
        )
        this.wheelLBMesh.quaternion.slerp(
            new THREE.Quaternion(
                data.w[2].q._x,
                data.w[2].q._y,
                data.w[2].q._z,
                data.w[2].q._w
            ),
            0.2
        )
        this.wheelRBMesh.position.lerp(
            new THREE.Vector3(data.w[3].p.x, data.w[3].p.y, data.w[3].p.z),
            0.2
        )
        this.wheelRBMesh.quaternion.slerp(
            new THREE.Quaternion(
                data.w[3].q._x,
                data.w[3].q._y,
                data.w[3].q._z,
                data.w[3].q._w
            ),
            0.2
        )

        for (let i = 0; i < 3; i++) {
            // if (data.b[i].c > this.lastBulletCounter[i]) {
            //     this.lastBulletCounter[i] = data.b[i].c
            //     this.bulletMesh[i].position.set(
            //         data.b[i].p.x,
            //         data.b[i].p.y,
            //         data.b[i].p.z
            //     )
            // } else {
            // this.bulletMesh[i].position.lerp(
            //     new THREE.Vector3(data.b[i].p.x, data.b[i].p.y, data.b[i].p.z),
            //     0.1
            // )
            //this.lastBulletCounter[i] = data.b[i].c
            this.bulletMesh[i].position.set(
                data.b[i].p.x,
                data.b[i].p.y,
                data.b[i].p.z
            )
            //}
        }
        //console.log(data.tq)
    }

    update() {
        this.frameBody.position.set(
            this.frameMesh.position.x,
            this.frameMesh.position.y,
            this.frameMesh.position.z
        )
        this.frameBody.quaternion.set(
            this.frameMesh.quaternion.x,
            this.frameMesh.quaternion.y,
            this.frameMesh.quaternion.z,
            this.frameMesh.quaternion.w
        )
        this.wheelLFBody.position.set(
            this.wheelLFMesh.position.x,
            this.wheelLFMesh.position.y,
            this.wheelLFMesh.position.z
        )
        this.wheelLFBody.quaternion.set(
            this.wheelLFMesh.quaternion.x,
            this.wheelLFMesh.quaternion.y,
            this.wheelLFMesh.quaternion.z,
            this.wheelLFMesh.quaternion.w
        )
        this.wheelRFBody.position.set(
            this.wheelRFMesh.position.x,
            this.wheelRFMesh.position.y,
            this.wheelRFMesh.position.z
        )
        this.wheelRFBody.quaternion.set(
            this.wheelRFMesh.quaternion.x,
            this.wheelRFMesh.quaternion.y,
            this.wheelRFMesh.quaternion.z,
            this.wheelRFMesh.quaternion.w
        )
        this.wheelLBBody.position.set(
            this.wheelLBMesh.position.x,
            this.wheelLBMesh.position.y,
            this.wheelLBMesh.position.z
        )
        this.wheelLBBody.quaternion.set(
            this.wheelLBMesh.quaternion.x,
            this.wheelLBMesh.quaternion.y,
            this.wheelLBMesh.quaternion.z,
            this.wheelLBMesh.quaternion.w
        )
        this.wheelRBBody.position.set(
            this.wheelRBMesh.position.x,
            this.wheelRBMesh.position.y,
            this.wheelRBMesh.position.z
        )
        this.wheelRBBody.quaternion.set(
            this.wheelRBMesh.quaternion.x,
            this.wheelRBMesh.quaternion.y,
            this.wheelRBMesh.quaternion.z,
            this.wheelRBMesh.quaternion.w
        )
    }

    dispose() {
        this.scene.remove(this.bulletMesh[0])
        this.scene.remove(this.bulletMesh[1])
        this.scene.remove(this.bulletMesh[2])
        this.scene.remove(this.wheelLFMesh)
        this.scene.remove(this.wheelRFMesh)
        this.scene.remove(this.wheelLBMesh)
        this.scene.remove(this.wheelRBMesh)
        this.scene.remove(this.turretPivot)
        this.scene.remove(this.turretMesh)
        this.scene.remove(this.frameMesh)

        this.physics.world.removeBody(this.wheelLFBody)
        this.physics.world.removeBody(this.wheelRFBody)
        this.physics.world.removeBody(this.wheelLBBody)
        this.physics.world.removeBody(this.wheelRBBody)
        this.physics.world.removeBody(this.frameBody)
        this.partIds = []
    }
}
