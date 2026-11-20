import { clamp } from './math.js';

/* Where a body aims, and how long it takes to get there. The four keys are a
   closed set, so a drawing layer bakes one variant per key. */
const LOOK_KEYS = Object.freeze(['neutral', 'left', 'right', 'up']);

/* Authority: Flash & Hogan 1985, the minimum-jerk trajectory. A voluntary
   human reach follows the quintic that minimises integrated squared jerk. Its
   speed profile peaks at 1.875 times the mean (MIN_JERK_PEAK), which derives
   turnDuration. */
const minimumJerk = (value) => {
  const t = clamp(value, 0, 1);
  return t*t*t*(10+t*(-15+6*t));
};
const minimumJerkDerivative = (value) => {
  const t = clamp(value, 0, 1);
  return 30*t*t*(1-t)*(1-t);
};

const LOOK_ENTER=0.28,LOOK_EXIT=0.16,NECK_YAW=1.75;
const MIN_TURN_TIME=0.08,MAX_TURN_RATE=6.0,MIN_JERK_PEAK=1.875;

const wrapAngle = (a) => {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};

function viewFromHeading(hx, hy) {
  return Math.abs(hx) >= Math.abs(hy) ? 2 : (hy > 0 ? 0 : 1);
}

/* A person has eight facings: the five drawn views and their mirrors. This is
   the one function that resolves a heading to one of them.

   Authored decision: the bands are octants, so no drawing stands for a heading
   more than 22.5 degrees away from it. A map that spends every sideways
   heading on the down diagonal draws a villager walking due east turned
   toward the camera, an eighth of the circle off his heading. The traveller's
   eight-way input resolves here too. */
const DIAGONAL_BAND = Math.tan(Math.PI / 8);
function figureViewFromHeading(hx, hy, previousFlip = false) {
  const ax = Math.abs(hx), ay = Math.abs(hy);
  if (ax < 1e-6 && ay < 1e-6) return { dir: 0, flip: previousFlip };
  /* A diagonal owns the band where neither axis dominates. Outside it the
     dominant axis picks the view and ties fall to the axial pair. */
  if (Math.min(ax, ay) > DIAGONAL_BAND * Math.max(ax, ay))
    return { dir: hy > 0 ? 3 : 4, flip: hx < 0 };
  if (ax > ay) return { dir: 2, flip: hx < 0 };
  return { dir: hy > 0 ? 0 : 1, flip: previousFlip };
}

function profileFlipFromHeading(hx, faceLock = 0.30, previous = false) {
  if (hx > faceLock) return false;
  if (hx < -faceLock) return true;
  return previous;
}

/* The heading a drawn view stands for. resolveAttention subtracts it from the
   angle to a target to get the neck yaw, so it is the centre of the view's
   octant: the angle the view was authored at. */
function headingOf(dir, flip) {
  if (dir === 0) return Math.PI * 0.5;
  if (dir === 1) return -Math.PI * 0.5;
  if (dir === 3) return flip ? Math.PI * 0.75 : Math.PI * 0.25;
  if (dir === 4) return flip ? -Math.PI * 0.75 : -Math.PI * 0.25;
  return flip ? Math.PI : 0;
}

function resolveAttention({
  actor, target, dir, flip = false, previousLook = 'neutral',
  neckYaw = NECK_YAW, pitchGate = LOOK_ENTER,
} = {}) {
  if (!target || !actor) return { dir, flip, look: 'neutral', yaw: 0, pitch: 0 };
  const dx = target.x - actor.x;
  const dy = (target.y - actor.y) / 0.66;
  const planar = Math.max(1e-6, Math.hypot(dx, dy));
  const pitch = Math.atan2(target.z || 0, planar);
  const yaw = wrapAngle(Math.atan2(dy, dx) - headingOf(dir, flip));

  if (pitch > pitchGate) return { dir, flip, look: 'up', yaw, pitch };
  const enter = previousLook === 'neutral' ? LOOK_ENTER : LOOK_EXIT;
  if (yaw > enter && yaw < neckYaw) return { dir, flip, look: 'left', yaw, pitch };
  if (yaw < -enter && yaw > -neckYaw) return { dir, flip, look: 'right', yaw, pitch };
  return { dir, flip, look: 'neutral', yaw, pitch };
}

