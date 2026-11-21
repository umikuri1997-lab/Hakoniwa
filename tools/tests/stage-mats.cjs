/* 水・闇のステージの草・花・素材：その土地の雑草が生え、その土地の花を植えられ、その土地の素材がとれる。草原の草を使う家具は、その土地の草で作る */
const assert=require('node:assert/strict');
async function one(world,want){const {browser,page,run,errors}=await require('../sim/boot.cjs')({world});
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.hold=0;`);
  const o=JSON.parse(await run(`(()=>{recount();for(let j=0;j<W*H;j++)if(WEEDS.has(S.obj[j]))S.obj[j]='';for(let j=0;j<W*H;j++)REV.add(j);weedMorning();const ws=[...new Set(S.obj.filter(o=>WEEDS.has(o)&&o!=='kinoko'&&o!=='weedc'))];
    let st=null;if(WD===MIZU){S.drops=(S.drops||[]).filter(d=>d.id!=='mat:maruishi');mzStoneMorning();st=S.drops.filter(d=>d.id==='mat:maruishi').length}
    return JSON.stringify({ws,st,fl:Object.keys(S.unlocked).filter(k=>FLOWERS.has(k)&&['ayame','tsukimi','tanpopo'].includes(k)),swing:BL.swing.mat,chips:['weed'+weedSt()+'g','weed'+weedSt()+'k'].every(k=>!!CHIPS[k]),tree:[plantChip('tree',0)===CHIPS['tree'+(WD===MIZU?'~m':'~y')],!!castShadowChip('deadtree',5),iname('deadtree')],ic:Object.keys(MATN).filter(k=>NOMAT[WD]&&!NOMAT[WD].includes(k)&&['ashi','gama','nendo','maruishi','yotsuyu','kagekusa','gekko','kogi'].includes(k)).every(k=>ICI[k]&&ICI[k].ok)})})()`));
  console.log(world,JSON.stringify(o));
  assert.deepEqual(o.ws.sort(),want.ws);assert.deepEqual(o.fl,[want.fl]);assert.deepEqual(o.swing,want.swing);assert.ok(o.chips&&o.ic,'絵');assert.ok(o.tree[0]&&o.tree[1],'木');assert.equal(o.tree[2],want.tree);if(want.st)assert.ok(o.st>0,'丸石');
  assert.deepEqual(errors,[]);await browser.close()}
(async()=>{
  await one(3,{ws:['weed3g'],fl:'ayame',swing:{wood:12,ashi:4},st:1,tree:'水べの木'});
  await one(5,{ws:['weed5g'],fl:'tsukimi',swing:{wood:12,yotsuyu:4},tree:'枯れたオーク'});
  console.log('stage-mats ok')})().catch(e=>{console.error(e);process.exit(1)});
