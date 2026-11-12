/* 火のせいれいの夜の見回り：外に置いた灯りのまわりを先に見回る。神殿・御神木・家の中の灯りは入れない */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:1});
  const r=JSON.parse(await run(`(()=>{S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+23.5*60;S.enemyOn=true;USERPAUSE=true;document.querySelector('#dialog').hidden=true;
    const f=S.res[0];f.nap=false;f.hunger=hMax(f);f.energy=100;const cx=f.x|0,cy=f.y|0;
    const lit=()=>{PMASK=null;const m=patrolMask();let n=0;for(let j=0;j<W*H;j++)if(m[j]&4)n++;return n};
    const pick=()=>{let lit=0,n=0;for(let i=0;i<30;i++){endAct(f);f.act=null;PMASK=null;decide0(f);const a=f.act;if(!a||a.type!=='patrol'||a.stand==null||a.stand<0)continue;n++;if(patrolMask()[a.stand]&4)lit++}return lit+'/'+n};
    const out={};S.obj[STATUE>=0?STATUE:0]=S.obj[STATUE>=0?STATUE:0];recount();out.none=lit();
    /* 神殿 */const sj=(cy+10)*W+cx+10;S.obj[sj]='statue';recount();out.statue=lit();S.obj[sj]='';
    /* 家の中のランタン：小さな家を建てる */const hx=cx+12,hy=cy-8;for(let y=hy;y<hy+4;y++)for(let x=hx;x<hx+4;x++){const j=y*W+x;S.obj[j]=(y===hy||y===hy+3||x===hx||x===hx+3)?'hwall':''}S.obj[(hy+3)*W+hx+1]='door';S.obj[(hy+1)*W+hx+1]='lantern';recount();out.house=HOUSES.length+':'+lit();
    /* 外のたいまつ */const tj=(cy+4)*W+cx+5;S.obj[tj]='torch';recount();out.torch=lit();out.pick=pick();
    return JSON.stringify(out)})()`));
  console.log(r);
  assert.equal(r.none,0);assert.equal(r.statue,0,'temple light is not patrolled');assert.match(r.house,/^[1-9]\d*:0$/,'house light is not patrolled');
  assert(r.torch>20,'torch area is patrolled');const [l,n]=r.pick.split('/').map(Number);assert(n>0&&l===n,'fire spirit patrols the torch area');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
