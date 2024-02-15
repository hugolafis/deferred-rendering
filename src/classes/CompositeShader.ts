import * as THREE from 'three';

export interface CompositeShaderParameters {
  tDiffuse: THREE.Texture;
  tNormal: THREE.Texture;
  tDepth: THREE.DepthTexture;
}

export class CompositeShader extends THREE.ShaderMaterial {
  constructor(params: CompositeShaderParameters) {
    super();

    this.glslVersion = THREE.GLSL3;
    this.uniforms.tDiffuse = { value: params.tDiffuse };
    this.uniforms.tNormal = { value: params.tNormal };
    this.uniforms.tDepth = { value: params.tDepth };

    this.vertexShader = `
      out vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    this.fragmentShader = `
      layout(location = 0) out vec4 color;

      uniform sampler2D tDiffuse;
      uniform sampler2D tNormal;
      uniform sampler2D tDepth;

      in vec2 vUv;

      void main() {
        vec4 diffuseTexel = texture( tDiffuse, vUv );
        vec4 normalTexel = texture( tNormal, vUv );
        vec4 depthTexel = texture( tDepth, vUv );

        //color = vec4( normalTexel.xyz, 1.0 );
        //color = vec4( vec3(depthTexel.r), 1.0 );
        color = diffuseTexel;
      }
    `;
  }
}
