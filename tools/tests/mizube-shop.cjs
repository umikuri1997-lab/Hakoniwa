/* 水のステージの食堂（試作、js/mizube-shop.js）：店になる条件・ふんいき・調理のうで・お客さんが舟で来て食べてかいがらをはらう・歌・貿易・セーブ */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:3});
  const J=async s=>JSON.parse(await run(`JSON.stringify(${s})`));
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.hold=0;S.t=1440+600;S.quest=99;`);
  /* 家：9×7（中は7×5）。ドアは下のまん中。中に、食卓・いす2つ・かまど。看板はあとで */
  await run(`(()=>{const hx=CX+3,hy=CY+2;window.__H={hx,hy};for(let y=hy-1;y<hy+9;y++)for(let x=hx-1;x<hx+10;x++){const j=y*W+x;S.obj[j]='';S.floor[j]='';delete S.dyn[j];S.ground[j]=0;if(S.mz.cn)delete S.mz.cn[j]}
    for(let y=hy;y<hy+7;y++)for(let x=hx;x<hx+9;x++){const j=y*W+x;if(y===hy||y===hy+6||x===hx||x===hx+8)S.obj[j]='hwall'}S.obj[(hy+6)*W+hx+4]='door';
    const I=(x,y)=>(hy+y)*W+hx+x;S.obj[I(3,2)]='table';S.obj[I(2,2)]='chair';S.obj[I(4,2)]='chair';S.obj[I(6,1)]='oven';
    const d=(hy+8)*W+hx+4;S.obj[d]='dock';window.__D=d;S.obj[(hy+8)*W+hx+7]='crate';recount()})()`);
  assert.equal(await J(`shopOf()`),null,'no shop without the sign');
  await run(`S.obj[(__H.hy+1)*W+__H.hx+1]='shopsign';S.obj[(__H.hy+1)*W+__H.hx+2]='candle';recount()`);
  const a=await J(`(()=>{const s=shopOf();return s&&{seats:s.seats.length,fun:s.fun,stars:s.stars}})()`);
  assert.deepEqual(a,{seats:2,fun:3,stars:0},'the sign makes the house a shop; a light gives 3');
  await run(`(()=>{const I=(x,y)=>(__H.hy+y)*W+__H.hx+x;S.obj[I(5,4)]='counter';S.obj[I(6,4)]='menuboard';S.obj[I(1,4)]='stage';recount()})()`);
  assert.deepEqual(await J(`(()=>{const s=shopOf();return {fun:s.fun,stars:s.stars}})()`),{fun:23,stars:1},'counter 5 + menu board 5 + stage 10 + light 3 = 23 (one star)');
  console.log('Shop: a house with the sign, a table, seats and a cooking station is a shop; its mood gives stars');
  /* 調理のうで：10この料理で1つ上がる。Lv4で★2 */
  const u=await J(`(()=>{const r=S.res[0];r.ude=0;S.mz.star={};S.mz.menu=[];for(let i=0;i<9;i++)shopCooked(r,'soup');const a=[udeLv(r),shopStar('soup')];shopCooked(r,'soup');const b=udeLv(r);for(let i=0;i<20;i++)shopCooked(r,'soup');return {a,b,c:udeLv(r),st:shopStar('soup'),menu:S.mz.menu}})()`);
  assert.deepEqual(u,{a:[1,1],b:2,c:4,st:2,menu:['soup']});
  console.log('Shop: cooking skill rises every 10 dishes and sets the dish stars');
  /* お客さん：11時に舟で来て、すわって、料理を待つ。せいれいが箱から運ぶと、食べて、かいがらをはらう（★2＝5） */
  await run(`(()=>{S.cookKn={'imo+tomato@oven':'soup'};boxIn(${'__D'}+3,'f:soup',5);while(hour()<11)S.t+=1;S.mz.wv=null;S.mz.shell=0;S.mz.served=0;const r=S.res[0];r.x=__D%W+.5;r.y=((__D/W)|0)-1+.5;r.hunger=500;r.energy=100;r.fun=100;r.act=null;r.path=[]})()`);
  await run(`shopTick(.1)`);
  const c0=await J(`{n:SHOPC.cust.length,want:SHOPC.cust.map(c=>c.want)}`);
  assert.equal(c0.n,2,'customers are capped by the seats');assert.deepEqual(c0.want,['soup','soup']);
  let s=null;for(let k=0;k<40;k++){s=await J(`(()=>{const r=S.res[0];r.hunger=500;r.energy=100;r.fun=100;for(let i=0;i<200;i++)stepWorld(.25);return {served:S.mz.served||0,shell:S.mz.shell||0,cust:SHOPC.cust.map(c=>c.st)}})()`);if(s.shell>=10)break}
  assert.equal(s.served,2,'the spirit served both customers: '+JSON.stringify(s));assert.equal(s.shell,10,'two ★2 dishes pay 5 shells each');
  console.log('Shop: customers come by boat, get served, eat and pay shells');
  /* 歌：16時、ミオが舞台で歌う。その夕方のお客さんが2人ふえる */
  let g=null;for(let k=0;k<20;k++){g=await J(`(()=>{const r=S.res[0];if(k0())while(hour()<16)S.t+=1;r.hunger=500;r.energy=100;r.fun=100;for(let i=0;i<200&&S.mz.songD!==callDay();i++)stepWorld(.25);return {song:S.mz.songD===callDay(),sung:S.mz.sung||0}})()`.replace('k0()',k===0?'true':'false'));if(g.song)break}
  assert.deepEqual(g,{song:true,sung:1},'Mio sang on the stage');
  console.log('Shop: Mio sings on the stage before the evening');
  /* 貿易：料理10こで、つぎの朝に3こ */
  const t=await J(`(()=>{S.fs.soup=12;const ok=shopSend(),fs=S.fs.soup,again=shopSend();const k=SHOP.trade.items[S.mz.strade.i%SHOP.trade.items.length],n0=S.fs[k]||0;shopMorning();return {ok,fs,again,got:(S.fs[k]||0)-n0,left:S.mz.strade}})()`);
  assert.deepEqual(t,{ok:true,fs:2,again:false,got:3,left:null});
  console.log('Shop: trade sends 10 dishes and brings 3 ingredients the next morning');
  /* 画面とセーブ */
  await run(`shopPop()`);assert.ok(await J(`document.body.innerText.includes('かいがら（10）')`),'the shop sheet shows the shells');
  await run(`save()`);const sv=await J(`(()=>{const o=JSON.parse(localStorage.getItem(SAVE_KEYS[MIZU]));return {shell:o.mz.shell,star:o.mz.star.soup,menu:o.mz.menu}})()`);
  assert.deepEqual(sv,{shell:10,star:2,menu:['soup']});
  assert.deepEqual(errors,[]);console.log('Shop: OK');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
