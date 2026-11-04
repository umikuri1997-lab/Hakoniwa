/* マップチップ工房に、チップ（chips.js）ではない絵を足すための書き出し。
   ヌシ様（NSHEET・NSHEET2・NSPR）、アイテム（素材・食べ物・そうび・矢・たね・カミサマの道具のアイコン）、
   チップのない家具・建物（コードで描く物。ゲームのアイコン iconURL の絵）、プログラムの絵（assets/g の PSPR・ART・CSPR・KGS・FXS など）。
   つかいかた：ゲームをサーバーで開けるようにして（python3 -m http.server）、
   node tools/kobo_extra.js <URL> <出力.json> [gvフォルダ]
   → python3 tools/chips.py kobo-extra <工房のフォルダ> <出力.json> で、工房の g/*.json と index.json に入れる。
   gvフォルダをわたすと、チップのない家具・建物を、ゲームそのもので置いて写す（gameview.js と同じ写し方。そのあと gameview_grid.py）。 */
const {chromium}=require('playwright');const fs=require('fs');const [URL0,OUT,GV]=process.argv.slice(2);
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(URL0);await p.waitForTimeout(5000);
const R=await p.evaluate(async()=>{
 const out={},ld=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=u});
 const png=(im,x,y,w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,x,y,w,h,0,0,w,h);const u=c.toDataURL();c.width=c.height=0;return u};
 /* 1つの絵（コマ）を足す。g:64 で、下のはしをマスの下、まん中をマスのまん中に */
 const add=(genre,group,key,name,frames,w,h,ax,ay)=>{out[key]={genre,group,name,w,h,ax:ax==null?Math.round(32-w/2):ax,ay:ay==null?64-h:ay,g:64,f:frames}};
 const whole=async(genre,group,key,name,src)=>{const im=await ld(src);if(im)add(genre,group,key,name,[png(im,0,0,im.width,im.height)],im.width,im.height)};
 /* ヌシ様：コマごとに大きさがちがうので、1コマを1つに */
 const POSE=i=>i<3?['正面','うしろ','横'][i]+'の立ち姿':i<9?'正面を歩く'+(i-2):i<15?'うしろを歩く'+(i-8):'横を歩く'+(i-14);
 for(const [SH,g,nm] of [[NSHEET,'nushi','草原のヌシ様'],[NSHEET2,'nushi2','火のヌシ様']]){const im=await ld(SH.img.src);if(!im)continue;SH.f.forEach((r,i)=>add('nushi',g,g+':'+i,nm+'（'+POSE(i)+'）',[png(im,r[0],r[1],r[2],r[3])],r[2],r[3]))}
 for(const k in NSPR)await whole('nushi','nushi_old','nushi_old:'+k,'草原のヌシ様（前の絵・'+(k==='top'?'からだ':'脚'+k.slice(1))+'）',NSPR[k].src);
 /* アイテム */
 const icon=async(group,key,name,u)=>{if(!u)return;const im=await ld(u);if(im)add('items',group,key,name,[png(im,0,0,im.width,im.height)],im.width,im.height,null,null)};
 for(const k in MATN)await icon('mat','mat:'+k,MATN[k],ICONS[k]||null);
 for(const k in FOODS)await icon('food','food:'+k,FOODS[k].name,ICONS[k]||icURL(FOODS[k].e)||(EIMG[FOODS[k].e]||null));
 if(ICONS.hiryo)await icon('mat','mat:hiryo','肥料',ICONS.hiryo);
 for(const k in BL){const o=BL[k];if(o.g||o.kind==='ammo')await icon(o.kind==='ammo'?'ammo':'gear','gear:'+k,o.name,iconURL(k))}
 for(const k in BL)if(k.startsWith('seed:'))await icon('seed','seed:'+k.slice(5),BL[k].name,iconURL(k));
 for(const [k,n] of [['mover','ひっこしミトン'],['scoop','だんさスコップ'],['hake','ひろびろハケ'],['swap','つけかえトンカチ'],['stamp','スタンプ'],['glass','砂時計'],['dig','けずる'],['mound','もる']])await icon('tool','tool:'+k,n,toolIcon(k));
 /* チップのない家具・建物（コードで描く物）：ゲームのアイコンの絵 */
 const base=new Set(Object.keys(CHIPS).map(k=>k.split(/[:#>@~.\/]/)[0])),codeIds=[];
 for(const k in BL){const o=BL[k];if(base.has(k)||o.g||o.kind==='ammo'||k.startsWith('seed:')||k==='part'||k==='site2'||k==='dig')continue;let u=null;try{u=iconURL(k)}catch(e){}if(!u)continue;const im=await ld(u);if(!im)continue;add('codeart',k,k,o.name,[png(im,0,0,im.width,im.height)],im.width,im.height);codeIds.push(k)}
 /* プログラムの絵（assets/g） */
 for(const k in PSPR)await whole('progart','pspr','pspr:'+k,'建物・道具の絵 '+k,PSPR[k].src);
 for(const k in ART)await whole('progart','art','art:'+k,'花・木・岩の絵 '+k,ART[k].src);
 for(const k in CSPR)await whole('progart','crop','crop:'+k,'作物の絵 '+k,CSPR[k].src);
 for(const k in SPR)await whole('progart','spr','spr:'+k,k==='god'?'カミサマ':'建てている場所',SPR[k].src);
 await whole('progart','spr','spr:bed','ベッド（もとの絵）',BEDSPR.src);
 for(const k in KGS)await whole('progart','kgs','kgs:'+k,'コワイノの絵 '+k,KGS[k].src);
 {const im=await ld(FESTA.img.src);if(im)for(const k in FESTA.F){const r=FESTA.F[k];add('progart','festa','festa:'+k,'おまつりの屋台 '+k,[png(im,r[0],r[1],r[2],r[3])],r[2],r[3])}}
 for(const k in FXS){const F=FXS[k],im=await ld(F.src);if(!im)continue;const fr=[];for(let i=0;i<F.n;i++)fr.push(png(im,i*F.w,0,F.w,F.h));add('progart','fx','fx:'+k,'エフェクト '+k,fr,F.w,F.h,32-F.ax,32-F.ay)}
 for(const k in EMOS)await whole('progart','emo','emo:'+k,'ふきだし '+k,EMOS[k]);
 for(const k in ICONS)if(/^(f_|m_)|^(fire|pan)$/.test(k))await whole('progart','ui','ui:'+k,'UIのアイコン '+k,ICONS[k]);
 return {out,codeIds};
});
fs.writeFileSync(OUT,JSON.stringify(R.out));console.log(Object.keys(R.out).length,'こ');
if(GV){const D=GV.replace(/\/?$/,'/');fs.mkdirSync(D,{recursive:true});
 await p.evaluate(()=>{if(!S)continueGame(newState(0))});await p.waitForTimeout(8000);
 await p.evaluate(()=>{USERPAUSE=true;document.querySelectorAll('.hud,.dock,.quest,#qrow,.qrow,#skill,#toast').forEach(e=>e.style.visibility='hidden');(S.res||[]).forEach(r=>r.hidden=true);S.t=Math.floor(S.t/1440)*1440+12*60;S.hold=0;document.querySelectorAll('.dlg,.idea-reveal,#dlg').forEach(e=>e.style.visibility='hidden')});
 const sz={};
 for(const id of R.codeIds){const z=await p.evaluate(id=>{const X=40,Y=40;for(let b=-4;b<7;b++)for(let a=-4;a<7;a++){const j=(Y+b)*W+X+a;S.obj[j]='';S.ground[j]=0;if(S.hi)S.hi[j]=0;if(S.floor)S.floor[j]=''}
   const o=BL[id],z=o.sz||[1,1],j=Y*W+X;if(o.floor&&S.floor)S.floor[j]=id;else{S.obj[j]=id;for(let b=0;b<z[1];b++)for(let a=0;a<z[0];a++)if(a||b){S.obj[j+b*W+a]='part';S.ref[j+b*W+a]=j}}
   if(/^(stairs|slope|ladder)/.test(id)&&S.hi){for(let a=-4;a<7;a++)for(let b=-4;b<0;b++)S.hi[(Y+b)*W+X+a]=1}/* 階段・坂・ハシゴは、うしろを1だん高く */
   if(id==='bridge'){for(let b=-4;b<7;b++)S.ground[(Y+b)*W+X]=1}
   try{recount();rebuildStatic(true)}catch(e){}cam.z=3;centerOn((X+z[0]/2)*TS,(Y+z[1]/2)*TS);dirty=true;return z},id);sz[id]={sz:z};
  await p.waitForTimeout(260);await p.screenshot({path:D+id+'.png',clip:{x:450-240,y:450-240,width:480,height:480}})}
 fs.writeFileSync(D+'gameinfo.json',JSON.stringify(sz))}
console.log(JSON.stringify(errs.slice(0,5)));await b.close()})();
