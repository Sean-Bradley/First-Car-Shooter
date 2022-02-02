import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import Physics from './physics'

export default class Moon {
    private mesh: THREE.Mesh
    body: CANNON.Body
    private targetPosMesh = new THREE.Vector3()
    private targetQuatMesh = new THREE.Quaternion()
    enabled = false

    constructor(scene: THREE.Scene, physics: Physics) {
        const material = new THREE.MeshStandardMaterial()
        material.map = new THREE.TextureLoader().load('img/moon_540x270.jpg')
        material.flatShading = false

        const normalMap = new THREE.TextureLoader().load('img/moon_normalmap.jpg')
        material.normalMap = normalMap

        this.mesh = new THREE.Mesh(new THREE.SphereGeometry(10), material)
        this.mesh.castShadow = true
        this.mesh.receiveShadow = true

        scene.add(this.mesh)

        this.body = new CANNON.Body({ mass: 0 })
        this.body.addShape(new CANNON.Sphere(10))

        physics.world.addBody(this.body)
    }

    updateTargets(gameData: any) {
        this.targetPosMesh.set(gameData.p.x, gameData.p.y, gameData.p.z)
        this.targetQuatMesh.set(
            gameData.q.x,
            gameData.q.y,
            gameData.q.z,
            gameData.q.w
        )
    }

    update() {
        this.mesh.position.lerp(this.targetPosMesh, 0.1)
        this.body.position.set(
            this.mesh.position.x,
            this.mesh.position.y,
            this.mesh.position.z
        )

        this.mesh.quaternion.slerp(this.targetQuatMesh, 0.1)
        this.body.quaternion.set(
            this.mesh.quaternion.x,
            this.mesh.quaternion.y,
            this.mesh.quaternion.z,
            this.mesh.quaternion.w
        )
        this.enabled = true
    }
}
