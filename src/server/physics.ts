import * as CANNON from 'cannon-es'
import CannonUtils from './utils/cannonUtils'
import path from 'path'
import fs from 'fs'
import * as THREE from 'three'
import { OBJLoader } from './OBJLoader.js'
import socketIO from 'socket.io'
import Moon from './moon'

export default class Physics {
    world = new CANNON.World()

    earthSphere = new THREE.Mesh()
    earthBody = new CANNON.Body()

    public moons: { [id: string]: Moon } = {}

    io: socketIO.Server
    constructor(io: socketIO.Server) {
        this.io = io

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

        for (let i = 0; i < 10; i++) {
            this.moons[i] = new Moon(this.world)
        }

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
