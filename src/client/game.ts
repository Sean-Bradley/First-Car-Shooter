import * as THREE from 'three'
import UI from './ui'
import Earth from './earth'
import * as CANNON from 'cannon-es'
import Physics from './physics'
import CannonDebugRenderer from './utils/cannonDebugRenderer'
import Car from './car'
//import Moon from './moon'
import { io, Socket } from 'socket.io-client'
import Player from './player'
import Explosion from './explosion'
import Moon from './moon'
import CannonUtils from './utils/cannonUtils'

export default class Game {
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    car: Car
    earth: Earth
    physics: Physics
    cannonDebugRenderer: CannonDebugRenderer
    ui: UI
    socket: Socket
    updateInterval: any //used to update server
    myId = ''
    gamePhase: number = 0
    timestamp = 0
    players: { [id: string]: Player } = {}
    explosions: Explosion[]
    moons: { [id: string]: Moon } = {}

    constructor(
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer
    ) {
        this.scene = scene
        this.camera = camera
        this.renderer = renderer
        this.ui = new UI(this, renderer.domElement)
        this.physics = new Physics()
        this.socket = io()
        this.car = new Car(scene, camera, this.physics, this.players, this.socket)
        this.earth = new Earth(this.scene, this.physics, this.car)
        this.cannonDebugRenderer = new CannonDebugRenderer(
            this.scene,
            this.physics.world
        )
        this.explosions = [
            new Explosion(new THREE.Color(0xff0000), this.scene),
            new Explosion(new THREE.Color(0x00ff00), this.scene),
            new Explosion(new THREE.Color(0x0000ff), this.scene),
        ]
        //sockets
        this.socket.on('connect', function () {
            console.log('connected')
        })
        this.socket.on('disconnect', (message: any) => {
            console.log('disconnected ' + message)
            clearInterval(this.updateInterval)
            //todo remove other players cars
        })
        this.socket.on(
            'joined',
            (id: string, screenName: string, recentWinners: []) => {
                this.myId = id
                ;(
                    document.getElementById('screenNameInput') as HTMLInputElement
                ).value = screenName

                this.updateInterval = setInterval(() => {
                    // if (this.cars[this.myId].carFullySetup) {
                    //     this.cars[this.myId].turretPivot.getWorldPosition(
                    //         this.tmpVec
                    //     )

                    this.socket.emit('update', {
                        t: Date.now(),
                        p: this.car.frameMesh.position,
                        q: this.car.frameMesh.quaternion,
                        tp: this.car.turretMesh.position,
                        tq: this.car.turretMesh.quaternion,
                        w: [
                            {
                                p: this.car.wheelLFMesh.position,
                                q: this.car.wheelLFMesh.quaternion,
                            },
                            {
                                p: this.car.wheelRFMesh.position,
                                q: this.car.wheelRFMesh.quaternion,
                            },
                            {
                                p: this.car.wheelLBMesh.position,
                                q: this.car.wheelLBMesh.quaternion,
                            },
                            {
                                p: this.car.wheelRBMesh.position,
                                q: this.car.wheelRBMesh.quaternion,
                            },
                        ],
                        b: [
                            {
                                p: this.car.bulletMesh[0].position,
                                //c: this.car.lastBulletCounter[0]
                            },
                            {
                                p: this.car.bulletMesh[1].position,
                                //c: this.car.lastBulletCounter[1]
                            },
                            {
                                p: this.car.bulletMesh[2].position,
                                //c: this.car.lastBulletCounter[2]
                            },
                        ],
                    })
                }, 50)
                this.ui.updateScoreBoard(recentWinners)
            }
        )

        this.socket.on(
            'hit',
            (message: { p: string; pos: THREE.Vector3; dir: CANNON.Vec3 }) => {
                // console.log('hit ' + message.who)
                // console.log('hit ' + message.p)
                if ((this.gamePhase = 1)) {
                    if (message.p === this.myId) {
                        //console.log(message.dir)
                        this.car.explode(
                            new CANNON.Vec3(
                                message.dir.x,
                                message.dir.y,
                                message.dir.z
                            )
                        )
                    }
                    //console.log(message.pos.x, message.pos.y, message.pos.z)
                    this.explosions.forEach((e) => {
                        e.explode(message.pos)
                    })
                }
            }
        )

        this.socket.on('explosion', (p: THREE.Vector3) => {
            // this.explosions.forEach((e) => {
            //     e.explode(p)
            // })
            // this.explosionSound.position.copy(p)
            // if (this.explosionSound.isPlaying) {
            //     this.explosionSound.stop()
            // }
            // this.explosionSound.play()
            // console.log('playing explosion sound')
        })

        this.socket.on('winner', (screenName: string, recentWinners: []) => {
            ;(
                document.getElementById('winnerLabel') as HTMLDivElement
            ).style.display = 'block'
            ;(
                document.getElementById('winnerScreenName') as HTMLDivElement
            ).innerHTML = screenName
            this.ui.updateScoreBoard(recentWinners)
        })

        this.socket.on('newGame', () => {
            this.ui.gameClosedAlert.style.display = 'none'
            if (!this.ui.menuActive) {
                this.ui.newGameAlert.style.display = 'block'
                setTimeout(() => {
                    this.ui.newGameAlert.style.display = 'none'
                }, 2000)
            }
        })

        this.socket.on('removePlayer', (p: string) => {
            //todo dispose player
            console.log('deleting player ' + p)
            this.players[p].dispose()
            delete this.players[p]
        })

        this.socket.on('gameData', (gameData: any) => {
            if (gameData.gameClock >= 0) {
                if (this.gamePhase != 1) {
                    console.log('new game')
                    this.gamePhase = 1
                    ;(
                        document.getElementById('gameClock') as HTMLDivElement
                    ).style.display = 'block'
                    ;(
                        document.getElementById('winnerLabel') as HTMLDivElement
                    ).style.display = 'none'
                    ;(
                        document.getElementById(
                            'winnerScreenName'
                        ) as HTMLDivElement
                    ).innerHTML = ''

                    if (!this.car.enabled) {
                        this.car.fix()
                        const pos = this.earth.getSpawnPosition()
                        this.car.spawn(pos)
                        setTimeout(() => {
                            if (this.car.isUpsideDown()) {
                                this.car.spawn(pos)
                            }
                        }, 2000)
                    }
                }
                ;(
                    document.getElementById('gameClock') as HTMLDivElement
                ).innerText = Math.floor(gameData.gameClock).toString()
            } else {
                ;(
                    document.getElementById('gameClock') as HTMLDivElement
                ).style.display = 'none'
                if (
                    !this.ui.menuActive &&
                    gameData.gameClock >= -3 &&
                    this.gamePhase === 1
                ) {
                    console.log('game closed')
                    this.ui.gameClosedAlert.style.display = 'block'
                    setTimeout(() => {
                        this.ui.gameClosedAlert.style.display = 'none'
                    }, 4000)
                }
                this.gamePhase = 0
            }

            let pingStatsHtml = 'Socket Ping Stats<br/><br/>'
            Object.keys(gameData.players).forEach((p) => {
                this.timestamp = Date.now()
                pingStatsHtml +=
                    gameData.players[p].sn +
                    ' ' +
                    gameData.players[p].s +
                    ' ' +
                    (this.timestamp - gameData.players[p].t) +
                    'ms<br/>'
                if (p !== this.myId) {
                    if (!this.players[p]) {
                        console.log('adding player ' + p)
                        this.players[p] = new Player(this.scene, this.physics)
                    }
                    this.players[p].updateLerps(gameData.players[p])
                }
            })
            Object.keys(gameData.moons).forEach((m) => {
                if (!this.moons[m]) {
                    console.log('adding moon ' + m)
                    this.moons[m] = new Moon(this.scene)//, this.physics)
                }
                this.moons[m].updateLerps(gameData.moons[m])
            })
            ;(document.getElementById('pingStats') as HTMLDivElement).innerHTML =
                pingStatsHtml
        })
    }

    public update = (delta: number) => {
        this.physics.world.step(delta)

        //this.cannonDebugRenderer.update()

        this.car.update()

        Object.keys(this.players).forEach((p) => {
            this.players[p].update()
        })

        this.earth.update(delta)

        // Object.keys(this.moons).forEach((m) => {
        //     this.moons[m].update()
        // })
        this.explosions.forEach((e) => {
            e.update()
        })
    }
}
