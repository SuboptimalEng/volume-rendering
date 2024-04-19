# 🌊 Volume Rendering

## Description

Volume rendering is a common technique used to render 3D medical imaging data such as MRIs or CT scans. This data is
usually stored in 3D textures. This repo contains my implementation of it in Three.js and React. Huge thanks to [Will
Usher's blog post](https://www.willusher.io/webgl/2019/01/13/volume-rendering-with-webgl) on this very technique.

## Demo

## Setup

```
git clone https://github.com/SuboptimalEng/volume-rendering.git
cd volume-rendering/
npm install
npm run dev
```

But wait, there's more! After running this command, you will be able to open the project in localhost. However, there will be
no image rendered on screen! This is because, I did not want to upload 16MB raw files to this repo. Here are.

- Skull - https://klacansky.com/open-scivis-datasets/skull/skull_256x256x256_uint8.raw
- Bonsai - https://klacansky.com/open-scivis-datasets/bonsai/bonsai_256x256x256_uint8.raw
- Foot Model - https://klacansky.com/open-scivis-datasets/foot/foot_256x256x256_uint8.raw

The website I linked has tons of other models, but not all of them will work. I've hard-coded this project to work with `256x256x256
uint8` files that are scaled `1x1x1`.

## References

- Will Usher - https://www.willusher.io/webgl/2019/01/13/volume-rendering-with-webgl
- Open Scientific Visualization Datasets - https://klacansky.com/open-scivis-datasets
- The Art of Code - https://www.youtube.com/watch?v=S8AWd66hoCo
- Inigo Quilez - https://iquilezles.org/articles/palettes/
