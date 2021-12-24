import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js'

import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js'

class CharacterControllerProxy {
    constructor(animations) {
        this._animations = animations
    }

    get animations() {
        return this._animations
    }
}

export class CharacterController {
    constructor(params) {
        this.params = params
        // Legacy constructor param
        // this.targetObject = target
        this.init()
    }

    init() {
        // Vector setup for character
        this.decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0)
        this.acceleration = new THREE.Vector3(1, 0.25, 50.0)
        this.velocity = new THREE.Vector3(0, 0, 0)
    
        this.animations = {}
        this.input = new CharacterControllerInput()
        this.stateMachine = new CharacterFSM(new CharacterControllerProxy(this.animations))

        this.loadModel()
    }

    loadModel() {
        // In the future we could use this method to load in fbx models and animations
        // this.params.scene.add(this.targetObject)
        const loader = new FBXLoader()
        loader.setPath('./assets/Timmy/')
        loader.load('model_timmy.fbx', fbx => {
            fbx.scale.setScalar(0.1)
            fbx.traverse(c => { c.castShadow = true })

            this.target = fbx
            this.params.scene.add(this.target)
    
            this.mixer = new THREE.AnimationMixer(this.target)
    
            this.manager = new THREE.LoadingManager()
            this.manager.onLoad = () => {
                this.stateMachine.setState('idle')
            }

            const onLoad = (animName, anim) => {
                const clip = anim.animations[0]
                const action = this.mixer.clipAction(clip)

                this.animations[animName] = {
                    clip: clip,
                    action: action
                }
            }

            const loader = new FBXLoader(this.manager)
            loader.setPath('./assets/Timmy/')
            loader.load('Walking.fbx', a => { onLoad('walk', a) })
            loader.load('Running.fbx', a => { onLoad('run', a) })
            loader.load('Idle.fbx', a => { onLoad('idle', a) })
            loader.load('Crouch_Idle.fbx', a => { onLoad('crouch', a) })
            loader.load('Crouched_Walking.fbx', a => onLoad('crouch_w', a))
            loader.load('Walking_Backwards.fbx', a => onLoad('walk_b', a))
        })
    }


    update(timeInSeconds) {
        if (!this.target) return

        this.stateMachine.update(timeInSeconds, this.input)

        const v = this.velocity
        const frameDecceleration = new THREE.Vector3(
            v.x * this.decceleration.x,
            v.y * this.decceleration.y,
            v.z * this.decceleration.z
        )
        frameDecceleration.multiplyScalar(timeInSeconds)
        frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(Math.abs(frameDecceleration.z), Math.abs(v.z))

        v.add(frameDecceleration)
    
        const controlObject = this.target
        const _Q = new THREE.Quaternion()
        const _A = new THREE.Vector3()
        const _R = controlObject.quaternion.clone()
    
        const acc = this.acceleration.clone()
        if (this.input.keys.shift) acc.multiplyScalar(2.0)
    
        if (this.input.keys.control) acc.multiplyScalar(0.5)

        if (this.input.keys.forward) v.z += acc.z * timeInSeconds

        if (this.input.keys.backward) v.z -= acc.z * timeInSeconds

        if (this.input.keys.left) {
            _A.set(0, 1, 0)
            _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeInSeconds * this.acceleration.y)
            _R.multiply(_Q)
        }
        if (this.input.keys.right) {
            _A.set(0, 1, 0)
            _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * this.acceleration.y)
            _R.multiply(_Q)
        }
    
        controlObject.quaternion.copy(_R)
    
        const oldPosition = new THREE.Vector3()
        oldPosition.copy(controlObject.position)
    
        const forward = new THREE.Vector3(0, 0, 1)
        forward.applyQuaternion(controlObject.quaternion)
        forward.normalize()
    
        const sideways = new THREE.Vector3(1, 0, 0)
        sideways.applyQuaternion(controlObject.quaternion)
        sideways.normalize()
    
        sideways.multiplyScalar(v.x * timeInSeconds)
        forward.multiplyScalar(v.z * timeInSeconds)
    
        controlObject.position.add(forward)
        controlObject.position.add(sideways)
    
        oldPosition.copy(controlObject.position)
        
        if (this.mixer) this.mixer.update(timeInSeconds)
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
                break
            case 'a':
                this.keys.left = true
                break
            case 's':
                this.keys.backward = true
                break
            case 'd':
                this.keys.right = true
                break
            case ' ': // Space
                this.keys.space = true
                break
            case 'Shift':
                this.keys.shift = true
                break
            case 'Control':
                this.keys.control = true
                break
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
                break
            case 'a':
                this.keys.left = false
                break
            case 's':
                this.keys.backward = false
                break
            case 'd':
                this.keys.right = false
                break
            case ' ': // SPACE
                this.keys.space = false
                break
            case 'Shift':
                this.keys.shift = false
                break
            case 'Control':
                this.keys.control = false
                break    
        }
    }
}

