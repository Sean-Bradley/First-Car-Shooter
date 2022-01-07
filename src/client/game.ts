import Explosion from './explosion'
import * as THREE from 'three'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import UI from './ui'
import { Socket } from 'socket.io-client'
import Car from './car'
import Moon from './moon'
//import { Sky } from 'three/examples/jsm/objects/Sky'
import {
    Lensflare,
    LensflareElement,
} from 'three/examples/jsm/objects/Lensflare.js'

export default class Game {
    //public gamePhase: number = 0
    private timestamp = 0

    //public players: { [id: string]: THREE.Mesh } = {}
    public cars: { [id: string]: Car } = {}
    public moons: { [id: string]: Moon } = {}
    //public obstacles: { [id: string]: THREE.Mesh } = {}

    private camPos = new THREE.Vector3()
    private camQuat = new THREE.Quaternion()
    public chaseCamPivot = new THREE.Object3D()
    public chaseCam = new THREE.Object3D()

    tmpVec = new THREE.Vector3()

    private updateInterval: any

    public myId = ''

    //public isMobile = false

    public ui: UI

    //UI Input
    public vec = [0, 0]
    public spcKey = 0

    //scene
    private scene: THREE.Scene
    private renderer: THREE.WebGLRenderer
    public camera: THREE.PerspectiveCamera
    public socket: Socket

    //private sky: Sky
    //private sun: THREE.Mesh

    public cameraRotationXZOffset = 0
    public cameraRotationYOffset = 0
    public radius = 4
    public sensitivity = 0.004

    //private chaseCam: THREE.Object3D
    private ambientLight: THREE.AmbientLight
    private light: THREE.DirectionalLight
    //private helper: THREE.CameraHelper

    private lightPivot = new THREE.Object3D()

    private backGroundTexture: THREE.CubeTexture
    //private jewel = new THREE.Object3D()
    public explosions: Explosion[]
    //private sphereGeometry = new THREE.SphereBufferGeometry(1, 24, 24)
    //private cubeGeometry = new THREE.BoxBufferGeometry(2, 2, 2)
    //private sphereMaterial: THREE.MeshBasicMaterial
    //private cubeMaterial: THREE.MeshBasicMaterial
    //private cubeRenderTarget1: THREE.WebGLCubeRenderTarget
    //private cubeCamera1: THREE.CubeCamera
    //private myMaterial: THREE.MeshPhongMaterial
    //private objLoader: OBJLoader
    //private groundMirror: Reflector

    earthSphere = new THREE.Group()

    constructor(
        socket: Socket,
        scene: THREE.Scene,
        renderer: THREE.WebGLRenderer,
        camera: THREE.PerspectiveCamera
    ) {
        // if (
        //     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        //         navigator.userAgent
        //     )
        // ) {
        //     this.isMobile = true
        // }

        //threejs
        this.scene = scene
        this.renderer = renderer
        this.camera = camera
        this.socket = socket

        // this.sky = new Sky()
        // this.sky.scale.setScalar(450000)
        // scene.add(this.sky)

        this.ui = new UI(this, renderer.domElement)

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.1)
        scene.add(this.ambientLight)

        this.light = new THREE.DirectionalLight(0xffffff, 2)
        this.light.position.set(0, 0, 500)
        this.light.castShadow = true
        this.light.shadow.bias = -0.002
        this.light.shadow.mapSize.width = 16384
        this.light.shadow.mapSize.height = 16384
        this.light.shadow.camera.left = -150
        this.light.shadow.camera.right = 150
        this.light.shadow.camera.top = -150
        this.light.shadow.camera.bottom = 150
        this.light.shadow.camera.near = 350
        this.light.shadow.camera.far = 600

        // this.helper = new THREE.CameraHelper(this.light.shadow.camera)
        // scene.add(this.helper)

        // this.sun = new THREE.Mesh(
        //     new THREE.SphereGeometry(10),
        //     new THREE.MeshBasicMaterial({ color: 0xffff00 })
        // )
        // //this.sun.position.set(0, 0, 500)
        // this.light.add(this.sun)
        this.lightPivot.add(this.light)
        scene.add(this.lightPivot)

        const textureFlare0 = new THREE.TextureLoader().load('img/lensflare0.png')
        const lensflare = new Lensflare()
        lensflare.addElement(
            new LensflareElement(textureFlare0, 1000, 0, this.light.color)
        )
        this.light.add(lensflare)

        this.backGroundTexture = new THREE.CubeTextureLoader().load([
            'img/px_eso0932a.jpg',
            'img/nx_eso0932a.jpg',
            'img/py_eso0932a.jpg',
            'img/ny_eso0932a.jpg',
            'img/pz_eso0932a.jpg',
            'img/nz_eso0932a.jpg',
        ])
        scene.background = this.backGroundTexture

        this.explosions = [
            new Explosion(new THREE.Color(0xff0000), scene),
            new Explosion(new THREE.Color(0x00ff00), scene),
            new Explosion(new THREE.Color(0x0000ff), scene),
        ]

