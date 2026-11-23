const assert=require('node:assert/strict');
/* 夜の窓のあかり（iqWinLit、js/iso-conn.js）：灯りのある家の、外を向いた窓（南の壁・東の壁）だけ光る。家の中を向いた窓（北・西）・屋根をはずした家・昼は光らない。手前に背の高い物があれば描かない */
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
const out=JSON.parse(await run(`(()=>{USERPAUSE=true;const T=h=>{S.t=1440*2+h*60};const f=S.res[0],X=(f.x|0)+6,Y=(f.y|0)+3;
  for(let y=Y-1;y<Y+9;y++)for(let x=X-1;x<X+7;x++){const j=y*W+x;S.obj[j]='';delete S.ref[j];delete S.dyn[j];S.floor[j]='';S.ground[j]=0;if(S.hi)S.hi[j]=0;if(S.fog)S.fog[j]=0}
  for(let y=Y;y<Y+5;y++)for(let x=X;x<X+5;x++){const j=y*W+x;if(y===Y||y===Y+4||x===X||x===X+4)S.obj[j]='hwall';else S.floor[j]='floor'}S.obj[(Y+4)*W+X+2]='door';
  S.win=S.win||{};const sw=(Y+4)*W+X+1,ew=(Y+2)*W+X+4,nw=Y*W+X+2,ww=(Y+2)*W+X;for(const q of[sw,ew,nw,ww])S.win[q]=1;recount();
  const h=HOUSES.find(q=>q.inside.has((Y+2)*W+X+2));const got=[];const o0=iqChip;iqChip=(c,k,i,lv)=>{got.push([k,i]);return true};
  const draw=()=>{got.length=0;iqWinLit(ctx,new Set([h]));return got.map(g=>(g[1]===sw?'s':g[1]===ew?'e':g[1]===nw?'n':g[1]===ww?'w':'?')+':'+g[0].slice(-1)).sort().join(',')};
  const cs=()=>{cam.x=(X+2)*TS-VW/cam.z/2;cam.y=(Y+2)*TS-VH/cam.z/2};cs();
  const r={};T(23);r.night=draw();T(12);r.noon=draw();T(23);ROOFS.set(hKey(h),{a:0});r.open=draw();ROOFS.set(hKey(h),{a:1});
  S.obj[(Y+5)*W+X+1]='tree';r.tree=draw();iqChip=o0;r.chip=!!(CHIPS['iso:win:window:lit:h']&&CHIPS['iso:win:window:lit:v']);
  ctx.save();iqWinLit(ctx,new Set([h]));ctx.restore();return JSON.stringify(r)})()`));
  assert.ok(out.chip,'lit window chips exist');
  assert.equal(out.night,'e:v,s:h','only the outward windows (south, east) glow at night: '+out.night);
  assert.equal(out.noon,'','no glow at noon');
  assert.equal(out.open,'','with the roof off the front walls are low (no windows): '+out.open);
  assert.ok(!/s:/.test(out.tree),'a tree in front hides the lit south window: '+out.tree);
  console.log('Window light: outward windows glow at night, hidden behind tall things',JSON.stringify(out));
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
