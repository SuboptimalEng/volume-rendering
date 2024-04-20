import { useEffect, useRef } from 'react';
import * as Three from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import vertexV1 from './shaders/vertexV1.glsl?raw';
import fragmentV1 from './shaders/fragmentV1.glsl?raw';

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
      vertexShader: vertexV1,
      fragmentShader: fragmentV1,
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
