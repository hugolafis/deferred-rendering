import * as THREE from 'three';

export interface CompositeShaderParameters {
  tDiffuse: THREE.Texture;
  tNormal: THREE.Texture;
  tFragPos: THREE.Texture;
  cameraMatrixWorld: THREE.Matrix4;
  tDepth: THREE.DepthTexture;
}

export class CompositeShader extends THREE.ShaderMaterial {
  constructor(params: CompositeShaderParameters) {
    super();

    this.glslVersion = THREE.GLSL3;
    this.uniforms.tDiffuse = { value: params.tDiffuse };
    this.uniforms.tNormal = { value: params.tNormal };
    this.uniforms.tDepth = { value: params.tDepth };
    this.uniforms.tFragPos = { value: params.tFragPos };
    this.uniforms.cameraMatrixWorld = { value: params.cameraMatrixWorld };

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
      uniform sampler2D tFragPos;

      uniform mat4 cameraMatrixWorld;

      in vec2 vUv;

      const vec3 sunDirection = normalize( vec3(0.35, 0.75, 0.5) );

      void main() {
        vec4 diffuseTexel = texture( tDiffuse, vUv );
        vec4 normalTexel = texture( tNormal, vUv );
        vec4 depthTexel = texture( tDepth, vUv );
        vec4 fragPos = texture( tFragPos, vUv );

        vec3 normal_W = ( cameraMatrixWorld * vec4( normalTexel.xyz, 0.0 ) ).xyz;

        float sunDot = dot( normal_W, sunDirection );

        //color = vec4( normalTexel.xyz, 1.0 );
        //color = vec4( vec3(depthTexel.r), 1.0 );
        //color = vec4( fragPos.xyz, 1.0 );
        //color = diffuseTexel;
        color = vec4( vec3(sunDot), 1.0 );
      }
    `;
  }
}
