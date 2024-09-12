precision mediump int;
precision mediump float;

uniform vec3 u_camera;
uniform vec3 u_resolution;
uniform mediump sampler3D u_volume;
uniform vec3 u_leftCrossSectionSize;
uniform vec3 u_rightCrossSectionSize;
uniform float u_dt;
uniform float u_time;
uniform float u_color;
uniform float u_isoValue;

// Inigo Quilez - https://iquilezles.org/articles/palettes/
vec3 palette(in float t) {
  vec3 a = vec3(0.5, 0.5, 0.5);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.00, 0.33, 0.67);

  return a + b * cos(6.28318 * (c * t + d));
}

varying vec3 v_hitPos;
varying vec3 v_hitPosWorldSpace;
varying vec3 v_cameraObjectSpace;

// Will Usher - https://www.willusher.io/webgl/2019/01/13/volume-rendering-with-webgl
vec2 intersect_box(vec3 orig, vec3 dir) {
  // note: used this for testing purposes
  // const float halfBoxSize = 0.5;
  // const vec3 box_min = vec3(-halfBoxSize);
  // const vec3 box_max = vec3(halfBoxSize);

  vec3 box_min = vec3(-u_leftCrossSectionSize);
  vec3 box_max = vec3(u_rightCrossSectionSize);
  vec3 inv_dir = 1.0 / dir;
  vec3 tmin_tmp = (box_min - orig) * inv_dir;
  vec3 tmax_tmp = (box_max - orig) * inv_dir;
  vec3 tmin = min(tmin_tmp, tmax_tmp);
  vec3 tmax = max(tmin_tmp, tmax_tmp);
  float t0 = max(tmin.x, max(tmin.y, tmin.z));
  float t1 = min(tmax.x, min(tmax.y, tmax.z));
  return vec2(t0, t1);
}

void main() {
  vec3 rayOrigin = vec3(0.0, 0.0, -3.0);
  // rayOrigin = u_camera;
  rayOrigin = v_cameraObjectSpace;

  vec2 uv = 2.0 * gl_FragCoord.xy / u_resolution.xy - 1.0;
  vec3 rayDir = normalize(vec3(uv, 1.0));
  // rayDir = normalize(vec3(uv, 1.0) - rayOrigin);
  rayDir = normalize(v_hitPos - rayOrigin);
  // rayDir = normalize(v_hitPosWorldSpace - rayOrigin);

  // Step 2: Intersect the ray with the volume bounds to find the interval
  // along the ray overlapped by the volume.
  vec2 t_hit = intersect_box(rayOrigin, rayDir);
  if (t_hit.x > t_hit.y) {
    discard;
  }

  // We don't want to sample voxels behind the eye if it's
  // inside the volume, so keep the starting point at or in front
  // of the eye
  t_hit.x = max(t_hit.x, 0.0);

  // Step 3: Compute the step size to march through the volume grid
  // vec3 dt_vec = 1.0 / (vec3(20.0) * abs(rayDir));

  // float dt = min(dt_vec.x, min(dt_vec.y, dt_vec.z));
  // float dt = 0.002;
  float dt = u_dt;

  vec4 color = vec4(0.0);

  // note: 0.5 offset centers on cube
  vec3 p = rayOrigin + t_hit.x * rayDir + 0.5;
  for (float t = t_hit.x; t < t_hit.y; t += dt) {
    // note: used this for testing purposes
    // float textureVal = texture(u_volume, vec3(0.4, 0.2, 0.4)).r;

    float textureVal = texture(u_volume, p).r;

    vec4 val_color = vec4(0.0);
    float val_color_alpha = textureVal * 0.1;

    // looks a little nicer when using this alpha
    val_color_alpha = smoothstep(0.0, 0.25, textureVal * 0.1);

    if (abs(u_color - 1.0) <= 0.01) {
      val_color = vec4(1.0, 1.0, 1.0, val_color_alpha);
    } else if (abs(u_color - 2.0) <= 0.01) {
      val_color = vec4(1.0, 0.0, 0.0, val_color_alpha);
    } else {
      val_color = vec4(palette(textureVal), val_color_alpha);
    }

    // Step 4.2: Accumulate the color and opacity using the front-to-back
    // compositing equation
    color.rgb += (1.0 - color.a) * val_color.a * val_color.rgb;
    color.a += (1.0 - color.a) * val_color.a;

    // todo: Add blinn-phong lighting? (done, kinda)
    // todo: Iso value slider? (done, kinda)
    // todo: Clean this up? (Is this even the right approach?)
    if (textureVal > u_isoValue) {
      // calculate normal at point by central differences method
      float gxLess = texture(u_volume, vec3(p.x - rayDir.x * u_dt, p.y, p.z)).r;
      float gxMore = texture(u_volume, vec3(p.x + rayDir.x * u_dt, p.y, p.z)).r;
      float dgx = gxMore - gxLess;

      float gyLess = texture(u_volume, vec3(p.x, p.y - rayDir.y * u_dt, p.z)).r;
      float gyMore = texture(u_volume, vec3(p.x, p.y + rayDir.y * u_dt, p.z)).r;
      float dgy = gyMore - gyLess;

      float gzLess = texture(u_volume, vec3(p.x, p.y, p.z - rayDir.z * u_dt)).r;
      float gzMore = texture(u_volume, vec3(p.x, p.y, p.z + rayDir.z * u_dt)).r;
      float dgz = gzMore - gzLess;
      vec3 n = normalize(vec3(dgx, dgy, dgz));

      // calculate diffuse lighting
      vec3 lightSource = vec3(1.0);
      vec3 lightDir = normalize(lightSource);
      float diffuseStrength = max(dot(n, lightDir), 0.0);

      // calculate specular lighting
      vec3 viewSource = normalize(rayOrigin);
      vec3 reflectSource = normalize(reflect(-lightSource, n));
      float specularStrength = max(0.0, dot(viewSource, reflectSource));
      specularStrength = pow(specularStrength, 64.0);

      // add lighting
      color.rgb = diffuseStrength * val_color.rgb + specularStrength * val_color.rgb;
      color.rgb *= val_color.rgb;
      color.a = 0.95;
      break;
    }

    // Optimization: break out of the loop when the color is near opaque
    if (color.a >= 0.95) {
      break;
    }

    p += rayDir * dt;
  }

  gl_FragColor = color;
}