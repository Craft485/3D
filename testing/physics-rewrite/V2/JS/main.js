import * as CANNON from './lib/cannon.js'
import * as THREE from 'https://unpkg.com/three@0.122.0/build/three.module.js'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import { levelLoader } from './level.js'

// three.js variables
let camera, scene, renderer
const meshesToUpdate = []
// let box

// cannon.js variables
let world
// let boxBody

await initThree()
initCannon()
animate()

async function initThree() {
    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000)
    camera.position.y = 30
    camera.position.z = 20

    // Scene
    scene = await levelLoader('debug')

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)

    document.body.appendChild(renderer.domElement)

    window.addEventListener('resize', onWindowResize)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 20, 0)
    controls.update()

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1)
    scene.add(ambientLight)

    const spotlight = new THREE.SpotLight(0xffffff, 0.7, 0, Math.PI / 4, 1)
    spotlight.position.set(10, 50, 20)
    spotlight.target.position.set(0, 0, 0)

    spotlight.castShadow = true

    spotlight.shadow.camera.near = 20
    spotlight.shadow.camera.far = 50
    spotlight.shadow.camera.fov = 40

    spotlight.shadow.bias = -0.001
    spotlight.shadow.mapSize.width = 2048
    spotlight.shadow.mapSize.height = 2048

    scene.add(spotlight)

    // Generic material
    // const material = new THREE.MeshLambertMaterial({ color: 0xdddddd })

    // Floor
    // const floorGeometry = new THREE.PlaneBufferGeometry(300, 300, 50, 50)
    // floorGeometry.rotateX(-Math.PI / 2)
    // const floor = new THREE.Mesh(floorGeometry, material)
    // floor.receiveShadow = true
    // scene.add(floor)

    // Thing to break
    // box = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 6), material)
    // scene.add(box)
    // box.position.set(new THREE.Vector3(0, 5, 0))
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

function initCannon() {
    world = new CANNON.World({ gravity: new CANNON.Vec3(0, -10, 0) })

    // Create a slippery material (friction coefficient = 0.0)
    const physicsMaterial = new CANNON.Material('physics')
    const physics_physics = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, {
        friction: 0.0,
        restitution: 0.3,
    })

    // We must add the contact materials to the world
    world.addContactMaterial(physics_physics)

    for (let i = 0; i < scene.children.length; i++) {
        const mesh = scene.children[i]

        // Skip lights
        if (mesh.type.toUpperCase().includes('LIGHT')) continue

        const m = i > 0 ? 1 : 0

        if (mesh.type.toUpperCase() === 'GROUP') {
            // Loop through children
            for (let j = 0; j < mesh.children.length; j++) {
                const childMesh = mesh.children[j]
                if (childMesh.type.toUpperCase().includes('LIGHT')) continue

                // Every rendered mesh will have its own rigidbody representation
                // Set position and rotation
                const body = new CANNON.Body({ mass: m, material: physicsMaterial })
                body.position = new CANNON.Vec3(childMesh.position.x, childMesh.position.y, childMesh.position.z)
                body.quaternion = new CANNON.Quaternion(childMesh.quaternion._x, childMesh.quaternion._y, childMesh.quaternion._z, childMesh.quaternion._w)

                const geometry = childMesh.geometry.type.replace(/geometry|buffer/gi, '')
                const shape = new CANNON[geometry](new CANNON.Vec3(childMesh.scale.x / 2, childMesh.scale.y / 2, childMesh.scale.z / 2))

                body.addShape(shape)
                world.addBody(body)
                meshesToUpdate.push(childMesh)
            }
        } else {
            const body = new CANNON.Body({ mass: m, material: physicsMaterial })
            body.position = new CANNON.Vec3(mesh.position.x, mesh.position.y, mesh.position.z)
            body.quaternion = new CANNON.Quaternion(mesh.quaternion._x, mesh.quaternion._y, mesh.quaternion._z, mesh.quaternion._w)    
            
            const geometry = mesh.geometry.type.replace(/geometry|buffer/gi, '')
            const shape = new CANNON[geometry](new CANNON.Vec3(mesh.scale.x / 2, mesh.scale.y / 2, mesh.scale.z / 2))
            
            body.addShape(shape)
            world.addBody(body)
            meshesToUpdate.push(mesh)
        }
    }

    // Create the ground plane
    // const groundShape = new CANNON.Plane()
    // const groundBody = new CANNON.Body({ mass: 0, material: physicsMaterial })
    // groundBody.addShape(groundShape)
    // groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    // world.addBody(groundBody)

    // Thing to break
    // const boxShape = new CANNON.Box(new CANNON.Vec3(3, 3, 3))
    // boxBody = new CANNON.Body({ mass: 1, material: physicsMaterial })
    // boxBody.addShape(boxShape)
    // boxBody.position.set(0, 5, 0)
    // world.addBody(boxBody)
}

function animate() {
    requestAnimationFrame(animate)

    // Update thing to break
    // box.position.copy(boxBody.position)
    // box.quaternion.copy(boxBody.quaternion)

    // Render three.js
    renderer.render(scene, camera)
}

window.addEventListener('keydown', (e) => {
    if (e.key === "Enter") {
        // Step the physics world
        world.fixedStep()

        // Update rendered meshes
        world.bodies.forEach( /** @param {CANNON.Body} body @param {Number} i */ (body, i) => {
            meshesToUpdate[i].position.copy(body.position)
            meshesToUpdate[i].quaternion.copy(body.quaternion)
        })
    }
})

// Expose stuff to dev tools
setTimeout(() => {window.scene=scene;window.camera=camera;window.world=world;window.meshesToUpdate=meshesToUpdate;}, 5000)