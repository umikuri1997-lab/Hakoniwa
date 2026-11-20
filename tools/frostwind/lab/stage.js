import * as THREE from 'three';
import { bakeOutPalette, bakePalette, FOG_BASE, repaint } from '../src/palette.js';
import { Batch } from '../src/render.js';
import { POST_FS, QUAD_VS, SPRITE_FS } from '../src/shaders/sprite.js';
import { W_SPRITE_VS } from '../src/shaders/world.js';

/* ═══════════════════════════════════════════════════════════════════════════
   The lab's render seam: the real shaders.

   The one place the sprite lab touches the GPU, a transcription of
   src/render.js: the same vertex stage (W_SPRITE_VS), fragment stage
   (SPRITE_FS), instance batch (Batch, exported from render.js), post pass
   (POST_FS) and renderer flags (antialias off, pixel ratio 1, nearest
   filtering, linear-sRGB output).

   A sprite stores a material id, a normal, occlusion and thickness; colour
   is resolved at draw time by rampStep() against the resident scene's locked
   output palette. A review tool that resolves colour in JavaScript is a
   second colour path and can show a distinction the shader does not render.
   This file arranges sprites and sets uniforms. It never decides a pixel's
   colour.

   The one lab-owned shader is the background: a constant-colour fullscreen
   quad drawn under the sprites and run through the same post pass, so the
   swatch is quantised to the locked palette. It carries no material and no
   normal.
   ═══════════════════════════════════════════════════════════════════════════ */

/* The lab's quad: one uniform, one colour, no lighting model. */
const BG_FS = `
precision highp float;
uniform vec3 uColor;
void main(){ gl_FragColor = vec4(uColor, 1.0); }`;

/* Defaults, named once. Each uniform is the value src/render.js gives it:

     uSteps 3.0     three lighting steps per material
     uLanternI 0    the lamp defaults off. It is an unquantised warm add that
                    turns the traveller pink at full strength.
     uGeom/uShadow  null: they belong to the ground and water passes, which
                    the lab does not run
     the aerial     tL 150, comp 0.24, fog 0.19, the frostwood aer() in
                    src/scene.js. Per-instance, so it lives in the cell list. */
const AERIAL = { tL: 150, comp: 0.24, fog: 0.19 };

