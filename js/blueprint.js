/* ---------- 家の設計図 ----------
   設計図（S.bpInv：[{k,g}]、g はくれたせいれいの id）を「どうぐ」でえらび、左上をタップして置くと、せいれいが、床 → 家具 → 壁・窓 → ドアの順に建てる（S.bp）。
   1つずつの部品は「建てる所」（S.obj='site'、S.dyn[j].bp）で、素材はせいれいが箱から運ぶ。置く所の木・岩は、せいれいが先に切る・ほる。
   できたら、家に名前がつき（S.hname：家の中のマス→名前）、住み心地+10（BPCOMF）。くれたせいれいはよろこび、その家のベッドをつかう。 */
const BPS={/* 家具は、家の中の空いたマスが、ぜんぶドアの前までつながるようにならべる（とじこめられる所を作らない。tools/tests/blueprint.cjs でたしかめる） */
  small:{name:'ちいさなおうち',pc:20,rows:['WWOWW','W...W','W...W','WWDWW'],furn:[[1,1,'bed'],[3,1,'candle']]},
  mono:{name:'ものおきごや',pc:20,rows:['WWWW','W..W','W..W','WDWW'],furn:[[1,1,'crate'],[2,1,'taru'],[2,2,'asabukuro']]},
  hana:{name:'はなのいえ',pc:35,rows:['WWOOWW','W....W','W....W','W....W','WWWDWW'],furn:[[1,1,'bed'],[4,1,'monstera'],[4,2,'candle'],[3,2,'ltable'],[1,3,'monstera']]},
  futari:{name:'ふたりのいえ',pc:45,rows:['WWOWOWW','W.....W','W.....W','W.....W','WWWDWWW'],furn:[[1,1,'chair',1],[2,1,'table'],[3,1,'chair',3],[5,1,'flamp'],[1,3,'bed'],[5,3,'bed']]},
};
const BPORDER=['small','mono','hana','futari'],BPCOMF=10,BPGIVEFUN=30,BPFISH=.02,BPCHEST=.5,BPTALK=.15,BPTALKCD=3;/* つり2%・霧の宝箱50%・お話15%（3日に1回まで） */
const BPT={floor:8,wall:12,door:15,win:18,furn:40};/* 1つずつの部品を建てる時間 */
const bpWall=()=>WD===1?'bamboowall':'hwall';
function bpPieceMat(t,id){/* 1つずつの部品の素材 */if(t==='floor')return{wood:1};if(t==='wall')return WD===1?{bamboo:1}:{wood:1};if(t==='door')return{wood:2};if(t==='win')return WD===1?{bamboo:1,wood:2}:{wood:3};return Object.assign({},BL[id].mat||{})}
function bpPieces(k){/* 設計図の部品：[dx,dy,t,id,rot,phase] */const b=BPS[k],L=[],fset=new Set(b.furn.map(f=>f[0]+','+f[1]));
  b.rows.forEach((row,dy)=>{for(let dx=0;dx<row.length;dx++){const c=row[dx];
    if(c==='.')L.push([dx,dy,'floor','floor',0,1]);else if(c==='W')L.push([dx,dy,'wall',bpWall(),0,3]);else if(c==='D')L.push([dx,dy,'door','door',0,4])/* ドアはさいご：それまで出入り口があいていて、中のせいれいが出られる */;else if(c==='O')L.push([dx,dy,'win',bpWall(),0,3])}});
  for(const[dx,dy,id,rot]of b.furn)L.push([dx,dy,'furn',id,rot||0,2]);return L}
function bpCost(k){const m={};for(const p of bpPieces(k)){const pm=bpPieceMat(p[2],p[3]);for(const key in pm)m[key]=(m[key]||0)+pm[key]}return m}
const bpSize=k=>({w:BPS[k].rows[0].length,h:BPS[k].rows.length});
const BPNAT=new Set(['ntree','deadtree','bamboo','rock','boulder']);/* 置く所にあれば、せいれいが切る・ほる */
const bpSoft=o=>WEEDS.has(o)||o==='kinoko'||o==='takenoko';/* 置くときに、そのままなくなる */
function bpCheck(k,x,y){/* 置けるか：[ok, わけ] */const {w,h}=bpSize(k);if(x<0||y<0||x+w>W||y+h>H)return[false,'ここには置けません'];const h0=hiAt(y*W+x);
  for(let b=0;b<h;b++)for(let a=0;a<w;a++){const j=(y+b)*W+x+a,o=S.obj[j];
    if(S.ground[j]===1||S.ground[j]===2)return[false,'水の上には置けません'];if(S.fog&&fogAt(j))return[false,'霧の中には置けません'];if(hiAt(j)!==h0)return[false,'段差のある所には置けません'];
    if(STUMPB.has(j)||j===GODJ||sacredNoBuild(j,bpWall()))return[false,'ここには置けません'];
    if(S.floor[j]||S.rug&&S.rug[j]!=null||S.edge&&S.edge[j]||S.roof&&S.roof[j])return[false,'床や物のある所には置けません'];
    if(o&&!BPNAT.has(o)&&!bpSoft(o)&&!VEINS[o])return[false,'物のある所には置けません'];
    if(S.bp&&S.bp.some(e=>e.cells.includes(j)))return[false,'ほかの設計図とかさなっています']}
  return[true,'']}
