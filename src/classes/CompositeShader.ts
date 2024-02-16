import * as THREE from 'three';

export interface CompositeShaderParameters {
  tDiffuse: THREE.Texture;
  tNormal: THREE.Texture;
  tFragPos: THREE.Texture;
  cameraMatrixWorld: THREE.Matrix4;
  tDepth: THREE.DepthTexture;
  numLights: number;
}

export class CompositeShader extends THREE.ShaderMaterial {
  constructor(params: CompositeShaderParameters) {
    super();

    this.defines.NUM_LIGHTS = params.numLights;

    this.glslVersion = THREE.GLSL3;
    this.uniforms.tDiffuse = { value: params.tDiffuse };
    this.uniforms.tNormal = { value: params.tNormal };
    this.uniforms.tDepth = { value: params.tDepth };
    this.uniforms.tFragPos = { value: params.tFragPos };
    this.uniforms.cameraMatrixWorld = { value: params.cameraMatrixWorld };
    this.uniforms.lights = { value: [] };

    this.vertexShader = `
      out vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    this.fragmentShader = `
      layout(location = 0) out vec4 color;

      struct PointLight {
        float brightness;
        vec3 position;
        vec3 color;
      };

      uniform sampler2D tDiffuse;
      uniform sampler2D tNormal;
      uniform sampler2D tDepth;
      uniform sampler2D tFragPos;

      uniform mat4 cameraMatrixWorld;
      uniform PointLight lights[NUM_LIGHTS];

      in vec2 vUv;

      const vec3 sunDirection = normalize( vec3(0.35, 0.75, 0.5) );
      const PointLight testLight = PointLight(1.0, vec3(10.0, 5.0, 0.0), vec3(1.0, 0.0, 0.0)); // todo: pass these as view space
      const float lightAttentuation = 10.0;

      void getPointLightContribution(in vec3 fragPos, in vec3 normal_W, in PointLight light, inout vec3 contribution) {
        vec3 distance = light.position - fragPos;
        vec3 fragToLight = normalize( distance );
        float dotP = max( dot( normal_W, fragToLight ), 0.0 );

        float amount = (1.0 / ( 1.0 + lightAttentuation * length(distance)));

        contribution += light.color * (dotP * amount * light.brightness);
      }

      void main() {
        vec4 diffuseTexel = texture( tDiffuse, vUv );
        vec4 normalTexel = texture( tNormal, vUv );
        vec4 depthTexel = texture( tDepth, vUv );
        vec4 fragPos = texture( tFragPos, vUv );

        vec3 normal_W = ( cameraMatrixWorld * vec4( normalTexel.xyz, 0.0 ) ).xyz;

        float sunDot = dot( normal_W, sunDirection );
        vec3 frag_W = ( cameraMatrixWorld * vec4( fragPos.xyz, 1.0 ) ).xyz;

        vec3 pointLightContribution = vec3(0.0);
        for (int i = 0; i < NUM_LIGHTS; i++) {
          getPointLightContribution( frag_W, normal_W, lights[i], pointLightContribution );
        }

        vec3 directLight = diffuseTexel.rgb * (pointLightContribution);
        vec3 emissiveLight = diffuseTexel.rgb * normalTexel.w;

        //diffuseTexel.rgb = vec3(normalTexel.w);

        //color = vec4( normalTexel.xyz, 1.0 );
        //color = vec4( vec3(depthTexel.r), 1.0 );
        //color = vec4( fragPos.xyz, 1.0 );

        color = vec4( directLight + emissiveLight, 1.0 );


        //color = vec4( vec3(pointDot), 1.0 );

        //color.rgb = toneMapping( color.rgb );
        //color = linearToOutputTexel( color );

        // todo: add in tonemapping, color space
      }
    `;
  }
}
