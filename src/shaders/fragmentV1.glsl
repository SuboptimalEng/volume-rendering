uniform vec3 u_camera;
uniform vec3 u_resolution;

varying vec3 v_hitPos;
varying vec3 v_hitPosWorldSpace;
varying vec3 v_cameraObjectSpace;

float sdCircle(vec3 p, float r) {
  return length(p) - r;
}

float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

float map(vec3 p) {
  // return sdCircle(p, 0.5);
  return sdTorus(p, vec2(0.5, 0.2));
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

  float totalDistance = 0.0;
  bool discardCheck = true;

  for (int i = 0; i < 32; i++) {
    vec3 p = rayOrigin + rayDir * totalDistance;

    float d = map(p);

    totalDistance += d;

    if (d < 0.001) {
      discardCheck = false;
      break;
    }

    if (totalDistance >= 100.0) {
      // If you want to truly discard, set discardCheck to true here.
      // discardCheck = true;
      discardCheck = false;
      break;
    }
  }

  if (discardCheck) {
    discard;
  }

  gl_FragColor = vec4(1.0);
  gl_FragColor.xyz = rayDir;
  gl_FragColor.xyz = vec3(totalDistance * 0.1);
}