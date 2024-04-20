import { useEffect, useRef, useState } from 'react';
import * as Three from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'dat.gui';

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

const initData = (canvasRef: any) => {
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

    const volumeDataTexture = new Three.Data3DTexture(
      volumeData,
      dim,
      dim,
      dim,
    );
    volumeDataTexture.format = Three.RedFormat;
    // volumeDataTexture.type = Three.UnsignedByteType;
    volumeDataTexture.minFilter = Three.LinearFilter;
    volumeDataTexture.magFilter = Three.LinearFilter;
    // volumeDataTexture.wrapS = Three.RepeatWrapping;
    volumeDataTexture.wrapT = Three.RepeatWrapping;
    // volumeDataTexture.wrapR = Three.RepeatWrapping;
    volumeDataTexture.needsUpdate = true;
    console.log(volumeDataTexture);

    const { camera, stats, clock, uniforms, gui, renderer, scene, controls } =
      initData(canvasRef); // TODO: I should clean this up...

    // Note: Plane works, but looks very weird...
    // const geo1 = new Three.PlaneGeometry(2, 2, 2);
    const geo1 = new Three.BoxGeometry(2, 2, 2);
    const mat1 = new Three.ShaderMaterial({
      uniforms: {
        u_volume: {
          value: volumeDataTexture,
        },
        ...uniforms,
      },
      vertexShader: `
      uniform vec3 u_camera; // default in world space
      uniform vec3 u_resolution;
      uniform float u_time;

      // The Art of Code - https://www.youtube.com/watch?v=S8AWd66hoCo
      // It is important to keep camera + (vertex) position in same space.
      // We can either move (vertex) position to world space, or the camera
      // to object space. In this example, we transform camera to object
      // space and use that as the rayOrigin in the fragment shader.

      varying vec3 v_hitPos; // default in object space
      varying vec3 v_hitPosWorldSpace;
      varying vec3 v_cameraObjectSpace;

      void main() {
        vec3 pos = position;
        // pos.y = pos.y + sin(u_time);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

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
      precision mediump int;
      precision mediump float;

      uniform vec3 u_camera;
      uniform vec3 u_resolution;
      uniform mediump sampler3D u_volume;
      uniform vec3 u_crossSectionSize;
      uniform float u_dt;
      uniform float u_time;
      uniform float u_color;

      // Inigo Quilez - https://iquilezles.org/articles/palettes/
      vec3 palette(in float t) {
        vec3 a = vec3(0.5, 0.5, 0.5);
        vec3 b = vec3(0.5, 0.5, 0.5);
        vec3 c = vec3(1.0, 1.0, 1.0);
        vec3 d = vec3(0.00, 0.33, 0.67);

        // vec3 a = vec3(0.8, 0.5, 0.4);
        // vec3 b = vec3(0.2, 0.4, 0.2);
        // vec3 c = vec3(2.0, 1.0, 1.0);
        // vec3 d = vec3(0.00, 0.25, 0.25);

        return a + b*cos( 6.28318*(c*t+d) );
      }

      varying vec3 v_hitPos;
      varying vec3 v_hitPosWorldSpace;
      varying vec3 v_cameraObjectSpace;

      // Will Usher - https://www.willusher.io/webgl/2019/01/13/volume-rendering-with-webgl
      vec2 intersect_box(vec3 orig, vec3 dir) {
        // const float halfBoxSize = 0.5;
        // const vec3 box_min = vec3(-halfBoxSize);
        // const vec3 box_max = vec3(halfBoxSize);

        vec3 box_min = vec3(-u_crossSectionSize);
        vec3 box_max = vec3(u_crossSectionSize);
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
        vec3 dt_vec = 1.0 / (vec3(20.0) * abs(rayDir));
        // float dt = min(dt_vec.x, min(dt_vec.y, dt_vec.z));
        // float dt = 0.002;
        float dt = u_dt;

        vec4 color = vec4(0.0);
        vec4 c = vec4(0.0);

        // TODO: Add blinn-phong lighting?
        // vec3 lightSource = vec3(1.0, 1.0, 1.0);

        vec3 p = rayOrigin + t_hit.x * rayDir;
        for (float t = t_hit.x; t < t_hit.y; t += dt) {
          // float val = texture(u_volume, vec3(0.4, 0.2, 0.4)).r;
          float val = texture(u_volume, p + 0.5).r;

          vec4 val_color = vec4(0.0);
          if (abs(u_color - 1.0) <= 0.01) {
            val_color = vec4(1.0, 1.0, 1.0, val * 0.1);
          } else if (abs(u_color - 2.0) <= 0.01) {
            val_color = vec4(1.0, 0.0, 0.0, val * 0.1);
          } else {
            val_color = vec4(palette(val), val * 0.1);
          }

          // val_color = vec4(palette(val), val * 0.1);
          // vec4 val_color = vec4(palette(val), val * 0.1);
          // vec4 val_color = vec4(palette(val + sin(u_time)), val * 0.1);

          // val_color = vec4(1.0, 0.0, 0.0, val);
          // c.r += val;

          // Step 4.2: Accumulate the color and opacity using the front-to-back
          // compositing equation
          color.rgb += (1.0 - color.a) * val_color.a * val_color.rgb;
          color.a += (1.0 - color.a) * val_color.a;

          // Optimization: break out of the loop when the color is near opaque
          if (color.a >= 0.95) {
            break;
          }

          p += rayDir * dt;
        }

        gl_FragColor = color;
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
