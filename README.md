# Craft's 3D POC

The scale and intention of this project will change with time, it began as a learning exercise.

[THREEJS Docs](https://threejs.org/docs/index.html)

## Concept 1 Notes: Basic Scene(Initial commit ID: [7a79f85](https://github.com/Craft485/3D/commit/7a79f85fe0dfbe9b6a256460fa55e5a56d2afd7e))

Borrows heavily from [SimonDev's YouTube](https://www.youtube.com/channel/UCEwhtpXrg5MmwlH04ANpL8A) and [Github](https://github.com/simondevyoutube/ThreeJS_Tutorial_BasicWorld)

Includes:

- Skybox

  - Found this to hit performance pretty hard as we are rendering the same static images every time

- Perspective camera with an orbit controller

- Rendering an object or three into the scene

## Concept 2 Notes: Character Controller(WIP)

I'm taking most if not all of the math for movement/rotation from [an example](https://github.com/simondevyoutube/ThreeJS_Tutorial_CharacterController) because I have yet to really understand vectors and quaternions

### General Overview

To start with I didn't focus on models or animations, a cube will suffice

Controller and input are taken care of in seperate classes in order to keep the logic decoupled
