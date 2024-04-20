import { useEffect, useRef } from 'react';
import * as Three from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

const generateCube = (p: Three.Vector3 = new Three.Vector3(0, 0, 0)) => {
  const geo1 = new Three.BoxGeometry(1, 1, 1);
  const mat1 = new Three.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new Three.Mesh(geo1, mat1);
  cube.position.set(p.x, p.y, p.z);
  return cube;
};

export const ThreeSceneV1 = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current === null) {
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const renderer = new Three.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(width, height);

    const myCamera = new Three.PerspectiveCamera(75, width / height, 0.1, 1000);
    myCamera.position.set(0, 0, -5);
    myCamera.lookAt(new Three.Vector3(0, 0, 0));
    myCamera.up.set(0, 1, 0);

    const scene = new Three.Scene();
    const cube1 = generateCube(new Three.Vector3(-2, 0, 0));
    const cube2 = generateCube(new Three.Vector3(2, 0, 0));
    scene.add(cube1);
    scene.add(cube2);

    // const geo1 = new Three.PlaneGeometry(2, 2, 2);
    const geo1 = new Three.BoxGeometry(2, 2, 2);
    const mat1 = new Three.ShaderMaterial({
      uniforms: {
        u_camera: {
          value: myCamera.position,
        },
        u_resolution: {
          value: new Three.Vector3(width, height, 1),
        },
      },
      vertexShader: `
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
      `,
      fragmentShader: `
      uniform vec3 u_camera;
      uniform vec3 u_resolution;

      varying vec3 v_hitPos;
      varying vec3 v_hitPosWorldSpace;
      varying vec3 v_cameraObjectSpace;

      float sdCircle(vec3 p, float r) {
        return length(p) - r;
      }

      float sdTorus(vec3 p, vec2 t) {
        vec2 q = vec2(length(p.xz)-t.x,p.y);
        return length(q)-t.y;
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
      `,
    });
    const m1 = new Three.Mesh(geo1, mat1);
    // Changing this position will change world space coords of the mesh.
    // Since transform camera coordinates to object space, this will
    // also work on the ray march. Same for rotataion + scale.
    // m1.position.x = 2;
    // m1.rotation.x = 10;
    // m1.scale.x = 2;
    scene.add(m1);

    const controls = new OrbitControls(myCamera, renderer.domElement);

    const animate = () => {
      controls.update();
      renderer.render(scene, myCamera);
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return (
    <>
      <canvas ref={canvasRef}></canvas>
    </>
  );
};
