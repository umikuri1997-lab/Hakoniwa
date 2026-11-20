/* ビルダーズを参考にした手ざわり：
   部屋のおねがい（こまりごと room）・たのんだ子が作った物を見にきて、つかう（giftVisit・tryGiftUse）・
   部屋がはじめてできたときのパワー（ROOMPW）・建てている所と設計図のできあがりの絵（siteGhost・bpGhostDraw） */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;USERPAUSE=true;S.enemyOn=false;const out={};S.t=1440*4+10*60;
    const a=S.res[0];a.act=null;a.hunger=450;a.fun=50;
    const hx=CX+4,hy=CY-4;for(let y=hy;y<hy+4;y++)for(let x=hx;x<hx+4;x++){const j=y*W+x;S.obj[j]=(y===hy||y===hy+3||x===hx||x===hx+3)?'hwall':''}S.obj[(hy+3)*W+hx+1]='door';
    const bj=(hy+1)*W+hx+1;S.obj[bj]='bed';(S.bedOwn||(S.bedOwn={}))[bj]=a.id;recount();out.home=!!homeOf(a);
    /* 部屋のおねがい：作れる家具だけでできる、まだない部屋 */S.recipes=Object.assign(S.recipes||{},{bed:true,shelf1:true});
    const pick=roomPick(a);out.pickOK=!!pick&&!!ROOMWANT[pick];
    S.trouble={id:a.id,k:'room',d:dayNo(),f:'shinshitsu'};out.text=troubleText(a);out.stillOk=TROUBLE.room.ok(a);
    /* しんしつをそろえる */const sj=(hy+1)*W+hx+2;S.obj[sj]='shelf1';recount();out.roomIn=roomIn(homeOf(a),'shinshitsu');
    const pt0=S.pt;for(let i=0;i<5;i++)troubleTick();out.fixed=S.trouble===null;out.visit=JSON.stringify((QUEST_VISITS.get(a)||[]).map(v=>[v.obj,v.id,v.gift]));out.bj=bj;
    /* 見たあと、つかう：ベンチ */S.obj[(CY+3)*W+CX-3]='bench';recount();a.giftUseJ=(CY+3)*W+CX-3;a.act=null;out.use=tryGiftUse(a);out.useAct=a.act&&a.act.type;
    /* 部屋のパワー：スポットのポップアップ */S.spotSeen=S.spotSeen||{};const ROOMS=SPOT_POPS.filter(e=>e.sp&&e.sp.room).map(e=>e.sp.k);out.popRoom=ROOMS.includes('shinshitsu');
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.home,true);assert.equal(r.pickOK,true);
  assert.ok(r.text.includes('しんしつがほしい'),r.text);assert.equal(r.stillOk,true);
  assert.equal(r.roomIn,true);assert.equal(r.fixed,true);
  assert.ok(JSON.parse(r.visit).some(v=>v[0]===r.bj&&v[2]===1),'たのんだ子が見にくる');
  assert.equal(r.use,true);assert.equal(r.useAct,'rest');assert.equal(r.popRoom,true);
  /* ポップアップを出して OK：パワー+ROOMPW */
  const p=JSON.parse(await run(`(async()=>{const pt0=S.pt;spotSceneReset&&spotSceneReset();GIFT_ACTIVE=false;while(SPOT_POPS.length&&!(SPOT_POPS[0].sp&&SPOT_POPS[0].sp.k==='shinshitsu'))SPOT_POPS.shift();SPOT_POPS[0].scn=1;showSpotPop();await new Promise(z=>setTimeout(z,800));const card=document.querySelector('.idea-card');const txt=card?card.textContent:'';card&&card.querySelector('button').click();return JSON.stringify({txt,d:S.pt-pt0})})()`));
  console.log(JSON.stringify(p));
  assert.ok(p.txt.includes('パワー+20'),p.txt);assert.equal(p.d,20);
  /* できあがりの絵：建てている所は、足場の上に物の絵がうすく出る。設計図の家具の部品も */
  const g=JSON.parse(await run(`(()=>{const cv=document.createElement('canvas');cv.width=cv.height=200;const c=cv.getContext('2d');const sum=()=>{const d=c.getImageData(0,0,200,200).data;let n=0;for(let i=3;i<d.length;i+=4)n+=d[i];return n};
    const d={build:'well',p:0,need:10,got:{}};siteGhost(c,d,80,120,performance.now(),null);const a0=sum();c.clearRect(0,0,200,200);d.p=10;siteGhost(c,d,80,120,performance.now(),null);const a1=sum();
    c.clearRect(0,0,200,200);siteGhost(c,{build:'stairs',p:5,need:10},80,120,performance.now(),null);const st=sum();
    const k=Object.keys(BPS).find(k=>bpPieces(k).some(p=>p[2]==='furn'));const old=pending;pending={kind:'bp',k,x:CX-20,y:CY+10,ok:true};bpGhostDraw(c);pending=old;
    return JSON.stringify({a0,a1,st})})()`));
  console.log(JSON.stringify(g));assert.ok(g.a0>0,'0%でもうすく出る');assert.ok(g.a1>g.a0,'建てるほどこく');assert.equal(g.st,0,'階段は出さない');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
