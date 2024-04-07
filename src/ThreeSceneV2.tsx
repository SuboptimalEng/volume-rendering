import { useEffect, useRef, useState } from 'react';
import * as Three from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

const generateCube = (p: Three.Vector3 = new Three.Vector3(0, 0, 0)) => {
  const geo1 = new Three.BoxGeometry(1, 1, 1);
  const mat1 = new Three.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new Three.Mesh(geo1, mat1);
  cube.position.set(p.x, p.y, p.z);
  return cube;
};

export const ThreeSceneV2 = () => {
  const canvasRef = useRef(null);
  let myCamera: Three.PerspectiveCamera;

  const uniformData: {
    cameraPos: Three.Vector3;
  } = {
    cameraPos: new Three.Vector3(0, 0, 0),
  };

  useEffect(() => {
    if (canvasRef.current === null) {
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const renderer = new Three.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(width, height);

    myCamera = new Three.PerspectiveCamera(75, width / height, 0.1, 1000);
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
          // value: new Three.Vector3(
          //   uniformData.cameraPos.x,
          //   uniformData.cameraPos.y,
          //   uniformData.cameraPos.z
          // ),
          // value: new Three.Vector3(0, 0, -2.5),
          value: myCamera.position,
        },
        u_resolution: {
          value: new Three.Vector3(width, height, 1),
        },
      },
      vertexShader: `
      varying vec3 v_hitPos;

      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        v_hitPos = position;
      }
      `,
      fragmentShader: `
      uniform vec3 u_camera;
      uniform vec3 u_resolution;

      varying vec3 v_hitPos;

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
        rayOrigin = u_camera;

        vec2 uv = 2.0 * gl_FragCoord.xy / u_resolution.xy - 1.0;
        vec3 rayDir = normalize(vec3(uv, 1.0));
        // rayDir = normalize(vec3(uv, 1.0) - rayOrigin);
        rayDir = normalize(v_hitPos - rayOrigin);

        float totalDistance = 0.0;
        for (int i = 0; i < 32; i++) {
          vec3 p = rayOrigin + rayDir * totalDistance;

          float d = map(p);

          totalDistance += d;

          if (d < 0.001 || totalDistance >= 100.0) {
            break;
          }
        }

        gl_FragColor = vec4(1.0);
        gl_FragColor.xyz = rayDir;
        gl_FragColor.xyz = vec3(totalDistance * 0.1);
      }
      `,
    });
    const m1 = new Three.Mesh(geo1, mat1);
    scene.add(m1);

    const controls = new OrbitControls(myCamera, renderer.domElement);

    const animate = () => {
      controls.update();
      renderer.render(scene, myCamera);

      // uniformData.cameraPos = myCamera.position;
      // console.log(uniformData.cameraPos);

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
