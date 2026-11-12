/* 火のせいれいの夜の見回り：家のまわり3マスだけ（家の中・灯りのまわり・柵の中は見ない） */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:1});
  const r=JSON.parse(await run(`(()=>{S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+23.5*60;S.enemyOn=true;USERPAUSE=true;document.querySelector('#dialog').hidden=true;
    const f=S.res[0];f.nap=false;f.hunger=hMax(f);f.energy=100;const cx=f.x|0,cy=f.y|0;
    const pick=()=>{let ok=0,n=0;for(let i=0;i<30;i++){endAct(f);f.act=null;PMASK=null;decide0(f);const a=f.act;if(!a||a.type!=='patrol'||a.stand==null||a.stand<0)continue;n++;if(patrolMask()[a.stand]===2)ok++}return ok+'/'+n};
    const out={};
    /* 外のたいまつ（家より近い所） */S.obj[(cy+1)*W+cx+2]='torch';
    /* 小さな家 */const hx=cx+8,hy=cy-4;for(let y=hy;y<hy+4;y++)for(let x=hx;x<hx+4;x++){const j=y*W+x;S.obj[j]=(y===hy||y===hy+3||x===hx||x===hx+3)?'hwall':''}S.obj[(hy+3)*W+hx+1]='door';recount();PMASK=null;
    out.houses=HOUSES.length;let n=0;const m=patrolMask();for(let j=0;j<W*H;j++)if(m[j]===2)n++;out.ring=n;out.pick=pick();
    return JSON.stringify(out)})()`));
  console.log(r);
  assert(r.houses>=1,'house built');assert(r.ring>20,'house ring exists');
  const [k,n]=r.pick.split('/').map(Number);assert(n>0&&k===n,'fire spirit patrols only around the house');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
