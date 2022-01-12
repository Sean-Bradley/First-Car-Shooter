import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module'
import Game from './game'
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer'

const scene = new THREE.Scene()

const renderer = new THREE.WebGLRenderer()
renderer.shadowMap.enabled = true
renderer.shadowMap.autoUpdate = false
//renderer.outputEncoding = THREE.sRGBEncoding
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const labelRenderer = new CSS2DRenderer()
labelRenderer.setSize(window.innerWidth, window.innerHeight)
labelRenderer.domElement.style.position = 'absolute'
labelRenderer.domElement.style.top = '0px'
labelRenderer.domElement.style.pointerEvents = 'none'
document.body.appendChild(labelRenderer.domElement)

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.set(0, 0, 2000)

const listener = new THREE.AudioListener()
camera.add(listener)

const game = new Game(scene, camera, renderer, listener, labelRenderer)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    labelRenderer.setSize(window.innerWidth, window.innerHeight)
}

const stats = Stats()
document.body.appendChild(stats.dom)

const clock = new THREE.Clock()
let delta

function animate() {
    requestAnimationFrame(animate)

    delta = Math.min(clock.getDelta(), 0.1)
    game.update(delta)

    renderer.render(scene, camera)
    labelRenderer.render(scene, camera)

    stats.update()
}

animate()

// setInterval(() => {
//     console.log((window.performance as any).memory)
// }, 5000)
