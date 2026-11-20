import * as THREE from 'three';
import { CH, WIND_A } from './constants.js';
import { LifeSession } from './life-session.js';
import { clamp } from './math.js';
import { bakeOutPalette, bakePalette, extraColour } from './palette.js';
import { PLAYER_H } from './scale.js';
import { POST_FS, QUAD_VS, SPRITE_FS } from './shaders/sprite.js';
import { BLIT_FS, BLIT_VS, CONTACT_VS,
         W_GROUND_FS, W_REFLECT_VS, W_SHADOW_FS, W_SHADOW_VS, W_SPRITE_VS,
         W_WATER_FS } from './shaders/world.js';
import { Scene } from './scene.js';
import { MARK_MAX } from './spell.js';

/* A reusable instance batch. The visible set changes every frame, so the
   buffers are allocated once and refilled in place: a fresh
   InstancedBufferGeometry per frame leaks a GPU buffer per frame. */
class Batch{
  constructor(cap,quad,mat,shadowMat){
    this.cap=cap;
    const g=new THREE.InstancedBufferGeometry();
    g.index=quad.index;
    g.setAttribute('position',quad.getAttribute('position'));
    g.setAttribute('uv',quad.getAttribute('uv'));
    this.pos=new Float32Array(cap*2);  this.rect=new Float32Array(cap*4);
    this.anch=new Float32Array(cap*4); this.rng=new Float32Array(cap*4);
    this.atm=new Float32Array(cap*2);  this.ph=new Float32Array(cap);
    /* INVARIANT: instance material stores deposit ramp, window and volume weight; shader resolves colour. */
    this.mat2=new Float32Array(cap*4);
    /* Height of this caster's foot above the ground plane, in drawn rows.
       Zero on the ground. Its own buffer: iAnchor.w is the ramp id, iRange
       and iMat are full, and iAtm.x carries the dissolve. */
    this.lift=new Float32Array(cap);
    /* crown bend from a spell front, whole pixels (propFx in src/spell.js) */
    this.fx=new Float32Array(cap);
    const A=(n,a,s)=>{ const at=new THREE.InstancedBufferAttribute(a,s);
      at.setUsage(THREE.DynamicDrawUsage); g.setAttribute(n,at); return at; };
    this.aPos=A('iPos',this.pos,2);   this.aRect=A('iRect',this.rect,4);
    this.aAnch=A('iAnchor',this.anch,4); this.aRng=A('iRange',this.rng,4);
    this.aAtm=A('iAtm',this.atm,2);   this.aPh=A('iPhase',this.ph,1);
    this.aMat=A('iMat',this.mat2,4);  this.aLift=A('iLift',this.lift,1);
    this.aFx=A('iFx',this.fx,1);
    g.instanceCount=0;
    this.g=g;
    this.scene=new THREE.Scene();
    const m=new THREE.Mesh(g,mat); m.frustumCulled=false; this.scene.add(m);
    this.shadowScene=new THREE.Scene();
    const s=new THREE.Mesh(g,shadowMat); s.frustumCulled=false; this.shadowScene.add(s);
  }
  fill(list){
    const n=Math.min(list.length,this.cap);
    for(let i=0;i<n;i++){
      const e=list[i];
      this.pos[i*2]=e.x; this.pos[i*2+1]=e.y;
      this.rect[i*4]=e.r.x; this.rect[i*4+1]=e.r.y; this.rect[i*4+2]=e.r.w; this.rect[i*4+3]=e.r.h;
      this.anch[i*4]=e.flip?(e.r.w-1-e.r.ax):e.r.ax; this.anch[i*4+1]=e.r.ay;
      this.anch[i*4+2]=e.flip?1:0; this.anch[i*4+3]=e.rampId;
      this.rng[i*4]=e.sMin; this.rng[i*4+1]=e.sMax; this.rng[i*4+2]=e.tL/255; this.rng[i*4+3]=e.comp;
      this.mat2[i*4]=e.ramp2||0;
      /* INVARIANT: deposit sMin/sMax window its ramp exactly like the base material. */
      this.mat2[i*4+1]=e.dMin===undefined?0:e.dMin;
      this.mat2[i*4+2]=e.dMax===undefined?1:e.dMax;
      /* deposit volume weight (vVol in SPRITE_FS) */
      this.mat2[i*4+3]=e.vol===undefined?0:e.vol;
      /* iAtm.x carries the dissolve: how much of this sprite is still drawn */
      this.atm[i*2]=e.fade===undefined?1:e.fade; this.atm[i*2+1]=e.fog;
      /* Negative phase is an explicit rigid instance; never upload NaN when a
         draw-list producer omits phase. */
      this.ph[i]=e.phase===undefined?-1:e.phase;
      this.lift[i]=e.lift===undefined?0:e.lift;
      this.fx[i]=e.bend||0;
    }
    this.g.instanceCount=n;
    for(const a of [this.aPos,this.aRect,this.aAnch,this.aRng,this.aAtm,this.aPh,
                    this.aMat,this.aLift,this.aFx])
      a.needsUpdate=true;
    return n;
  }
}

