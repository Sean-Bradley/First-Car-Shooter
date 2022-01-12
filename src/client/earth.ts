import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import * as CANNON from 'cannon-es'
import CannonUtils from './utils/cannonUtils'
import Physics from './physics'
import Cosmos from './cosmos'
import Car from './car'

export default class Earth {
    mesh = new THREE.Mesh()
    lightPivot: THREE.Object3D
    earthBody = new CANNON.Body()
    ambientLight: THREE.AmbientLight
    light: THREE.DirectionalLight

    constructor(scene: THREE.Scene, physics: Physics, car: Car) {
        const earthTexture = new THREE.TextureLoader().load(
            'img/worldColour.5400x2700.jpg'
        )
        const earthMaterial = new THREE.MeshPhongMaterial() //{ wireframe: true })
        earthMaterial.map = earthTexture

        const objLoader = new OBJLoader()
        objLoader.load(
            'models/topoEarth_3.obj',
            (obj) => {
                obj.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        const m = child as THREE.Mesh
                        m.receiveShadow = true
                        m.castShadow = true
                        m.material = earthMaterial
                        this.mesh = m

                        const shape = CannonUtils.CreateTrimesh(m.geometry)
                        this.earthBody = new CANNON.Body({
                            mass: 0,
                            material: physics.groundMaterial,
                        })
                        this.earthBody.addShape(shape)
                        this.earthBody.position.x = m.position.x
                        this.earthBody.position.y = m.position.y
                        this.earthBody.position.z = m.position.z
                        this.earthBody.quaternion.x = m.quaternion.x
                        this.earthBody.quaternion.y = m.quaternion.y
                        this.earthBody.quaternion.z = m.quaternion.z
                        this.earthBody.quaternion.w = m.quaternion.w
                        physics.world.addBody(this.earthBody)

                        const startPosition = this.getSpawnPosition()
                        car.spawn(startPosition)
                    }
                })

                scene.add(obj)
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
            },
            (error) => {
                console.log(error)
            }
        )

        // this.mesh = new THREE.Mesh(
        //     new THREE.SphereGeometry(100, 16, 16),
        //     earthMaterial
        // )
        // scene.add(this.mesh)
        // this.earthBody = new CANNON.Body({
        //     mass: 0,
        //     material: physics.groundMaterial,
        // })
        // this.earthBody.addShape(new CANNON.Sphere(100))
        // physics.world.addBody(this.earthBody)
        // const startPosition = this.getSpawnPosition()
        // car.spawn(startPosition)

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
        scene.add(this.ambientLight)

        this.light = new THREE.DirectionalLight(0xffffff, 2)
        this.light.position.set(0, 0, 500)
        this.light.castShadow = true
        this.light.shadow.bias = -0.002
        this.light.shadow.mapSize.width = 512
        this.light.shadow.mapSize.height = 512
        this.light.shadow.camera.left = -150
        this.light.shadow.camera.right = 150
        this.light.shadow.camera.top = -150
        this.light.shadow.camera.bottom = 150
        this.light.shadow.camera.near = 350
        this.light.shadow.camera.far = 750

        this.lightPivot = new THREE.Object3D()
        this.lightPivot.add(this.light)
        scene.add(this.lightPivot)

        new Cosmos(scene, this.light)
    }

    getSpawnPosition(p?: THREE.Vector3) {
        const raycaster = new THREE.Raycaster()

        const outside = new THREE.Vector3()
        if (p) {
            outside.copy(p)
        } else {
            //outside.set(Math.random() * 0.2 - 0.1, 1, Math.random() * 0.2 - 0.1)
            outside.set(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            )
        }
        outside.normalize()

        const inside = new THREE.Vector3()
            .subVectors(new THREE.Vector3(), outside)
            .normalize()
        outside.multiplyScalar(200)
        raycaster.set(outside, inside)

        const intersects = raycaster.intersectObject(this.mesh, false)
        let startPosition = new THREE.Vector3()
        if (intersects.length > 0) {
            startPosition = intersects[0].point.addScaledVector(
                outside.normalize(),
                4
            )
        }
        return startPosition
    }

    update(delta: number) {
        this.lightPivot.rotation.y += delta / 4
    }
}
