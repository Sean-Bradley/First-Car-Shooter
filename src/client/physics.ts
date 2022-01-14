import * as CANNON from 'cannon-es'

export default class Physics {
    world: CANNON.World
    groundMaterial: CANNON.Material
    wheelMaterial: CANNON.Material

    constructor() {
        this.world = new CANNON.World()
        this.world.gravity.set(0, -1, 0)

        this.groundMaterial = new CANNON.Material('groundMaterial')
        this.wheelMaterial = new CANNON.Material('wheelMaterial')
        const wheelGroundContactMaterial = new CANNON.ContactMaterial(
            this.wheelMaterial,
            this.groundMaterial,
            {
                friction: 0.4,
                restitution: 0.5,
                contactEquationStiffness: 1000,
            }
        )
        this.world.addContactMaterial(wheelGroundContactMaterial)

        this.world.addEventListener('postStep', () => {
            // Gravity towards (0,0,0)
            this.world.bodies.forEach((b) => {
                const v = new CANNON.Vec3()
                v.set(-b.position.x, -b.position.y, -b.position.z).normalize()
                v.scale(9.8, b.force)
                b.applyLocalForce(v)
                b.force.y += b.mass //cancel out world gravity
            })
        })
    }
}
