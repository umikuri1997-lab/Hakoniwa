// 仮の絵を、ゲームと同じ描画関数で写す。出力は g64 の矩形と足もと。
const fs = require('node:fs');
const vm = require('node:vm');

const [name, phaseText] = process.argv.slice(2);
const phase = JSON.parse(phaseText);
const commands = [];
let tx = 0;
let ty = 0;
let scale = 2;
const stack = [];
const c = {
  fillStyle: '#000',
  globalAlpha: 1,
  save() { stack.push([tx, ty, scale, this.globalAlpha]); },
  restore() { [tx, ty, scale, this.globalAlpha] = stack.pop(); },
  translate(x, y) { tx += x * scale; ty += y * scale; },
  scale(k) { scale *= k; },
  fillRect(x, y, w, h) {
    commands.push([x*scale+tx, y*scale+ty, w*scale, h*scale, this.fillStyle, this.globalAlpha]);
  },
};
const base = name.endsWith('b') ? name.slice(0, -1) : name;
const rides = new Set(['merry', 'cup', 'skyswing', 'wheel']);
const dir = name.includes('>') ? Number(name.split('>')[1]) : 0;
const context = vm.createContext({
  c, name: name.split('>')[0], base, phase,
  RIDEK: 1.5, RIDES: rides, RIDEB: {},
  i: phase === null ? null : 1, rideAng: () => phase,
  PLROTS: {kazami: dir}, performance: {now: () => 0},
});
const water = ['dock', 'raft', 'mzchest', 'mzgate', 'mzgateb'].includes(name);
const wind = fs.readFileSync('js/wind.js', 'utf8');
const windArt = wind.slice(wind.indexOf('function drawWindObj'), wind.indexOf('function drawRide0'));
const ride = wind.slice(wind.indexOf('function drawRide0')).split(/\n(?=\/\*|function |const |ACT\.)/)[0];
vm.runInContext(windArt + ride, context);
let anchor = [32, 56];
if (rides.has(base)) {
  vm.runInContext('drawRide(c, base, name !== base, 0, 0, i, 0)', context);
  anchor = [base === 'wheel' ? 96 : 64, 112];
} else if (water) {
  const mz = fs.readFileSync('js/mizube.js', 'utf8');
  vm.runInContext(mz.slice(mz.indexOf('const mzPx='), mz.indexOf('function mzBoatDraw')), context);
  vm.runInContext('mzDrawObj(c, name, 0, 0, null, 1)', context);
  anchor = [32, 64];
} else {
  vm.runInContext('drawWindObj(c, name, 0, 0, null, 0, 0)', context);
}
process.stdout.write(JSON.stringify([commands, anchor]));
