import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module'
import Game from './game'
import { io } from 'socket.io-client'

const socket = io()

const scene = new THREE.Scene()

const renderer = new THREE.WebGLRenderer()
renderer.shadowMap.enabled = true
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
)
camera.position.set(0, 0, 2000)

const listener = new THREE.AudioListener()
camera.add(listener)

const game = new Game(socket, scene, renderer, camera, listener)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

const stats = Stats()
document.body.appendChild(stats.dom)

function animate() {
    requestAnimationFrame(animate)

    game.update()

    renderer.render(scene, camera)

    stats.update()
}

animate()
