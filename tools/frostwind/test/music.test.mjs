import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BiomeMusic,
  CROSSFADE_S,
  FIRST_FADE_S,
  MUSIC_TRACKS,
  MUSIC_VOLUME,
  musicTrackForScene,
  STOP_FADE_S,
  travellerMoved,
} from '../src/music.js';
import { SCENES, WORLD_NAMES } from '../src/scene.js';

class FakeParam{
  constructor(value=1){ this.value=value; this.events=[]; }
  setValueAtTime(value,at){ this.value=value; this.events.push(['set',value,at]); }
  linearRampToValueAtTime(value,at){ this.value=value; this.events.push(['ramp',value,at]); }
  cancelScheduledValues(at){ this.events.push(['cancel',at]); }
  cancelAndHoldAtTime(at){ this.events.push(['hold',at]); }
}
class FakeNode{
  constructor(){ this.connections=[]; this.disconnected=false; }
  connect(node){ this.connections.push(node); return node; }
  disconnect(){ this.disconnected=true; }
}
class FakeGain extends FakeNode{
  constructor(){ super(); this.gain=new FakeParam(); }
}
class FakeAnalyser extends FakeNode{
  constructor(){ super(); this.fftSize=64; this.frequencyBinCount=32; this.smoothingTimeConstant=0; }
  getByteFrequencyData(out){ out.fill(128); }
}
class FakeSource extends FakeNode{
  constructor(ctx){ super(); this.ctx=ctx; this.buffer=null; this.loop=false; this.starts=[]; this.stops=[]; }
  start(at){ this.starts.push(at); }
  stop(at=this.ctx.currentTime){ this.stops.push(at); }
}
class FakeContext{
  constructor(){
    this.currentTime=7;
    this.state='suspended';
    this.destination=new FakeNode();
    this.sources=[];
  }
  createGain(){ return new FakeGain(); }
  createAnalyser(){ return new FakeAnalyser(); }
  createBufferSource(){ const source=new FakeSource(this); this.sources.push(source); return source; }
  async decodeAudioData(bytes){ return {byteLength:bytes.byteLength}; }
  async resume(){ this.state='running'; }
  async suspend(){ this.state='suspended'; }
  async close(){ this.state='closed'; }
}

const TRACK_ASSETS={
  lily:'data:application/octet-stream;base64,AA==',
  sunny:'data:application/octet-stream;base64,AQ==',
  veil:'data:application/octet-stream;base64,Ag==',
};
const settle=()=>new Promise((resolve)=>setImmediate(resolve));

test('every scene selects its authored biome track',()=>{
  assert.deepEqual(Object.keys(MUSIC_TRACKS).sort(),Object.keys(SCENES).sort());
  assert.deepEqual(WORLD_NAMES,{
    frostwood:'Frostwood',
    meadow:'Sun Meadow',
    swamp:'Green Swamp',
    desert:'Amber Waste',
    hollow:'Amethyst Hollow',
  });
  for(const [id,name] of Object.entries(WORLD_NAMES)) assert.equal(SCENES[id].name,name);
  assert.deepEqual(musicTrackForScene('frostwood'),{asset:'veil',title:'Veil of Dreams'});
  assert.deepEqual(musicTrackForScene('meadow'),
    {asset:'sunny',title:'Sunny Stroll',without:'frostwood'});
  assert.deepEqual(musicTrackForScene('swamp'),
    {asset:'lily',title:'Lily — Paddling Down the Stream'});
  assert.equal(musicTrackForScene('unknown'),null);
  /* A scene with no piece of its own says so in its row; a silent world reads
     as a bug and worlds sharing a theme read as one world. The borrowers are
     named here, so the next one fails until it is listed or scored. */
  const borrowed=Object.entries(MUSIC_TRACKS).filter(([,t])=>t.placeholder);
  assert.deepEqual(borrowed.map(([id])=>id),['desert','hollow'],
    'a scene outside the named borrowers is playing a borrowed track');
  const own=Object.entries(MUSIC_TRACKS).filter(([,t])=>!t.placeholder);
  assert.equal(new Set(own.map(([,t])=>t.asset)).size,own.length,
    'two worlds claim the same authored track as their own');
});

