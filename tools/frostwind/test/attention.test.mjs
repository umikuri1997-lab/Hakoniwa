import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LOOK_KEYS, anticipationFrame, anticipationProgress, createAttentionState,
  minimumJerk, minimumJerkDerivative, profileFlipFromHeading, resolveAttention,
  setAttentionTarget, updateAttention, viewFromHeading,
} from '../src/attention.js';

/* Aim outlived every rig that drew it. These tests cover the transition math
   only: nothing here bakes a sprite, because the look key currently resolves
   and is discarded at the draw call. See docs/DECISIONS.md. */

test('heading helpers preserve the existing three-view projection',()=>{
  assert.equal(viewFromHeading(1,0.2),2);
  assert.equal(viewFromHeading(-1,0.2),2);
  assert.equal(viewFromHeading(0.1,1),0);
  assert.equal(viewFromHeading(0.1,-1),1);
  assert.equal(profileFlipFromHeading(-1,0.3,false),true);
  assert.equal(profileFlipFromHeading(0.1,0.3,true),true);
});

test('attention moves the head and preserves locomotion facing at rest',()=>{
  const actor={x:0,y:0};
  for(const moving of [true,false]){
    const side=resolveAttention({
      actor,target:{x:0,y:20},dir:2,flip:false,moving,
    });
    assert.equal(side.dir,2);
    assert.equal(side.flip,false);
    assert.equal(side.look,'left');
    const behind=resolveAttention({
      actor,target:{x:-20,y:0},dir:2,flip:false,moving,
    });
    assert.equal(behind.dir,2);
    assert.equal(behind.flip,false);
    assert.equal(behind.look,'neutral','the neck turned beyond its range');
  }
});

test('target height selects the shared up pose',()=>{
  const a=resolveAttention({
    actor:{x:0,y:0},target:{x:8,y:0,z:12},dir:0,flip:false,moving:false,
  });
  assert.equal(a.look,'up');
});

test('look bins use dwell and hysteresis instead of chattering',()=>{
  let s=setAttentionTarget(createAttentionState(),{x:-20,y:0});
  const actor={x:0,y:0,dir:0,flip:false,moving:false};
  s=updateAttention(s,actor,0.04,0.08);
  assert.equal(s.look,'neutral');
  for(let i=0;i<12&&s.look==='neutral';i++)s=updateAttention(s,actor,0.04,0.08);
  assert.equal(s.look,'left');
  s=setAttentionTarget(s,null);
  for(let i=0;i<16&&s.look!=='neutral';i++) s=updateAttention(s,actor,0.04,0.08);
  assert.equal(s.look,'neutral');
});

test('preparation frames progress monotonically before a known goal',()=>{
  const rests=[0.24,0.18,0.12,0.06,0];
  const progress=rests.map((r)=>anticipationProgress(r,0.24));
  const seq=rests.map((r)=>anticipationFrame(r,0.24,3));
  assert.deepEqual(seq,[0,0,1,2,2]);
  assert.ok(progress.every((v,i)=>i===0||v>=progress[i-1]));
});

test('the easing is a minimum-jerk trajectory: it starts and ends at rest',()=>{
  /* AUTHORITY: Flash & Hogan 1985. A voluntary human reach follows the quintic
     that minimises integrated squared jerk, and what makes it read as a living
     movement rather than a lerp is that velocity is zero at BOTH ends. The
     derivative is the half worth asserting, and the function is the half the
     neck actually turns on, so both are checked against each other. */
  assert.equal(minimumJerk(0),0);
  assert.equal(minimumJerk(1),1);
  assert.equal(minimumJerkDerivative(0),0,'the turn starts with a jerk');
  assert.equal(minimumJerkDerivative(1),0,'the turn stops with a jerk');
  /* symmetric about the midpoint, and monotone between the ends */
  assert.ok(Math.abs(minimumJerk(0.5)-0.5)<1e-12);
  let last=-1;
  for(let i=0;i<=40;i++){
    const v=minimumJerk(i/40);
    assert.ok(v>=last,`easing went backwards at t=${i/40}`);
    last=v;
  }
  /* peak speed is 1.875x the mean, which is where MIN_TURN_TIME's scaling
     comes from in updateAttention */
  assert.ok(Math.abs(minimumJerkDerivative(0.5)-1.875)<1e-12);
});

test('the look set is closed, and every key is reachable from an aim',()=>{
  assert.deepEqual([...LOOK_KEYS],['neutral','left','right','up']);
  const actor={x:0,y:0};
  const at=(target,moving=false)=>resolveAttention({
    actor,target,dir:0,flip:false,moving,
  }).look;
  /* One target per key, so a drawing layer that bakes one variant per key knows
     the list cannot grow underneath it. `up` is a pitch and the other two are
     yaw, which is why a raised target does not also read as a turn. */
  assert.equal(at({x:0,y:20}),'neutral');
  assert.equal(at({x:-20,y:0}),'left');
  assert.equal(at({x:20,y:6}),'right');
  assert.equal(at({x:8,y:0,z:12}),'up');
  /* Past the neck. A target at yaw -1.997 is 14 degrees beyond NECK_YAW, and a
     head does not turn that far without the shoulders: the body keeps facing
     where it is going and the look falls back to neutral rather than snapping
     to the nearest bin. */
  assert.equal(at({x:20,y:-6}),'neutral');
});
