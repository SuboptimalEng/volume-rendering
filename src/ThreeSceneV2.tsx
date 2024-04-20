import { useEffect, useRef, useState } from 'react';
import * as Three from 'three';
import { GUI } from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import Stats from 'three/addons/libs/stats.module.js';
import vertexV2 from './shaders/vertexV2.glsl?raw';
import fragmentV2 from './shaders/fragmentV2.glsl?raw';

const handleVolumeFileUpload = (event: any, dim: number, setDataFn: any) => {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = (e: any) => {
    const arrayBuffer = e.target.result;

    const uint8Array = new Uint8Array(arrayBuffer);
    // Assuming the raw file contains 256x256x256 uint8 values
    const data = new Uint8Array(dim * dim * dim);
    for (let i = 0; i < uint8Array.length; i++) {
      data[i] = uint8Array[i];
    }
    setDataFn(data);
  };
  reader.readAsArrayBuffer(file);
};

const initData = (canvasRef: any, volumeData: any, dim: number) => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const camera = new Three.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(0, 0, -2);
  camera.lookAt(new Three.Vector3(0, 0, 0));
  camera.up.set(0, 1, 0);

  const renderer = new Three.WebGLRenderer({ canvas: canvasRef.current });
  const scene = new Three.Scene();
  const stats = new Stats();
  const clock = new Three.Clock();
  const controls = new OrbitControls(camera, renderer.domElement);

  renderer.setSize(width, height);
  clock.start();
  document.body.appendChild(stats.dom);

  const gui = new GUI();
  const crossSectionSize = new Three.Vector3(0.5, 0.5, 0.5);
  const folder = gui.addFolder('Display Settings');
  folder.add(crossSectionSize, 'x', 0.02, 0.5, 0.02);
  folder.add(crossSectionSize, 'y', 0.02, 0.5, 0.02);
  folder.add(crossSectionSize, 'z', 0.02, 0.5, 0.02);

  const volumeDataTexture = new Three.Data3DTexture(volumeData, dim, dim, dim);
  volumeDataTexture.format = Three.RedFormat;
  // volumeDataTexture.type = Three.UnsignedByteType;
  volumeDataTexture.minFilter = Three.LinearFilter;
  volumeDataTexture.magFilter = Three.LinearFilter;
  // volumeDataTexture.wrapS = Three.RepeatWrapping;
  volumeDataTexture.wrapT = Three.RepeatWrapping;
  // volumeDataTexture.wrapR = Three.RepeatWrapping;
  volumeDataTexture.needsUpdate = true;
  console.log(volumeDataTexture);

  const uniforms = {
    u_camera: {
      value: camera.position,
    },
    u_resolution: {
      value: new Three.Vector3(width, height, 1),
    },
    u_dt: {
      value: 0.01,
    },
    u_time: {
      value: 0.0,
    },
    u_crossSectionSize: {
      value: crossSectionSize,
    },
    u_color: {
      value: 1,
    },
    u_volume: {
      value: volumeDataTexture,
    },
  };

  folder.add(uniforms.u_dt, 'value', 0.002, 0.04, 0.002).name('step size');
  folder.add(uniforms.u_color, 'value', 1, 3, 1).name('color');
  folder.open();

  return {
    camera,
    stats,
    clock,
    uniforms,
    gui,
    renderer,
    scene,
    controls,
  };
};

export const ThreeSceneV2 = () => {
  const dim = 256;
  const canvasRef = useRef(null);
  const [volumeData, setVolumeData] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (canvasRef.current === null) {
      console.log('No canvas!');
      return;
    }

    if (volumeData === null) {
      console.log('No volume data!');
      return;
    }

    // TODO: I should clean this up...
    const { camera, stats, clock, uniforms, gui, renderer, scene, controls } =
      initData(canvasRef, volumeData, dim);

    // Note: Plane works, but looks very weird...
    // const geo1 = new Three.PlaneGeometry(2, 2, 2);
    const geo1 = new Three.BoxGeometry(2, 2, 2);
    const mat1 = new Three.ShaderMaterial({
      uniforms: { ...uniforms },
      vertexShader: vertexV2,
      fragmentShader: fragmentV2,
    });
    const m1 = new Three.Mesh(geo1, mat1);
    // Changing this position will change world space coords of the mesh.
    // Since transform camera coordinates to object space, this will
    // also work on the ray march. Same for rotataion + scale.
    // m1.position.x = 2;
    // m1.rotation.x = 10;
    // m1.scale.x = 2;
    scene.add(m1);

    const animate = () => {
      controls.update();
      stats.update();
      renderer.render(scene, camera);
      uniforms.u_time.value = clock.getElapsedTime();
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      gui.destroy();
    };
  }, [volumeData]);

  return (
    <>
      <div className="absolute top-24">
        <input
          type="file"
          onChange={(e) => handleVolumeFileUpload(e, dim, setVolumeData)}
        />
      </div>
      <canvas ref={canvasRef}></canvas>
    </>
  );
};
