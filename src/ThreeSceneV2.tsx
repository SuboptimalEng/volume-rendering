import { useEffect, useRef, useState } from 'react';
import * as Three from 'three';
import { GUI } from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import Stats from 'three/addons/libs/stats.module.js';
import vertexV2 from './shaders/vertexV2.glsl?raw';
import fragmentV2 from './shaders/fragmentV2.glsl?raw';
import TWEEN from '@tweenjs/tween.js';

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
  const stats = new Stats();
  const clock = new Three.Clock();
  const controls = new OrbitControls(camera, renderer.domElement);

  renderer.setSize(width, height);
  clock.start();
  document.body.appendChild(stats.dom);

  const gui = new GUI();
  const folder = gui.addFolder('Display Settings');
  folder.open();

  const crossFolder = folder.addFolder('Cross Section Settings');
  const crossSectionSize = new Three.Vector3(0.5, 0.5, 0.5);
  crossFolder.add(crossSectionSize, 'x', 0.02, 0.5, 0.02);
  const crossSectionYSetting = crossFolder.add(
    crossSectionSize,
    'y',
    0.02,
    0.5,
    0.02,
  );
  crossFolder.add(crossSectionSize, 'z', 0.02, 0.5, 0.02);
  crossFolder.open();

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
      value: 2,
    },
    u_volume: {
      value: volumeDataTexture,
    },
    u_isoValue: {
      value: 1,
    },
    u_alphaVal: {
      value: 0.2,
    },
  };

  const algoFolder = folder.addFolder('Algorithm Settings');
  algoFolder.add(uniforms.u_dt, 'value', 0.002, 0.04, 0.002).name('step size');
  algoFolder.add(uniforms.u_color, 'value', 1, 2, 1).name('color');
  const alphaSetting = algoFolder
    .add(uniforms.u_alphaVal, 'value', 0.01, 0.4, 0.01)
    .name('alpha val');
  algoFolder.add(uniforms.u_isoValue, 'value', 0, 1, 0.04).name('iso value');
  algoFolder.open();

  return {
    camera,
    stats,
    clock,
    uniforms,
    gui,
    renderer,
    controls,
    crossSectionYSetting,
    alphaSetting,
  };
};

export const ThreeSceneV2 = () => {
  const dim = 256;
  const canvasRef = useRef(null);
  const [volumeData, setVolumeData] = useState<Uint8Array | null>(null);

  let prevChapterAnimation = () => {};
  let nextChapterAnimation = () => {};

  useEffect(() => {
    if (canvasRef.current === null) {
      console.log('No canvas!');
      return;
    }

    if (volumeData === null) {
      console.log('No volume data!');
      return;
    }

    // todo: I should clean this up...
    const {
      camera,
      stats,
      clock,
      uniforms,
      gui,
      renderer,
      controls,
      crossSectionYSetting,
      alphaSetting,
    } = initData(canvasRef, volumeData, dim);

    // Note: Plane works, but looks very weird...
    // const geo1 = new Three.PlaneGeometry(2, 2, 2);
    const scene = new Three.Scene();
    const geo1 = new Three.BoxGeometry(2, 2, 2);
    const mat1 = new Three.ShaderMaterial({
      uniforms: { ...uniforms },
      vertexShader: vertexV2,
      fragmentShader: fragmentV2,
    });
    const mesh1 = new Three.Mesh(geo1, mat1);
    mesh1.rotateY(Math.PI / 2);
    scene.add(mesh1);

    const prev = { y: 0.5, alphaVal: 0.2, rotX: 0 };
    const next = { y: 0.1, alphaVal: 0.04, rotX: Math.PI / 180 };

    const forwardTween = new TWEEN.Tween({ ...prev })
      .to(next, 2000)
      .onUpdate((obj) => {
        uniforms.u_crossSectionSize.value.y = obj.y;
        crossSectionYSetting.setValue(obj.y);

        uniforms.u_alphaVal.value = obj.alphaVal;
        alphaSetting.setValue(obj.alphaVal);

        mesh1.rotateX(obj.rotX);
      });
    const backwardTween = new TWEEN.Tween({ ...next })
      .to(prev, 2000)
      .onUpdate((obj) => {
        uniforms.u_crossSectionSize.value.y = obj.y;
        crossSectionYSetting.setValue(obj.y);

        uniforms.u_alphaVal.value = obj.alphaVal;
        alphaSetting.setValue(obj.alphaVal);

        mesh1.rotateX(-obj.rotX);
      });

    nextChapterAnimation = () => {
      forwardTween.start();
    };

    prevChapterAnimation = () => {
      backwardTween.start();
    };

    const animate = () => {
      forwardTween.update();
      backwardTween.update();
      controls.update();
      stats.update();
      renderer.render(scene, camera);
      uniforms.u_time.value = clock.getElapsedTime();
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      document.body.removeChild(stats.dom);
      stats.end();
      gui.destroy();
    };
  }, [volumeData]);

  return (
    <>
      <div className="absolute top-16">
        <input
          type="file"
          onChange={(e) => handleVolumeFileUpload(e, dim, setVolumeData)}
        />
        <div className="flex space-x-4">
          <div className="border" onClick={() => prevChapterAnimation()}>
            Previous Chapter
          </div>
          <div className="border" onClick={() => nextChapterAnimation()}>
            Next Chapter
          </div>
        </div>
      </div>
      <canvas ref={canvasRef}></canvas>
    </>
  );
};
