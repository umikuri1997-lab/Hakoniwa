/* 天気のよほう（weather.js）と季節の料理（season.js・cook_table.py）
   よほう：2日先まで前もってきめ、朝はそのとおりになる（雨・虹・あらし・その日のできごと）。天気の札をタップすると、きょう・あした・あさって。
   季節の料理：冬にあたたかい料理を食べた子は寒さがとどかない・夏につめたい料理を食べた子はつかれのへりがかわらない（6時間）。箱からは、その季節の料理を先にとる。 */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
  await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};showSpotPop=()=>{};true`);
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.hold=0;USERPAUSE=true;S.enemyOn=true;const out={};
    /* よほうのとおりになる */const res=[];for(let i=0;i<30;i++){const d=dayNo();wxFill(d);const e=Object.assign({},S.wxQ[d+1]);S.t+=1440;morning();
      const ok=(!!S.rain===(!!e.r||!!e.s))&&(rainbowToday()===!!e.b)&&(stormNow()===!!e.s)&&(S.today===(S.enemyOn&&dayNo()>=3?e.t:null));res.push(ok?1:0);if(!ok)out.bad=JSON.stringify([d+1,e,S.rain,rainbowToday(),stormNow(),S.today])}
    out.match=res.reduce((a,b)=>a+b,0);out.ahead=Object.keys(S.wxQ).map(Number).filter(k=>k>dayNo()).length;
    /* あらし：前もってきめた日に来て、前の日の17時に知らせる */const d=dayNo();S.wxQ[d+1]={r:1,b:0,s:1,t:null};S.stormNext=d+1;S.stormWarn=0;S.t=Math.floor(S.t/1440)*1440+18*60;stormTick();out.warn=S.stormWarn;S.t+=1440;S.t=Math.floor(S.t/1440)*1440+6*60;morning();out.storm=stormNow()&&S.rain;
    /* よほうの画面 */document.querySelector('.htag.wxtag').click();const rows=[...document.querySelectorAll('.pxpopw .ppb .st b')].map(e=>e.textContent);out.rows=rows;document.querySelectorAll('.pxpopw').forEach(e=>e.remove());
    /* 料理の表 */out.warmN=COOKD.filter(c=>c.f&&c.f.ef&&c.f.ef.warm).length;out.coolN=COOKD.filter(c=>c.f&&c.f.ef&&c.f.ef.cool).length;out.ck16=FOODS.ck16&&FOODS.ck16.fx;out.soup=FOODS.soup.ef;
    /* 冬：あたたかい料理 */const a=S.res[0];a.elem='wood';S.t=Math.floor(S.t/1440)*1440;while(seasonNow()!==3)S.t+=1440;S.t+=12*60;S.res=[a];a.x=5.5;a.y=5.5;a.warmT=0;
    out.coldBefore=seaWarm(a);out.mvB=seaMul(a,'move');out.food=seaFood('ck16')+':'+seaFood('ck10');
    a.meal={u:1,items:['ck16'],pt:0,pw:0};const A={};ACT.eat.start(a,A);ACT.eat.end(a,A);out.warmT=a.warmT>S.t;
    const W0=new WeakMap();out.coldAfter=seaWarm(a);out.mvA=seaMul(a,'move');
    /* 夏：つめたい料理 */while(seasonNow()!==1)S.t+=1440;a.coolT=0;out.hotB=seaTired(a);a.meal={u:1,items:['ck10'],pt:0,pw:0};const B={};ACT.eat.start(a,B);ACT.eat.end(a,B);out.hotA=seaTired(a);out.foodS=seaFood('ck16')+':'+seaFood('ck10');
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.match,30,'よほうのとおりの天気になる '+(r.bad||''));assert.equal(r.ahead,2,'2日先まできまっている');
  assert.equal(r.warn,1);assert.equal(r.storm,true);
  assert.deepEqual(r.rows,['きょう','あした','あさって']);
  assert.ok(r.warmN>=20&&r.coolN>=4,r.warmN+' '+r.coolN);assert.match(r.ck16,/6時間、冬の寒さがとどかない/);assert.deepEqual(r.soup,{warm:540});
  assert.equal(r.coldBefore,false);assert.equal(r.mvB,.8);assert.equal(r.food,'1:0');
  assert.equal(r.warmT,true);assert.equal(r.coldAfter,true);assert.equal(r.mvA,1,'あたたかい料理で、冬の寒さがとどかない');
  assert.equal(r.hotB,1.2);assert.equal(r.hotA,1,'つめたい料理で、夏の暑さがとどかない');assert.equal(r.foodS,'0:1');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
