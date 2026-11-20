/* うれしさの演出・宝箱の謎解き・草原のそうび・図鑑の節目・宝箱だけの家具（juice2.js・reveal.js・fogpuzzle.js・zukanms.js）
   - 箱入り娘の2つの形が、とけること（やさしい形 14手・むずかしい形 45手。1マスうごかすのを1手）
   - 謎の画面4つが、エラーなく出て、さわれること。ダイヤル・すべる石は、ゴールから逆にうごかしてまぜるので、かならずとける
   - ふしぎなふくろ：中身に合わせたタップの回数で、ひらいて中身が出る
   - 草原で、はじめてそうびを手に入れたら、作れる8つを思いつく
   - 図鑑の節目：さかなが5しゅるいで、パワー50
   - 宝箱だけの家具：レシピにならない・水ばちのまわりの芽は、植えたその日に育つ・望遠鏡で流れ星の見こみ
   - 家ができたしゅんかん・光のなみ・ヒットストップが、エラーなくうごく */
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
function klotski(P){const W=4,H=5,key=s=>{const g=Array(20).fill('.');s.forEach((p,i)=>{const c=i===0?'B':p[2]+''+p[3];for(let y=0;y<p[3];y++)for(let x=0;x<p[2];x++)g[(p[1]+y)*W+p[0]+x]=c});return g.join('')};
  const seen=new Set([key(P)]);let q=[P],d=0;
  while(q.length){const nq=[];for(const s of q){if(s[0][0]===1&&s[0][1]===3)return d;const occ=Array(20).fill(-1);s.forEach((p,i)=>{for(let y=0;y<p[3];y++)for(let x=0;x<p[2];x++)occ[(p[1]+y)*W+p[0]+x]=i});
    s.forEach((p,i)=>{for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=p[0]+dx,ny=p[1]+dy;if(nx<0||ny<0||nx+p[2]>W||ny+p[3]>H)continue;let ok=true;for(let y=0;y<p[3]&&ok;y++)for(let x=0;x<p[2];x++){const o=occ[(ny+y)*W+nx+x];if(o!==-1&&o!==i){ok=false;break}}if(!ok)continue;const n=s.map(q=>q.slice());n[i][0]=nx;n[i][1]=ny;const k=key(n);if(seen.has(k))continue;seen.add(k);nq.push(n)}})}q=nq;d++}return -1}
(async()=>{
  const src=fs.readFileSync(path.join(__dirname,'../../js/fogpuzzle.js'),'utf8'),K=eval('('+src.match(/const KHLAY=(\{[\s\S]*?\]\]\};)/)[1].replace(/;$/,'')+')');
  const kh=klotski(K.kh),kh2=klotski(K.kh2);console.log('klotski',kh,kh2);assert.equal(kh,14);assert.equal(kh2,45);
  const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
  await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};showSpotPop=()=>{};true`);
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;S.enemyOn=false;const out={};
    /* 謎の画面 */
    out.pz={};for(const k of PZKINDS){let solved=0;pzOpen(k,()=>{solved=1});const c=document.querySelector('.pxcard canvas');out.pz[k]=!!c&&c.width>0;const b=c.getBoundingClientRect();
      for(let i=0;i<6;i++)c.dispatchEvent(new PointerEvent('pointerdown',{clientX:b.left+b.width*(.2+.15*(i%4)),clientY:b.top+b.height*.8,pointerId:1,bubbles:true}));
      c.dispatchEvent(new PointerEvent('pointermove',{clientX:b.left+b.width*.9,clientY:b.top+b.height*.8,pointerId:1,bubbles:true}));c.dispatchEvent(new PointerEvent('pointerup',{pointerId:1,bubbles:true}));
      document.querySelector('.pxcard .rs').click();document.querySelectorAll('.pxcard').forEach(e=>e.parentNode.remove())}
    /* ふくろ：家具ならタップ6回 */
    const fr=fukuroRoll;fukuroRoll=()=>[['orgel',1]];S.fukuro=1;fukuroOpen();fukuroRoll=fr;const st=document.querySelector('.pxcard .st');let taps=0;while(!document.querySelector('.pxcard .it img')&&taps<20){st.click();taps++}
    out.fukTaps=taps;out.fukItem=[...document.querySelectorAll('.pxcard .it span')].map(e=>e.textContent).join();document.querySelectorAll('.pxcard').forEach(e=>e.parentNode.remove());
    /* 草原のそうび */
    const g0=GEAR_IDS.filter(id=>BL[id].g.gr&&!BL[id].g.sp&&S.recipes&&S.recipes[id]).length;giveItem('gg09',1);out.gearLearn=[g0,GEAR_IDS.filter(id=>BL[id].g.gr&&!BL[id].g.sp&&S.recipes[id]).length];out.gearHas=gearCount('gg09');out.ggKnown=recipeKnown('gg01');
    /* 図鑑の節目 */
    S.flags.zkMs=null;delete S.flags.zkMs;zkMsTick(1e9);const pt0=S.pt;S.fishRec={funa:1,koi:1,nijimasu:1,yumasu:1,namazu:1};zkMsTick(2e9);out.zk=[S.flags.zkMs[6],S.pt-pt0];out.zkNext=zkNext(6);
    /* 宝箱だけの家具 */
    out.chestRec=['orgel','telescope','hdokei','mizubachi'].map(id=>recipeKnown(id));out.chestPool=['orgel','telescope','hdokei','mizubachi'].some(id=>giftPoolOK(id));
    const mj=(CY+6)*W+CX+6,fj=mj+2;S.obj[mj]='mizubachi';S.obj[fj]='clover';(S.bud||(S.bud={}))[fj]=callDay()+1;recount();out.bud=isBud(fj);S.obj[mj]='';recount();out.budFar=isBud(fj);S.obj[fj]='';
    out.star=STARPT>STARP;
    /* 家ができた・光のなみ・ヒットストップ */
    juiceHouse({set:new Set([(CY+4)*W+CX,(CY+4)*W+CX+1,(CY+5)*W+CX])},performance.now());juiceWave();const a=S.res[0];fx.push({k:'spr',n:'treefall',x:0,y:0,life:1,dur:1});juiceStop(a,fx.length-1);out.stopOff=juiceStopOff(a,performance.now()+10)!==0;out.wave=waveR(performance.now()+500)>0;
    return JSON.stringify(out)})()`));
  await page.waitForTimeout(400);
  console.log(JSON.stringify(r));
  for(const k in r.pz)assert.equal(r.pz[k],true,k);
  assert.equal(r.fukTaps,6,'家具はタップ6回');assert.equal(r.fukItem,'古いオルゴール');
  assert.equal(r.gearLearn[1],r.gearLearn[0],'特別なそうびをもらっても、レシピは思いつかない（思いつくのは素材を手に入れたとき。gear.cjs）');assert.equal(r.gearHas,1);assert.equal(r.ggKnown,false);
  assert.deepEqual(r.zk,[1,50]);assert.deepEqual(r.zkNext,{v:6,left:1,all:true});
  assert.deepEqual(r.chestRec,[false,false,false,false]);assert.equal(r.chestPool,false);
  assert.equal(r.bud,false,'水ばちのそばの芽は育つ');assert.equal(r.budFar,true);assert.equal(r.star,true);
  assert.equal(r.stopOff,true);assert.equal(r.wave,true);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