class Stage {
  constructor(canvas) {
    /* The four flags that make a pixel a pixel, matching the game. */
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    this.renderer.autoClear = false;
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.PlaneGeometry(1, 1);
    this.warmth = 0;
    /* palette.js calls rebuildPalette() at module load, so only baking is
       left. */
    this.pal = bakePalette(0);
    this.outPal = bakeOutPalette(0);

    this.spriteMat = new THREE.ShaderMaterial({
      uniforms: {
        uPal: { value: this.pal.tex }, uRungTex: { value: this.pal.rtex },
        uLight: { value: new THREE.Vector3(-0.55, -0.43, 0.72) },
        uLightCol: { value: new THREE.Vector3(1, 1, 1) },
        uFog: { value: new THREE.Vector3(0.55, 0.62, 0.68) },
        uLantern: { value: new THREE.Vector3(0, 0, 40) }, uLanternI: { value: 0 },
        uRes: { value: new THREE.Vector2(480, 270) },
        uGeom: { value: null }, uShadow: { value: null },
        uCam: { value: new THREE.Vector2() }, uBayer: { value: this.pal.btex },
        uWind: { value: 0 }, uTime: { value: 0 },
        uNrm: { value: null }, uMat: { value: null },
        uAtlas: { value: new THREE.Vector2(1, 1) },
        uSteps: { value: 3.0 },
      },
      vertexShader: W_SPRITE_VS, fragmentShader: SPRITE_FS,
      depthTest: false, depthWrite: false, transparent: false, side: THREE.DoubleSide,
    });

    this.bgMat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Vector3(0.6, 0.65, 0.7) } },
      vertexShader: QUAD_VS, fragmentShader: BG_FS,
      depthTest: false, depthWrite: false,
    });

    this.postMat = new THREE.ShaderMaterial({
      uniforms: {
        uScene: { value: null }, uOut: { value: this.outPal.tex },
        uOutN: { value: this.outPal.n },
        /* The palette snap is on, as in the game: it makes the frame legal. */
        uQuant: { value: 1 }, uTime: { value: 0 },
        uFlakes: { value: 0 }, uVig: { value: 0 },
        uWind: { value: 1 }, uWindX: { value: 1 },
        uRes: { value: new THREE.Vector2(480, 270) },
        uCam: { value: new THREE.Vector2() },
      },
      vertexShader: QUAD_VS, fragmentShader: POST_FS,
      depthTest: false, depthWrite: false,
    });

    const mk = (mat) => { const sc = new THREE.Scene();
      const m = new THREE.Mesh(this.quad, mat); m.frustumCulled = false; sc.add(m);
      return sc; };
    this.bgScene = mk(this.bgMat);
    this.postScene = mk(this.postMat);
    /* One batch, refilled per group: the atlas is a uniform, so a second
       atlas is a second fill and draw into the same target. Capacity is far
       above the page's need (about 180 instances) because Batch.fill clamps
       to cap silently. */
    this.batch = new Batch(2048, this.quad, this.spriteMat, this.spriteMat);
    this.W = 0; this.H = 0;
  }

  setFrame(W, H) {
    if (this.W === W && this.H === H && this.rt) return;
    this.W = W; this.H = H;
    if (this.rt) this.rt.dispose();
    this.rt = new THREE.WebGLRenderTarget(W, H, {
      type: THREE.UnsignedByteType, magFilter: THREE.NearestFilter,
      minFilter: THREE.NearestFilter, depthBuffer: false, stencilBuffer: false });
    for (const m of [this.spriteMat, this.postMat]) m.uniforms.uRes.value.set(W, H);
    this.renderer.setSize(W, H, false);
  }

  /* The light as FrostwoodWorld.setLight computes it: azimuth and elevation
     in degrees to a unit vector in the screen basis. Sprites are not re-baked
     when the light moves: the dot product is evaluated per frame in the
     fragment stage. */
  setLight(azDeg, elDeg, warmth) {
    const a = azDeg * Math.PI / 180, e = elDeg * Math.PI / 180;
    const v = new THREE.Vector3(Math.cos(a) * Math.cos(e), Math.sin(a) * Math.cos(e),
                                Math.sin(e)).normalize();
    this.spriteMat.uniforms.uLight.value.copy(v);
    if (Math.abs(warmth - this.warmth) > 0.004) {
      this.warmth = warmth;
      const p = bakePalette(warmth), o = bakeOutPalette(warmth);
      this.pal.tex.dispose(); this.outPal.tex.dispose();
      this.pal.tex = p.tex; this.outPal.tex = o.tex;
      this.spriteMat.uniforms.uPal.value = p.tex;
      this.postMat.uniforms.uOut.value = o.tex;
    }
    const f = repaint(FOG_BASE);
    this.spriteMat.uniforms.uFog.value.set(f[0] / 255, f[1] / 255, f[2] / 255);
  }

  /* The one draw. `groups` is a list of {baked, cells}: a baked atlas from
     bakeWorldAtlas and the instances to draw out of it. The atlas is a
     uniform, so swapping it between draws is free. */
  draw(groups, o) {
    const R = this.renderer;
    this.spriteMat.uniforms.uTime.value = o.time;
    this.spriteMat.uniforms.uWind.value = o.wind;
    this.postMat.uniforms.uTime.value = o.time;
    this.bgMat.uniforms.uColor.value.set(o.bg[0] / 255, o.bg[1] / 255, o.bg[2] / 255);

    R.setRenderTarget(this.rt); R.clear(true, true, true);
    R.render(this.bgScene, this.cam);
    for (const g of groups) {
      if (!g.cells.length) continue;
      this.spriteMat.uniforms.uNrm.value = g.baked.nrm;
      this.spriteMat.uniforms.uMat.value = g.baked.mat;
      this.spriteMat.uniforms.uAtlas.value.set(g.baked.W, g.baked.H);
      this.batch.fill(g.cells);
      R.render(this.batch.scene, this.cam);
    }
    this.postMat.uniforms.uScene.value = this.rt.texture;
    R.setRenderTarget(null); R.clear(true, true, true);
    R.render(this.postScene, this.cam);
  }
}

/* One instance, in the shape Batch.fill reads. `x,y` is the anchor in screen
   pixels, the sprite's (ax,ay): for a figure, the point between its boots.
   The rest is the per-instance colour decision: one drawing in the atlas can
   be drawn in several ramps. */
function cell(x, y, r, rampId, sMin, sMax, flip) {
  return { x, y, r, flip: !!flip, rampId, sMin, sMax,
           tL: AERIAL.tL, comp: AERIAL.comp, fog: AERIAL.fog, fade: 1, phase: 0 };
}

export { AERIAL, cell, Stage };
