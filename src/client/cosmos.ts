import * as THREE from 'three'
import {
    Lensflare,
    LensflareElement,
} from 'three/examples/jsm/objects/Lensflare.js'

export default class Cosmos {
    constructor(scene: THREE.Scene, light: THREE.Light) {
        const flareTexture = new THREE.TextureLoader().load('img/lensflare0.png')
        //const flareTexture1 = new THREE.TextureLoader().load('img/lensflare1.png')
        const lensflare = new Lensflare()
        lensflare.addElement(
            new LensflareElement(flareTexture, 1000, 0, light.color)
        )
        // lensflare.addElement(
        //     new LensflareElement(flareTexture1, 250, 0.2, light.color)
        // )
        light.add(lensflare)
        
        const texture = new THREE.CubeTextureLoader().load([
            'img/px_eso0932a.jpg',
            'img/nx_eso0932a.jpg',
            'img/py_eso0932a.jpg',
            'img/ny_eso0932a.jpg',
            'img/pz_eso0932a.jpg',
            'img/nz_eso0932a.jpg',
        ])
        scene.background = texture
    }
}
