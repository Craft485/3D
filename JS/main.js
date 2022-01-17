import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';

import { CharacterController, CharacterControllerInput } from './characterController.js'

import { levelLoader } from './level.js'

class WorldDemo {
    constructor() {
        this.init()
    }

    async init() {
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

        
        // =======================================================================================================================
        // This is being kept here in case I wish to switch from having it as a file to having it as as function on WorldDemo later
        // In other words: THIS CODE IS NOT LEGACY
        // =======================================================================================================================
        // const ll = new THREE.ObjectLoader()
        // await ll.load(
        //     // Level data URL
        //     `./levels/debug_leveldata.json`,
        //     // onLoad callback
        //     // This has to be an arrow function because of the behavior of "this"
        //     (sceneData) => {
        //         console.log(sceneData)
        //         this.scene = sceneData
        //     },
        //     // onProgress callback
        //     (xhr) => console.log( (xhr.loaded / xhr.total * 100) + '% loaded' ),
        //     // onError callback
        //     (err) => console.error( 'An error happened\n' + err )
        // )
            
        // Load level data into scene
        this.scene = await levelLoader('debug')

        this.mixers = []
        this.previousRAF = null
        // Give the levelLoader time to to its thing
        setTimeout(() => {
            this.loadModel()
            // Begin rendering cycle via RequestAnimationFrame
            this.RAF()
        }, 1000)
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
// window.addEventListener('keydown', e => { if (!e.metaKey) e.preventDefault() })