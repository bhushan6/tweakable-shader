import "./style.css";
import * as BABYLON from "@babylonjs/core";
import { TweakableShader } from "tweakable-shader";

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
                    gl_FragColor = vec4(color, brightness * (sin(uTime * 0.05)+1.) - 1.);
                }`,
  needAlphaBlending: true,
  timeUniform: { name: "uTime" },
});

box.material = shaderMaterial;

const box2 = BABYLON.MeshBuilder.CreateBox("box", { size: 2 });

const shaderMaterial2 = new TweakableShader("shader-material2", scene, {
  vertexShader: `precision highp float;
                attribute vec3 position;
                uniform mat4 worldViewProjection;
                attribute vec2 uv;

                varying vec2 vUv;

                void main() {
                    vec4 p = vec4(position, 1.);
                    gl_Position = worldViewProjection * p;
                    vUv = uv;
                }`,
  fragmentShader: `precision highp float;
                uniform float brightness; // ts({ value: 1.0, min: 0, max:1.0, step: 0.01 })
                uniform float uTime;

                varying vec2 vUv;

                void main() {
                    gl_FragColor = vec4(vUv.x * (sin(uTime * 0.01) + 1.) - 1., vUv.y, (sin(uTime * 0.01) + 1.) - 1. , brightness);
                }`,
  needAlphaBlending: true,
  timeUniform: { name: "uTime" },
});

box2.material = shaderMaterial2;
box2.position.x = -2;
box.position.x = 2;
