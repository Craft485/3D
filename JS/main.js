import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';

import { CharacterController, CharacterControllerInput } from './characterController.js'

class WorldDemo {
    constructor() {
        this.init()
    }

    init() {
        // Create and setup renderer
        this.threejs = new THREE.WebGLRenderer({
            antialias: true
        })
        this.threejs.shadowMap.enabled = true
        this.threejs.shadowMap.type = THREE.PCFSoftShadowMap
        this.threejs.setPixelRatio(window.devicePixelRatio)
        this.threejs.setSize(window.innerWidth, window.innerHeight)

        document.body.appendChild(this.threejs.domElement)

        window.addEventListener('resize', () => {
            this.onWindowResize()
        }, false)

        // Camera creation and setup
        const fov = 60
        const aspect = 1920 / 1080
        const near = 1.0
        const far = 1000.0
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
        // Set initial x, y, z coords of camera object
        this.camera.position.set(75, 20, 0)

        // Create new scene
        this.scene = new THREE.Scene()

        // Create, setup, and add a new light source
        let light = new THREE.DirectionalLight(0xFFFFFF, 1.0)
        light.position.set(20, 100, 10)
        light.target.position.set(0, 0, 0)
        light.castShadow = true
        light.shadow.bias = -0.001
        light.shadow.mapSize.width = 2048
        light.shadow.mapSize.height = 2048
        light.shadow.camera.near = 0.1
        light.shadow.camera.far = 500.0
        light.shadow.camera.near = 0.5
        light.shadow.camera.far = 500.0
        light.shadow.camera.left = 100
        light.shadow.camera.right = -100
        light.shadow.camera.top = 100
        light.shadow.camera.bottom = -100
        this.scene.add(light)

        // light = new THREE.AmbientLight(0x101010)
        // this.scene.add(light)

        // Create and setup a controller
        const controls = new OrbitControls(this.camera, this.threejs.domElement)
        controls.target.set(0, 20, 0)
        controls.update()

        // Setup and load in skybox
        const loader = new THREE.CubeTextureLoader()
        const texture = loader.load([
            './assets/skybox/posx.jpg',
            './assets/skybox/negx.jpg',
            './assets/skybox/posy.jpg',
            './assets/skybox/negy.jpg',
            './assets/skybox/posz.jpg',
            './assets/skybox/negz.jpg'
        ])
        // Skybox loading can be toggled off for performance
        this.scene.background = texture

        // Create, setup, and add a basic plane to the scene
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100, 10, 10),
            new THREE.MeshStandardMaterial({ color: 0x808080 })
        )
        plane.castShadow = false
        plane.receiveShadow = true
        plane.rotation.x = -Math.PI / 2
        this.scene.add(plane)

        // Create and setup a character mesh
        this.character = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 2),
            new THREE.MeshStandardMaterial({
                color: 0x46b6e2
            })
        )
        // Set x, y, and z values for the Vector3 position of the mesh
        this.character.position.set(0, 1, 0)
        this.character.castShadow = true
        this.character.receiveShadow = true

        // Add a few more boxes via looping
        // for (let x = -8; x < 8; x++) {
        //     for (let y = -8; y < 8; y++) {
        //       const box = new THREE.Mesh(
        //         new THREE.BoxGeometry(2, 2, 2),
        //         new THREE.MeshStandardMaterial({
        //             color: 0x808080,
        //         }));
        //       box.position.set(Math.random() + x * 5, Math.random() * 4.0 + 2.0, Math.random() + y * 5);
        //       box.castShadow = true;
        //       box.receiveShadow = true;
        //       this.scene.add(box);
        //     }
        // }

        this.mixers = []
        this.previousRAF = null
        this.loadModel()
        // Begin rendering cycle via RequestAnimationFrame
        this.RAF()
    }

    loadModel() {
        this.controls = new CharacterController({ camera: this.camera, scene: this.scene })
    }

    RAF() {
        requestAnimationFrame(t => {
            if (this.previousRAF === null) this.previousRAF = t

            this.RAF()
            
            this.threejs.render(this.scene, this.camera)
            this.step(t - this.previousRAF)
            this.previousRAF = t
        })
    }

    step(timeElapsed) {
        const timeElapsedInSeconds = timeElapsed * 0.001

        // Update animations
        if (this.mixers) this.mixers.map(m => m.update(timeElapsedInSeconds))

        // Update controls
        if (this.controls) this.controls.update(timeElapsedInSeconds)
    }
}

export let APP = null

window.addEventListener('DOMContentLoaded', () => {
    APP = new WorldDemo()
})

// This is to hopefully prevent some of the browser keyboard shortcuts from causing problems, dev tools can still be opened via chrome://inspect/#pages
// It seems as though this doesn't prevent ctrl + w unfortunatly
window.addEventListener('keydown', e => { if (!e.metaKey) e.preventDefault() })