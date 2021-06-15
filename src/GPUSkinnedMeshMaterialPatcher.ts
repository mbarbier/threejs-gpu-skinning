import { Material, MathUtils, Shader, WebGLRenderer } from "three";
import { GPUSkeleton } from "./GPUSkeleton";

export class GPUSkinnedMeshMaterialPatcher {

    private ellapsed = 0;

    private shader: Shader;

    constructor(baseMaterial: Material, private skeleton: GPUSkeleton) {
        baseMaterial.onBeforeCompile = (s, r) => this.onBeforeCompile(s, r);
    }


    private onBeforeCompile(shader: Shader, renderer: WebGLRenderer) {
        this.shader = shader;

        shader.uniforms["currentStep"] = { value: 0 };
        shader.uniforms["nextStep"] = { value: 0 };
        shader.uniforms["stepLerp"] = { value: 0 };

        let skinning_pars_vertex = `

        vec4 slerp(vec4 a, vec4 b, float t) {
            // if either input is zero, return the other.
            if (length(a) == 0.0) {
                if (length(b) == 0.0) {
                    return vec4(0, 0, 0, 1);
                }
                return b;
            } else if (length(b) == 0.0) {
                return a;
            }
        
            float cosHalfAngle = a.w * b.w + dot(a.xyz, b.xyz);
        
            if (cosHalfAngle >= 1.0 || cosHalfAngle <= -1.0) {
                return a;
            } else if (cosHalfAngle < 0.0) {
                b.xyz = -b.xyz;
                b.w = -b.w;
                cosHalfAngle = -cosHalfAngle;
            }
        
            float blendA;
            float blendB;
            if (cosHalfAngle < 0.99) {
                // do proper slerp for big angles
                float halfAngle = acos(cosHalfAngle);
                float sinHalfAngle = sin(halfAngle);
                float oneOverSinHalfAngle = 1.0 / sinHalfAngle;
                blendA = sin(halfAngle * (1.0 - t)) * oneOverSinHalfAngle;
                blendB = sin(halfAngle * t) * oneOverSinHalfAngle;
            } else {
                // do lerp if angle is really small.
                blendA = 1.0 - t;
                blendB = t;
            }
        
            vec4 result = vec4(blendA * a.xyz + blendB * b.xyz, blendA * a.w + blendB * b.w);
            if (length(result) > 0.0) {
                return normalize(result);
            }
            return vec4(0, 0, 0, 1);
        }

        vec4 matrix_to_quaternion(in mat4 m) {
            float tr = m[0][0] + m[1][1] + m[2][2];
            vec4 q = vec4(0, 0, 0, 0);
            if (tr > 0.0)
            {
                float s = sqrt(tr + 1.0) * 2.0; // S=4*qw 
                q.w = 0.25 * s;
                q.x = (m[2][1] - m[1][2]) / s;
                q.y = (m[0][2] - m[2][0]) / s;
                q.z = (m[1][0] - m[0][1]) / s;
            }
            else if ((m[0][0] > m[1][1]) && (m[0][0] > m[2][2]))
            {
                float s = sqrt(1.0 + m[0][0] - m[1][1] - m[2][2]) * 2.0; // S=4*qx 
                q.w = (m[2][1] - m[1][2]) / s;
                q.x = 0.25 * s;
                q.y = (m[0][1] + m[1][0]) / s;
                q.z = (m[0][2] + m[2][0]) / s;
            }
            else if (m[1][1] > m[2][2])
            {
                float s = sqrt(1.0 + m[1][1] - m[0][0] - m[2][2]) * 2.0; // S=4*qy
                q.w = (m[0][2] - m[2][0]) / s;
                q.x = (m[0][1] + m[1][0]) / s;
                q.y = 0.25 * s;
                q.z = (m[1][2] + m[2][1]) / s;
            }
            else
            {
                float s = sqrt(1.0 + m[2][2] - m[0][0] - m[1][1]) * 2.0; // S=4*qz
                q.w = (m[1][0] - m[0][1]) / s;
                q.x = (m[0][2] + m[2][0]) / s;
                q.y = (m[1][2] + m[2][1]) / s;
                q.z = 0.25 * s;
            }
            return q;
        }

        mat4 m_scale(mat4 m, vec3 v)
        {
            float x = v.x, y = v.y, z = v.z;

            m[0][0] *= x; m[1][0] *= y; m[2][0] *= z;
            m[0][1] *= x; m[1][1] *= y; m[2][1] *= z;
            m[0][2] *= x; m[1][2] *= y; m[2][2] *= z;
            m[0][3] *= x; m[1][3] *= y; m[2][3] *= z;

            return m;
        }

        mat4 quaternion_to_matrix(vec4 quat)
        {
            mat4 m = mat4(vec4(0, 0, 0, 0), vec4(0, 0, 0, 0), vec4(0, 0, 0, 0), vec4(0, 0, 0, 0));

            float x = quat.x, y = quat.y, z = quat.z, w = quat.w;
            float x2 = x + x, y2 = y + y, z2 = z + z;
            float xx = x * x2, xy = x * y2, xz = x * z2;
            float yy = y * y2, yz = y * z2, zz = z * z2;
            float wx = w * x2, wy = w * y2, wz = w * z2;

            m[0][0] = 1.0 - (yy + zz);
            m[0][1] = xy - wz;
            m[0][2] = xz + wy;

            m[1][0] = xy + wz;
            m[1][1] = 1.0 - (xx + zz);
            m[1][2] = yz - wx;

            m[2][0] = xz - wy;
            m[2][1] = yz + wx;
            m[2][2] = 1.0 - (xx + yy);

            m[3][3] = 1.0;

            return m;
        }

        mat4 m_translate(mat4 m, vec3 v)
        {
            float x = v.x, y = v.y, z = v.z;
            m[3][0] = x;
            m[3][1] = y;
            m[3][2] = z;
            return m;
        }

        mat4 compose(vec3 position, vec4 quat, vec3 scale)
        {
            mat4 m = quaternion_to_matrix(quat);
            m = m_scale(m, scale);
            m = m_translate(m, position);
            return m;
        }

        void decompose(in mat4 m, out vec3 position, out vec4 rotation, out vec3 scale)
        {
            float sx = length(vec3(m[0][0], m[0][1], m[0][2]));
            float sy = length(vec3(m[1][0], m[1][1], m[1][2]));
            float sz = length(vec3(m[2][0], m[2][1], m[2][2]));

            // if determine is negative, we need to invert one scale
            float det = determinant(m);
            if (det < 0.0) {
                sx = -sx;
            }

            position.x = m[3][0];
            position.y = m[3][1];
            position.z = m[3][2];

            // scale the rotation part
            float invSX = 1.0 / sx;
            float invSY = 1.0 / sy;
            float invSZ = 1.0 / sz;

            m[0][0] *= invSX;
            m[0][1] *= invSX;
            m[0][2] *= invSX;

            m[1][0] *= invSY;
            m[1][1] *= invSY;
            m[1][2] *= invSY;

            m[2][0] *= invSZ;
            m[2][1] *= invSZ;
            m[2][2] *= invSZ;

            rotation = matrix_to_quaternion(m);

            scale.x = sx;
            scale.y = sy;
            scale.z = sz;
        }

        uniform float time;
        uniform int currentStep;
        uniform int nextStep;
        uniform float stepLerp;
        int animSteps = ${this.skeleton.steps};
        int bonesCount = ${this.skeleton.bones.length};

        #ifdef USE_SKINNING
        
            uniform mat4 bindMatrix;
            uniform mat4 bindMatrixInverse;
        
            #ifdef BONE_TEXTURE
        
                uniform highp sampler2D boneTexture;
                uniform int boneTextureSize;
        
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
                    mat4 bone0 = getStepBoneMatrix(i, currentStep);
                    mat4 bone1 = getStepBoneMatrix(i, nextStep);

                    vec3 position0; vec4 rotation0; vec3 scale0;
                    vec3 position1; vec4 rotation1; vec3 scale1;
                    
                    decompose(bone0, position0, rotation0, scale0);
                    decompose(bone1, position1, rotation1, scale1);
                    
                    vec3 position2 = mix(position0, position1, stepLerp);
                    vec3 scale2 = mix(scale0, scale1, stepLerp);
                    vec4 rotation2 = slerp(rotation0, rotation1, stepLerp);

                    mat4 lerpMatrix = compose(position2, rotation2, scale2);
                    return lerpMatrix;
                    // return bone0;
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



        let skinning_vertex = `
        #ifdef USE_SKINNING
            // vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
            // vec4 skinned = vec4( 0.0 );
            // skinned += boneMatX * skinVertex * skinWeight.x;
            // skinned += boneMatY * skinVertex * skinWeight.y;
            // skinned += boneMatZ * skinVertex * skinWeight.z;
            // skinned += boneMatW * skinVertex * skinWeight.w;
            // transformed = ( bindMatrixInverse * skinned ).xyz;
            vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
            vec4 skinned = vec4( 0.0 );
            skinned += boneMatX * skinVertex * skinWeight.x;
            skinned += boneMatY * skinVertex * skinWeight.y;
            skinned += boneMatZ * skinVertex * skinWeight.z;
            skinned += boneMatW * skinVertex * skinWeight.w;
            transformed = ( bindMatrixInverse * skinned ).xyz;
        #endif
        `;

        shader.vertexShader = shader.vertexShader.replace('#include <skinning_pars_vertex>', skinning_pars_vertex);
        shader.vertexShader = shader.vertexShader.replace('#include <skinning_vertex>', skinning_vertex);
    }


    update(dt: number) {
        if (this.shader == null) return;

        this.ellapsed += dt;
        this.ellapsed = MathUtils.clamp(this.ellapsed - Math.floor(this.ellapsed / this.skeleton.duration) * this.skeleton.duration, 0, this.skeleton.duration);

        let frame = Math.floor(this.ellapsed * this.skeleton.fps);
        frame = frame % this.skeleton.steps;

        let nextFrame = (frame + 1) % this.skeleton.steps;

        let frameTime = frame * (1 / this.skeleton.fps);
        let nextFrameTime = nextFrame * (1 / this.skeleton.fps);
        let lerp = MathUtils.inverseLerp(frameTime, nextFrameTime, this.ellapsed);


        this.shader.uniforms["currentStep"].value = frame;
        this.shader.uniforms["nextStep"].value = nextFrame;
        this.shader.uniforms["stepLerp"].value = lerp;
    }
}