function createAttentionState() {
  return {
    target: null,
    look: 'neutral',
    candidate: 'neutral',
    candidateFor: 0,
    yaw:0,
    pitch:0,
    startYaw:0,
    startPitch:0,
    targetYaw:0,
    targetPitch:0,
    transition:1,
    turnDuration:MIN_TURN_TIME,
    appearance: null,
  };
}

function setAttentionTarget(state, target) {
  return {
    ...(state || createAttentionState()),
    target: target ? { x: target.x, y: target.y, z: target.z || 0, kind: target.kind || null } : null,
    candidate: 'neutral',
    candidateFor: 0,
  };
}

function updateAttention(state, actor, dt, dwell = 0.08) {
  state = state || createAttentionState();
  const wanted = resolveAttention({
    actor,
    target: state.target,
    dir: actor.dir,
    flip: actor.flip,
    moving: actor.moving,
    previousLook: state.look,
    views: actor.views || 3,
  });
  let startYaw=state.startYaw,startPitch=state.startPitch;
  let targetYaw=state.targetYaw,targetPitch=state.targetPitch;
  let transition=state.transition,turnDuration=state.turnDuration;
  const yawDelta=wrapAngle(wanted.yaw-targetYaw);
  const pitchDelta=wanted.pitch-targetPitch;
  if(Math.abs(yawDelta)>0.02||Math.abs(pitchDelta)>0.02){
    startYaw=state.yaw;
    startPitch=state.pitch;
    targetYaw=wanted.yaw;
    targetPitch=wanted.pitch;
    transition=0;
    const distance=Math.max(
      Math.abs(wrapAngle(targetYaw-startYaw)),
      Math.abs(targetPitch-startPitch),
    );
    turnDuration=Math.max(MIN_TURN_TIME,MIN_JERK_PEAK*distance/MAX_TURN_RATE);
  }
  transition=clamp(transition+Math.max(0,dt||0)/turnDuration,0,1);
  const eased=minimumJerk(transition);
  const yaw=startYaw+wrapAngle(targetYaw-startYaw)*eased;
  const pitch=startPitch+(targetPitch-startPitch)*eased;
  const currentLook=lookFromAngles(yaw,pitch,state.look);
  let candidate = state.candidate, candidateFor = state.candidateFor;
  if (currentLook !== candidate) {
    candidate = currentLook;
    candidateFor = 0;
  } else {
    candidateFor += Math.max(0, dt || 0);
  }
  const look = candidateFor >= dwell ? candidate : state.look;
  return {
    ...state,
    look,
    candidate,
    candidateFor,
    yaw,pitch,startYaw,startPitch,targetYaw,targetPitch,
    transition,turnDuration,
    appearance: { ...wanted, yaw, pitch, look },
  };
}

function lookFromAngles(yaw,pitch,previousLook='neutral'){
  if(pitch>LOOK_ENTER)return 'up';
  const enter=previousLook==='neutral'?LOOK_ENTER:LOOK_EXIT;
  if(yaw>enter&&yaw<NECK_YAW)return 'left';
  if(yaw<-enter&&yaw>-NECK_YAW)return 'right';
  return 'neutral';
}

function anticipationProgress(rest,duration){
  if(!(duration>0))return 1;
  return minimumJerk(1-clamp(rest/duration,0,1));
}

function anticipationFrame(rest, duration, frames = 2) {
  if (!(duration > 0) || rest > duration) return 0;
  const u = anticipationProgress(rest,duration);
  return Math.min(frames - 1, Math.floor(u * frames));
}

export {
  LOOK_KEYS, anticipationFrame, anticipationProgress, createAttentionState,
  figureViewFromHeading, headingOf,
  lookFromAngles, minimumJerk, minimumJerkDerivative,
  profileFlipFromHeading, resolveAttention, setAttentionTarget,
  updateAttention, viewFromHeading, wrapAngle,
};
