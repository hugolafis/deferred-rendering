import * as THREE from 'three';

export interface DeferredMaterialParameters {
  color: THREE.Color;
  emissive: number;
}

export interface DeferredMaterialUniforms {
  color: THREE.IUniform<THREE.Color>;
  emissive: THREE.IUniform<number>;
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
    this.uniforms.emissive = { value: params.emissive };

    this.vertexShader = `
      out vec3 vNormal;
      out vec3 vFragPos;

      void main() {
        vNormal = normalize( normalMatrix * normal );

        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        vFragPos = mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    this.fragmentShader = `
      layout(location = 0) out vec4 albedo;
      layout(location = 1) out vec4 normal;
      layout(location = 2) out vec4 fragPos;

      uniform vec3 color;
      uniform float emissive;

      in vec3 vNormal;
      in vec3 vFragPos;

      void main() {
        normal = vec4( vNormal, emissive );
        albedo = vec4( color, 1.0 );
        fragPos = vec4( vFragPos, 0.0 );
      }
    `;
  }
}
