"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const player_1 = __importDefault(require("./player"));
class Game {
    constructor(io) {
        this.gameClock = 1;
        this.gamePhase = 0; //0=closed, 1=open
        this.gameId = 0;
        this.gameWinner = '';
        this.resentWinners = [
            { screenName: 'SeanWasEre', score: 10 },
            { screenName: 'SeanWasEre', score: 20 },
            { screenName: 'SeanWasEre', score: 30 },
        ];
        this.winnersCalculated = false;
        this.players = {};
        this.playerCount = 0;
        this.recalcWinnersTable = () => {
            let highestScore = 0;
            let highestScorePlayer = new player_1.default();
            Object.keys(this.players).forEach((p) => {
                console.log('score = ' + this.players[p].s);
                if (this.players[p].s > highestScore) {
                    highestScore = this.players[p].s;
                    highestScorePlayer = this.players[p];
                }
            });
            if (highestScore > 0) {
                this.gameWinner = highestScorePlayer.sn;
                this.resentWinners.push({
                    screenName: highestScorePlayer.sn,
                    score: highestScore,
                });
                while (this.resentWinners.length > 10) {
                    this.resentWinners.shift();
                }
                this.io.emit('winner', highestScorePlayer.sn, this.resentWinners);
            }
            this.winnersCalculated = true;
        };
        this.io = io;
        this.io.on('connection', (socket) => {
            this.players[socket.id] = new player_1.default();
            this.players[socket.id].sn = 'Guest' + this.playerCount++;
            //console.log(this.players)
            console.log('a user connected : ' + socket.id);
            socket.emit('joined', socket.id, this.players[socket.id].sn, this.resentWinners);
            socket.on('disconnect', () => {
                console.log('socket disconnected : ' + socket.id);
                if (this.players && this.players[socket.id]) {
                    console.log('deleting ' + socket.id);
                    delete this.players[socket.id];
                    io.emit('removePlayer', socket.id);
                }
            });
            socket.on('update', (message) => {
                if (this.players[socket.id]) {
                    this.players[socket.id].t = message.t;
                    this.players[socket.id].p = message.p;
                    this.players[socket.id].q = message.q;
                    this.players[socket.id].tp = message.tp;
                    this.players[socket.id].tq = message.tq;
                    this.players[socket.id].w[0].p = message.w[0].p;
                    this.players[socket.id].w[0].q = message.w[0].q;
                    this.players[socket.id].w[1].p = message.w[1].p;
                    this.players[socket.id].w[1].q = message.w[1].q;
                    this.players[socket.id].w[2].p = message.w[2].p;
                    this.players[socket.id].w[2].q = message.w[2].q;
                    this.players[socket.id].w[3].p = message.w[3].p;
                    this.players[socket.id].w[3].q = message.w[3].q;
                    this.players[socket.id].b[0].p = message.b[0].p;
                    //this.players[socket.id].b[0].c = message.b[0].c
                    this.players[socket.id].b[1].p = message.b[1].p;
                    //this.players[socket.id].b[1].c = message.b[1].c
                    this.players[socket.id].b[2].p = message.b[2].p;
                    //this.players[socket.id].b[2].c = message.b[2].c
                }
            });
            socket.on('updateScreenName', (screenName) => {
                if (screenName.match(/^[0-9a-zA-Z]+$/) && screenName.length <= 12) {
                    this.players[socket.id].sn = screenName;
                }
            });
            // socket.on('shoot', () => {
            //     console.log('shoot from ' + this.players[socket.id].sn)
            // })
            socket.on('hit', (p, pos, dir) => {
                console.log('notfying hit');
                // console.log(who)
                // console.log(p)
                //console.log(this.players[who])
                if (this.players[p].e) {
                    io.emit('hit', { p: p, pos: pos, dir: dir });
                    this.players[p].e = false;
                    this.players[socket.id].s += 100;
                }
            });
            socket.on('enable', () => {
                this.players[socket.id].e = true;
            });
        });
        setInterval(() => {
            this.io.emit('gameData', {
                gameId: this.gameId,
                gamePhase: this.gamePhase,
                gameClock: this.gameClock,
                players: this.players,
                //obstacles: this.obstacles,
            });
        }, 50);
        setInterval(() => {
            this.gameClock -= 1;
            if (this.gameClock < -5) {
                this.gamePhase = 1;
                this.gameClock = 60;
                this.gameWinner = '';
                this.gameId += 1;
                this.winnersCalculated = false;
                this.io.emit('newGame', {});
            }
            else if (this.gameClock < 0) {
                this.gamePhase = 0;
                if (!this.winnersCalculated) {
                    this.recalcWinnersTable();
                }
            }
        }, 1000);
    }
}
exports.default = Game;
