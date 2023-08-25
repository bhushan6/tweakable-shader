# Tweakable Shader for Babylon.js

## Introduction

`TweakableShader` is a package that simplifies the process of creating and tweaking shader materials in Babylon.js. It allows you to easily adjust shader uniforms through a GUI, making it ideal for both development and debugging. The unique feature of this package is that it reads special comments in your GLSL code to automatically generate the GUI using Tweakpane.

Inspired by [this](https://github.com/luruke/magicshader/tree/master) three js package

![Description of GIF](https://github.com/bhushan6/tweakable-shader/raw/862a72a93d5426f090c1e4a96c8309ed7c12e59c/example/public/tweakbale.gif)

## Supported Data Types

The package currently supports the following data types for uniforms:

- `Color3`
- `Vector3`
- `Vector2`
- `float`
- `int`
- `time`

## Table of Contents

- [Tweakable Shader for Babylon.js](#tweakable-shader-for-babylonjs)
  - [Introduction](#introduction)
  - [Supported Data Types](#supported-data-types)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
  - [GUI Configuration](#gui-configuration)
  - [Examples](#examples)
  - [Roadmap](#roadmap)
  - [Contributing](#contributing)

## Installation

```bash
npm install tweakable-shader
```

## Usage

Here's a simple example to get you started:

```javascript
import { TweakableShader } from "tweakable-shader";

const shaderMaterial = new TweakableShader("shader-material", scene, {
  vertexShader: `...`,
  fragmentShader: `...`,
  needAlphaBlending: true,
});
```

The TweakableShader class is used to create a shader material with GUI. It accepts the following parameters:

- `name`: It is first parameter, which is passed to shader material as name and also used as folder name in Tweakpane. So its needs to be unique for each instance (required).
- `scene`: Babylon js scene in which shader material is being used
- `options`: You can pass all the shader material options here the way you'll pass it to babylon's shader material, except vertex shader and fragment shader code should be passed using `vertexShader` and `fragmentShader` as shown above.
  - `vertexShader`: glsl code of vertex shader as string
  - `fragmentShader`: glsl code of fragment shader as string
  - `timeUniform`: create time uniform if specified. Expected value `{name : <Name Of your time uniform>}`
  - And all the other options that babylon js shader material takes

## GUI Configuration

To configure the GUI for your uniforms, add special comments in your GLSL code like so:

```glsl
uniform vec3 color; // ts({ value: {r: 0, g: 255, b: 214, a: 0.5} })
uniform float brightness; // ts({ value: 1.0, min: 0, max:1.0, step: 0.1 })
```

The package will automatically parse these comments and generate the appropriate GUI using Tweakpane

## Examples

[Live demo](https://tweakable-shader.vercel.app/) of below example

```javascript
import * as BABYLON from "@babylonjs/core";
import { TweakableShader } from "tweakable-shader";

// setup babylon js basic scene
const initCamera = (scene) => {
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    0,
    0,
    10,
    new BABYLON.Vector3(0, 0, 0),
    scene
  );

  camera.attachControl(true);
  camera.setPosition(new BABYLON.Vector3(0, 0, 10));
  return camera;
};

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas);

const createScene = function (engine) {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color3(0, 0, 0);
  //CAMERA
  initCamera(scene);

  return scene;
};

const scene = createScene(engine);

engine.runRenderLoop(function () {
  scene.render();
});

window.addEventListener("resize", function () {
  engine.resize();
});

const box = BABYLON.MeshBuilder.CreateBox("box", { size: 2 });

// Create Shader material with GUI using Tweable-shader
const shaderMaterial = new TweakableShader("shader-material", scene, {
  vertexShader: `precision highp float;
                attribute vec3 position;
                uniform mat4 worldViewProjection;

                void main() {
                    vec4 p = vec4(position, 1.);
                    gl_Position = worldViewProjection * p;
                }`,
  fragmentShader: `precision highp float;
                uniform vec3 color; // ts({ value: {r: 0, g: 255, b: 214, a: 0.5} })
                uniform float brightness; // ts({ value: 1.0, min: 0, max:1.0, step: 0.1 })
                uniform float uTime;

                void main() {
                    gl_FragColor = vec4(color , brightness * sin(uTime * 0.05));
                }`,
  needAlphaBlending: true,
  timeUniform: { name: "uTime" }, // creates uTime uniform that updates in render loop
});

box.material = shaderMaterial;
```

## Roadmap

- More Examples
- Add support for more data type

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