        const earthTexture = new THREE.TextureLoader().load(
            'img/worldColour.5400x2700.jpg'
        )
        const earthMaterial = new THREE.MeshPhongMaterial() //{ wireframe: true })
        earthMaterial.map = earthTexture

        const objLoader = new OBJLoader()
        objLoader.load(
            'models/topoEarth_3.obj',
            (obj) => {
                obj.traverse(function (child) {
                    if ((child as THREE.Mesh).isMesh) {
                        const m = child as THREE.Mesh
                        m.receiveShadow = true
                        m.castShadow = true
                        //earthSphere = m
                        m.material = earthMaterial
                    }
                })

                this.earthSphere = obj

                scene.add(obj)
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
            },
            (error) => {
                console.log(error)
            }
        )

        //sockets
        socket.on('connect', function () {
            console.log('connect')
        })
        socket.on('disconnect', (message: any) => {
            console.log('disconnect ' + message)
            clearInterval(this.updateInterval)
            Object.keys(this.cars).forEach((p) => {
                scene.remove(this.cars[p].frame)
                scene.remove(this.cars[p].turretPivot)
                scene.remove(this.cars[p].turretMesh)
                scene.remove(this.cars[p].wheelLFMesh)
                scene.remove(this.cars[p].wheelRFMesh)
                scene.remove(this.cars[p].wheelLBMesh)
                scene.remove(this.cars[p].wheelRBMesh)
                scene.remove(this.cars[p].bullet)
                delete this.cars[p]
            })
        })
        socket.on('joined', (id: string, screenName: string, recentWinners: []) => {
            this.myId = id
            ;(
                document.getElementById('screenNameInput') as HTMLInputElement
            ).value = screenName

            this.updateInterval = setInterval(() => {
                this.cars[this.myId].turretPivot.getWorldPosition(this.tmpVec)
                //console.log(this.cars[this.myId].turretMesh.quaternion.x)

                socket.emit('update', {
                    t: Date.now(),
                    keyMap: this.ui.keyMap,
                    cq: this.camQuat,
                    tp: this.tmpVec,
                    tq: this.cars[this.myId].turretMesh.quaternion,
                    //vec: this.vec,
                    //spc: this.spcKey,
                }) //, p: myObject3D.position, r: myObject3D.rotation })
            }, 50)
            //this.ui.updateScoreBoard(recentWinners)
        })

        socket.on('explosion', (p: THREE.Vector3) => {
            //console.log('explosion')
            this.explosions.forEach((e) => {
                e.explode(p)
            })
        })

        // socket.on(
        //     'winner',
        //     (position: THREE.Vector3, screenName: string, recentWinners: []) => {
        //         //this.jewel.visible = false
        //         this.explosions.forEach((e) => {
        //             e.explode(position)
        //         })
        //         ;(
        //             document.getElementById('winnerLabel') as HTMLDivElement
        //         ).style.display = 'block'
        //         ;(
        //             document.getElementById('winnerScreenName') as HTMLDivElement
        //         ).innerHTML = screenName
        //         this.ui.updateScoreBoard(recentWinners)
        //     }
        // )

        // socket.on('newGame', () => {
        //     // if (this.jewel) {
        //     //     this.jewel.visible = true
        //     // }
        //     this.ui.gameClosedAlert.style.display = 'none'
        //     if (!this.ui.menuActive) {
        //         this.ui.newGameAlert.style.display = 'block'
        //         setTimeout(() => {
        //             this.ui.newGameAlert.style.display = 'none'
        //         }, 2000)
        //     }
        // })

        socket.on('removePlayer', (p: string) => {
            scene.remove(this.cars[p].frame)
            scene.remove(this.cars[p].turretPivot)
            scene.remove(this.cars[p].turretMesh)
            scene.remove(this.cars[p].wheelLFMesh)
            scene.remove(this.cars[p].wheelRFMesh)
            scene.remove(this.cars[p].wheelLBMesh)
            scene.remove(this.cars[p].wheelRBMesh)
            scene.remove(this.cars[p].bullet)
            delete this.cars[p]
        })

