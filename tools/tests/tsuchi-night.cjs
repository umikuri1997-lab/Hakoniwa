/* 土のステージの夜（tsuchi-night.js）：ツチノオオカゲを追いかえしたあと、谷の地われからコワイノとバケモノが来る。
   3びきに1ぴきが、洞窟でひらいた階のバケモノ（ひらいた階から、じゅんばんに）・来る所は地われのふち・朝はバケモノだけ歩いて地われへもどる
   夜の水のかたまりは2つにわかれる・組みかけのほねは組みなおす（まもりの光でとどめ）・炉にくべられたものの通った所は、あつい床・古いセーブの読みかえ */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:2});
  const J=async s=>JSON.parse(await run(`JSON.stringify(${s})`));
  /* まだ追いかえしていない土の村：夜は来ない */
  const a0=await J(`(()=>({on:!!S.enemyOn}))()`);assert.equal(a0.on,false,'ツチノオオカゲの前は、夜のコワイノは来ない');
  /* 追いかえした：つぎの夜から */
  await run(`(()=>{S.flags.tsOokDown=1;S.enemyOn=true;S.cvClr=3;S.nights=6;S.enemies=[];while(S.res.length<6){const r=mkRes(S,'テスト'+S.res.length,'earth',CX+.5+S.res.length,CY+2.5);r.nap=false;S.res.push(r)}})()`);
  const w=await J(`(()=>{const out=[];for(let d=10;d<16;d++){S.nights=d;const L=waveFor(d);out.push(L)}return out})()`);
  console.log(JSON.stringify(w));
  for(const L of w){const bk=L.filter(t=>t.startsWith('bk_'));assert.equal(bk.length,Math.floor(L.length/3),'3びきに1ぴきがバケモノ');assert.ok(bk.every(t=>['bk_kui','bk_sui','bk_yoru'].includes(t)),'ひらいた階のバケモノだけ');assert.ok(!L.includes('boss'),'オオカゲは来ない')}
  {const all=w.flat().filter(t=>t.startsWith('bk_'));for(const t of['bk_kui','bk_sui','bk_yoru'])assert.ok(all.includes(t),'どの階のバケモノも来る '+t)}
  const w0=await J(`(()=>{S.cvClr=0;S.nights=8;const L=waveFor(12);S.cvClr=3;return L})()`);assert.ok(!w0.some(t=>t.startsWith('bk_')),'洞窟をひらいていなければ、コワイノだけ');
  /* 来る所：地われのふち */
  const s1=await J(`(()=>{S.enemies=[];S.t=Math.floor(S.t/1440)*1440+1440;spawnWave(['basic','bk_kui','fast','bk_sui']);document.querySelectorAll('#dialog').forEach(d=>d.hidden=true);DLGQ.length=0;for(const e of S.enemies){e.delay=0;updEnemy(e,.1)}return S.enemies.map(e=>({sp:e.spawned,rift:[1,-1,W,-W].some(d=>riftJ((e.y|0)*W+(e.x|0)+d)),far:Math.hypot(e.x-CX,e.y-CY)}))})()`);
  console.log(JSON.stringify(s1));assert.ok(s1.every(e=>e.sp&&e.rift),'地われのふちから来る');
  /* 夜の水のかたまり：たたかれると2つにわかれる（1回だけ） */
  const p1=await J(`(()=>{const e=S.enemies[0];e.type='bk_yoru';e.hp=e.max=EN.bk_yoru.hp;S.enemies=[e];hurtEn(e,40,{exact:1});tsNightTick(0);tsNightTick(0);const L=S.enemies.filter(q=>q.type==='bk_yoru');return{n:L.length,hp:L.map(q=>q.hp)}})()`);
  console.log(JSON.stringify(p1));assert.equal(p1.n,2,'2つにわかれる');assert.deepEqual(p1.hp,[80,80]);
  /* 組みかけのほね：たおしても組みなおす。まもりの光で、とどめ */
  const h1=await J(`(()=>{const e=S.enemies[0];e.type='bk_hone';e.hp=e.max=EN.bk_hone.hp;S.enemies=[e];const k0=S.kills;defeat(e,'t');const a={down:!!e.down,dead:!!e.dead,sp:e.spawned,k:S.kills-k0};S.t=e.down+1;updEnemy(e,.1);const b={down:!!e.down,sp:e.spawned,hp:e.hp===e.max};defeat(e,'t');glHit(e.x|0,e.y|0,1,null);return{a,b,dead:!!e.dead,k:S.kills-k0}})()`);
  console.log(JSON.stringify(h1));assert.deepEqual(h1.a,{down:true,dead:false,sp:false,k:0},'くずれて、まだ消えない');assert.deepEqual(h1.b,{down:false,sp:true,hp:true},'組みなおして起きる');assert.equal(h1.dead,true,'まもりの光でとどめ');assert.equal(h1.k,1);
  /* 炉にくべられたもの：通った所が、あつい床。火のせいれいのほかは、おなかがへる */
  const r1=await J(`(()=>{S.enemies=S.enemies.filter(e=>!e.dead);const L=S.res.filter(r=>r.elem!=='fire'),r=L[0];let j=-1;for(let k=(CY+3)*W+CX;k<W*H;k++)if(walk(k)&&!S.ground[k]&&!riftJ(k)){j=k;break}const e={id:S.nid++,type:'bk_ro',x:j%W+.5,y:((j/W)|0)+.5,hp:160,max:160,delay:0,spawned:true,path:[],repath:0,atk:0,stun:0,flash:0,flee:false};S.enemies=[e];tsNightTick(0);r.x=e.x;r.y=e.y;r.hidden=false;r.hunger=400;tsNightTick(5);const h=r.hunger;e.x+=3;S.t+=CVROHOT+1;tsNightTick(0);return{h,hot:TSHOT.m.has(j)}})()`);
  console.log(JSON.stringify(r1));assert.ok(r1.h<400&&r1.h>=394-0.01,'あつい床で、おなかがへる');assert.equal(r1.hot,false,'あつい床は、しばらくでさめる');
  /* 朝：コワイノは消えて、バケモノは歩いて地われへもどる */
  const m1=await J(`(()=>{S.enemies=[];spawnWave(['basic','bk_kui']);document.querySelectorAll('#dialog').forEach(d=>d.hidden=true);DLGQ.length=0;for(const e of S.enemies){e.delay=0;updEnemy(e,.1);e.x=CX+.5;e.y=CY+4.5}S.nightHad=true;S.t=Math.floor(S.t/1440)*1440+6*60-.5+(S.hold||0);stepWorld(1);return S.enemies.map(e=>({t:e.type,home:!!e.home,flee:!!e.flee}))})()`);
  console.log(JSON.stringify(m1));assert.deepEqual(m1,[{t:'bk_kui',home:true,flee:true}],'朝、バケモノだけのこって、もどる');
  const m2=await J(`(()=>{const e=S.enemies[0],x0=e.x,y0=e.y;for(let i=0;i<4000&&S.enemies.includes(e);i++)stepWorld(1);return{gone:!S.enemies.includes(e),dead:!!e.dead,rift:[1,-1,W,-W].some(d=>riftJ((e.y|0)*W+(e.x|0)+d)),moved:Math.hypot(e.x-x0,e.y-y0)}})()`);
  console.log(JSON.stringify(m2));assert.ok(m2.gone&&m2.dead&&m2.rift,'地われのふちまで歩いて、もどった');
  /* 絵：バケモノ・くずれたほね・あつい床を描いてもエラーにならない */
  await run(`(()=>{const j=(CY+4)*W+CX;S.enemies=[{id:S.nid++,type:'bk_kui',x:CX+.5,y:CY+4.5,hp:300,max:300,delay:0,spawned:true,path:[],repath:0,atk:0,stun:0,flash:0,flee:false},{id:S.nid++,type:'bk_hone',x:CX+1.5,y:CY+4.5,hp:0,max:180,delay:0,spawned:false,down:S.t+20,path:[],repath:0,atk:0,stun:0,flash:0,flee:false}];tsHotMap().set(j,S.t+10);cam.x=(CX-6)*TS;cam.y=(CY-2)*TS})()`);
  await page.waitForTimeout(600);
  /* 古いセーブ：追いかえしたあとのセーブは、夜が来るようになる */
  const g1=await J(`(()=>{const s={ts:{hole:1},flags:{tsOokDown:1},enemyOn:false,mig:11};runMigrations(s);const t={flags:{},enemyOn:false,mig:11};runMigrations(t);return{a:s.enemyOn,b:t.enemyOn}})()`);
  console.log(JSON.stringify(g1));assert.deepEqual(g1,{a:true,b:false});
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
