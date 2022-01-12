import * as CANNON from 'cannon-es'
import * as THREE from 'three'

export default class Moon {
    sphereBody: CANNON.Body

    constructor(world: CANNON.World) {
        const sphereShape = new CANNON.Sphere(10)
        this.sphereBody = new CANNON.Body({ mass: 1 })
        this.sphereBody.addShape(sphereShape)

        world.addBody(this.sphereBody)

        this.randomise()
    }

    randomise() {
        const outside = new THREE.Vector3(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
        ).normalize()
        outside.multiplyScalar(150)

        this.sphereBody.position.x = outside.x
        this.sphereBody.position.y = outside.y
        this.sphereBody.position.z = outside.z

        this.sphereBody.velocity.set(
            Math.random() * 50 - 25,
            Math.random() * 50 - 25,
            Math.random() * 50 - 25
        )
        this.sphereBody.angularVelocity.set(
            Math.random() * 5 - 2.5,
            Math.random() * 5 - 2.5,
            Math.random() * 5 - 2.5
        )
    }

    
}
