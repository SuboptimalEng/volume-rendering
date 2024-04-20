uniform vec3 u_camera; // default in world space
uniform vec3 u_resolution;

// The Art of Code: https://www.youtube.com/watch?v=S8AWd66hoCo
// It is important to keep camera + (vertex) position in same space.
// We can either move (vertex) position to world space, or the camera
// to object space. In this example, we transform camera to object
// space and use that as the rayOrigin in the fragment shader.

varying vec3 v_hitPos; // default in object space
varying vec3 v_hitPosWorldSpace;
varying vec3 v_cameraObjectSpace;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  v_hitPos = position.xyz;

  // In this case, we move the (vertex) position to world space.
  // Notice we multiply by modelMatrix, not modelViewMatrix.
  v_hitPosWorldSpace = (modelMatrix * vec4(position, 1.0)).xyz;

  // In this case, we move the camera to object space.
  // Notice we use inverse(modelMatrix) + put camera in homogeneous coords.
  v_cameraObjectSpace = (inverse(modelMatrix) * vec4(u_camera, 1.0)).xyz;
}