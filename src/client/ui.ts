import Game from './game'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'
import { Vec2, XYController } from './XYController'

export default class UI {
    menuActive: boolean
    private recentWinnersTable: HTMLTableElement
    private startButton: HTMLButtonElement
    menuPanel: HTMLDivElement
    newGameAlert: HTMLDivElement
    gameClosedAlert: HTMLDivElement
    private keyCheckInterval: NodeJS.Timer
    private shadowsEnabledCheckbox: HTMLInputElement
    private shadowMapSize: HTMLSelectElement
    private ambientLightIntensity: HTMLSelectElement
    private renderer: THREE.WebGLRenderer
    private game: Game
    private camAngle = 0

    private xycontrollerLook?: XYController
    private xycontrollerMove?: XYController

    keyMap: { [id: string]: boolean } = {}

    constructor(game: Game, renderer: THREE.WebGLRenderer) {
        this.game = game
        this.renderer = renderer
        this.menuActive = false
        this.recentWinnersTable = document.getElementById(
            'recentWinnersTable'
        ) as HTMLTableElement
        this.startButton = document.getElementById(
            'startButton'
        ) as HTMLButtonElement
        this.shadowsEnabledCheckbox = document.getElementById(
            'shadowsEnabledCheckbox'
        ) as HTMLInputElement
        this.shadowMapSize = document.getElementById(
            'shadowMapSize'
        ) as HTMLSelectElement
        this.ambientLightIntensity = document.getElementById(
            'ambientLightIntensity'
        ) as HTMLSelectElement
        this.menuPanel = document.getElementById('menuPanel') as HTMLDivElement
        this.newGameAlert = document.getElementById(
            'newGameAlert'
        ) as HTMLDivElement
        this.gameClosedAlert = document.getElementById(
            'gameClosedAlert'
        ) as HTMLDivElement

        this.startButton.addEventListener(
            'click',
            () => {
                if (this.game.isMobile) {
                    this.xycontrollerLook = new XYController(
                        document.getElementById(
                            'XYControllerLook'
                        ) as HTMLCanvasElement,
                        this.onXYControllerLook
                    )
                    this.xycontrollerMove = new XYController(
                        document.getElementById(
                            'XYControllerMove'
                        ) as HTMLCanvasElement,
                        this.onXYControllerMove
                    )

                    this.menuPanel.style.display = 'none'
                    this.recentWinnersTable.style.display = 'block'
                    this.menuActive = false
                } else {
                    renderer.domElement.requestPointerLock()
                }
            },
            false
        )

        this.shadowsEnabledCheckbox.addEventListener(
            'change',
            () => {
                if (this.shadowsEnabledCheckbox.checked) {
                    //this.renderer.shadowMap.enabled = true
                    this.game.earth.light.shadow.mapSize.width = Number(
                        this.shadowMapSize.value
                    )
                    this.game.earth.light.shadow.mapSize.height = Number(
                        this.shadowMapSize.value
                    )
                    this.renderer.shadowMap.autoUpdate = true
                    this.renderer.shadowMap.needsUpdate = true
                    ;(this.game.earth.light.shadow.map as any) = null
                } else {
                    //this.renderer.shadowMap.enabled = false
                    this.renderer.shadowMap.autoUpdate = false
                    this.renderer.shadowMap.needsUpdate = true
                    ;(this.game.earth.light.shadow.map as any) = null
                    this.renderer.clear()
                }
            },
            false
        )

        this.shadowMapSize.addEventListener('change', () => {
            ;(this.game.earth.light.shadow.map as any) = null
            this.game.earth.light.shadow.mapSize.width = Number(
                this.shadowMapSize.value
            )
            this.game.earth.light.shadow.mapSize.height = Number(
                this.shadowMapSize.value
            )
        })

        this.ambientLightIntensity.addEventListener('change', () => {
            this.game.earth.ambientLight.intensity = Number(
                this.ambientLightIntensity.value
            )
        })

        document.addEventListener('pointerlockchange', this.lockChangeAlert, false)
        ;(
            document.getElementById('screenNameInput') as HTMLInputElement
        ).addEventListener('keyup', (e) => {
            if (e.key === 'Enter') blur()
        })
        ;(
            document.getElementById('screenNameInput') as HTMLInputElement
        ).addEventListener('change', (e) => {
            var letterNumber = /^[0-9a-zA-Z]+$/
            var value = (e.target as HTMLFormElement).value
            if (value.match(letterNumber) && value.length <= 12) {
                game.socket.emit(
                    'updateScreenName',
                    (e.target as HTMLFormElement).value
                )
            } else {
                alert('Alphanumeric screen names only please. Max length 12')
            }
        })

        this.keyCheckInterval = setInterval(() => {
            //key presses are checked here once every 50ms.
            const car = this.game.car
            car.thrusting = false
            car.steering = false
            if (this.keyMap['w'] || this.keyMap['ArrowUp']) {
                if (car.forwardVelocity <= 40.0) car.forwardVelocity += 1.25
                car.thrusting = true
            }
            if (this.keyMap['s'] || this.keyMap['ArrowDown']) {
                if (car.forwardVelocity >= -20.0) car.forwardVelocity -= 1.25
                car.thrusting = true
            }
            if (this.keyMap['a'] || this.keyMap['ArrowLeft']) {
                if (car.rightVelocity >= -0.6) car.rightVelocity -= 0.1
                car.steering = true
            }
            if (this.keyMap['d'] || this.keyMap['ArrowRight']) {
                if (car.rightVelocity <= 0.6) car.rightVelocity += 0.1
                car.steering = true
            }
            if (this.keyMap[' ']) {
                if (car.forwardVelocity > 0) {
                    car.forwardVelocity -= 2.5
                }
                if (car.forwardVelocity < 0) {
                    car.forwardVelocity += 2.5
                }
            }

            if (!car.thrusting) {
                //not going forward or backwards so gradually slow down
                car.forwardVelocity = this.lerp(car.forwardVelocity, 0, 0.01)
            }
            if (!car.steering) {
                //not steering, so gradually straighten steering
                car.rightVelocity = this.lerp(car.rightVelocity, 0, 0.9)
            }
        }, 50)
    }

