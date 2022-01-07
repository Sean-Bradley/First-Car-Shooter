import * as CANNON from 'cannon-es'
import path from 'path'
import fs from 'fs'
import CannonUtils from './utils/cannonUtils'
import * as THREE from 'three'
import { OBJLoader } from './OBJLoader.js'
import Car from './car'
import Player from './player'
import Obstacle from './obstacle'
import { Socket } from 'socket.io'
import { Vec3 } from 'math/Vec3'

export default class Physics {
    world = new CANNON.World()
    obstacles: { [id: string]: CANNON.Body } = {}

    cars: { [id: string]: Car } = {}

    groundMaterial: CANNON.Material
    wheelMaterial: CANNON.Material
    wheelGroundContactMaterial: CANNON.ContactMaterial

    //public jewelBody: CANNON.Body = new CANNON.Body()
    public earthSphere = new THREE.Mesh()
    
    earthBody = new CANNON.Body()
    //private theCarGame: TheCarGame
    io: any

    constructor(io: any) {
        this.io = io
        //this.theCarGame = theCarGame

        this.world.gravity.set(0, -1, 0)

        this.groundMaterial = new CANNON.Material('groundMaterial')
        this.wheelMaterial = new CANNON.Material('wheelMaterial')
        this.wheelGroundContactMaterial = new CANNON.ContactMaterial(
            this.wheelMaterial,
            this.groundMaterial,
            {
                friction: 0.3,
                restitution: 0,
                contactEquationStiffness: 1000,
            }
        )
        this.world.addContactMaterial(this.wheelGroundContactMaterial)

        //const scene = new THREE.Scene()
        const loader = new OBJLoader()
        const data = fs.readFileSync(
            path.resolve(__dirname, '../client/models/topoEarth_3.obj'),
            { encoding: 'utf8', flag: 'r' }
        )

        const obj = loader.parse(data)

        obj.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
                const m = child as THREE.Mesh
                this.earthSphere = m
                const shape = CannonUtils.CreateTrimesh(this.earthSphere.geometry)
                this.earthBody = new CANNON.Body({
                    mass: 0,
                    material: this.groundMaterial,
                })
                this.earthBody.addShape(shape)
                this.earthBody.position.x = m.position.x
                this.earthBody.position.y = m.position.y
                this.earthBody.position.z = m.position.z
                this.earthBody.quaternion.x = m.quaternion.x
                this.earthBody.quaternion.y = m.quaternion.y
                this.earthBody.quaternion.z = m.quaternion.z
                this.earthBody.quaternion.w = m.quaternion.w
                this.world.addBody(this.earthBody)
            }
        })

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

    public createCar(socket: Socket, player: Player) {
        this.cars[socket.id] = new Car(
            player,
            this.world,
            this.earthSphere,
            this.wheelMaterial
        )
        this.cars[socket.id].bullet.addEventListener('collide', (e: any) => {
            //this.io.emit('explosion', this.cars[socket.id].bullet.position)

            Object.keys(this.obstacles).forEach((o, i) => {
                if (e.contact.bj.id === this.obstacles[o].id) {
                    console.log('bullet hit a moon')
                    this.io.emit('explosion', this.cars[socket.id].bullet.position)

                    const pointOfImpact = (
                        e.contact.bj.position as CANNON.Vec3
                    ).vadd(e.contact.rj) //e.contact.bj.pointToLocalFrame((e.contact.bj.position as CANNON.Vec3).vadd(e.contact.rj))
                    console.log('pointOfImpact = ' + pointOfImpact)

                    console.log(e.contact.bj.velocity)

                    //bounce of the earth and back intno orbit
                    //e.contact.bj.force.set(e.contact.bj.position.x, e.contact.bj.position.y, e.contact.bj.position.z).normalize()
                    const v = e.contact.bj.position.vsub(pointOfImpact)
                    //e.contact.bj.force.copy(pointOfImpact).normalize()
                    e.contact.bj.velocity = v.scale(Math.random() * 25)

                    //;(e.contact.bj.velocity as CANNON.Vec3)..vmul(e.contact.bj.velocity,)
                    //e.contact.bj.applyForce(e.contact.bj.velocity, pointOfImpact)
                    // e.contact.bj.velocity.x *= 10
                    // e.contact.bj.velocity.y *= 10
                    // e.contact.bj.velocity.z *= 10

                    // const up = new CANNON.Vec3()
                    // up.set(e.contact.bj.position.x, e.contact.bj.position.y, e.contact.bj.position.z).normalize()
                    // up.scale(100, e.contact.bj.force)
                    // e.contact.bj.applyLocalForce(up)
                    // e.contact.bj.force.y += e.contact.bj.mass //cancel out world gravity
                    //         // console.log(e.contact.bj.position)
                    //         // console.log(e.contact.rj)
                }
                //     //console.log(this.obstacles[e].id)
            })
            // console.log(e.contact.bi.id + ' ' + e.contact.bj.id)
        })
    }

    public shoot(id: string) {
        this.cars[id].bullet.velocity.set(0, 0, 0)
        this.cars[id].bullet.angularVelocity.set(0, 0, 0)
        let v = new THREE.Vector3(0, 0, -1)
        const q = new THREE.Quaternion()
            .set(
                this.cars[id].turretBody.quaternion.x,
                this.cars[id].turretBody.quaternion.y,
                this.cars[id].turretBody.quaternion.z,
                this.cars[id].turretBody.quaternion.w
            )
            .normalize()
        v.applyQuaternion(q)
        v.multiplyScalar(3)
        v.add(
            new THREE.Vector3(
                this.cars[id].turretBody.position.x,
                this.cars[id].turretBody.position.y,
                this.cars[id].turretBody.position.z
            )
        )

        this.cars[id].bullet.position.set(v.x, v.y, v.z)
        //console.log(this.cars[id].bullet.position)
        v = new THREE.Vector3(0, 0, -1)
        v.applyQuaternion(q)
        v.multiplyScalar(40)
        this.cars[id].bullet.velocity.set(v.x, v.y, v.z)

        this.cars[id].lastBulletCounter += 1
    }

    public generateObstacles(obstacles: { [id: string]: Obstacle }): void {
        for (let i = 0; i < 10; i++) {
            const sphereShape = new CANNON.Sphere(10)
            const sphereBody = new CANNON.Body({ mass: 1 })
            sphereBody.addShape(sphereShape)

            const outside = new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            ).normalize()
            outside.multiplyScalar(250)

            sphereBody.position.x = outside.x
            sphereBody.position.y = outside.y
            sphereBody.position.z = outside.z

            sphereBody.velocity.set(
                Math.random() * 100 - 50,
                Math.random() * 100 - 50,
                Math.random() * 100 - 50
            )
            sphereBody.angularVelocity.set(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            )

            obstacles[i] = new Obstacle()

            if (this.obstacles['obstacle_' + i]) {
                this.world.removeBody(this.obstacles['obstacle_' + i]) //remove old
            }
            this.world.addBody(sphereBody) // add new
            this.obstacles['obstacle_' + i] = sphereBody
        }
    }
}
