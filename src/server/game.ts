import socketIO from 'socket.io'
import Player from './player'
import Physics from './physics'

export default class Game {
    io: socketIO.Server
    physics: Physics

    gameClock = 1
    gamePhase = 0 //0=closed, 1=open
    gameId: number = 0
    gameWinner: string = ''
    recentWinners = [
        { screenName: 'SeanWasEre', score: 30 },
        { screenName: 'SeanWasEre', score: 10 },
        { screenName: 'SeanWasEre', score: 20 },
    ]
    winnersCalculated = false

    players: { [id: string]: Player } = {}
    playerCount = 0

    constructor(io: socketIO.Server) {
        this.io = io
        this.physics = new Physics(io)

        this.io.on('connection', (socket: any) => {
            this.players[socket.id] = new Player()
            this.players[socket.id].sn = 'Guest' + this.playerCount++

            //console.log(this.players)
            console.log('a user connected : ' + socket.id)
            socket.emit(
                'joined',
                socket.id,
                this.players[socket.id].sn,
                this.recentWinners
            )

            socket.on('disconnect', () => {
                console.log('socket disconnected : ' + socket.id)
                if (this.players && this.players[socket.id]) {
                    console.log('deleting ' + socket.id)
                    delete this.players[socket.id]
                    io.emit('removePlayer', socket.id)
                }
            })

            socket.on('update', (message: any) => {
                if (this.players[socket.id]) {
                    this.players[socket.id].t = message.t
                    this.players[socket.id].p = message.p
                    this.players[socket.id].q = message.q
                    this.players[socket.id].tp = message.tp
                    this.players[socket.id].tq = message.tq
                    this.players[socket.id].w[0].p = message.w[0].p
                    this.players[socket.id].w[0].q = message.w[0].q
                    this.players[socket.id].w[1].p = message.w[1].p
                    this.players[socket.id].w[1].q = message.w[1].q
                    this.players[socket.id].w[2].p = message.w[2].p
                    this.players[socket.id].w[2].q = message.w[2].q
                    this.players[socket.id].w[3].p = message.w[3].p
                    this.players[socket.id].w[3].q = message.w[3].q
                    this.players[socket.id].b[0].p = message.b[0].p
                    //this.players[socket.id].b[0].c = message.b[0].c
                    this.players[socket.id].b[1].p = message.b[1].p
                    //this.players[socket.id].b[1].c = message.b[1].c
                    this.players[socket.id].b[2].p = message.b[2].p
                    //this.players[socket.id].b[2].c = message.b[2].c
                }
            })

            socket.on('updateScreenName', (screenName: string) => {
                if (screenName.match(/^[0-9a-zA-Z]+$/) && screenName.length <= 12) {
                    this.players[socket.id].sn = screenName
                }
            })

            // socket.on('shoot', () => {
            //     console.log('shoot from ' + this.players[socket.id].sn)
            // })

            socket.on('hit', (p: string, pos: THREE.Vector3, dir: any) => {
                console.log('notfying hit')
                // console.log(who)
                // console.log(p)
                //console.log(this.players[who])
                if (this.players[p].e) {
                    io.emit('hit', { p: p, pos: pos, dir: dir })
                    this.players[p].e = false
                    this.players[socket.id].s += 100
                }
            })

            socket.on('enable', () => {
                this.players[socket.id].e = true
            })
        })

        setInterval(() => {
            this.io.emit('gameData', {
                gameId: this.gameId,
                gamePhase: this.gamePhase,
                gameClock: this.gameClock,
                players: this.players,
                //obstacles: this.obstacles,
            })
        }, 50)

        setInterval(() => {
            this.physics.world.step(0.025)
        }, 25)

        setInterval(() => {
            this.gameClock -= 1
            if (this.gameClock < -5) {
                this.gamePhase = 1
                this.gameClock = 30
                this.gameWinner = ''
                this.gameId += 1
                this.winnersCalculated = false
                Object.keys(this.players).forEach((p) => {
                    this.players[p].s = 0
                })
                this.io.emit('newGame', {})
            } else if (this.gameClock < 0) {
                this.gamePhase = 0
                if (!this.winnersCalculated) {
                    this.recalcWinnersTable()
                }
            }
        }, 1000)
    }

    recalcWinnersTable = () => {
        let highestScore = 0
        let highestScorePlayer: Player = new Player()
        Object.keys(this.players).forEach((p) => {
            console.log('score = ' + this.players[p].s)
            if (this.players[p].s > highestScore) {
                highestScore = this.players[p].s
                highestScorePlayer = this.players[p]
            }
        })

        if (highestScore > 0) {
            this.gameWinner = highestScorePlayer.sn
            this.recentWinners.push({
                screenName: highestScorePlayer.sn,
                score: highestScore,
            })

            //sort
            this.recentWinners.sort((a: any, b: any) =>
                a.score < b.score ? 1 : b.score < a.score ? -1 : 0
            )

            //keep top 10
            while (this.recentWinners.length > 10) {
                this.recentWinners.shift()
            }

            this.io.emit('winner', highestScorePlayer.sn, this.recentWinners)
        }

        this.winnersCalculated = true
    }
}
