import { CARBUNCLE_SPEC } from './carbuncle.js';
import { LANTERN_SPEC } from './driftlantern.js';
import { GUEST_SPEC } from './shadeguest.js';
import { HARE_SPEC } from './hare.js';
import { SNAIL_SPEC } from './lampsnail.js';
import { OLM_SPEC } from './olm.js';
import { SKIMMER_SPEC } from './skimmer.js';
import { drawSkeleton } from './skeleton.js';
import { STORK_SPEC } from './stork.js';

/* ═══════════════════════════════════════════════════════════════════════════
   Every body on the projected-skeleton rig, in one list. The atlas bakes
   from it, tools/creature.mjs draws from it, and test/skeleton.test.mjs holds
   each row to the rig's laws. A new creature is a module and a row here.

   A spec is the whole claim about a body:
     kind, biome, states, canvas, pose, mats
     brief  the reasons, checked for presence: `cause` (why it is in this
            world), `authority` (the measured body it is built on), `read`
            (what no other body here has). A fictional body adds `law` (its
            one invention) and `boundary` (what stays ordinary).
     size   what it measures, in metres: `length` and `height` of the profile
            in `size.state`. The test compares the drawn box to these. No
            body is larger in any view than the traveller is tall unless
            `size.larger` says why: an invented scale is the smallest that
            reads, and a body the size of a person is a claim.
     plants the indices of the limbs that bear weight, for the stance law.
   ═══════════════════════════════════════════════════════════════════════════ */
const RIGGED = Object.freeze([GUEST_SPEC, STORK_SPEC, HARE_SPEC, SKIMMER_SPEC, SNAIL_SPEC,
  OLM_SPEC, LANTERN_SPEC, CARBUNCLE_SPEC]);
const RIGGED_BY_KIND = Object.freeze(Object.fromEntries(RIGGED.map((q) => [q.kind, q])));

const makeRigged = (spec) => (rnd, frame = 0, dir = 2, state = Object.keys(spec.states)[0]) =>
  drawSkeleton(spec.pose(frame, state), spec.canvas, dir, spec.kind);

/* What a spec must state before it is drawn. Returns reasons, like every
   other validator here. */
function validateSpec(spec) {
  const errors = [], id = spec?.kind || '(no kind)';
  const need = (ok, what) => { if (!ok) errors.push(`${id}: ${what}`); };
  need(typeof spec.kind === 'string', 'kind is missing');
  need(typeof spec.biome === 'string', 'biome is missing');
  need(spec.states && Object.keys(spec.states).length > 0, 'states are missing');
  need(spec.canvas && ['w', 'h', 'ax', 'ay'].every((k) => Number.isInteger(spec.canvas[k])),
    'canvas needs integer w, h, ax, ay');
  need(typeof spec.pose === 'function', 'pose is missing');
  need(Array.isArray(spec.mats) && spec.mats.length > 0, 'mats are missing');
  const b = spec.brief || {};
  for (const field of ['cause', 'authority', 'read'])
    need(typeof b[field] === 'string' && b[field].length > 12, `brief.${field} is missing`);
  if (b.law !== undefined) {
    need(typeof b.law === 'string' && b.law.length > 12, 'a fictional body states its one law');
    need(Array.isArray(b.boundary) && b.boundary.length >= 2,
      'a fictional body states at least two things its law leaves ordinary');
  }
  const s = spec.size || {};
  need(s.length > 0 && s.height > 0 && spec.states?.[s.state],
    'size needs length, height and a baked state');
  need(s.larger === undefined || (typeof s.larger === 'string' && s.larger.length > 12),
    'size.larger is the reason a body exceeds the traveller');
  if (typeof spec.pose === 'function' && spec.states)
    for (const [state, n] of Object.entries(spec.states)) for (let f = 0; f < n; f++) {
      const pose = spec.pose(f, state);
      const nums = [...(pose.parts || []).flatMap((p) => [p.u, p.z, p.ru, p.rv, p.rz]),
        ...(pose.limbs || []).flatMap((l) => l.pts.flat()),
        ...(pose.dots || []).flatMap((d) => [d.u, d.z])];
      need(nums.every(Number.isFinite), `${state}:${f} holds a number that is not finite`);
      need((pose.parts || []).length > 0, `${state}:${f} has no body part`);
    }
  return errors;
}

export { RIGGED, RIGGED_BY_KIND, makeRigged, validateSpec };
