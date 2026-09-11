/** Vendored GLSL from https://github.com/TjardoOrtan/audio-reactive-shaders (no license file). */
export const id = "cosmic-storm" as const;

export const name = 'Cosmic Storm';

export const fragmentShader = `
  uniform float time;
  uniform float audioLow;
  uniform float audioMid;
  uniform float audioHigh;
  varying vec2 vUv;
  
  float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }
  
  float noise (vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  
  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    
    // Create turbulent flow
    float t = time * 0.2;
    float n = noise(uv * 2.0 + t);
    n += 0.5 * noise(uv * 4.0 + t * 1.4 + 10.0);
    n += 0.25 * noise(uv * 8.0 + t * 2.1 - 20.0);
    
    // Audio-reactive coloring
    vec3 color = vec3(0.0);
    float audioMix = (audioLow + audioMid + audioHigh) / 3.0;
    
    // Create nebula-like colors
    float r = 0.5 + 0.5 * sin(n * 5.0 + t + audioLow * 5.0);
    float g = 0.5 + 0.5 * sin(n * 3.0 + t * 1.3 + audioMid * 4.0);
    float b = 0.5 + 0.5 * sin(n * 7.0 + t * 0.7 + audioHigh * 3.0);
    
    // Mix colors based on audio
    color = mix(
        vec3(r * 0.8, g * 0.3, b * 0.6),
        vec3(r * 0.3, g * 0.7, b * 0.9),
        audioMix
    );
    
    // Add music-reactive stars and shooting stars
    vec2 starUv = uv * 15.0;  // More stars with higher density
    vec2 starId = floor(starUv);
    vec2 starFract = fract(starUv) - 0.5;
    
    // Lightning effect - triggered by sudden audio peaks
    float lightning = 0.0;
    float lightningChance = smoothstep(0.7, 1.0, audioHigh) * step(0.95, random(vec2(time * 0.1)));
    
    if (lightningChance > 0.5) {
        // Create multiple lightning branches
        for (int i = 0; i < 3; i++) {
            float offset = float(i) * 0.3;
            float lightningWidth = 0.01 + 0.02 * random(vec2(float(i) * 0.1));
            
            // Create jagged lightning path
            float lightningPath = 0.0;
            float posX = 0.0;
            float posY = 0.0;
            float dir = random(vec2(offset, 0.0)) > 0.5 ? 1.0 : -1.0;
            
            // Generate multiple segments for organic look
            for (int j = 0; j < 5; j++) {
                float segLength = 0.2 + 0.1 * random(vec2(float(j) * 0.2, offset));
                float segAngle = (random(vec2(float(j) * 0.3, offset)) * 2.0 - 1.0) * 0.5 * dir;
                
                // Draw segment
                vec2 segStart = vec2(posX, posY);
                vec2 segEnd = segStart + vec2(cos(segAngle), sin(segAngle)) * segLength;
                
                // Distance to segment
                vec2 ba = segEnd - segStart;
                vec2 pa = uv - segStart;
                float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
                float dist = length(pa - ba * h);
                
                // Add glow and taper
                float segment = smoothstep(lightningWidth, 0.0, dist) * 
                              (1.0 - length(segStart) * 0.5) * 
                              (1.0 - float(j) * 0.15) * 
                              audioHigh * 2.0;
                
                lightning = max(lightning, segment);
                
                // Update position for next segment
                posX = segEnd.x;
                posY = segEnd.y;
            }
        }
        
        // Add lightning to the scene with blue-white color and glow
        vec3 lightningColor = mix(
            vec3(0.5, 0.7, 1.0),  // Blue
            vec3(1.0, 1.0, 1.0),  // White
            audioHigh
        );
        
        color += lightning * lightningColor * (1.0 + audioHigh * 3.0);
    }
    
    // Fractal blob - always visible but more intense with audio
    float blobPulse = 0.5 + 0.5 * sin(time * 0.5 + audioLow * 5.0);
    
    // Create fractal blob in the center
    vec2 blobPos = uv * 2.0 - 1.0;
    float blobDist = length(blobPos);
    
    // Fractal noise for organic shape
    float f = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    // Audio-reactive fractal iterations
    int iterations = 3 + int(audioMid * 3.0);
    
    for (int i = 0; i < 6; i++) {
        if (i >= iterations) break;
        
        // Warp the space for each iteration
        float n = noise(blobPos * frequency + time * 0.1 * float(i+1));
        f += amplitude * n;
        
        // Make the warping audio-reactive
        float warpAmount = 0.5 + 0.5 * sin(time * 0.3 + float(i) * 1.5);
        warpAmount *= 0.5 + 0.5 * audioMid;
        
        blobPos.x += cos(n * 6.28) * 0.1 * warpAmount;
        blobPos.y += sin(n * 6.28) * 0.1 * warpAmount;
        
        // Adjust parameters for next iteration
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    
    // Create the blob shape
    float blobSize = 0.3 + 0.1 * audioLow * blobPulse;
    float blobEdge = smoothstep(blobSize, 0.0, blobDist + f * 0.2);
    
    // Color the blob based on audio frequencies
    vec3 blobColor = mix(
        vec3(0.3, 0.5, 1.0),  // Blue
        vec3(0.8, 0.3, 0.6),  // Pink
        audioMid
    );
    
    // Add glow and pulsing
    float blobGlow = pow(blobEdge, 2.0) * (1.0 + audioHigh * 3.0);
    vec3 blobEffect = blobColor * blobGlow * (0.8 + 0.4 * sin(time * 0.7 + blobDist * 10.0));
    
    // Blend with existing color
    color = mix(color, blobEffect, blobEdge * 0.7);
    
    // Generate shooting stars based on audio intensity
    float shootingStarChance = smoothstep(0.0, 0.2, audioMid * audioHigh) * 0.01;
    float isShootingStar = step(0.999, random(vec2(time * 0.1)) + shootingStarChance);
    
    // Shooting star properties
    if (isShootingStar > 0.5) {
        // Create a trail that moves across the screen
        float trailLength = 0.5 + audioHigh * 1.5;
        float trailPos = fract(time * 0.5 * (0.5 + audioMid));
        float trailWidth = 0.02 + audioLow * 0.05;
        
        // Diagonal movement (top-right to bottom-left)
        float diagonal = (uv.x + uv.y) * 0.7;
        float trail = smoothstep(trailPos + trailLength, trailPos, diagonal) * 
                     smoothstep(trailPos - trailLength, trailPos, diagonal);
        
        // Add glow and color variation based on audio
        vec3 trailColor = mix(
            vec3(0.8, 0.9, 1.0),  // Cool blue
            vec3(1.0, 0.6, 0.3),  // Warm orange
            audioLow
        );
        
        // Add the shooting star trail to the scene
        color += trail * trailColor * (0.5 + audioHigh * 2.0) * 
                smoothstep(0.0, 1.0, 1.0 - abs(diagonal - 0.5) * 2.0);
    }
    
    // Create unique star properties based on position
    float starBase = random(starId);
    float starType = random(starId + 0.1);
    float starSpeed = 0.5 + random(starId + 0.2) * 2.0;
    
    // Only create stars in certain positions (sparse distribution)
    if (starBase > 0.95) {
        // Make stars move slightly with the music
        starFract += vec2(
            sin(time * 0.1 + starId.x * 0.1) * 0.02 * audioMid,
            cos(time * 0.08 + starId.y * 0.1) * 0.02 * audioMid
        );
        
        // Update star distance after movement
        float starDist = length(starFract);
        
        // Make stars pulse with different frequencies
        float pulse = 0.5 + 0.5 * sin(time * starSpeed * (1.0 + audioMid * 2.0));
        
        // Different star types react to different frequencies
        float starSize;
        vec3 starColor;
        
        if (starType > 0.66) {
            // Large, bright stars that pulse with bass
            starSize = 0.05 + 0.1 * audioLow * pulse;
            starColor = mix(
                vec3(1.0, 0.9, 0.7),  // Warm white
                vec3(1.0, 0.6, 0.3),  // Orange
                audioLow * 0.8
            );
        } else if (starType > 0.33) {
            // Medium stars that react to mid frequencies
            starSize = 0.03 + 0.05 * audioMid * pulse;
            starColor = mix(
                vec3(0.8, 0.9, 1.0),  // Cool white
                vec3(0.4, 0.6, 1.0),  // Blue
                audioMid * 0.8
            );
        } else {
            // Small, twinkling stars that react to high frequencies
            starSize = 0.01 + 0.02 * audioHigh * (0.5 + 0.5 * sin(time * 5.0 * starSpeed));
            starColor = mix(
                vec3(1.0, 1.0, 1.0),  // Pure white
                vec3(0.8, 0.4, 1.0),  // Purple
                audioHigh * 0.5
            );
        }
        
        // Create star shape with smooth falloff
        float starBrightness = smoothstep(starSize, 0.0, starDist) * starBase;
        
        // Add subtle twinkling effect based on audio, enhanced by lightning
        float twinkle = 0.7 + 0.6 * sin(time * 2.0 * starSpeed + starId.x * 10.0) * audioHigh;
        starBrightness *= twinkle * (1.0 + lightning * 0.5);  // Stars twinkle more during lightning
        
        // Make stars twinkle more with high frequencies
        float highFreqPulse = 0.8 + 0.4 * sin(time * 10.0 * starSpeed) * audioHigh;
        starBrightness *= highFreqPulse;
        
        // Add subtle movement with the bass
        starBrightness *= 0.9 + 0.2 * sin(time * 2.0 + audioLow * 10.0);
        
        // Add star to final color with bloom effect
        color += starBrightness * starColor * (1.0 + 2.0 * audioHigh);
        
        // Add subtle lens flare effect for bright stars
        if (starBrightness > 0.7) {
            float flare = smoothstep(0.7, 1.0, starBrightness);
            color += flare * 0.3 * vec3(1.0, 0.9, 0.8) * audioMid;
        }
    }
    
    gl_FragColor = vec4(color, 1.0);
  }
`;