function askBp(i,x,y){const it=(S.bpInv||[])[i];if(!it)return;const k=it.k,[ok,why]=bpCheck(k,x,y),pc=BPS[k].pc,m=bpCost(k);
  pending={kind:'bp',i,k,x,y,ok};$('#confirmTxt').textContent=ok?BPS[k].name+'をここに建てる？（'+SP(pc)+'・'+matTxt(m)+'）':why;
  lackOn($('#cYes'),ok?(S.pt<pc?lackPt(pc):!matOK(m)?lackMat(m):''):'').disabled=!ok;($('#cRot').hidden=true,$('#confirm').hidden=false);dirty=true}
function bpPlace(i,x,y){const it=(S.bpInv||[])[i];if(!it)return;const k=it.k,[ok,why]=bpCheck(k,x,y);if(!ok)return toast(why);const pc=BPS[k].pc,m=bpCost(k);
  if(S.pt<pc)return toast('パワーが足りません（'+SP(pc)+'）');if(!matOK(m))return toast('素材が足りません（'+matTxt(m)+'）');
  S.pt-=pc;S.bpInv.splice(i,1);const {w,h}=bpSize(k),cells=[];for(let b=0;b<h;b++)for(let a=0;a<w;a++){const j=(y+b)*W+x+a;cells.push(j);if(bpSoft(S.obj[j])){S.obj[j]='';delete S.dyn[j]}}
  const e={id:(S.bpId=(S.bpId||0)+1),k,x,y,g:it.g==null?null:it.g,cells,ps:bpPieces(k).map(([dx,dy,t,id,rot,ph])=>({j:(y+dy)*W+x+dx,t,id,rot,ph,s:0}))};
  (S.bp||(S.bp=[])).push(e);toast('せいれいが'+BPS[k].name+'を建てにきてくれる','good');sfx('power');bpAdvance(e);recount();dirty=true;renderPalette()}
const bpNatLeft=e=>e.cells.filter(j=>BPNAT.has(S.obj[j])||VEINS[S.obj[j]]);
function bpAdvance(e){/* つぎの段の部品を「建てる所」にする */if(bpNatLeft(e).length)return;const left=e.ps.filter(p=>p.s<2);if(!left.length)return bpComplete(e);const ph=Math.min(...left.map(p=>p.ph));
  const row=ph===1?Math.min(...left.filter(p=>p.ph===1).map(p=>(p.j/W)|0)):null;/* 床は1行ずつ（建てる所がかたまると、まん中へ行けない・とじこめられる） */
  for(const p of left){if(p.ph!==ph||p.s!==0||row!=null&&((p.j/W)|0)!==row)continue;const j=p.j;if(bpSoft(S.obj[j])){S.obj[j]='';delete S.dyn[j]}if(S.obj[j])continue;/* だれかが置いた物があれば、どけるまで待つ */
    if(S.res.some(r=>!r.hidden&&(r.y|0)*W+(r.x|0)===j))continue;/* せいれいが立っているマスには、まだ作らない（とじこめない） */
    S.obj[j]='site';S.dyn[j]={build:p.id,p:0,need:BPT[p.t],mat:bpPieceMat(p.t,p.id),got:{},bp:e.id};p.s=1}}
function bpFinish(j,r){/* finishBuild から：設計図の部品ができた */const d=S.dyn[j],e=(S.bp||[]).find(q=>q.id===d.bp),p=e&&e.ps.find(q=>q.j===j&&q.s===1);delete S.dyn[j];S.obj[j]='';
  if(!e||!p){recount();return}
  if(p.t==='floor')S.floor[j]=p.id;else if(p.t==='furn'){S.obj[j]=p.id;if(p.rot)(S.rot||(S.rot={}))[j]=p.rot;setParts(p.id,j,'part')}else{setBlock(p.id,j);if(p.t==='win')(S.win||(S.win={}))[j]=1}
  p.s=2;if(r){addSpiritXp(1,r);r.made=(r.made||0)+1}burst(j,p.t==='furn'?'furn':'block');recount();bpAdvance(e);dirty=true}
function bpComplete(e){S.bp=S.bp.filter(q=>q!==e);const b=BPS[e.k];recount();
  const inner=e.ps.find(p=>p.t==='floor'),h=inner&&HOUSES.find(q=>q.inside.has(inner.j));
  if(h){(S.hname||(S.hname={}))[inner.j]=b.name}S.bpDone=(S.bpDone||0)+1;
  toast(b.name+'ができた！','good');if(typeof memo==='function')memo(b.name+'ができた');
  const r=e.g!=null?S.res.find(q=>q.id===e.g&&!q.hidden):null;
  if(r){r.fun=Math.min(100,(r.fun||0)+BPGIVEFUN);const bed=e.ps.find(p=>p.t==='furn'&&BEDSET.has(p.id));if(bed)(S.bedOwn||(S.bedOwn={}))[bed.j]=r.id;/* くれたせいれいが、その家のベッドをつかう */
    dialog([[r.name,'#joy|わあ……！ ずっと、こんな家にすんでみたかったんだ。'],[r.name,'#joy|守り神さま、ほんとうに、ありがとう！ 今夜から、ここでねむるね。']])}
  checkQuest()}
