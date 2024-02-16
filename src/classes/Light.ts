import * as THREE from 'three';
import { DeferredMaterial } from './DeferredMaterial';

export class PointLight extends THREE.Mesh {
  constructor(public brightness = 1, public color = new THREE.Color()) {
    const sphereGeo = new THREE.SphereGeometry(0.1);
    const material = new DeferredMaterial({ color: new THREE.Color(), emissive: 1 });
    super(sphereGeo, material);
  }
}
