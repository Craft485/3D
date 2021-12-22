import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

export class CharacterController {
    constructor(params, target) {
        this.params = params
        this.targetObject = target
        this.init()
    }

    init() {
        // Vector setup for character
        this.decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
        this.acceleration = new THREE.Vector3(1, 0.25, 50.0);
        this.velocity = new THREE.Vector3(0, 0, 0);
    
        this.input = new CharacterControllerInput()

        this.loadTarget()
    }

    loadTarget() {
        // In the future we could use this method to load in fbx models and animations
        this.params.scene.add(this.targetObject)
    }

    update(timeInSeconds) {
        if (!this.targetObject) return

        const v = this.velocity
        const frameDecceleration = new THREE.Vector3(
            v.x * this.decceleration.x,
            v.y * this.decceleration.y,
            v.z * this.decceleration.z
        )
        frameDecceleration.multiplyScalar(timeInSeconds)
        frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(Math.abs(frameDecceleration.z), Math.abs(v.z))

        v.add(frameDecceleration)
    
        const controlObject = this.targetObject;
        const _Q = new THREE.Quaternion();
        const _A = new THREE.Vector3();
        const _R = controlObject.quaternion.clone();
    
        const acc = this.acceleration.clone();
        if (this.input.keys.shift) acc.multiplyScalar(2.0);
    
        if (this.input.keys.control) acc.multiplyScalar(0.5)

        if (this.input.keys.forward) v.z += acc.z * timeInSeconds;

        if (this.input.keys.backward) v.z -= acc.z * timeInSeconds;

        if (this.input.keys.left) {
          _A.set(0, 1, 0);
          _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeInSeconds * this.acceleration.y);
          _R.multiply(_Q);
        }
        if (this.input.keys.right) {
          _A.set(0, 1, 0);
          _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * this.acceleration.y);
          _R.multiply(_Q);
        }
    
        controlObject.quaternion.copy(_R);
    
        const oldPosition = new THREE.Vector3();
        oldPosition.copy(controlObject.position);
    
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(controlObject.quaternion);
        forward.normalize();
    
        const sideways = new THREE.Vector3(1, 0, 0);
        sideways.applyQuaternion(controlObject.quaternion);
        sideways.normalize();
    
        sideways.multiplyScalar(v.x * timeInSeconds);
        forward.multiplyScalar(v.z * timeInSeconds);
    
        controlObject.position.add(forward);
        controlObject.position.add(sideways);
    
        oldPosition.copy(controlObject.position);    
    }
}

/**
 * Adds event listeners and keeps track of which keys are pressed
 */
export class CharacterControllerInput {
    constructor() {
        this.init()
    }

    init() {
        this.keys = {
            // W
            forward: false,
            // A
            left: false,
            // S
            backward: false,
            // D
            right: false,
            // Jump
            space: false,
            // Run
            shift: false,
            // Crouch
            control: false,
        }
        document.addEventListener('keydown', e => this.keyDown(e))
        document.addEventListener('keyup', e => this.keyUp(e), false)
    }

    /**
     * 
     * @param {KeyboardEvent} event 
     */
    keyDown(event) {
        switch (event.key) {
            case 'w':
                this.keys.forward = true
                break;
            case 'a':
                this.keys.left = true
                break;
            case 's':
                this.keys.backward = true
                break;
            case 'd':
                this.keys.right = true
                break;
            case ' ': // Space
                this.keys.space = true
                break;
            case 'Shift':
                this.keys.shift = true
                break;
            case 'Control':
                this.keys.control = true
                break;
        }
    }

    /**
     * 
     * @param {KeybordEvent} event 
     */
    keyUp(event) {
        switch (event.key) {
            case 'w':
                this.keys.forward = false
                break;
            case 'a':
                this.keys.left = false
                break;
            case 's':
                this.keys.backward = false
                break;
            case 'd':
                this.keys.right = false
                break;
            case ' ': // SPACE
                this.keys.space = false
                break;
            case 'Shift':
                this.keys.shift = false
                break;
            case 'Control':
                this.keys.control = false
                break;    
        }
    }
}