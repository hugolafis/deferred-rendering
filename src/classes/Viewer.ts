import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DeferredMaterial } from './DeferredMaterial';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass';
import { CompositeShader } from './CompositeShader';

export class Viewer {
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private readonly scene: THREE.Scene;

  private readonly fsQuad: FullScreenQuad;
  private readonly gBuffer: THREE.WebGLMultipleRenderTargets;

  private readonly compositeShader: CompositeShader;

  private readonly canvasSize: THREE.Vector2;
  private readonly renderSize: THREE.Vector2;

  constructor(private readonly renderer: THREE.WebGLRenderer, private readonly canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(75, this.canvas.clientWidth / this.canvas.clientHeight);
    this.camera.position.set(0, 1, 2);
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.target.set(0, 0.5, 0);

    const ambient = new THREE.AmbientLight(undefined, 0.5);
    const sun = new THREE.DirectionalLight(undefined, 1.0);
    sun.position.copy(new THREE.Vector3(1, 1, 0.5).normalize());
    this.scene.add(sun);
    this.scene.add(ambient);

    this.fsQuad = new FullScreenQuad();
    const count = 3;
    // Color + Alpha, Normals + Specularity, FragPos
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

    const material = new DeferredMaterial({ color: new THREE.Color(0xff0000) });
    const box = new THREE.Mesh(new THREE.BoxGeometry(), material);

    this.scene.add(box);
  }

  readonly update = (dt: number) => {
    this.controls.update();

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

    this.renderer.setRenderTarget(this.gBuffer);
    this.renderer.render(this.scene, this.camera);

    this.renderer.setRenderTarget(null);
    this.fsQuad.material = this.compositeShader;
    this.fsQuad.render(this.renderer);
  };
}
