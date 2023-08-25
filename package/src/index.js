import * as BABYLON from "@babylonjs/core";
import { Pane } from "tweakpane";

const defaultUniforms = [
  "world",
  "worldView",
  "worldViewProjection",
  "view",
  "projection",
];

const pane = new Pane();

class TweakableShader {
  constructor(name, scene, options = {}) {
    const { vertexShader, fragmentShader, uniforms, timeUniform, ...rest } =
      options;

    if (uniforms) {
      console.warn("Passing uniform object won't make any difference");
    }

    if (!vertexShader || !fragmentShader) {
      throw Error("Provide vertex and fragment shader");
    }

    this.name = name;
    this.scene = scene;
    this.options = rest;

    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;

    this.GUIFolder = pane.addFolder({
      title: this.name,
    });

    const generatedUniforms = this.parseGLSL(fragmentShader);

    if (timeUniform && timeUniform.name) {
      this.uniforms = [
        ...defaultUniforms,
        ...generatedUniforms.map((uniform) => uniform.name),
        timeUniform.name,
      ];

      this.createTimeUniform(timeUniform.name, this.scene);
    } else {
      this.uniforms = [
        ...defaultUniforms,
        ...generatedUniforms.map((uniform) => uniform.name),
      ];
    }

    this.initShaderMaterial();

    const configsGUI = this.createGUI(generatedUniforms, this.GUIFolder);

    const babylonsUniforms = this.createUniformValues(generatedUniforms);

    this.attachEventListeners(configsGUI, generatedUniforms, babylonsUniforms);

    this.material.destroyGUI = this.destroyGUI.bind(this);

    return this.material;
  }

  initShaderMaterial() {
    BABYLON.Effect.ShadersStore["customVertexShader"] = this.vertexShader;
    BABYLON.Effect.ShadersStore["customFragmentShader"] = this.fragmentShader;

    this.material = new BABYLON.ShaderMaterial(
      this.name,
      this.scene,
      {
        vertex: "custom",
        fragment: "custom",
      },
      {
        ...this.options,
        uniforms: this.uniforms,
      }
    );
  }

  parseGLSL(glslCode) {
    const uniforms = [];

    const uniformRegex =
      /uniform\s+([\w\d_]+)\s+([\w\d_]+)\s*;?\s*\/\/\s*ts\((.+)\)/g;

    let match;
    while ((match = uniformRegex.exec(glslCode)) !== null) {
      const uniformType = match[1];
      const uniformName = match[2];

      let configs = {};

      try {
        eval(`configs = ${match[3]}`);
      } catch (e) {
        throw new Error(e);
      }

      uniforms.push({
        type: uniformType,
        name: uniformName,
        configs,
      });
    }

    return uniforms;
  }

  createGUI(uniforms, folder) {
    const PARAMS = uniforms.reduce((prevValue, currentEle) => {
      let value = currentEle.configs.value || 0;

      if (currentEle.type === "bool") {
        value = Boolean(currentEle.configs.value);
      } else if (currentEle.type === "int") {
        value = Math.round(currentEle.configs.value);
      }

      return {
        ...prevValue,
        [currentEle.name]: value,
      };
    }, {});

    const PARAMConfigs = uniforms.reduce((prevValue, currentEle) => {
      const { value, ...configs } = currentEle.configs;

      if (currentEle.type === "int") {
        configs.step = configs.step ? Math.round(configs.step) : 1;
      }

      return { ...prevValue, [currentEle.name]: configs };
    }, {});

    const configsGUI = [];

    Object.keys(PARAMS).forEach((param) => {
      try {
        const configGUI = folder.addBinding(PARAMS, param, PARAMConfigs[param]);
        configsGUI.push(configGUI);
      } catch (err) {
        console.log(err);
      }
    });

    return configsGUI;
  }

