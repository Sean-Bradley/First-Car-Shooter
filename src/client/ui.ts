import Car from './car'
import Game from './game'

export default class UI {
    public menuActive: boolean
    public recentWinnersTable: HTMLTableElement
    public startButton: HTMLButtonElement
    public menuPanel: HTMLDivElement
    public newGameAlert: HTMLDivElement
    public gameClosedAlert: HTMLDivElement
    public keyCheckInterval: NodeJS.Timer

    rendererDomElement: HTMLCanvasElement
    game: Game
    camAngle = 0

    public keyMap: { [id: string]: boolean } = {}

    constructor(game: Game, rendererDomElement: HTMLCanvasElement) {
        this.game = game
        this.rendererDomElement = rendererDomElement
        this.menuActive = true
        this.recentWinnersTable = document.getElementById(
            'recentWinnersTable'
        ) as HTMLTableElement
        this.startButton = document.getElementById(
            'startButton'
        ) as HTMLButtonElement
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
                rendererDomElement.requestPointerLock()
            },
            false
        )

        document.addEventListener('pointerlockchange', this.lockChangeAlert, false)
        ;(
            document.getElementById('screenNameInput') as HTMLInputElement
        ).addEventListener('keyup', (e) => {
            if (e.which === 13) blur()
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
                if (car.forwardVelocity > 0) {
                    car.forwardVelocity -= 0.25
                }
                if (car.forwardVelocity < 0) {
                    car.forwardVelocity += 0.25
                }
            }
            if (!car.steering) {
                if (car.rightVelocity > 0) {
                    car.rightVelocity -= 0.05
                }
                if (car.rightVelocity < 0) {
                    car.rightVelocity += 0.05
                }
            }
        }, 50)
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
            document.pointerLockElement === this.rendererDomElement ||
            (document as any).mozPointerLockElement === this.rendererDomElement
        ) {
            this.rendererDomElement.addEventListener(
                'mousemove',
                this.onDocumentMouseMove,
                false
            )
            this.rendererDomElement.addEventListener(
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
        } else {
            this.rendererDomElement.removeEventListener(
                'mousemove',
                this.onDocumentMouseMove,
                false
            )
            this.rendererDomElement.removeEventListener(
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
        }
    }

    onClick = () => {
        //this.game.socket.emit('shoot')
        this.game.car.shoot()
        //console.log("shoot")
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
}
