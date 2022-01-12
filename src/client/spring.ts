import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import Car from './car'
import * as CANNON from 'cannon-es'
import Earth from './earth'

export default class Spring {
    earth: Earth
    mesh = new THREE.Mesh()
    material: THREE.MeshMatcapMaterial

    constructor(scene: THREE.Scene, earth: Earth) {
        this.earth = earth
        this.material = new THREE.MeshMatcapMaterial({})
        const texture = new THREE.TextureLoader().load('img/matcap-opal.png')
        this.material.matcap = texture

        const objLoader = new OBJLoader()
        objLoader.load(
            'models/spring.obj',
            (obj) => {
                obj.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        const m = child as THREE.Mesh
                        m.receiveShadow = true
                        m.castShadow = true
                        m.material = this.material
                        this.mesh = m
                    }
                })

                scene.add(this.mesh)
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
            },
            (error) => {
                console.log(error)
            }
        )

        this.randomise()
    }

    randomise() {
        const p = this.earth.getSpawnPosition()
        this.mesh.position.copy(p)
        this.mesh.lookAt(0, 0, 0)
    }

    update(car: Car) {
        const d = this.mesh.position.distanceTo(car.frameMesh.position)
        if (d < 5) {
            console.log(d)
            const v = new CANNON.Vec3(
                this.mesh.position.x * 10,
                this.mesh.position.y * 10,
                this.mesh.position.z * 10
            )
            car.frameBody.applyForce(v)
            car.wheelLFBody.applyForce(v)
            car.wheelRFBody.applyForce(v)
            car.wheelLBBody.applyForce(v)
            car.wheelRBBody.applyForce(v)
        }
        this.mesh.rotation.z += 0.1
    }
}
