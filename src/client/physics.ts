import * as CANNON from 'cannon-es'

export default class Physics {
    world: CANNON.World
    groundMaterial: CANNON.Material
    wheelMaterial: CANNON.Material
    wheelGroundContactMaterial: CANNON.ContactMaterial

    constructor() {
        //io: any) {
        //this.io = io
        //this.theCarGame = theCarGame

        this.world = new CANNON.World()
        ;(this.world.solver as CANNON.GSSolver).iterations = 5
        this.world.gravity.set(0, -1, 0)

        this.groundMaterial = new CANNON.Material('groundMaterial')
        this.wheelMaterial = new CANNON.Material('wheelMaterial')
        this.wheelGroundContactMaterial = new CANNON.ContactMaterial(
            this.wheelMaterial,
            this.groundMaterial,
            {
                friction: 0.25,
                restitution: 0.5,
                contactEquationStiffness: 500,
            }
        )
        this.world.addContactMaterial(this.wheelGroundContactMaterial)

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