/* The world renderer. */
class FrostwoodWorld{
  constructor(canvas){
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false});
    this.renderer.autoClear=false;
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace=THREE.LinearSRGBColorSpace;
    this.cam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    this.warmth=0;
    this.pal=bakePalette(0); this.outPal=bakeOutPalette(0);
    this.quad=new THREE.PlaneGeometry(1,1);
    this.time=0;
    this._mkPasses();
  }
  /* INVARIANT: atlas binding increments generation so resident scene data cannot use stale textures. */
  bindAtlas(baked){
    /* The sheet belongs to the scene that baked it; `this.baked` is a
       read-only view. The renderer keeps which bind is current. */
    this.atlasGen=(this.atlasGen||0)+1;
    for(const m of [this.spriteMat,this.reflectionMat,this.shadowMat,this.contactMat]){
      if(m.uniforms.uNrm) m.uniforms.uNrm.value=baked.nrm;
      m.uniforms.uMat.value=baked.mat;
      m.uniforms.uAtlas.value.set(baked.W,baked.H);
    }
  }

  /* INVARIANT: palette texture, rung table and snap divisor bind as one generation. */
  bindPalette(pal,outPal){
    if(this.pal&&this.pal.tex!==pal.tex){ this.pal.tex.dispose(); this.pal.rtex.dispose(); }
    if(this.outPal&&this.outPal.tex!==outPal.tex) this.outPal.tex.dispose();
    this.pal=pal; this.outPal=outPal;
    /* INVARIANT: renderer notifies the resident scene after atlas/palette binding. */
    if(this.scene) this.scene.palette={pal,outPal};
    for(const m of [this.ground.mat,this.water.mat,this.spriteMat,this.reflectionMat,this.post.mat]){
      if(!m.uniforms.uPal) continue;
      m.uniforms.uPal.value=pal.tex;
      m.uniforms.uRungTex.value=pal.rtex;
    }
    this.post.mat.uniforms.uOut.value=outPal.tex;
    this.post.mat.uniforms.uOutN.value=outPal.n;
    /* the snap list's own bytes, so the plate survives the snap unmoved */
    const ice=extraColour(this.warmth);
    for(const m of [this.water.mat,this.spriteMat,this.reflectionMat])
      m.uniforms.uIceCol.value.set(ice[0]/255,ice[1]/255,ice[2]/255);
  }

  _mkScene(mat){
    const sc=new THREE.Scene();
    const m=new THREE.Mesh(this.quad,mat); m.frustumCulled=false; sc.add(m);
    return {sc,mat,mesh:m};
  }
  _mkPasses(){
    /* The live spell marks, MARK_MAX rows of two vec4. The scene writes them
       (markUniforms in src/spell.js); the ground and water passes share the
       one pair of arrays. */
    this.markA=Array.from({length:MARK_MAX},()=>new THREE.Vector4());
    this.markB=Array.from({length:MARK_MAX},()=>new THREE.Vector4());
    const U=()=>({
      uPal:{value:this.pal.tex}, uRungTex:{value:this.pal.rtex},
      uLight:{value:new THREE.Vector3(-0.55,-0.43,0.72)},
      uLightCol:{value:new THREE.Vector3(1,1,1)},
      uFog:{value:new THREE.Vector3(0.55,0.62,0.68)},
      uLantern:{value:new THREE.Vector3(0,0,40)}, uLanternI:{value:0},
      uRes:{value:new THREE.Vector2(480,270)},
      uGeom:{value:null}, uShadow:{value:null},
      uCam:{value:new THREE.Vector2()}, uBayer:{value:this.pal.btex},
      uWind:{value:1.0}, uTime:{value:0}, uRain:{value:0},
      uWorm:{value:0}, uWormSeed:{value:0},
      uMarkA:{value:this.markA}, uMarkB:{value:this.markB}, uMarkN:{value:0},
      /* The aerial treatment, per scene: target luminance, compression,
         desaturation, haze. Winter's four literals. See W_GROUND_FS. */
      uAer:{value:new THREE.Vector4(150,0.24,0.21,0.19)},
      /* scene-owned reflection strength and roughness, see W_WATER_FS */
      uReflect:{value:new THREE.Vector2(0.34,1.0)}
    });
    this.blit=this._mkScene(new THREE.ShaderMaterial({
      uniforms:{uTex:{value:null},uOrigin:{value:new THREE.Vector2()},
                uSize:{value:new THREE.Vector2(CH,CH)},uRes:{value:new THREE.Vector2(480,270)}},
      vertexShader:BLIT_VS, fragmentShader:BLIT_FS,
      depthTest:false, depthWrite:false, blending:THREE.NoBlending,
      /* the vertex stage flips y, which reverses the winding: single-sided,
         every chunk draws zero pixels */
      side:THREE.DoubleSide}));
    this.ground=this._mkScene(new THREE.ShaderMaterial({
      uniforms:U(), vertexShader:QUAD_VS, fragmentShader:W_GROUND_FS,
      depthTest:false, depthWrite:false}));
    const wu=U(); wu.uScene={value:null}; wu.uReflection={value:null};
    wu.uIce={value:-1}; wu.uIceCol={value:new THREE.Vector3(0.56,0.64,0.72)};
    this.water=this._mkScene(new THREE.ShaderMaterial({
      uniforms:wu, vertexShader:QUAD_VS, fragmentShader:W_WATER_FS,
      depthTest:false, depthWrite:false}));
    this.post=this._mkScene(new THREE.ShaderMaterial({
      uniforms:{uScene:{value:null}, uWeatherMask:{value:null},
        /* coverage of the one thing within reach, and whether there is one */
        uHighlight:{value:null}, uHighlightOn:{value:0},
        uOut:{value:this.outPal.tex},
        uPal:{value:this.pal.tex}, uRungTex:{value:this.pal.rtex},
        uOutN:{value:this.outPal.n},

        uQuant:{value:1}, uTime:{value:0},
        uFlakes:{value:0}, uRain:{value:0}, uRainRamp:{value:0}, uSand:{value:0},

        uVig:{value:0}, uWind:{value:1}, uWindX:{value:Math.cos(WIND_A)},
        /* Snow and rain fall and lean downwind with uWindX alone. Sand
           travels along the ground and needs the whole vector. */
        uWindY:{value:Math.sin(WIND_A)},
        uRes:{value:new THREE.Vector2(480,270)},
        uCam:{value:new THREE.Vector2()}},
      vertexShader:QUAD_VS, fragmentShader:POST_FS,
      depthTest:false, depthWrite:false}));
    const ice=()=>({uIce:{value:-1},uIceCol:{value:new THREE.Vector3(0.56,0.64,0.72)}});
    this.spriteMat=new THREE.ShaderMaterial({
      uniforms:Object.assign(U(),ice(),{uNrm:{value:null},uMat:{value:null},
        uAtlas:{value:new THREE.Vector2(1,1)},
        /* three lighting steps per material */
        uSteps:{value:3.0}, uDesat:{value:0.21}}),
      vertexShader:W_SPRITE_VS, fragmentShader:SPRITE_FS,
      depthTest:false, depthWrite:false, transparent:false, side:THREE.DoubleSide});
    this.reflectionMat=new THREE.ShaderMaterial({
      uniforms:Object.assign(U(),ice(),{uNrm:{value:null},uMat:{value:null},
        uAtlas:{value:new THREE.Vector2(1,1)},
        uSteps:{value:3.0}, uDesat:{value:0.21}}),
      vertexShader:W_REFLECT_VS, fragmentShader:SPRITE_FS,
      depthTest:false, depthWrite:false, transparent:false, side:THREE.DoubleSide});
    this.shadowMat=new THREE.ShaderMaterial({
      uniforms:{uMat:{value:null}, uAtlas:{value:new THREE.Vector2(1,1)},
        uRes:{value:new THREE.Vector2(480,270)},
        uLight:{value:new THREE.Vector3(-0.55,-0.43,0.72)},
        uLen:{value:1.0},uSquash:{value:0.55},uMinH:{value:20.0},uBase:{value:3.0},
        uWind:{value:1.0},uTime:{value:0}},
      vertexShader:W_SHADOW_VS, fragmentShader:W_SHADOW_FS,
      depthTest:false, depthWrite:false, side:THREE.DoubleSide,
      blending:THREE.CustomBlending, blendEquation:THREE.MaxEquation,
      blendSrc:THREE.OneFactor, blendDst:THREE.OneFactor});
    this.contactMat=new THREE.ShaderMaterial({
      uniforms:{uMat:{value:null}, uAtlas:{value:new THREE.Vector2(1,1)},
        uRes:{value:new THREE.Vector2(480,270)},
        uLight:{value:new THREE.Vector3(-0.55,-0.43,0.72)},uLen:{value:1.0},
        uWind:{value:0},uTime:{value:0}},
      vertexShader:CONTACT_VS, fragmentShader:W_SHADOW_FS,
      depthTest:false, depthWrite:false, side:THREE.DoubleSide,
      blending:THREE.CustomBlending, blendEquation:THREE.MaxEquation,
      blendSrc:THREE.OneFactor, blendDst:THREE.OneFactor});
    this.bBehind=new Batch(3000,this.quad,this.spriteMat,this.shadowMat);
    this.bFront =new Batch(3000,this.quad,this.spriteMat,this.shadowMat);
    /* Never part of painter order, never enters rtS. Its target contains
       caster radiance only, including the traveller. */
    this.bReflect=new Batch(6000,this.quad,this.reflectionMat,this.shadowMat);
    /* only its shadowScene is drawn; Batch builds both off one geometry */
    this.bContact=new Batch(1500,this.quad,this.spriteMat,this.contactMat);
    /* One body at a time is within reach; the outline is traced from its own
       instances. */
    this.bHighlight=new Batch(16,this.quad,this.spriteMat,this.shadowMat);
  }

  /* INVARIANT: renderer owns frame/GPU state; Scene owns world state and receives input/time boundaries. */
  get gen(){ return this.scene.gen; }
  /* latitude in degrees, for the day cycle. BIOMES.lat owns it. */
  get lat(){ return this.scene.gen.lat; }
  get atlas(){ return this.scene.atlas; }
  get baked(){ return this.scene.baked; }
  get chunks(){ return this.scene.chunks; }
  get clock(){ return this.lifeSession?.clock||null; }
  ensure(force){ return this.scene.ensure(force); }
  chunkAt(wx,wy){ return this.scene.chunkAt(wx,wy); }
  waterAt(wx,wy){ return this.scene.waterAt(wx,wy); }
  blocked(wx,wy){ return this.scene.blocked(wx,wy); }
  step(dt,input){ return this.scene.step(dt,input); }
  disturb(type,x,y,intensity,extra){ return this.scene.disturb(type,x,y,intensity,extra); }
  /* INVARIANT: only traveller/camera bridge fields are externally writable. */
  get px(){ return this.scene.px; }  set px(v){ this.scene.px=v; }
  get py(){ return this.scene.py; }  set py(v){ this.scene.py=v; }
  get camXf(){ return this.scene.camXf; }  set camXf(v){ this.scene.camXf=v; }
  get camYf(){ return this.scene.camYf; }  set camYf(v){ this.scene.camYf=v; }

  build(seed,W,H,opt){
    /* INVARIANT: setFrame is the sole authority for renderer frame dimensions. */
    this.opt=opt; this.seed=seed;
    /* the app's requested grid, kept for a scene switch */
    this.baseW=W; this.baseH=H;
    /* INVARIANT: scene tick, uniforms and draw execute in this order. */
    if(this.scene) this.scene.dispose();
    this.lifeSession=opt.lifeSnapshot
      ?LifeSession.fromSnapshot(opt.lifeSnapshot)
      :new LifeSession(seed);
    this.scene=new Scene(this,seed,opt,opt.scene,this.lifeSession);
    this.scene.palette={pal:this.pal,outPal:this.outPal};
    this.scene.generate();
    this.bindAtlas(this.baked);
    this.bindPalette(bakePalette(this.warmth),
      bakeOutPalette(this.warmth,this.scene.ramps,this.scene.haze()));
    this.resize(W,H);
    this.scene.populate(W,H);
    return {chunks:this.chunks.size, sprites:Object.keys(this.baked.rects).length,
            atlas:this.baked.W+'×'+this.baked.H, palette:this.outPal.n};
  }

  snapshotLife(){
    if(!this.lifeSession)throw new Error('world has no life session');
    return this.lifeSession.snapshot();
  }

  /* INVARIANT: portal crossing disposes old scene resources before binding the destination. */
  gotoScene(id,sourcePortal){
    const sun=this.scene.sun;
    const W=this.baseW||this.W, H=this.baseH||this.H;
    this.scene.dispose();
    this.scene=new Scene(this,this.seed,this.opt,id,this.lifeSession);
    this.scene.generate();
    this.bindAtlas(this.baked);
    this.bindPalette(bakePalette(this.warmth),
      bakeOutPalette(this.warmth,this.scene.ramps,this.scene.haze()));
    this.resize(W,H);
    const a=this.scene.arriveAtPortal(sourcePortal);
    this.scene.populate(W,H,a&&a.at);
    if(a) this.scene.doorLock=a.lock;
    /* The sun is the frame's and survives the world. The haze is the world's.
       Both are re-seated here. A scene's own lamp (spec.light) stays behind. */
    if(this.sky) this.setLight(this.sky.az,this.sky.el,this.sky.warmth);
    else{ if(sun) this.scene.setSun(sun); this.applyHaze(); }
  }
  applyHaze(){
    const f=this.scene.haze();
    for(const m of [this.ground.mat,this.water.mat,this.spriteMat,this.reflectionMat])
      if(m.uniforms.uFog) m.uniforms.uFog.value.set(f[0]/255,f[1]/255,f[2]/255);
  }
  /* INVARIANT: render frame dimensions and scene/world dimensions are distinct authorities. */
  resize(W,H){
    this.baseW=W; this.baseH=H;
    this.setFrame(...this.scene.regrid(W,H));
  }
  setFrame(W,H){
    if(this.W===W&&this.H===H&&this.rtA) return;
    this.W=W; this.H=H;
    const o={type:THREE.UnsignedByteType,magFilter:THREE.NearestFilter,
             minFilter:THREE.NearestFilter,depthBuffer:false,stencilBuffer:false};
    for(const k of ['rtA','rtB','rtS','rtG','rtR','rtWeather','rtHighlight'])
      if(this[k]) this[k].dispose();
    this.rtA=new THREE.WebGLRenderTarget(W,H,o);
    this.rtB=new THREE.WebGLRenderTarget(W,H,o);
    this.rtS=new THREE.WebGLRenderTarget(W,H,o);
    this.rtG=new THREE.WebGLRenderTarget(W,H,o);
    this.rtR=new THREE.WebGLRenderTarget(W,H,o);
    this.rtWeather=new THREE.WebGLRenderTarget(W,H,o);
    this.rtHighlight=new THREE.WebGLRenderTarget(W,H,o);
    this.rtR.texture.name='caster-reflection';
    this.rtWeather.texture.name='weather-occlusion';
    this.rtHighlight.texture.name='interaction-coverage';
    this.water.mat.uniforms.uReflection.value=this.rtR.texture;
    this.post.mat.uniforms.uWeatherMask.value=this.rtWeather.texture;
    this.post.mat.uniforms.uHighlight.value=this.rtHighlight.texture;
    for(const m of [this.ground.mat,this.water.mat,this.spriteMat,this.reflectionMat,this.post.mat,
                    this.shadowMat,this.contactMat,this.blit.mat])
      if(m.uniforms.uRes) m.uniforms.uRes.value.set(W,H);
    this.shoreCol=new Int32Array(W);
    this.renderer.setSize(W,H,false);
  }

  setLight(azDeg,elDeg,warmth){
    /* A sunless scene states its own light (SCENES.light); the clock's sun
       does not reach it. */
    const fixed=this.scene&&this.scene.spec.light;
    if(fixed){ azDeg=fixed.az; elDeg=fixed.el; warmth=0; }
    /* INVARIANT: the clock's sun outlives a sunless scene; gotoScene re-seats it. */
    else this.sky={az:azDeg,el:elDeg,warmth};
    const a=azDeg*Math.PI/180, e=elDeg*Math.PI/180;
    const v=new THREE.Vector3(Math.cos(a)*Math.cos(e),Math.sin(a)*Math.cos(e),Math.sin(e)).normalize();
    if(Math.abs(warmth-this.warmth)>0.004){
      this.warmth=warmth;
      /* INVARIANT: rung table and snap divisor update only through bindPalette. */
      this.bindPalette(bakePalette(warmth),bakeOutPalette(
        warmth,
        this.scene&&this.scene.ramps,
        this.scene?this.scene.haze():undefined,
      ));
    }
    this.shadowMat.uniforms.uLight.value.copy(v);
    /* A clamp at 2.6 draws every shadow at 60% of its computed length, and a
       low sun looks like a middling one. The cast shadow is the only ground
       mechanism that reaches the dark end of the snow ramp. */
    this.shadowMat.uniforms.uLen.value=clamp(0.55/Math.max(0.13,v.z),0.4,4.0);
    this.contactMat.uniforms.uLight.value.copy(v);
    this.contactMat.uniforms.uLen.value=this.shadowMat.uniforms.uLen.value;
    /* the scene keeps the sun, see Scene.setSun */
    this.scene.setSun(v);
    for(const m of [this.ground.mat,this.water.mat,this.spriteMat,this.reflectionMat]){
      if(m.uniforms.uLight) m.uniforms.uLight.value.copy(v);
      if(m.uniforms.uLightCol) m.uniforms.uLightCol.value.set(1,1,1);
    }
    /* the haze is the world's colour, see Scene.haze */
    this.applyHaze();
  }
  setLantern(on,intensity){
    const W=this.W,H=this.H;
    const x=Math.round(this.px)-Math.round(this.camXf);
    const y=Math.round(this.py)-Math.round(this.camYf)-PLAYER_H*0.45;
    const r=Math.round(Math.min(W,H)*0.115);

    this.ground.mat.uniforms.uLantern.value.set(x,y,r);
    this.ground.mat.uniforms.uLanternI.value=on?intensity:0;
    this.spriteMat.uniforms.uLantern.value.set(x,y,r);
    this.spriteMat.uniforms.uLanternI.value=on?intensity*0.33:0;
    this.reflectionMat.uniforms.uLantern.value.set(x,y,r);
    this.reflectionMat.uniforms.uLanternI.value=on?intensity*0.33:0;
  }

  render(dt,ui,target){
    this.time+=dt;
    const R=this.renderer;
    /* the frame's clock: the world's precipitation, wind and water advance off
       this one time */
    this.scene.tick(this.time,dt);
    [this.camXf,this.camYf]=this.scene.camera();
    const camX=Math.round(this.camXf), camY=Math.round(this.camYf);
    this.camX=camX; this.camY=camY;
    this.ground.mat.uniforms.uTime.value=this.time;
    this.water.mat.uniforms.uTime.value=this.time;
    /* one wind: the lake's swell and the trees' sway share the slider */
    this.water.mat.uniforms.uWind.value=ui.wind;
    this.spriteMat.uniforms.uTime.value=this.time;
    this.reflectionMat.uniforms.uTime.value=this.time;
    this.shadowMat.uniforms.uTime.value=this.time;
    /* the place's light and weather */
    this.scene.uniforms(ui);
    this.post.mat.uniforms.uTime.value=this.time;
    this.post.mat.uniforms.uQuant.value=ui.quant?1:0;
    this.post.mat.uniforms.uWind.value=ui.wind===undefined?1:ui.wind;

    this.ground.mat.uniforms.uCam.value.set(camX,camY);
    this.water.mat.uniforms.uCam.value.set(camX,camY);
    this.spriteMat.uniforms.uCam.value.set(camX,camY);
    this.reflectionMat.uniforms.uCam.value.set(camX,camY);
    this.post.mat.uniforms.uCam.value.set(camX,camY);
    const v=this.scene.draw(camX,camY);
    const nb=this.bBehind.fill(v.behind), nf=this.bFront.fill(v.front);
    const nr=this.bReflect.fill(v.reflection||[]);
    this.bContact.fill(v.contact);
    this.lastCount=nb+nf;
    this.lastReflectionCount=nr;

    /* 1. the geometry buffer: whatever this place's ground is made of */
    R.setRenderTarget(this.rtG); R.clear(true,true,true);
    this.scene.blit(camX,camY);
    for(const m of [this.ground.mat,this.water.mat]) m.uniforms.uGeom.value=this.rtG.texture;

    /* 2. shadows, composed by the place, see Scene.shadows */
    this.scene.shadows(ui);

    /* 3. caster radiance only. No geometry or shadow target is sampled here. */
    const clearAlpha=R.getClearAlpha();
    R.setClearAlpha(0);
    R.setRenderTarget(this.rtR); R.clear(true,true,true);
    if(nr)R.render(this.bReflect.scene,this.cam);
    R.setClearAlpha(clearAlpha);

    /* 4. Occluder silhouettes for depthed rain. The sprite material supplies
       the exact animated/dissolved coverage, so a swaying crown and its
       weather mask agree to the pixel. Only the target's alpha is consumed.
       Blown sand takes the same mask: saltation stays in the first few
       centimetres of the surface, under everything that stands on it. */
    if(this.post.mat.uniforms.uRain.value>0.01
      ||this.post.mat.uniforms.uSand.value>0.01){
      R.setClearAlpha(0);
      R.setRenderTarget(this.rtWeather);R.clear(true,true,true);
      const spriteRain=this.spriteMat.uniforms.uRain.value;
      this.spriteMat.uniforms.uRain.value=0;
      if(nb)R.render(this.bBehind.scene,this.cam);
      if(nf)R.render(this.bFront.scene,this.cam);
      this.spriteMat.uniforms.uRain.value=spriteRain;
      R.setClearAlpha(clearAlpha);
    }

    /* 4b. The interaction outline's coverage, from the instances the world
       pass draws. POST_FS draws the line after the palette snap. */
    const nh=this.bHighlight.fill(v.highlight||[]);
    this.post.mat.uniforms.uHighlightOn.value=nh?1:0;
    if(nh){
      R.setClearAlpha(0);
      R.setRenderTarget(this.rtHighlight);R.clear(true,true,true);
      const spriteRain=this.spriteMat.uniforms.uRain.value;
      this.spriteMat.uniforms.uRain.value=0;
      R.render(this.bHighlight.scene,this.cam);
      this.spriteMat.uniforms.uRain.value=spriteRain;
      R.setClearAlpha(clearAlpha);
    }

    /* 5. ground, then everything standing beyond the far shore */
    R.setRenderTarget(this.rtA); R.clear(true,true,true);
    R.render(this.ground.sc,this.cam);
    R.render(this.bBehind.scene,this.cam);

    /* 6. water clips the caster target by its wet surface, then the near bank
       is painted. Reflections do not depend on painter order. */
    this.water.mat.uniforms.uScene.value=this.rtA.texture;
    R.setRenderTarget(this.rtB); R.clear(true,true,true);
    R.render(this.water.sc,this.cam);
    R.render(this.bFront.scene,this.cam);

    /* 7. weather, palette lock */
    this.post.mat.uniforms.uScene.value=this.rtB.texture;
    R.setRenderTarget(target||null); R.clear(true,true,true);
    R.render(this.post.sc,this.cam);
  }
}

export { Batch, FrostwoodWorld };
