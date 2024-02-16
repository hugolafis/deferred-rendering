import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DeferredMaterial } from './DeferredMaterial';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass';
import { CompositeShader } from './CompositeShader';
import { PointLight } from './Light';
import { seededRandom } from 'three/src/math/MathUtils';

export class Viewer {
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private readonly scene: THREE.Scene;

  private readonly fsQuad: FullScreenQuad;
  private readonly gBuffer: THREE.WebGLMultipleRenderTargets;

  private readonly compositeShader: CompositeShader;

  private readonly canvasSize: THREE.Vector2;
  private readonly renderSize: THREE.Vector2;

  private readonly lights: PointLight[] = [];

  constructor(private readonly renderer: THREE.WebGLRenderer, private readonly canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(75, this.canvas.clientWidth / this.canvas.clientHeight);
    this.camera.position.set(10, 8, 10);
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.target.set(2, 0.5, 2);

    const ambient = new THREE.AmbientLight(undefined, 0.5);
    const sun = new THREE.DirectionalLight(undefined, 1.0);
    sun.position.copy(new THREE.Vector3(1, 1, 0.5).normalize());
    this.scene.add(sun);
    this.scene.add(ambient);

    this.fsQuad = new FullScreenQuad();
    const count = 3;
    // Color + Alpha, Normals + Emissive, FragPos
    this.gBuffer = new THREE.WebGLMultipleRenderTargets(1, 1, count, {
      depthBuffer: true,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
    });

    this.gBuffer.depthTexture = new THREE.DepthTexture(1, 1);

    this.compositeShader = new CompositeShader({
      tDiffuse: this.gBuffer.texture[0],
      tNormal: this.gBuffer.texture[1],
      tFragPos: this.gBuffer.texture[2],
      tDepth: this.gBuffer.depthTexture,
      cameraMatrixWorld: this.camera.matrixWorld,
    });

    this.canvasSize = new THREE.Vector2();
    this.renderSize = new THREE.Vector2();

    this.createMeshes();

    this.createLights();
  }

  readonly update = (dt: number) => {
    this.controls.update();

    // Update light positions
    const shaderLights: { brightness: number; color: THREE.Color; position: THREE.Vector3 }[] = [];
    this.lights.forEach((light, index) => {
      const time = performance.now();
      const size = 25;
      light.position.x = seededRandom(index) * size - size * 0.5 + Math.sin(index + time * 0.001) * 5;

      if (index % 2 === 0) {
        light.position.y = seededRandom(index) + 1 + Math.sin(index + time * 0.001);
      } else {
        light.position.y = seededRandom(index) + 1 + Math.cos(index + time * 0.001);
      }

      light.position.z = seededRandom(index + 1) * size - size * 0.5 + Math.cos(index + time * 0.001) * 5;

      const shaderLight = {
        brightness: light.brightness,
        color: light.color,
        position: light.position, //.clone().applyMatrix4(this.camera.matrixWorldInverse),
      };

      shaderLights.push(shaderLight);
    });

    // todo: fix this rebinding of uniforms
    this.compositeShader.uniforms.lights.value = shaderLights;

    // todo: buffer resizing
    this.canvasSize.set(
      Math.ceil(this.canvas.parentElement!.clientWidth),
      Math.ceil(this.canvas.parentElement!.clientHeight)
    );
    this.renderer.getSize(this.renderSize);
    if (!this.renderSize.equals(this.canvasSize)) {
      this.renderer.setSize(this.canvasSize.x, this.canvasSize.y, false);
      this.gBuffer.setSize(this.canvasSize.x, this.canvasSize.y);
      this.camera.aspect = this.canvasSize.x / this.canvasSize.y;
      this.camera.updateProjectionMatrix();
    }

    this.renderer.setClearAlpha(0);
    this.renderer.setRenderTarget(this.gBuffer);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setClearAlpha(1);

    this.renderer.setRenderTarget(null);
    this.fsQuad.material = this.compositeShader;
    this.fsQuad.render(this.renderer);
  };

  private createMeshes() {
    const geometry = new THREE.BoxGeometry();
    const material = new DeferredMaterial({ color: new THREE.Color(), emissive: 0 });

    const count = 16;
    const instancedMesh = new THREE.InstancedMesh(geometry, material, count * count);
    for (let x = 0; x < count; x++) {
      for (let y = 0; y < count; y++) {
        const vec = new THREE.Vector3((x - count * 0.5) * 2, 0, (y - count * 0.5) * 2);
        const matrix = new THREE.Matrix4().compose(vec, new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));

        console.log(y + count * x);
        instancedMesh.setMatrixAt(y + count * x, matrix);
      }
    }

    this.scene.add(instancedMesh);
  }

  private createLights() {
    for (let i = 0; i < 30; i++) {
      // todo - set HSL instead of RGB
      const light = new PointLight(5, new THREE.Color().setHSL(Math.random(), 1, 0.5));

      light.position.set(Math.random() * 25 - 12.5, Math.random() * 3 + 1, Math.random() * 25 - 12.5);

      this.lights.push(light);

      this.scene.add(light);
    }
  }
}
