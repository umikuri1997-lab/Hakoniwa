/* 物のアイコン（iconURL がその場で作っていた 144×144 の絵）を、先にぜんぶ作って、アトラスにまとめる。
   ゲームは、マップを開く前にアトラスを読んで、切り出すだけ（js/houses.js の iconURL・ITIP）。
   使い方: node tools/art/item_icons.cjs
   - ゲームをブラウザで開き、草原で、BL の物のアイコンを、絵のページがぜんぶとどいてから作る
   - ほかのステージでも作って、草原とちがう絵になる物（ステージで絵がかわる物）は、アトラスに入れない（ゲームがその場で作る）
   - アトラスに入れるのは、144×144にちぢめる前のドット絵（絵のある範囲だけ。ちぢめるのはゲームが切り出すとき）。つむブロックは48ドットの絵
   - tools/art/item_icon_pack.py が、それをつめて、js/item-icons.js と assets/g のアトラスを書く
   物の絵（チップ）・BL をかえたら、これを動かす（動かさないと、前の絵のアイコンのまま）。 */
const boot=require('../sim/boot.cjs'),serve=require('../sim/serve.cjs'),fs=require('fs'),os=require('os'),path=require('path'),{execFileSync}=require('child_process');
const WORLDS=[0,1,2,3,4,5];/* 草原・火山・土・水・風・闇 */
/* r：ちぢめる前の絵（絵のある範囲だけ）・c：つむブロックの144の絵・w：読みこみ待ち */
const GEN=`(()=>{for(const k in ITIA.m)delete ITIA.m[k];const ids=Object.keys(BL).filter(id=>id!=='tower'&&!id.startsWith('seed:')&&BL[id].kind!=='gift'&&!BL[id].g),o={};let wait=0;
  for(const id of ids){try{if(PICKB.includes(id)){const u=cubeIcon(id);if(u)o[id]={c:u};else wait++;continue}
    const r=iconDraw(id);if(!r){wait++;continue}if(!r[2])continue;const c=document.createElement('canvas');c.width=r[2];c.height=r[3];const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(ICONTMP,r[0],r[1],r[2],r[3],0,0,r[2],r[3]);o[id]={r:c.toDataURL()}}catch(e){o[id]={e:String(e.message)}}}
  return JSON.stringify({o,wait,pend:!chaReady()})})()`;
async function icons(world){const {browser,page,run,errors}=await boot({world});let last=null,r=null;
  for(let n=0;;n++){r=JSON.parse(await run(GEN));const sig=JSON.stringify(r.o);if(!r.wait&&!r.pend&&sig===last)break;last=sig;if(n>=60)throw new Error('アイコンがそろわない world '+world+' wait '+r.wait);await page.waitForTimeout(500)}
  await browser.close();console.log('world',world,Object.keys(r.o).length,'こ');if(errors.length)throw new Error(errors.join('\n'));return r.o}
(async()=>{const server=await serve();process.env.GAME_URL='http://127.0.0.1:'+server.address().port;
  const base=await icons(WORLDS[0]),skip=new Set(),key=v=>v?JSON.stringify(v):'';
  for(const id in base)if(base[id].e)skip.add(id);/* 作れなかった物 */
  for(const w of WORLDS.slice(1)){const o=await icons(w);for(const id of new Set([...Object.keys(base),...Object.keys(o)]))if(key(o[id])!==key(base[id]))skip.add(id)}
  server.close();const out={};for(const id in base)if(!skip.has(id))out[id]=base[id];
  const f=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'itemicons-')),'icons.json');fs.writeFileSync(f,JSON.stringify(out));
  console.log('アトラスに入れる',Object.keys(out).length,'こ・入れない（ステージで絵がかわる・作れない）',[...skip].join(' '));
  execFileSync('python3',[path.join(__dirname,'item_icon_pack.py'),f],{stdio:'inherit'});fs.rmSync(path.dirname(f),{recursive:true})})().catch(e=>{console.error(e);process.exit(1)});
