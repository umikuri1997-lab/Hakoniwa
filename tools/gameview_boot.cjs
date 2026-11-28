/* マップチップ工房の「ゲームの中で」の見本を、ゲームそのもので（新しい草原のゲームで、セーブなしで）置いて写す。クォータービュー（ひし形のマス）。
   つかいかた：node tools/gameview_boot.cjs <出力フォルダ> [id...]
   id がなければ、チップのある BL の物ぜんぶ。id は BL の物（水車 suisha は左どなりを水にする）か、飼う生き物 ani:<hane|moko|tsuno>（S.ani に1ぴき入れて、立つ絵 #0 で写す。ファイル名は ani-<k>.png）。
   つながる物（家の壁・塀・柵・生垣）は、角を置くマスにした L 字（うでは2マスずつ）に、ドア・柵のドアは、となりの壁・柵といっしょに置く。窓・カーテンなど壁にかける物は、壁にかける。
   480×480、3倍（2マスより大きい物・背の高い物は、上が切れないように2倍。info.json の k）。置く所（大きさ z の四角）のまん中の地面の点を、写す絵の (240,300) におく（立つ物が上へのびるので、少し下）。
   出力フォルダに info.json（id → 置いたマスの大きさ sz）も書く。そのあと tools/gameview_grid.py でひし形のマス目と黄色のわくをつけて webp にする。 */
const fs=require('fs');const [OUT0,...IDS0]=process.argv.slice(2);const OUT=OUT0.replace(/\/?$/,'/');fs.mkdirSync(OUT,{recursive:true});
(async()=>{const {browser,page,run,errors}=await require('./sim/boot.cjs')({world:0,draw3d:true,viewport:{width:900,height:900}});
 await run(`(()=>{S.spotSeen=Object.fromEntries(SPOTS.map(s=>[s.k,1]));SPOT_POPS.length=0;document.querySelectorAll(".idea-reveal").forEach(e=>e.remove());GIFT_ACTIVE=false;
  USERPAUSE=true;document.querySelector('#dialog').hidden=true;document.querySelectorAll('.hud,.dock,.quest,#qrow,.qrow,#skill,#toast').forEach(e=>e.style.visibility='hidden');S.res.forEach(r=>r.hidden=true);S.t=Math.floor(S.t/1440)*1440+12*60;S.hold=0;
  aniChip=(a)=>a.in?null:(CHIPS['ani:'+a.k+'#0']||null)})()`);/* 生き物は立つ絵 #0 だけ */
 const IDS=IDS0.length?IDS0:JSON.parse(await run(`JSON.stringify((()=>{const s=new Set();for(const k in CHIPS){const b=k.split(/[:#>@~.\\/]/)[0];if(BL[b]&&b!=='part'&&b!=='site')s.add(b)}return [...s].sort()})())`));
 const info={};
 for(const id of IDS){
  const z=JSON.parse(await run(`(()=>{const X=40,Y=40;S.ani=[];for(let b=-5;b<8;b++)for(let a=-5;a<8;a++){const j=(Y+b)*W+X+a;S.obj[j]='';delete S.ref[j];S.ground[j]=0;if(S.fog)S.fog[j]=0;if(S.hi)S.hi[j]=0;if(S.vx)S.vx[j]='';if(S.floor)S.floor[j]='';if(S.roof)delete S.roof[j];if(S.win)delete S.win[j];if(S.rug)delete S.rug[j];if(S.edge)delete S.edge[j]}
   S.rug=S.rug||{};S.roof=S.roof||{};S.win=S.win||{};const id=${JSON.stringify(id)},j=Y*W+X,put=(q,o)=>{S.obj[q]=o};let z=[1,1];
   if(id.startsWith('ani:')){S.ani.push({id:1,k:id.slice(4),h:j,x:X+.5,y:Y+.6,face:1,wt:0})}
   else{const B=BL[id];z=B.sz||[1,1];
    const conn=typeof iqGrp==='function'&&iqGrp(id);
    if(RUGS.has(id)){S.rug[j]=id;z=[2,2]}
    else if(CANOPY.has(id)){S.roof[j]=id;z=[2,2]}
    else if(WALLD.has(id)){const wl=stg().wall||'hwall';for(let a=-1;a<=1;a++)put(j+a,wl);S.win[j]=id==='window'?1:id}/* 壁にかける物：よこの壁のまん中に */
    else if(conn&&(HOME_DOORS.has(id)||GATE_IDS.has(id))){const wl=id==='sdoor'||id==='stonegate'?'wall':HOME_DOORS.has(id)?(stg().wall||'hwall'):id==='logdoor'||id==='loggate'?'logfence':'fence';for(let a=-1;a<=1;a++)put(j+a,wl);put(j,id)}/* ドア・柵のドア：となりの壁・柵といっしょに */
    else if(conn){for(const q of [j-2,j-1,j,j-W,j-2*W])put(q,id)}/* つながる物：L 字（角が置くマス。うでは画面の上の左右へ） */
    else{S.obj[j]=id;for(let b=0;b<z[1];b++)for(let a=0;a<z[0];a++)if(a||b){S.obj[j+b*W+a]='part';S.ref[j+b*W+a]=j}
     if(id==='suisha')S.ground[j-1]=1}}
   try{recount();rebuildStatic(true)}catch(e){}{const ch=CHIPS[id]||CHIPS[id+'#0']||CHIPS[id+':0'],hh=ch?ch.h/(ch.g===64?2:1):0;cam.z=z[0]>1||z[1]>1||hh>72?2:3}/* 大きい物・背の高い物は2倍 */camAt((X+z[0]/2)*TS,(Y+z[1]/2)*TS,450,510);dirty=true;return JSON.stringify({z,k:cam.z})})()`).catch(e=>{errors.push(id+' '+e.message);return '{"z":[1,1],"k":3}'}));
  info[id.replace(':','-')]={sz:z.z||z,k:z.k||3};
  await page.waitForTimeout(400);
  await page.screenshot({path:OUT+id.replace(':','-')+'.png',clip:{x:450-240,y:450-240,width:480,height:480}});
 }
 fs.writeFileSync(OUT+'info.json',JSON.stringify(info));
 console.log(IDS.length,JSON.stringify(errors.slice(0,8)));await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