/* AUTHORITY: assets/music/CREDITS.md. A tree without the optional file must
   still load, and must name the piece it plays. */
test('a scene whose optional file is absent plays the piece its row names',async()=>{
  const {sunny,...carried}=TRACK_ASSETS;
  assert.equal(musicTrackForScene('meadow',TRACK_ASSETS).title,'Sunny Stroll');
  assert.equal(musicTrackForScene('meadow',carried),MUSIC_TRACKS.frostwood);
  for(const [id,track] of Object.entries(MUSIC_TRACKS)){
    if(track.without) assert.ok(MUSIC_TRACKS[track.without]&&!MUSIC_TRACKS[track.without].without,
      `${id}: 'without' must name a scene whose file always ships`);
  }

  const ctx=new FakeContext();
  const music=new BiomeMusic(carried,{contextFactory:()=>ctx});
  music.syncScene('meadow');
  await music.unlock();
  music.begin();
  assert.equal(await music.ready,true,String(music.error));
  await settle();
  assert.equal(music.title,'Veil of Dreams');
  assert.equal(music.voice.sceneId,'meadow');
  assert.equal(music.voice.source.buffer,music.buffers.get('veil'));
  music.dispose?.();
});

test('the first-movement gate ignores a stationary or blocked traveller',()=>{
  assert.equal(travellerMoved(20,30,20,30),false);
  assert.equal(travellerMoved(20,30,20+1e-6,30),false);
  assert.equal(travellerMoved(20,30,20.01,30),true);
  assert.equal(travellerMoved(20,30,20,29.5),true);
});

test('music loops, fades, crossfades, obeys stop, and disposes',async()=>{
  const ctx=new FakeContext();
  const music=new BiomeMusic(TRACK_ASSETS,{contextFactory:()=>ctx});
  music.syncScene('meadow');
  await music.unlock();
  music.begin();
  await music.ready;
  await settle();

  assert.equal(ctx.state,'running');
  assert.equal(MUSIC_VOLUME.default,0.30);
  assert.equal(music.master.gain.value,MUSIC_VOLUME.default);
  assert.equal(music.voice.sceneId,'meadow');
  assert.equal(music.voice.source.loop,true);
  assert.deepEqual(music.voice.gain.gain.events.at(-1),['ramp',1,7+FIRST_FADE_S]);

  const meadow=music.voice;
  music.syncScene('swamp');
  await settle();
  assert.equal(music.voice.sceneId,'swamp');
  assert.deepEqual(music.voice.gain.gain.events.at(-1),['ramp',1,7+CROSSFADE_S]);
  assert.equal(meadow.source.stops.at(-1),7+CROSSFADE_S+0.04);

  const levels=new Float32Array(7);
  music.sampleLevels(levels);
  assert.ok(levels.every((level)=>level>0),'analyser did not drive every equalizer bar');

  music.setVolume(0.65);
  assert.equal(music.volume,0.65);
  assert.deepEqual(music.master.gain.events.at(-1),['ramp',0.65,7.08]);

  music.setEnabled(false);
  assert.equal(music.voice,null);
  assert.equal(music.master.gain.events.at(-1)[2],7+STOP_FADE_S);
  music.syncScene('frostwood');
  await settle();
  assert.equal(music.voice,null,'a scene change overrode the user stop');

  music.setVolume(0.40);
  music.setEnabled(true);
  await settle();
  assert.equal(music.voice.sceneId,'frostwood');
  assert.equal(music.title,'Veil of Dreams');
  assert.equal(music.master.gain.value,0.40);

  music.setHidden(true);
  await settle();
  assert.equal(ctx.state,'suspended');
  music.setHidden(false);
  await settle();
  assert.equal(ctx.state,'running');

  music.dispose();
  await settle();
  assert.equal(ctx.state,'closed');
  assert.equal(music.voice,null);
  assert.equal(music.voices.size,0);
});