        socket.on('gameData', (gameData: any) => {
            // console.log(gameData.earthQuat)
            // this.earthSphere.quaternion.slerp(
            //     gameData.earthQuat as THREE.Quaternion,
            //     0.1
            // )

            // if (gameData.gameClock >= 0) {
            //     if (this.gamePhase != 1) {
            //         console.log('new game')
            //         this.gamePhase = 1
            //         ;(
            //             document.getElementById('gameClock') as HTMLDivElement
            //         ).style.display = 'block'
            //         // if (this.jewel) {
            //         //     this.jewel.visible = true
            //         // }
            //         ;(
            //             document.getElementById('winnerLabel') as HTMLDivElement
            //         ).style.display = 'none'
            //         ;(
            //             document.getElementById(
            //                 'winnerScreenName'
            //             ) as HTMLDivElement
            //         ).innerHTML = ''
            //     }
            //     ;(
            //         document.getElementById('gameClock') as HTMLDivElement
            //     ).innerText = Math.floor(gameData.gameClock).toString()
            // } else {
            //     // if (this.jewel) {
            //     //     this.jewel.visible = false
            //     // }
            //     ;(
            //         document.getElementById('gameClock') as HTMLDivElement
            //     ).style.display = 'none'
            //     if (
            //         !this.ui.menuActive &&
            //         gameData.gameClock >= -3 &&
            //         this.gamePhase === 1
            //     ) {
            //         console.log('game closed')
            //         this.ui.gameClosedAlert.style.display = 'block'
            //         setTimeout(() => {
            //             this.ui.gameClosedAlert.style.display = 'none'
            //         }, 4000)
            //     }
            //     this.gamePhase = 0
            // }
            let pingStatsHtml = 'Socket Ping Stats<br/><br/>'
            Object.keys(gameData.players).forEach((p) => {
                this.timestamp = Date.now()
                pingStatsHtml +=
                    gameData.players[p].screenName +
                    ' ' +
                    (this.timestamp - gameData.players[p].t) +
                    'ms<br/>'
                if (!this.cars[p]) {
                    this.cars[p] = new Car(this.scene)
                    if (p === this.myId) {
                        this.chaseCam.position.set(0, 1.5, 4)
                        this.chaseCamPivot.add(this.chaseCam)
                        this.cars[p].frame.add(this.chaseCamPivot)
                    }
                    console.log('added player ' + p)
                    this.cars[p].name = p
                    this.cars[p].updateData(gameData.players[p])
                } else {
                    if (gameData.players[p].p) {
                        //if (p === this.myId) {

                        this.cars[p].updateData(gameData.players[p])
                        // } else {
                        //     this.cars[p].update(gameData.players[p])
                        // }
                    }
                }
            })
            Object.keys(gameData.obstacles).forEach((o) => {
                if (!this.moons[o]) {
                    this.moons[o] = new Moon(this.scene)
                } else {
                    this.moons[o].updateData(gameData.obstacles[o])
                }
                // if (!this.obstacles[o]) {
                //     console.log('adding obstacle ' + o)
                // if (gameData.obstacles[o].p) {

                //     this.obstacles[o] = new THREE.Mesh(
                //         new THREE.SphereGeometry(10),
                //         this.moonMaterial
                //     )
                //     this.obstacles[o].castShadow = true
                //     this.obstacles[o].receiveShadow = true
                //     this.obstacles[o].name = o
                //     this.obstacles[o].position.set(
                //         gameData.obstacles[o].p.x,
                //         gameData.obstacles[o].p.y,
                //         gameData.obstacles[o].p.z
                //     )
                //     scene.add(this.obstacles[o])
                // }
                // } else {
                //     if (gameData.obstacles[o].p) {
                //         this.obstacles[o].position.lerp(
                //             new THREE.Vector3(
                //                 gameData.obstacles[o].p.x,
                //                 gameData.obstacles[o].p.y,
                //                 gameData.obstacles[o].p.z
                //             ),
                //             0.1
                //         )
                //         this.obstacles[o].quaternion.slerp(
                //             new THREE.Quaternion(
                //                 gameData.obstacles[o].q.x,
                //                 gameData.obstacles[o].q.y,
                //                 gameData.obstacles[o].q.z,
                //                 gameData.obstacles[o].q.w
                //             ),
                //             0.1
                //         )
                //     }
                // }
            })
            // if (this.jewel && gameData.jewel) {
            //     if (gameData.jewel.p) {
            //         new TWEEN.Tween(this.jewel.position)
            //             .to(
            //                 {
            //                     x: gameData.jewel.p.x,
            //                     y: gameData.jewel.p.y,
            //                     z: gameData.jewel.p.z,
            //                 },
            //                 50
            //             )
            //             .start()
            //     }
            // }
            ;(document.getElementById('pingStats') as HTMLDivElement).innerHTML =
                pingStatsHtml
        })
    }

    public update = () => {
        this.chaseCam.getWorldPosition(this.camPos)
        this.camera.position.lerpVectors(this.camera.position, this.camPos, 0.2)
        this.chaseCam.getWorldQuaternion(this.camQuat)
        this.camera.quaternion.slerp(this.camQuat, 0.2)

        //this.helper.update()

        this.lightPivot.rotation.y += 0.001

        Object.keys(this.cars).forEach((c) => {
            this.cars[c].updatePositionQuaternion()
        })
        Object.keys(this.moons).forEach((m) => {
            this.moons[m].updatePositionQuaternion()
        })
        // if (!this.orbitingCamera) {
        //     chaseCamPivot.rotation.y = lerp(chaseCamPivot.rotation.y, 0, 0.05)
        // }

        // if (this.jewel) {
        //     this.jewel.rotation.x += 0.01
        //     this.jewel.rotation.y += 0.025
        // }

        this.explosions.forEach((e) => {
            e.update()
        })

        // if (this.players[this.myId]) {
        //     //this.groundMirror.visible = false
        //     this.players[this.myId].visible = false
        //     this.cubeCamera1.position.copy(this.players[this.myId].position)
        //     this.cubeCamera1.update(this.renderer, this.scene)
        //     //this.groundMirror.visible = true
        //     this.players[this.myId].visible = true
        // }

        TWEEN.update()
    }
}