  createUniformValues(uniforms) {
    const babylonsUniforms = {};

    uniforms.forEach((uniform) => {
      if (uniform.type === "vec3") {
        const { r, g, b } = uniform.configs.value;
        if (r !== undefined && g !== undefined && b !== undefined) {
          console.log(uniform.name);
          babylonsUniforms[uniform.name] = {
            value: new BABYLON.Color3(r / 255, g / 255, b / 255),
            type: "color3",
          };
          this.material.setColor3(
            uniform.name,
            babylonsUniforms[uniform.name].value
          );
        } else {
          const { x, y, z } = uniform.configs.value;
          babylonsUniforms[uniform.name] = {
            value: new BABYLON.Vector3(x, y, z),
            type: "vec3",
          };
          this.material.setVector3(
            uniform.name,
            babylonsUniforms[uniform.name].value
          );
        }
      } else if (uniform.type === "vec2") {
        const { x, y } = uniform.configs.value;
        babylonsUniforms[uniform.name] = {
          value: new BABYLON.Vector2(x, y),
          type: "vec2",
        };
        this.material.setVector2(
          uniform.name,
          babylonsUniforms[uniform.name].value
        );
      } else if (uniform.type === "float") {
        babylonsUniforms[uniform.name] = {
          value: uniform.configs.value,
          type: "float",
        };
        this.material.setFloat(
          uniform.name,
          babylonsUniforms[uniform.name].value
        );
      } else if (uniform.type === "int") {
        babylonsUniforms[uniform.name] = {
          value: uniform.configs.value,
          type: "int",
        };
        this.material.setInt(
          uniform.name,
          babylonsUniforms[uniform.name].value
        );
      }
    });

    return babylonsUniforms;
  }

  createTimeUniform(uniform, scene) {
    let t = 0;
    scene.onBeforeRenderObservable.add(() => {
      this.material.setFloat(uniform, t);
      t++;
    });
  }

  attachEventListeners(configsGUI, uniforms, babylonsUniforms) {
    configsGUI.forEach((configGUI) => {
      configGUI.on("change", (e) => {
        const key = e.target.key;
        const uniform = uniforms.filter((u) => u.name === key)[0];
        const updatedUniformValue = e.value;
        if (babylonsUniforms[key] && babylonsUniforms[key].type === "color3") {
          babylonsUniforms[key].value.r = updatedUniformValue.r / 255;
          babylonsUniforms[key].value.g = updatedUniformValue.g / 255;
          babylonsUniforms[key].value.b = updatedUniformValue.b / 255;
          this.material.setColor3(key, babylonsUniforms[uniform.name].value);
        } else if (
          babylonsUniforms[key] &&
          babylonsUniforms[key].type === "vec3"
        ) {
          babylonsUniforms[key].value.x = updatedUniformValue.x;
          babylonsUniforms[key].value.y = updatedUniformValue.y;
          babylonsUniforms[key].value.z = updatedUniformValue.z;
          this.material.setVector3(key, babylonsUniforms[uniform.name].value);
        } else if (
          babylonsUniforms[key] &&
          babylonsUniforms[key].type === "vec2"
        ) {
          babylonsUniforms[key].value.x = updatedUniformValue.x;
          babylonsUniforms[key].value.y = updatedUniformValue.y;
          this.material.setVector2(key, babylonsUniforms[uniform.name].value);
        } else if (
          babylonsUniforms[key] &&
          babylonsUniforms[key].type === "float"
        ) {
          babylonsUniforms[uniform.name].value = updatedUniformValue;
          this.material.setFloat(key, babylonsUniforms[uniform.name].value);
        } else if (
          babylonsUniforms[key] &&
          babylonsUniforms[key].type === "int"
        ) {
          babylonsUniforms[uniform.name].value = updatedUniformValue;
          this.material.setInt(key, babylonsUniforms[uniform.name].value);
        }
      });
    });
  }

  destroyGUI(shouldDisposeAll) {
    if (shouldDisposeAll) {
      pane.dispose();
    } else {
      this.GUIFolder.dispose();
    }
  }
}

window.TweakableShader = TweakableShader;

export { TweakableShader };
