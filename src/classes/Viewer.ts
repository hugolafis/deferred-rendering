import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Viewer {
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private readonly scene: THREE.Scene;

  constructor(private readonly renderer: THREE.WebGLRenderer, private readonly canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(75, this.canvas.clientWidth / this.canvas.clientHeight);
    this.camera.position.set(0, 1, 2);
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.target.set(0, 0.5, 0);

    const sun = new THREE.DirectionalLight(undefined, 1.0);
    sun.position.copy(new THREE.Vector3(1, 1, 0.5).normalize());
    this.scene.add(sun);
  }

  readonly update = (dt: number) => {
    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  };

  readonly resize = () => {
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
    this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.render(this.scene, this.camera);
  };
}
