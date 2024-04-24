# 🌊 Volume Rendering

Volume rendering is a common technique used to render 3D medical imaging data such as MRIs or CT scans. This repo contains my implementation of the algorithm in Three.js and GLSL. Here's a 30 second demo on [Twitter](https://x.com/SuboptimalEng/status/1781808470985003035) and [Reddit](https://www.reddit.com/r/GraphicsProgramming/comments/1c9ke0p/volume_rendering_in_threejs_and_glsl/).

Huge thanks to Will Usher for his blog post on [Volume Rendering in WebGL](https://www.willusher.io/webgl/2019/01/13/volume-rendering-with-webgl).

<img src="/_demos/foot-01.png" width="100%">
<img src="/_demos/foot-02.png" width="100%">
<img src="/_demos/bonsai-01.png" width="100%">

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

## License

Shield: [![CC BY-NC-SA 4.0][cc-by-nc-sa-shield]][cc-by-nc-sa]

This work is licensed under a
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License][cc-by-nc-sa].

[![CC BY-NC-SA 4.0][cc-by-nc-sa-image]][cc-by-nc-sa]

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg
