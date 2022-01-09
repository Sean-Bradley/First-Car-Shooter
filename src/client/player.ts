import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export default class Player {
    scene: THREE.Scene
    frameMesh = new THREE.Mesh()
    turretPivot = new THREE.Object3D()
    turretMesh = new THREE.Mesh()
    wheelLFMesh = new THREE.Group()
    wheelRFMesh = new THREE.Group()
    wheelLBMesh = new THREE.Group()
    wheelRBMesh = new THREE.Group()
    bulletMesh = [new THREE.Mesh(), new THREE.Mesh(), new THREE.Mesh()]
    lastBulletCounter = [-1, -1, -1] //used to decide if a bullet should instantly be repositioned or smoothly lerped

    constructor(scene: THREE.Scene) {
        this.scene = scene

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
    }

    update(data: any) {
        this.frameMesh.position.lerp(
            new THREE.Vector3(data.p.x, data.p.y, data.p.z),
            0.1
        )
        this.frameMesh.quaternion.slerp(
            new THREE.Quaternion(data.q._x, data.q._y, data.q._z, data.q._w),
            0.1
        )
        this.turretMesh.position.lerp(
            new THREE.Vector3(data.tp.x, data.tp.y, data.tp.z),
            0.1
        )
        this.turretMesh.quaternion.slerp(
            new THREE.Quaternion(data.tq._x, data.tq._y, data.tq._z, data.tq._w),
            0.1
        )
        this.wheelLFMesh.position.lerp(
            new THREE.Vector3(data.w[0].p.x, data.w[0].p.y, data.w[0].p.z),
            0.1
        )
        this.wheelLFMesh.quaternion.slerp(
            new THREE.Quaternion(
                data.w[0].q._x,
                data.w[0].q._y,
                data.w[0].q._z,
                data.w[0].q._w
            ),
            0.1
        )
        this.wheelRFMesh.position.lerp(
            new THREE.Vector3(data.w[1].p.x, data.w[1].p.y, data.w[1].p.z),
            0.1
        )
        this.wheelRFMesh.quaternion.slerp(
            new THREE.Quaternion(
                data.w[1].q._x,
                data.w[1].q._y,
                data.w[1].q._z,
                data.w[1].q._w
            ),
            0.1
        )
        this.wheelLBMesh.position.lerp(
            new THREE.Vector3(data.w[2].p.x, data.w[2].p.y, data.w[2].p.z),
            0.1
        )
        this.wheelLBMesh.quaternion.slerp(
            new THREE.Quaternion(
                data.w[2].q._x,
                data.w[2].q._y,
                data.w[2].q._z,
                data.w[2].q._w
            ),
            0.1
        )
        this.wheelRBMesh.position.lerp(
            new THREE.Vector3(data.w[3].p.x, data.w[3].p.y, data.w[3].p.z),
            0.1
        )
        this.wheelRBMesh.quaternion.slerp(
            new THREE.Quaternion(
                data.w[3].q._x,
                data.w[3].q._y,
                data.w[3].q._z,
                data.w[3].q._w
            ),
            0.1
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
            this.lastBulletCounter[i] = data.b[i].c
            this.bulletMesh[i].position.set(
                data.b[i].p.x,
                data.b[i].p.y,
                data.b[i].p.z
            )
            //}
        }
        //console.log(data.tq)
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
    }
}
