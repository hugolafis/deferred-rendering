import * as THREE from 'three';

export interface DeferredMaterialParameters {
  color: THREE.Color;
}

export interface DeferredMaterialUniforms {
  color: THREE.IUniform<THREE.Color>;
}

interface BaseUniforms {
  [uniform: string]: THREE.IUniform;
}

export class DeferredMaterial extends THREE.ShaderMaterial {
  declare uniforms: BaseUniforms & DeferredMaterialUniforms;

  constructor(params: DeferredMaterialParameters) {
    super();

    this.glslVersion = THREE.GLSL3;
    this.uniforms.color = { value: params.color };

    this.vertexShader = `
      out vec3 vNormal;

      void main() {
        vNormal = normalize( normalMatrix * normal );
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    this.fragmentShader = `
      layout(location = 0) out vec4 albedo;
      layout(location = 1) out vec4 normal;

      uniform vec3 color;

      in vec3 vNormal;

      void main() {
        normal = vec4( vNormal, 0.0 );
        albedo = vec4( color, 1.0 );
      }
    `;
  }
}
