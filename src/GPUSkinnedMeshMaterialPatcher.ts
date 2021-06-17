import { Material, Shader, WebGLRenderer } from "three";
import { GPUSkeleton } from "./GPUSkeleton";

export class GPUSkinnedMeshMaterialPatcher {

    public shader: Shader;

    constructor(private baseMaterial: Material) {
    }

    patchShader(skeleton: GPUSkeleton) {
        this.baseMaterial.onBeforeCompile = (s, r) => this.onBeforeCompile(s, r, skeleton);
    }

    private onBeforeCompile(shader: Shader, renderer: WebGLRenderer, skeleton: GPUSkeleton) {

        this.shader = shader;


        let skinning_pars_vertex = `

        attribute float instanceFrameData; // currentStep

        int animSteps = ${skeleton.steps};
        int bonesCount = ${skeleton.bones.length};

        #ifdef USE_SKINNING
        
            uniform mat4 bindMatrix;
            uniform mat4 bindMatrixInverse;
        
            #ifdef BONE_TEXTURE
        
                uniform highp sampler2D boneTexture;
                uniform int boneTextureSize;
        
                // Get skinning for bone 'i' at frame 'step'
                mat4 getStepBoneMatrix( const in float i, const in int step ) {

                    // 4 pixels for 1 matrix
                    float j = float(step) * float(bonesCount) * 4.0 + i * 4.0;
                    float x = mod( j, float( boneTextureSize ) );
                    float y = floor( j / float( boneTextureSize ) );
        
                    float dx = 1.0 / float( boneTextureSize );
                    float dy = 1.0 / float( boneTextureSize );
        
                    y = dy * ( y + 0.5 );
        
                    vec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );
                    vec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );
                    vec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );
                    vec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );
        
                    mat4 bone = mat4( v1, v2, v3, v4 );
                    return bone;
                }


                mat4 getBoneMatrix( const in float i ) {
                    mat4 bone0 = getStepBoneMatrix(i, int(instanceFrameData));
                    return bone0;
                }
        
            #else
                uniform mat4 boneMatrices[ MAX_BONES ];
                mat4 getBoneMatrix( const in float i ) {
                    mat4 bone = boneMatrices[ int(i) ];
                    return bone;
                }
            #endif
        
        #endif
        `;


        shader.vertexShader = shader.vertexShader.replace('#include <skinning_pars_vertex>', skinning_pars_vertex);
    }


}