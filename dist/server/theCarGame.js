"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const player_1 = __importDefault(require("./player"));
//import Bullet from './bullet'
const physics_1 = __importDefault(require("./physics"));
//import * as CANNON from 'cannon-es'
//import Car from './car'
class TheCarGame {
    constructor(io) {
        //public gameClock = 1
        //public gamePhase = 0 //0=closed, 1=open
        //public gameId: number = 0
        //public gameWinner: string = ''
        // public resentWinners: any[] = [
        //     { screenName: 'SeanWasEre', time: 1 },
        //     { screenName: 'SeanWasEre', time: 2 },
        //     { screenName: 'SeanWasEre', time: 3 },
        //     { screenName: 'SeanWasEre', time: 4 },
        //     { screenName: 'SeanWasEre', time: 5 },
        //     { screenName: 'SeanWasEre', time: 6 },
        //     { screenName: 'SeanWasEre', time: 7 },
        //     { screenName: 'SeanWasEre', time: 8 },
        //     { screenName: 'SeanWasEre', time: 9 },
        //     { screenName: 'SeanWasEre', time: 10 },
        // ]
        //public jewel: any = {}
        this.players = {};
        //public cars: { [id: string]: Car } = {}
        this.obstacles = {};
        this.playerCount = 0;
        this.physics = new physics_1.default(io);
        io.on('connection', (socket) => {
            this.players[socket.id] = new player_1.default();
            //this.players[socket.id].canJump = true
            this.players[socket.id].screenName = 'Guest' + this.playerCount++;
            //console.log(this.players)
            console.log('a user connected : ' + socket.id);
            socket.emit('joined', socket.id, this.players[socket.id].screenName
            //this.resentWinners
            );
            this.physics.createCar(socket, this.players[socket.id]);
            socket.on('disconnect', () => {
                console.log('socket disconnected : ' + socket.id);
                if (this.players && this.players[socket.id]) {
                    console.log('deleting ' + socket.id);
                    delete this.players[socket.id];
                    this.physics.cars[socket.id].dispose();
                    delete this.physics.cars[socket.id];
                    io.emit('removePlayer', socket.id);
                }
            });
            socket.on('update', (message) => {
                //console.log(message)
                if (this.players[socket.id]) {
                    this.players[socket.id].t = message.t; //client timestamp
                    //console.log(message.keyMap)
                    const car = this.physics.cars[socket.id];
                    //console.log(message.cq)
                    car.camQuat.set(message.cq._x, message.cq._y, message.cq._z, message.cq._w); //
                    //console.log(message.tp)
                    car.turretBody.position.set(message.tp.x, message.tp.y, message.tp.z);
                    car.turretBody.quaternion.set(message.tq._x, message.tq._y, message.tq._z, message.tq._w);
                    //console.log(car.turretBody.position.x)
                    car.thrusting = false;
                    car.steering = false;
                    if (message.keyMap['w'] || message.keyMap['ArrowUp']) {
                        if (car.forwardVelocity < 25.0)
                            car.forwardVelocity += 0.5;
                        car.thrusting = true;
                    }
                    if (message.keyMap['s'] || message.keyMap['ArrowDown']) {
                        if (car.forwardVelocity > -10.0)
                            car.forwardVelocity -= 0.5;
                        car.thrusting = true;
                    }
                    if (message.keyMap['a'] || message.keyMap['ArrowLeft']) {
                        if (car.rightVelocity > -0.5)
                            car.rightVelocity -= 0.05;
                        car.steering = true;
                    }
                    if (message.keyMap['d'] || message.keyMap['ArrowRight']) {
                        if (car.rightVelocity < 0.5)
                            car.rightVelocity += 0.05;
                        car.steering = true;
                    }
                    if (message.keyMap[' ']) {
                        if (car.forwardVelocity > 0) {
                            car.forwardVelocity -= 1;
                        }
                        if (car.forwardVelocity < 0) {
                            car.forwardVelocity += 1;
                        }
                    }
                    if (!car.thrusting) {
                        //not going forward or backwards so gradually slow down
                        if (car.forwardVelocity > 0) {
                            car.forwardVelocity -= 0.25;
                        }
                        if (car.forwardVelocity < 0) {
                            car.forwardVelocity += 0.25;
                        }
                    }
                    if (!car.steering) {
                        if (car.rightVelocity > 0) {
                            car.rightVelocity -= 0.05;
                        }
                        if (car.rightVelocity < 0) {
                            car.rightVelocity += 0.05;
                        }
                    }
                }
            });
            socket.on('updateScreenName', (screenName) => {
                if (screenName.match(/^[0-9a-zA-Z]+$/) && screenName.length <= 12) {
                    this.players[socket.id].screenName = screenName;
                }
            });
            socket.on('shoot', () => {
                console.log('shoot from ' + this.players[socket.id].screenName);
                this.physics.shoot(socket.id);
            });
            this.physics.generateObstacles(this.obstacles);
        });
        setInterval(() => {
            io.emit('gameData', {
                //earthQuat: this.physics.earthBody.quaternion,
                // gameId: this.gameId,
                // gamePhase: this.gamePhase,
                // gameClock: this.gameClock,
                players: this.players,
                //(this.cars),
                obstacles: this.obstacles,
                //jewel: this.jewel,
            });
            //console.log(this.cars)
        }, 50);
        setInterval(() => {
            this.physics.world.step(0.025);
            Object.keys(this.players).forEach((p) => {
                this.physics.cars[p].update();
            });
            Object.keys(this.obstacles).forEach((o, i) => {
                this.obstacles[o].p = {
                    x: this.physics.obstacles['obstacle_' + i].position.x,
                    y: this.physics.obstacles['obstacle_' + i].position.y,
                    z: this.physics.obstacles['obstacle_' + i].position.z,
                };
                this.physics.obstacles['obstacle_' + i].quaternion.normalize();
                this.obstacles[o].q = {
                    x: this.physics.obstacles['obstacle_' + i].quaternion.x,
                    y: this.physics.obstacles['obstacle_' + i].quaternion.y,
                    z: this.physics.obstacles['obstacle_' + i].quaternion.z,
                    w: this.physics.obstacles['obstacle_' + i].quaternion.w,
                };
                //console.log(this.physics.obstacles['obstacle_' + i].quaternion.x)
            });
            // this.physics.earthBody.quaternion.y += 0.001
            // this.physics.earthBody.quaternion.normalize()
            // this.jewel.p = {
            //     x: this.physics.bodies['jewel'].position.x,
            //     y: this.physics.bodies['jewel'].position.y,
            //     z: this.physics.bodies['jewel'].position.z,
            // }
        }, 25);
        // setInterval(() => {
        //     // this.gameClock -= 1
        //     // if (this.gameClock < -5) {
        //     //     //generate new game
        //     //     //this.physics.regenerateObstacles(this.obstacles)
        //     //     //this.physics.jewelBody.wakeUp()
        //     //     this.gamePhase = 1
        //     //     this.gameClock = 10
        //     //     this.gameWinner = ''
        //     //     this.gameId += 1
        //     //     io.emit('newGame', {})
        //     // } else if (this.gameClock < 0) {
        //     //     this.gamePhase = 0
        //     //     // this.physics.jewelBody.position.x = Math.random() * 50 - 25
        //     //     // this.physics.jewelBody.position.y = Math.random() * 20 + 20
        //     //     // this.physics.jewelBody.position.z = Math.random() * 50 - 25
        //     //     // this.physics.jewelBody.velocity.set(0, 0, 0)
        //     //     // this.physics.jewelBody.angularVelocity.set(0, 0, 0)
        //     //     // this.physics.jewelBody.sleep()
        //     // }
        //     //reset out of bounds players
        //     // Object.keys(this.players).forEach((p) => {
        //     //     if (this.physics.bodies[p].position.y < -25) {
        //     //         this.physics.bodies[p].position.x = Math.random() * 50 - 25
        //     //         this.physics.bodies[p].position.y = 10
        //     //         this.physics.bodies[p].position.z = Math.random() * 50 - 25
        //     //         this.physics.bodies[p].velocity.set(0, 0, 0)
        //     //         this.physics.bodies[p].angularVelocity.set(0, 0, 0)
        //     //     }
        //     // })
        // }, 1000)
    }
}
exports.default = TheCarGame;
