"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const player_1 = __importDefault(require("./player"));
const physics_1 = __importDefault(require("./physics"));
const CANNON = __importStar(require("cannon-es"));
class Game {
    constructor(io) {
        this.gameClock = 1;
        this.gamePhase = 0; //0=closed, 1=open
        this.gameId = 0;
        this.gameWinner = '';
        this.recentWinners = [
            { screenName: 'SeanWasEre', score: 100 },
            { screenName: 'sbcode', score: 90 },
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
                this.recentWinners.push({
                    screenName: highestScorePlayer.sn,
                    score: highestScore,
                });
                //sort
                this.recentWinners.sort((a, b) => a.score < b.score ? 1 : b.score < a.score ? -1 : 0);
                //keep top 10
                while (this.recentWinners.length > 10) {
                    this.recentWinners.pop();
                }
                this.io.emit('winner', highestScorePlayer.sn, this.recentWinners);
            }
            this.winnersCalculated = true;
        };
        this.io = io;
        this.physics = new physics_1.default(io);
        this.io.on('connection', (socket) => {
            this.players[socket.id] = new player_1.default();
            this.players[socket.id].sn = 'Guest' + this.playerCount++;
            //console.log(this.players)
            console.log('a user connected : ' + socket.id);
            socket.emit('joined', socket.id, this.players[socket.id].sn, this.recentWinners);
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
                    this.players[socket.id].v = message.v;
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
                    this.players[socket.id].b[0].c = message.b[0].c;
                    this.players[socket.id].b[1].p = message.b[1].p;
                    this.players[socket.id].b[1].c = message.b[1].c;
                    this.players[socket.id].b[2].p = message.b[2].p;
                    this.players[socket.id].b[2].c = message.b[2].c;
                }
            });
            socket.on('updateScreenName', (screenName) => {
                if (screenName.match(/^[0-9a-zA-Z]+$/) && screenName.length <= 12) {
                    this.players[socket.id].sn = screenName;
                }
            });
            socket.on('hitCar', (p, pos, dir) => {
                console.log('notfying hit');
                if (this.gamePhase === 1) {
                    if (this.players[p] && this.players[p].e) {
                        io.emit('hitCar', { p: p, pos: pos, dir: dir });
                        this.players[p].e = false;
                        this.players[socket.id].s += 100;
                    }
                }
            });
            socket.on('hitMoon', (m, pos, dir) => {
                console.log('notfying hit moon');
                if (this.physics.moons[m]) {
                    const v = new CANNON.Vec3(dir.x, dir.y, dir.z).scale(Math.random() * 25);
                    this.physics.moons[m].sphereBody.velocity = v;
                    io.emit('hitMoon', pos);
                    this.players[socket.id].s += 10;
                }
            });
            socket.on('enable', () => {
                this.players[socket.id].e = true;
            });
        });
        setInterval(() => {
            const moonData = [];
            Object.keys(this.physics.moons).forEach((m) => {
                moonData.push({
                    p: {
                        x: this.physics.moons[m].sphereBody.position.x,
                        y: this.physics.moons[m].sphereBody.position.y,
                        z: this.physics.moons[m].sphereBody.position.z,
                    },
                    q: {
                        x: this.physics.moons[m].sphereBody.quaternion.x,
                        y: this.physics.moons[m].sphereBody.quaternion.y,
                        z: this.physics.moons[m].sphereBody.quaternion.z,
                        w: this.physics.moons[m].sphereBody.quaternion.w,
                    },
                });
            });
            this.io.emit('gameData', {
                gameId: this.gameId,
                gamePhase: this.gamePhase,
                gameClock: this.gameClock,
                players: this.players,
                moons: moonData,
            });
            //this.physics.world.step(0.0125)
        }, 50);
        setInterval(() => {
            this.physics.world.step(0.025);
        }, 100);
        setInterval(() => {
            this.gameClock -= 1;
            if (this.gameClock < -5) {
                this.gamePhase = 1;
                this.gameClock = 60;
                this.gameWinner = '';
                this.gameId += 1;
                this.winnersCalculated = false;
                Object.keys(this.players).forEach((p) => {
                    this.players[p].s = 0;
                });
                Object.keys(this.physics.moons).forEach((m) => {
                    this.physics.moons[m].randomise();
                });
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