// ===== Animations ====

class FiniteStateMachine {
    constructor() {
        this.states = {}
        this.currentState = null
    }

    /**
     * Add a new state to the controller
     * @param {string} name Name of state
     * @param {State} type Class instance of a state
     */
    addState(name, type) {
        this.states[name] = type
    }

    setState(name) {
        const prevState = this.currentState

        if (prevState) {
            // We don't care about this call if the state we are going into we are already in
            if (prevState.Name == name) return

            prevState.exit()
        }

        // Create new instance of one of the stored states
        const state = new this.states[name](this)

        this.currentState = state
        state.enter(prevState)
    }

    update(timeElapsed, input) {
        // Call update on the instance of the state
        if (this.currentState) this.currentState.update(timeElapsed, input)
    }
}

class CharacterFSM extends FiniteStateMachine {
    constructor(proxy) {
        super(proxy)
        this.proxy = proxy
        this.init()
    }

    init() {
        this.addState('idle', IdleState)
        this.addState('walk', WalkState)
        this.addState('run', RunState)
        this.addState('crouch', CrouchIdleState)
        this.addState('crouch_w', CrouchWalkState)
        this.addState('walk_b', WalkBackwardState)
    }
}

class BaseState {
    constructor(parent) {
        this.parent = parent
    }

    enter() {}
    exit() {}
    update() {}
}

class WalkState extends BaseState {
    constructor(parent) {
        super(parent)
    }

    get Name() {
        return 'walk'
    }

    enter(prevState) {
        const curAction = this.parent.proxy.animations['walk'].action
        if (prevState) {
            const prevAction = this.parent.proxy.animations[prevState.Name].action

            curAction.enabled = true

            if (prevState.Name == 'run') {
                const ratio = curAction.getClip().duration / prevAction.getClip().duration
                curAction.time = prevAction.time * ratio
            } else {
                curAction.time = 0.0
                curAction.setEffectiveTimeScale(1.0)
                curAction.setEffectiveWeight(1.0)
            }

            curAction.crossFadeFrom(prevAction, 0.5, true)
            curAction.play()
        } else {
            curAction.play()
        }
    }

    exit() {}

    update(timeElapsed, input) {
        if (input.keys.forward || input.keys.backward) {
            if (input.keys.shift) {
                this.parent.setState('run')
            } else if (input.keys.control) {
                this.parent.setState('crouch_w')
            }
            return
        }

        this.parent.setState('idle')
    }
}

class WalkBackwardState extends BaseState {
    constructor(parent) {
        super(parent)
    }

    get Name() {
        return 'walk_b'
    }

    enter(prevState) {
        const curAction = this.parent.proxy.animations['walk_b'].action
        if (prevState) {
            const prevAction = this.parent.proxy.animations[prevState.Name].action
    
            curAction.enabled = true
    
            if (prevState.Name == 'crouch_w') {
                const ratio = curAction.getClip().duration / prevAction.getClip().duration
                curAction.time = prevAction.time * ratio
            } else {
                curAction.time = 0.0
                curAction.setEffectiveTimeScale(1.0)
                curAction.setEffectiveWeight(1.0)
            }
    
            curAction.crossFadeFrom(prevAction, 0.5, true)
            curAction.play()
        } else {
            curAction.play()
        }
    }

    exit() {}

    update(timeElapsed, input) {
        if (!input.keys.backward) {
            this.parent.setState('idle')
        } else if (input.keys.control) {
            this.parent.setState('crouch_w')
        }
    }
}