    lerp = (x: number, y: number, a: number): number => {
        return (1 - a) * x + a * y
    }

    updateScoreBoard = (recentWinners: []) => {
        const rows = this.recentWinnersTable.rows
        var i = rows.length
        while (--i) {
            this.recentWinnersTable.deleteRow(i)
        }

        recentWinners.forEach((w: any) => {
            const row = this.recentWinnersTable.insertRow()
            const cell0 = row.insertCell(0)
            cell0.appendChild(document.createTextNode(w.screenName))
            const cell1 = row.insertCell(1)
            cell1.appendChild(document.createTextNode(w.score))
        })
    }

    lockChangeAlert = () => {
        if (
            document.pointerLockElement === this.renderer.domElement ||
            (document as any).mozPointerLockElement === this.renderer.domElement
        ) {
            this.renderer.domElement.addEventListener(
                'mousemove',
                this.onDocumentMouseMove,
                false
            )
            this.renderer.domElement.addEventListener(
                'mousewheel',
                this.onDocumentMouseWheel,
                false
            )
            document.addEventListener('click', this.onClick, false)
            document.addEventListener('keydown', this.onDocumentKey, false)
            document.addEventListener('keyup', this.onDocumentKey, false)

            this.menuPanel.style.display = 'none'
            this.recentWinnersTable.style.display = 'block'
            this.menuActive = false

            this.game.car.carSound.play()
            Object.keys(this.game.players).forEach((p) => {
                this.game.players[p].carSound.play()
            })

            new TWEEN.Tween(this.game.car.chaseCam.position)
                .to({ z: 4 })
                .easing(TWEEN.Easing.Cubic.Out)
                .start()
        } else {
            this.renderer.domElement.removeEventListener(
                'mousemove',
                this.onDocumentMouseMove,
                false
            )
            this.renderer.domElement.removeEventListener(
                'mousewheel',
                this.onDocumentMouseWheel,
                false
            )
            document.removeEventListener('click', this.onClick, false)
            document.removeEventListener('keydown', this.onDocumentKey, false)
            document.removeEventListener('keyup', this.onDocumentKey, false)
            this.menuPanel.style.display = 'block'
            this.recentWinnersTable.style.display = 'none'
            this.gameClosedAlert.style.display = 'none'
            this.newGameAlert.style.display = 'none'
            this.menuActive = true

            this.game.car.carSound.stop()
            Object.keys(this.game.players).forEach((p) => {
                this.game.players[p].carSound.stop()
            })

            new TWEEN.Tween(this.game.car.chaseCam.position)
                .to({ z: 250 })
                .easing(TWEEN.Easing.Cubic.Out)
                .start()
        }
    }

    onClick = () => {
        this.game.car.shoot()
        return false
    }

    onDocumentMouseMove = (e: MouseEvent) => {
        this.game.car.chaseCamPivot.rotation.y -= e.movementX * 0.0025
        this.camAngle += e.movementY * 0.002
        this.camAngle = Math.max(Math.min(this.camAngle, 0.5), -0.4)
        this.game.car.chaseCamPivot.position.y = this.camAngle * 4
        this.game.car.chaseCam.rotation.x = -this.camAngle

        return false
    }

    onDocumentMouseWheel = (e: THREE.Event) => {
        let newVal = this.game.car.chaseCam.position.z + e.deltaY * 0.05
        if (newVal > 0.25) {
            this.game.car.chaseCam.position.z = newVal
        }
        return false
    }

    onDocumentKey = (e: KeyboardEvent) => {
        this.keyMap[e.key] = e.type === 'keydown'
        console.log('keydown')
        if (this.keyMap['r']) {
            if (!this.game.car.enabled) {
                this.game.car.fix()
            }
            const pos = this.game.earth.getSpawnPosition()
            this.game.car.spawn(pos)
        }
    }

    onXYControllerLook = (vec2: Vec2) => {
        this.game.car.chaseCamPivot.rotation.y -= vec2.x * 0.1
        this.camAngle += vec2.y * 0.05
        this.camAngle = Math.max(Math.min(this.camAngle, 0.5), -0.4)
        this.game.car.chaseCamPivot.position.y = this.camAngle * 4
        this.game.car.chaseCam.rotation.x = -this.camAngle
    }

    onXYControllerMove = (vec2: Vec2) => {
        let forwardVelocity = vec2.y * 40
        forwardVelocity = Math.max(forwardVelocity, -20)
        this.game.car.forwardVelocity = forwardVelocity
        this.game.car.rightVelocity = vec2.x * -0.6
    }
}
