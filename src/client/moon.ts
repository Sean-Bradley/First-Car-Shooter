import * as THREE from 'three'
export default class Moon {
    mesh: THREE.Mesh
    moonMaterial: THREE.MeshStandardMaterial
    targetPos = new THREE.Vector3()
    targetQuat = new THREE.Quaternion()

    constructor(scene: THREE.Scene) {
        this.moonMaterial = new THREE.MeshStandardMaterial()
        this.moonMaterial.map = new THREE.TextureLoader().load(
            'img/moon_540x270.jpg'
        )
        this.mesh = new THREE.Mesh(new THREE.SphereGeometry(10), this.moonMaterial)
        this.mesh.castShadow = true
        this.mesh.receiveShadow = true

        scene.add(this.mesh)
    }

    update() {}
    
    // updateData(gameData: any) {
    //     this.targetPos.set(gameData.p.x, gameData.p.y, gameData.p.z)
    //     this.targetQuat.set(gameData.q.x, gameData.q.y, gameData.q.z, gameData.q.w)
    // }

    // updatePositionQuaternion() {
    //     this.mesh.position.lerp(this.targetPos, 0.1)
    //     this.mesh.quaternion.slerp(this.targetQuat, 0.1)
    // }
}
