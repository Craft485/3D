# Craft's 3D POC

The scale and intention of this project will change with time, it began as a learning exercise.

[THREEJS Docs](https://threejs.org/docs/index.html)

## Concept 1 Notes: Basic Scene(Initial commit ID: [7a79f85](https://github.com/Craft485/3D/commit/7a79f85fe0dfbe9b6a256460fa55e5a56d2afd7e))

Borrows heavily from [SimonDev's YouTube](https://www.youtube.com/channel/UCEwhtpXrg5MmwlH04ANpL8A) and [Github](https://github.com/simondevyoutube/ThreeJS_Tutorial_BasicWorld)

Includes:

- Skybox

- Perspective camera with an orbit controller

- Rendering an object or three into the scene

## Concept 2 Notes: Character Controller(Initial Commit ID: [3259635](https://github.com/Craft485/TimmysWorld/commit/3259635f6aefb55c2e848973b946cfcc4aa5349d))

I'm taking most if not all of the math for movement/rotation from [an example](https://github.com/simondevyoutube/ThreeJS_Tutorial_CharacterController) because I have yet to really understand vectors and quaternions

### General Overview

To start with I didn't focus on models or animations, a cube will suffice

Controller and input are taken care of in seperate classes in order to keep the logic decoupled

### Concept 2 Part 2: Models and animations

Using [Mixamo](https://www.mixamo.com) to get models and animations

Animations:

- Idle

- Walk forwards

- Walk backwards

- Crouch while idle

- Crouch while walking either forwards or backwards

- Run forwards

What I have currently is good for the purposes of what I wanted from it.
In the future I may add more animations and/or play with blending them together to get cleaner animations.

## Concept 3 Notes: Level loading

Using a [threejs level editor](https://threejs.org/editor/) I can export a scene into a JSON file and load it in later.
Loading in scene data uses the THREEJS [ObjectLoader](https://threejs.org/docs/index.html#api/en/loaders/ObjectLoader), while the loader uses an ES6 Promise I'm not sure its 100% needed, but all I'm looking for is a working project.
Later on if need be I can switch the function from being in a seperate file to be as function on the WorldDemo class.
