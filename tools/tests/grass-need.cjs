/* 目標に足りない草：御神木の調べの準備（切り株の下で：あさぶくろ）に足りない草は、雑草を見つける広さ（seekR）より遠くても、せいれいがとりに行く。
   足りていれば、遠くの草へは行かない。 */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;
    S.t=1440*3+10*60;const a=S.res[0];a.hunger=hMax(a);a.energy=100;a.fun=100;
    const f=mkRes(S,'テスト火','fire',a.x,a.y);f.hunger=hMax(f);f.energy=100;f.fun=100;S.res.push(f);for(const q of S.res){endAct(q);q.act=null}
    const c=(f.y|0)*W+(f.x|0)+2;S.obj[c]='';S.obj[c]='crate';recount();addFood('berry',20);S.mat.wood=20;boxSync();
    S.quest=questIndexOf('earthListen');S.qTalked=true;S.orders=[];
    /* まわり20マスの雑草はけして、ふんばり草を seekR より遠い所に1本だけ */
    for(let dy=-20;dy<=20;dy++)for(let dx=-20;dx<=20;dx++){const k=((f.y|0)+dy)*W+(f.x|0)+dx;if(WEEDS.has(S.obj[k]))S.obj[k]=''}
    let far=-1;for(let d=seekR(f)+1;d<20&&far<0;d++)for(const k of[(f.y|0)*W+(f.x|0)+d,(f.y|0)*W+(f.x|0)-d,((f.y|0)+d)*W+(f.x|0),((f.y|0)-d)*W+(f.x|0)])if(far<0&&!S.obj[k]&&walk(k)){S.obj[k]='weedc';far=k}
    const out={far:far>=0,dist:far<0?0:Math.hypot(far%W+.5-f.x,(far/W|0)+.5-f.y)>seekR(f),need:JSON.stringify(grassNeed())};
    goWork(f,bfs(f.x|0,f.y|0),true);out.act=f.act&&f.act.type;out.obj=f.act&&f.act.obj===far;
    endAct(f);f.act=null;S.mat.funba=6;boxSync();out.need2=grassNeed();goWork(f,bfs(f.x|0,f.y|0),true);out.act2=f.act&&f.act.type;out.obj2=!!(f.act&&f.act.obj===far);
    return JSON.stringify(out)})()`));
  console.log(r);
  assert.equal(r.far,true);assert.equal(r.dist,true,'far weed is outside seekR');assert.ok(/funba/.test(r.need),'funba is short');
  assert.equal(r.act,'weed');assert.equal(r.obj,true,'goes to the far funba');
  assert.equal(r.need2,null,'enough funba: nothing short');assert.equal(r.obj2,false,'does not go to far weeds when enough');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
