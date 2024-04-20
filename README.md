# 🌊 Volume Rendering

## Description

Volume rendering is a common technique used to render 3D medical imaging data such as MRIs or CT scans. This repo contains my implementation of the algorithm in Three.js, GLSL, and React.

<img src="/_demos/foot-01.png" width="42%">
<img src="/_demos/foot-02.png" width="42%">
<img src="/_demos/bonsai-01.png" width="42%">
<img src="/_demos/bonsai-02.png" width="42%">

## Setup

```
git clone https://github.com/SuboptimalEng/volume-rendering.git
cd volume-rendering/
npm install
npm run dev
```

But wait, there's more! After running these commands, you will be able to open the project in localhost. However, there will be no image rendered on screen. Why, you may ask? Simple, I did not want to upload multiple 16MB data files to GitHub. To see the demo in action, you will need to download one of these files and upload them via the UI.

- Foot - https://klacansky.com/open-scivis-datasets/foot/foot_256x256x256_uint8.raw
- Skull - https://klacansky.com/open-scivis-datasets/skull/skull_256x256x256_uint8.raw
- Bonsai - https://klacansky.com/open-scivis-datasets/bonsai/bonsai_256x256x256_uint8.raw

Note: The website I linked has tons of models, but not all of them will work. I've hard-coded this project to work with `256x256x256 uint8` files that are scaled `1x1x1`.

## References

- Will Usher's Blog Post - https://www.willusher.io/webgl/2019/01/13/volume-rendering-with-webgl
- Open Scientific Visualization Datasets - https://klacansky.com/open-scivis-datasets
- The Art of Code - https://www.youtube.com/watch?v=S8AWd66hoCo
- Inigo Quilez - https://iquilezles.org/articles/palettes/
