/* 手もとの音（本物の録音）：うけとった・たっせい・はじめて置いた・ひろった物の音（材質ごと）・はしご・弓・きのこ・水やりのつづく音・畑の動き・ちょう・図鑑・ボタンでない所のタップ・コワイノの足音・流れ星 */
const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await boot();
await page.mouse.click(450,350);await run(`(()=>{SND.sfx=true;audioInit();AC.resume();if(sheet)closeSheet()})()`);/* まん中の御神木をクリックしてひらいた画面をとじる（ひらいたままだと村が止まり、音が鳴らない） */
await page.waitForFunction(()=>sacredEval(`AC.state==='running'&&['ladder','bowdraw','tpuni','loomk','shutl','cv_chou','midnight','tsoil','twood','tgrass','tstone','pourw','tillhit','starkira','fgrass','knockw','tink','tbell','slip','rwget','rwquest','rwfirst','wdone'].every(k=>(SBUF[k]||[]).some(Boolean))`),{},{timeout:30000});
const out=await run(`(()=>{const o={},name=b=>{for(const k in SBUF)if((SBUF[k]||[]).includes(b))return k;return'?'},L=[];const st=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...a){L.push(name(this.buffer));return st.apply(this,a)};
 const n=k=>L.filter(x=>x===k).length,clr=()=>{L.length=0;LOWL.length=0;for(const k in lastSfx)delete lastSfx[k]}/* 前の音がまだ鳴っていることにしない（うしろの音は同時に LOWN こまで） */;const r=S.res[0];r.nap=false;RHOLD.set(r,0);S.enemies=[];
 const cx=Math.floor(cam.x/TS+VW/cam.z/TS/2),cy=Math.floor(cam.y/TS+VH/cam.z/TS/2);r.x=cx+.5;r.y=cy+.5;
 /* ひろった物：材質の録音 */
 for(const[id,k]of[['mat:wood','twood'],['mat:eda','twood'],['mat:stone','tstone'],['mat:shina','tgrass'],['mat:can','tcan'],['mat:nuno','tcloth'],['food:berry','tgrass'],['food:fish','twater']]){clr();itemSnd(id);o['pick '+id]=itemMat(id)===k&&n(k)>=1&&n('seed')===0}
 clr();S.drops=[];S.mat=S.mat||{};takeDrop({id:'mat:wood',x:cx,y:cy,n:1},r);o.takeDrop=n('twood')>=1&&n('joyc')===0;/* せいれいが拾った知らせは、ちりりんを鳴らさない */
 clr();sfx('tpuni');o.puni=n('tpuni')===1;clr();sfx('bowdraw');o.bow=n('bowdraw')===1;clr();sfx('starkira');o.kira=n('starkira')===1;
 /* うけとった・たっせい・はじめて置いた：持ち主がえらんだ鉄琴とチャイムの録音（作った音・前の鈴は鳴らさない） */
 clr();sfx('gift');o.gift=n('rwget')===1&&n('joyc')===0;clr();sfx('quest');o.quest=n('rwquest')===1;clr();j3FirstSnd();o.first=n('rwfirst')===1&&n('tink')===0&&n('starkira')===0;clr();sfx('workdone');o.wdone=n('wdone')===1;
 /* 水たまりですべる：効果音ラボの「シャッ、シャッ」 */
 {const rp=rainPud;window.rainPud=()=>true;r.slipJ=-1;r.slipT=0;clr();rainSlip(r);o.slip=n('slip')===1;window.rainPud=rp;r.slipT=0;r.slipJ=-1}
 /* 水やり：3秒の音を、つづけて重ねる（すぐ2回よんでも1つだけ） */
 clr();pourKeep(r);pourKeep(r);pourKeep(r);o.pour=n('pourw');
 /* 畑の動き */
 const WB=(nm,hits)=>{clr();const m=SPM[nm],t0=.05/m.r;workBeat(r,nm,t0);for(const b of hits){for(const k in lastSfx)delete lastSfx[k];workBeat(r,nm,(b+.02)/m.r)}return L.slice()};
 o.till=WB('till',[.85]).includes('tillhit');o.sow=WB('sow',[.12,.62]).filter(k=>k==='tsoil').length;o.weed=WB('weed',[.6]).includes('tgrass');
 o.loom=WB('loomweave',[.3,.8]).filter(k=>k==='shutl'||k==='loomk').length;
 /* はしご・コワイノの足音 */
 FOOTP.delete(r);CLIMB.add(r);r.act={type:'watchpost',stage:'do',cl:.5,obj:0};clr();{const T0=performance.now();footTick(T0);for(let i=1;i<=10;i++)footTick(T0+i*100)}o.ladder=n('ladder');CLIMB.delete(r);r.act=null;
 const ty=Object.keys(EN)[0],e={id:3,type:ty,x:cx+.5,y:cy+1.5,hp:10};S.enemies=[e];clr();{const T0=performance.now();footTick(T0);for(let i=1;i<=10;i++){e.x=cx+.5+i*.2;footTick(T0+i*100)}}o.enemy=L.filter(k=>k[0]==='f').length;S.enemies=[];
 /* 図鑑のアイコン */
 clr();zkSnd('i:mat:stone');o.zk=n('tstone')===1;clr();zkSnd('k:'+CRITV.fly);o.chou=n('cv_chou')===1;o.CRITVfly=CRITV.fly;
 /* ボタンでない所のタップ */
 const app=document.querySelector('#app'),d=document.createElement('p');app.appendChild(d);const b=document.createElement('button');app.appendChild(b);
 clr();lastSfx.uknock=0;d.dispatchEvent(new MouseEvent('click',{bubbles:true}));o.knock=n('knockw');clr();lastSfx.uknock=0;b.dispatchEvent(new MouseEvent('click',{bubbles:true}));o.knockBtn=n('knockw');d.remove();b.remove();
 AudioBufferSourceNode.prototype.start=st;return o})()`);
console.log(out);
for(const k in out){if(k==='pour'){assert.equal(out.pour,1,'水やりの音は、かさねて呼んでも1つ');continue}if(k==='sow'){assert.ok(out.sow>=2,'たねまき：手が土にふれるたびに鳴る');continue}if(k==='loom'){assert.ok(out.loom>=2,'はたおり');continue}if(k==='ladder'){assert.ok(out.ladder>=2,'はしごをのぼる音');continue}if(k==='enemy'){assert.ok(out.enemy>=1,'コワイノの足音');continue}if(k==='knock'){assert.equal(out.knock,1,'ボタンでない所は鳴る');continue}if(k==='knockBtn'){assert.equal(out.knockBtn,0,'ボタンは鳴らさない');continue}if(k==='CRITVfly'){assert.equal(out[k],'cv_chou');continue}assert.ok(out[k],k)}
assert.deepEqual(errors,[]);console.log('New sounds ok. Browser errors: none');
await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