class RunState extends BaseState {
    constructor(parent) {
        super(parent)
    }

    get Name() {
        return 'run'
    }

    enter(prevState) {
      const curAction = this.parent.proxy.animations['run'].action
        if (prevState) {
            const prevAction = this.parent.proxy.animations[prevState.Name].action
    
            curAction.enabled = true
    
            if (prevState.Name == 'walk') {
                const ratio = curAction.getClip().duration / prevAction.getClip().duration
                curAction.time = prevAction.time * ratio
            } else {
                curAction.time = 0.0
                curAction.setEffectiveTimeScale(1.0)
                curAction.setEffectiveWeight(1.0)
            }
    
            curAction.crossFadeFrom(prevAction, 0.5, true)
            curAction.play()
        } else {
            curAction.play()
        }
    }
  
    exit() {}

    update(timeElapsed, input) {
        if (input.keys.forward || input.keys.backward) {
            if (!input.keys.shift) {
                this.parent.setState('walk')
            }
            return
        }
        this.parent.setState('idle')
    }
}

class IdleState extends BaseState {
    constructor(parent) {
        super(parent)
    }
  
    get Name() {
        return 'idle'
    }
  
    enter(prevState) {
        const idleAction = this.parent.proxy.animations['idle'].action
        if (prevState) {
            const prevAction = this.parent.proxy.animations[prevState.Name].action
            idleAction.time = 0.0
            idleAction.enabled = true
            idleAction.setEffectiveTimeScale(1.0)
            idleAction.setEffectiveWeight(1.0)
            idleAction.crossFadeFrom(prevAction, 0.5, true)
            idleAction.play()
        } else {
            idleAction.play()
        }
    }
  
    exit() {}

    update(_, input) {
        if (input.keys.forward) {
            this.parent.setState('walk')
        } else if (input.keys.backward) {
            this.parent.setState('walk_b')
        } else if (input.keys.control) {
            this.parent.setState('crouch')
        }
    }
}

class CrouchIdleState extends BaseState {
    constructor(parent) {
        super(parent)
    }

    get Name() {
        return 'crouch'
    }

    enter(prevState) {
        const curAction = this.parent.proxy.animations['crouch'].action
        if (prevState) {
            const prevAction = this.parent.proxy.animations[prevState.Name].action

            curAction.enabled = true

            if (prevState.Name == 'walk') {
                const ratio = curAction.getClip().duration / prevAction.getClip().duration
                curAction.time = prevAction.time * ratio
            } else {
                curAction.time = 0.0
                curAction.setEffectiveTimeScale(1.0)
                curAction.setEffectiveWeight(1.0)
            }

            curAction.crossFadeFrom(prevAction, 0.5, true)
            curAction.play()
        } else {
            curAction.play()
        }
    }

    exit() {}

    update(_, input) {
        // If we are no longer crouching return to walking
        if (!input.keys.control) {
            this.parent.setState('idle')
        }
    }
}

class CrouchWalkState extends BaseState {
    constructor(parent) {
        super(parent)
    }

    get Name() {
        return 'crouch_w'
    }

    enter(prevState) {
        const curAction = this.parent.proxy.animations['crouch_w'].action
        if (prevState) {
            const prevAction = this.parent.proxy.animations[prevState.Name].action

            curAction.enabled = true

            if (prevState.Name == 'walk') {
                const ratio = curAction.getClip().duration / prevAction.getClip().duration
                curAction.time = prevAction.time * ratio
            } else {
                curAction.time = 0.0
                curAction.setEffectiveTimeScale(1.0)
                curAction.setEffectiveWeight(1.0)
            }

            curAction.crossFadeFrom(prevAction, 0.5, true)
            curAction.play()
        } else {
            curAction.play()
        }
    }

    exit() {}

    update(timeElapsed, input) {
        // If we are no longer crouching return to appropriate state
        if (input.keys.forward || input.keys.backward) {
            if (!input.keys.control) {
                this.parent.setState(input.keys.forward ? 'walk' : 'walk_b')
            }
            return
        }

        this.parent.setState('idle')
    }
}