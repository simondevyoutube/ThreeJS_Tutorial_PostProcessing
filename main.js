import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';

import {EffectComposer} from 'https://cdn.jsdelivr.net/npm/three@0.122/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'https://cdn.jsdelivr.net/npm/three@0.122/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'https://cdn.jsdelivr.net/npm/three@0.122/examples/jsm/postprocessing/UnrealBloomPass.js';
import {GlitchPass} from 'https://cdn.jsdelivr.net/npm/three@0.122/examples/jsm/postprocessing/GlitchPass.js';
import {ShaderPass} from 'https://cdn.jsdelivr.net/npm/three@0.122/examples/jsm/postprocessing/ShaderPass.js';
import {SSAOPass} from 'https://cdn.jsdelivr.net/npm/three@0.122/examples/jsm/postprocessing/SSAOPass.js';

import {LuminosityShader} from 'https://cdn.jsdelivr.net/npm/three@0.122/examples/jsm/shaders/LuminosityShader.js';

const _VS = `
varying vec2 vUv;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  vUv = uv;
}
`;

const _FS = `
#include <common>

uniform sampler2D tDiffuse;

varying vec2 vUv;

void main() {
  vec4 diffuse = texture2D(tDiffuse, vUv);

  gl_FragColor = (diffuse - 0.5) * 4.0 + 0.5;
}
`;

const CrapShader = {
  uniforms: {
    tDiffuse: null,
  },
  vertexShader: _VS,
  fragmentShader: _FS,
};


class PostProcessingDemo {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 500.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(75, 20, 0);

    this._scene = new THREE.Scene();

    this._composer = new EffectComposer(this._threejs);
    this._composer.addPass(new RenderPass(this._scene, this._camera));
    this._composer.addPass(new UnrealBloomPass({x: 1024, y: 1024}, 2.0, 0.0, 0.75));
    this._composer.addPass(new GlitchPass());
    this._composer.addPass(new ShaderPass(CrapShader));

    let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(20, 100, 10);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    this._scene.add(light);

    light = new THREE.AmbientLight(0x101010);
    this._scene.add(light);

    const controls = new OrbitControls(
      this._camera, this._threejs.domElement);
    controls.target.set(0, 20, 0);
    controls.update();

    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
        './resources/posx.jpg',
        './resources/negx.jpg',
        './resources/posy.jpg',
        './resources/negy.jpg',
        './resources/posz.jpg',
        './resources/negz.jpg',
    ]);
    this._scene.background = texture;

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(1000, 1000, 10, 10),
        new THREE.MeshStandardMaterial({
            color: 0x808080,
          }));
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    this._scene.add(plane);

    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(5, 1.5, 100, 16),
      new THREE.MeshStandardMaterial({
          color: 0xFFFFFF,
      }));
    knot.position.set(0, 15, 0);
    knot.castShadow = true;
    knot.receiveShadow = true;
    this._scene.add(knot);
    this._knot = knot;

    for (let x = -8; x < 8; x++) {
      for (let y = -8; y < 8; y++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(2, 10, 2),
          new THREE.MeshStandardMaterial({
              color: 0x808080,
          }));
        box.position.set(Math.random() + x * 20, Math.random() * 4.0 + 5.0, Math.random() + y * 20);
        box.castShadow = true;
        box.receiveShadow = true;
        this._scene.add(box);
      }
    }

    this._RAF();
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
    this._composer.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame(() => {
      // this._knot.rotateY(0.01);
      // this._knot.rotateZ(0.005);

      // this._threejs.render(this._scene, this._camera);
      this._composer.render();
      this._RAF();
    });
  }
}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new PostProcessingDemo();
});