function bpCancel(e){/* 建てている部品をやめた：設計図ごとやめる（できた部品はのこす） */for(const p of e.ps)if(p.s===1&&S.obj[p.j]==='site'&&S.dyn[p.j]&&S.dyn[p.j].bp===e.id){siteRefund(S.dyn[p.j],p.j);clearObj(p.j)}
  S.bp=S.bp.filter(q=>q!==e);toast(BPS[e.k].name+'を建てるのをやめた');recount()}
const bpOfSite=j=>{const d=S.dyn[j];return d&&d.bp!=null?(S.bp||[]).find(q=>q.id===d.bp)||null:null};
function bpTick(){/* 1秒ごと：木・岩をかたづけおわったら、つぎの段へ。だれかがどけた物のあとも */for(const e of (S.bp||[]).slice()){if(e.ps.some(p=>p.s===1))continue;bpAdvance(e)}}
function bpJob(r,G,dry){/* 置く所の木・岩を、切る・ほる */if(isNight()||!S.bp||!S.bp.length)return false;
  if(roomN(r)<1){if(!r.cmat||!S.bp.some(e=>bpNatLeft(e).length)||matCap()<=0)return false;if(dry)return true;const ks=cmatKeys(r),j=nearest(G,j=>putAdj(j,ks)>=0,200);if(j>=0){startAct(r,G,'smat',j);return true}return false}/* 手がいっぱいなら、先に箱へしまってから、また切りにいく */
  for(const e of S.bp)for(const q of bpNatLeft(e)){const o=S.obj[q],k=o==='rock'||o==='boulder'||VEINS[o]?'mine':'chop';if(!free('o'+q,1))continue;if(dry)return true;
    const j=nearest(G,s=>adjOf(s,c=>c===q)>=0,200);if(j>=0){startAct(r,G,k,j,{key:'o'+q,obj:q});return true}}return false}
const bpHouseName=h=>{if(!S.hname)return null;for(const k in S.hname)if(h.inside.has(+k))return S.hname[k];return null};
function bpGive(k,g){(S.bpInv||(S.bpInv=[])).push({k,g:g==null?null:g});toast('設計図「'+BPS[k].name+'」をもらった','good')}
function bpNext(){/* まだ持っていない・建てていない設計図（はじめから順に） */const have=new Set([...(S.bpInv||[]).map(q=>q.k),...(S.bp||[]).map(q=>q.k),...Object.keys(S.bpGot||{})]);return BPORDER.find(k=>!have.has(k))||null}
function bpGiveNext(g){const k=bpNext();if(!k)return null;(S.bpGot||(S.bpGot={}))[k]=1;bpGive(k,g);return k}
/* ---------- 絵：置く前のわく・建てる前の部品のうすい形 ---------- */
function bpGhostDraw(ctx){const L=[];if(pending&&pending.kind==='bp'){const {w,h}=bpSize(pending.k);L.push([pending.k,pending.x,pending.y,pending.ok,null])}
  for(const e of S.bp||[])L.push([e.k,e.x,e.y,true,e]);if(!L.length)return;ctx.save();
  for(const[k,x,y,ok,e]of L){const ps=bpPieces(k);for(const[dx,dy,t,id,,ph]of ps){if(e){const p=e.ps.find(q=>q.j===(y+dy)*W+x+dx&&q.t===t);if(!p||p.s>0)continue}
      const px=(x+dx)*TS,py=(y+dy)*TS-hiAt((y+dy)*W+x+dx)*LIFT;ctx.fillStyle=!ok?'rgba(255,110,110,.30)':t==='floor'?'rgba(255,236,170,.22)':t==='furn'?'rgba(170,220,255,.32)':'rgba(255,214,140,.40)';ctx.fillRect(px+1,py+1,TS-2,TS-2);
      ctx.strokeStyle=!ok?'rgba(255,110,110,.9)':'rgba(255,230,120,.85)';ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.strokeRect(px+1.5,py+1.5,TS-3,TS-3);ctx.setLineDash([])}}
  ctx.restore()}
function bpTalkGift(r){/* お話のあと：ときどき、すみたい家の設計図をくれる */if(S.free||!bpNext()||Math.random()>=BPTALK)return;const d=callDay();if(S.bpTalkD!=null&&d-S.bpTalkD<BPTALKCD)return;S.bpTalkD=d;const id=r.id;
  dialog([[r.name,'#think|ねえ、守り神さま……こんな家に、すんでみたいなって、ずっと考えてたんだ。'],[r.name,'#joy|えがいてみたの。よかったら、もらって！']],()=>{const q=S.res.find(x=>x.id===id);bpGiveNext(q?q.id:null)})}
