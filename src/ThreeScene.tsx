import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
// import data from '../public/foot_256x256x256_uint8.raw';

export const ThreeScene = () => {
  const canvasRef = useRef(null);
  const scene = new THREE.Scene();

  // const [t, setT] = useRef(null)
  const clock = new THREE.Clock();
  clock.start();

  let obj = {
    t: clock.elapsedTime,
  };

  // const [time, setTime] = useState(0);
  // setTime(clock.elapsedTime);

  // let camera: THREE.PerspectiveCamera | null = null;

  useEffect(() => {
    // Create a camera
    const width = window.innerWidth;
    const height = window.innerHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    // Create a renderer
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(window.innerWidth, window.innerHeight);
    const controls = new OrbitControls(camera, renderer.domElement);

    // Create a cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    cube.name = 'cube';
    scene.add(cube);

    // Animate the scene
    const animate = () => {
      requestAnimationFrame(animate);

      controls.update();

      // Rotate the cube
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      cube.position.x = 2;

      obj.t = clock.getElapsedTime();

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    // let s = 256 * 256;
    // const imageData = new Uint8Array(s);
    // for (let i = 0; i < s; i++) {
    //   imageData[i] = Math.floor(s * Math.random());
    // }
    // console.log(imageData);
    // const txt = new THREE.DataTexture(imageData, 256, 256, THREE.RedFormat);
    // txt.needsUpdate = true; // Set needsUpdate to true after updating texture data
    // // Set texture parameters (adjust as needed)
    // txt.minFilter = THREE.LinearFilter;
    // txt.magFilter = THREE.LinearFilter;
    // txt.wrapS = THREE.ClampToEdgeWrapping;
    // txt.wrapT = THREE.ClampToEdgeWrapping;
    // const geo = new THREE.PlaneGeometry(1, 1);
    // const mat = new THREE.MeshBasicMaterial({
    //   map: txt,
    //   side: THREE.DoubleSide,
    // });
    // const mesh = new THREE.Mesh(geo, mat);
    // scene.add(mesh);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const [imageData, setImageData] = useState<Uint8Array | null>(null);
  const [volumeData, setVolumeData] = useState<Uint8Array | null>(null);

  const handleFileUploadVolume = (event: any) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const arrayBuffer = e.target.result;
      const uint8Array = new Uint8Array(arrayBuffer);
      // Assuming the raw file contains 256x256x256 uint8 values
      const data = new Uint8Array(256 * 256 * 256);
      // const data = new Uint8Array(256 * 256 * 256);
      for (let i = 0; i < uint8Array.length; i++) {
        data[i] = uint8Array[i];
      }
      setVolumeData(data);
      // console.log(data);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUploadImage = (event: any) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const arrayBuffer = e.target.result;
      const uint8Array = new Uint8Array(arrayBuffer);
      let oneSlice = 256 * 256;
      const data = new Uint8Array(256 * 256);
      let started = false;
      let count = 0;
      for (let i = 0; i < uint8Array.length; i++) {
        if (!started && uint8Array[i] < 25) {
          continue;
        }

        started = true;

        if (count === oneSlice - 1) {
          break;
        }

        count++;
        data[count] = uint8Array[i];
      }
      setImageData(data);
      // console.log(data);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (event: any) => {
    handleFileUploadImage(event);
    handleFileUploadVolume(event);
  };

  useEffect(() => {
    if (volumeData === null) {
      console.log('no volume data');
      return;
    }

    // console.log('hello there!!!', volumeData);
    const dim = 256;
    const volumeDataTexture = new THREE.Data3DTexture(
      volumeData,
      dim,
      dim,
      dim
    );
    // volumeDataTexture.format = THREE.RGBFormat; // Adjust format based on your data type
    volumeDataTexture.format = THREE.RedFormat; // Adjust format based on your data type
    volumeDataTexture.minFilter = THREE.LinearFilter; // Adjust filtering as needed
    volumeDataTexture.magFilter = THREE.LinearFilter;
    // volumeDataTexture.type = THREE.; // Adjust type based on your data precision
    volumeDataTexture.wrapS = THREE.ClampToEdgeWrapping; // Adjust wrapping as needed
    volumeDataTexture.wrapT = THREE.ClampToEdgeWrapping;
    volumeDataTexture.wrapR = THREE.ClampToEdgeWrapping;
    volumeDataTexture.needsUpdate = true;

    const volumeShaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        volumeData: {
          value: volumeDataTexture,
        },
        resolution: {
          value: new THREE.Vector3(window.innerWidth, window.innerHeight, 1),
        },
        cameraPos: {
          value: new THREE.Vector3(0, 0, 0),
          // value: camera.position,
        },
        time: {
          value: obj.t,
        },
      },
      // side: THREE.BackSide,
      // side: THREE.DoubleSide,
      // transparent: true,
      // opacity: 0.5,
      vertexShader: `
void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
      `,
      fragmentShader: `
precision highp sampler3D;
precision highp float;

uniform sampler3D volumeData;

uniform vec3 resolution;
uniform vec3 cameraPos;
uniform float time;

float sdSphere(vec3 p, float s) {
  return length(p) - s;
}

float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

float map(vec3 p) {
  return sdTorus(p, vec2(0.1, 0.05));
  // return sdSphere(p, 0.1);
}

void main() {
    // vec3 rayOrigin = cameraPos;
    vec3 rayOrigin = vec3(0.0, 0.0, -1.0);
    // vec3 rayDir = vec3(normalize(gl_FragCoord.xy / resolution.xy - 0.5), 1.0);
    vec3 rayDir = normalize(gl_FragCoord.xyz / resolution.xyz - 0.5);

    float stepSize = 0.01; // Adjust step size based on your data
    float totalDistance = 0.0;

    // float alpha = 0.0;
    // vec4 color = vec4(0.0, 0.0, 1.0, 1.0);

    for (int i = 0; i < 64; i++) {
      vec3 p = rayOrigin + rayDir * totalDistance;
      float d = map(p);
      totalDistance += d;
      if (d < 0.001 || totalDistance > 100.0) {
        break;
      }
    }

    // for (int i = 0; i < 100; i++) { // Maximum iterations for ray marching
    //     vec3 samplePos = rayOrigin + t * rayDir;
    //     float sampleValue = texture(imageData, samplePos).r;
    //     // Apply transfer function to map sample value to color and opacity
    //     vec4 sampleColor = vec4(sampleValue, sampleValue, sampleValue, 1.0); // Grayscale example
    //     float sampleAlpha = sampleValue; // Example: opacity based on sample value
    //     // color.x += sampleValue;
    //     // color.x += sampleValue;
    //     // color = texture(imageData, vec3(0.5));
    //     color += sampleColor * (1.0 - alpha);
    //     alpha += sampleAlpha * (1.0 - alpha);
    //     color.rgb += vec3(sampleValue, sampleValue, 0.0);
    //     if (alpha >= 1.0 || t >= 1.0) break; // Exit loop if opacity reaches 1.0
    //     totalDistance += stepSize;
    // }

    // divide by 255?
    // float v = texture(volumeData, vec3(0.5)).r;
    // gl_FragColor = vec4(vec2(v), 1.0, 1.0);

    // float val = texture(volumeData, vec3(0.25)).r;
    // gl_FragColor = vec4(val, 0.0, 0.0, 1.0);

    gl_FragColor = vec4(1);
    gl_FragColor = vec4(rayDir, 1.0);
    gl_FragColor = vec4(vec3(totalDistance * 0.1), 1.0);
}
      `,
    });

    // const volumeGeometry = new THREE.PlaneGeometry(1.5, 1.5);
    const volumeGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const volumeMesh = new THREE.Mesh(volumeGeometry, volumeShaderMaterial);
    volumeMesh.name = '3d texture';
    scene.add(volumeMesh);
    // debugger;

    const imageDataTexture = new THREE.DataTexture(
      imageData,
      256,
      256,
      THREE.RedFormat
    );
    imageDataTexture.needsUpdate = true; // Set needsUpdate to true after updating texture data
    imageDataTexture.minFilter = THREE.LinearFilter;
    imageDataTexture.magFilter = THREE.LinearFilter;
    imageDataTexture.wrapS = THREE.ClampToEdgeWrapping;
    imageDataTexture.wrapT = THREE.ClampToEdgeWrapping;
    const geo1 = new THREE.BoxGeometry(1, 1, 1);
    const mat1 = new THREE.MeshBasicMaterial({
      map: imageDataTexture,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo1, mat1);
    mesh.position.y = 2;
    scene.add(mesh);

    const geometry2 = new THREE.BoxGeometry();
    const material2 = new THREE.ShaderMaterial({
      fragmentShader: `
void main() {
    gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
}
      `,
    });
    const cube = new THREE.Mesh(geometry2, material2);
    cube.position.x = -2;
    cube.name = 'cube 2';
    scene.add(cube);

    return () => {};
  }, [volumeData]);

  return (
    <>
      <input type="file" onChange={handleFileUpload} />
      <canvas ref={canvasRef} />
    </>
  );
};
