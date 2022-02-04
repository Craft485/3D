import * as CANNON from './lib/cannon.js'
import * as THREE from 'https://unpkg.com/three@0.122.0/build/three.module.js'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import { levelLoader } from './level.js'

/**
 * Really basic example to show cannon.js integration
 * with three.js.
 * Each frame the cannon.js world is stepped forward and then
 * the position and rotation data of the boody is copied
 * over to the three.js scene.
 */

// three.js variables
let camera, scene, renderer
const renderedMeshes = []

// cannon.js variables
let world
let body

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

    // Box
    // const geometry = new THREE.BoxBufferGeometry(2, 2, 2)
    // const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })

    // mesh = new THREE.Mesh(geometry, material)
    // scene.add(mesh)
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

function initCannon() {
    world = new CANNON.World({ gravity: new CANNON.Vec3(0, -10, 0) })
    console.log(scene)
    /** @todo Maybe make this a function to minimize duplicate code */
    scene.children.forEach((obj, i) => {
        if (!obj.type.toUpperCase().includes('LIGHT') && !obj.type.toUpperCase().includes('GROUP')) {
            console.log(obj)
            // Convert THREEJS geometry names to CANNONJS
            const g = obj.geometry.type.replace(/geometry|buffer/gi, '')
            console.log(`Obj Index: ${i} | Parsed geometry name: ${g}`)
            // Diving by 2 because we need "half extents"
            const shape = new CANNON[g](new CANNON.Vec3(obj.scale.x / 2, obj.scale.y / 2, obj.scale.z / 2))
            // Everything in CANNON uses SI units
            // Should probably find a more realistic way of doing mass instead of literally everything having a mass of 1kg
            const m = i === 0 ? 0 : 1
            const body = new CANNON.Body({ mass: m })
            body.position = new CANNON.Vec3(obj.position.x, obj.position.y, obj.position.z)
            body.quaternion = new CANNON.Quaternion(obj.quaternion._x, obj.quaternion._y, obj.quaternion._z, obj.quaternion._w)
            // Used for relating whats happening in world to whats being rendered in scene
            renderedMeshes.push(obj)
            body.addShape(shape)
            world.addBody(body)
        } else if (obj.type.toUpperCase() === 'GROUP') {
            console.log(obj)
            // Add the children of a group as shapes to some group body
            const groupBody = new CANNON.Body({ mass: 1 })
            groupBody.position = new CANNON.Vec3(obj.position.x, obj.position.y, obj.position.z)
            groupBody.quaternion = new CANNON.Quaternion(obj.quaternion._x, obj.quaternion._y, obj.quaternion._z, obj.quaternion._w)
            obj.children.forEach((childObj, childIndex) => {
                const g = childObj.geometry.type.replace(/geometry|buffer/gi, '')
                console.log(`Child object of group. Group object index: ${i} | Child index: ${childIndex} | Parsed child geometry name: ${g}`)
                /** @type {CANNON.Shape} */
                const shape = new CANNON[g](new CANNON.Vec3(childObj.scale.x / 2, childObj.scale.y / 2, childObj.scale.z / 2))
                shape.quaternion
                groupBody.addShape(shape)
            })
            renderedMeshes.push(obj)
            world.addBody(groupBody)
        }
    })

    // Box
    // const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1))
    // body = new CANNON.Body({
    //     mass: 1,
    // })
    // body.addShape(shape)
    // body.angularVelocity.set(0, 10, 0)
    // body.angularDamping = 0.5
    // world.addBody(body)

    console.log(world)
}

function animate() {
    requestAnimationFrame(animate)

    // Step the physics world
    // world.fixedStep()

    /** @todo Loop through all objects in world and copy those positions to the objects in the THREEJS scene for rerendering */
    
    world.bodies.forEach( /** @param {CANNON.Body} body @param {Number} i*/ (body, i) => {
        // const meshToUpdate = scene.children.find(mesh => mesh.type === 'Group' ? mesh.children.find(childMesh => childMesh.id === shape.id) : mesh.id === shape.id)
        
    })
    
    // Copy coordinates from cannon.js to three.js
    // mesh.position.copy(body.position)
    // mesh.quaternion.copy(body.quaternion)

    // Render three.js
    renderer.render(scene, camera)
}


// world.bodies.forEach((body, i) => {
//     body.shapes.forEach(/** @param {CANNON.Shape} shape */(shape, j) => {
//         const meshToUpdate = scene.children.find(mesh => mesh.type === 'Group' ? mesh.children.find(childMesh => childMesh.id === shape.id) : mesh.id === shape.id)
//         console.log(meshToUpdate)
//         if (meshToUpdate) {
//             meshToUpdate.position.copy(body.position)
//             meshToUpdate.quaternion.copy(body.quaternion)
//         }
//     })
// })

// Debug
setTimeout(() => {window.scene=scene;window.camera=camera;window.world=world;console.log(renderedMeshes);}, 5000)

window.addEventListener('keydown', (e) => { // Also debug
    if (e.key === "Enter") {
        world.fixedStep()
        world.bodies.forEach( /** @param {CANNON.Body} body @param {Number} i */ (body, i) => {
            const renderedMesh = renderedMeshes[i]
            console.log('============================')
            console.log(body)
            console.log(renderedMesh)
            console.log('============================')
            renderedMesh.position.copy(body.position)
            renderedMesh.quaternion.copy(body.quaternion)
        })
    }
})