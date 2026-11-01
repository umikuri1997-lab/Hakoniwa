'use strict';

/* ---------- 保存 ---------- */
let NOSAVE=false;/* 読みこみ直後は、いまの状態で上書きしない */
function save(){if(NOSAVE||!S||!S.introSeen)return false;recSync();try{const d=Object.assign({},S,{savedAt:Date.now(),res:S.res.map(r=>{const c=Object.assign({},r);if(r.act&&r.act.type==='watchpost'&&r.act.sx!=null){c.x=r.act.sx;c.y=r.act.sy}/* 見張り台の上の子は、のぼる前の場所でしまう */c.act=null;c.path=[];c.hidden=false;return c}),orders:S.orders.map(o=>Object.assign({},o,{worker:null}))});return KV.setItem(SAVE_KEYS[S.world||0],JSON.stringify(d))}catch(e){return false}}
/* 72×72マスのセーブを、108×108マスに広げる（いまの村は、まん中にそのままのこす。外がわは、新しい土地） */
function expandMap(d){const O=OFF,mi=j=>(((j/OW)|0)+O)*W+(j%OW)+O,inner=j=>{const x=j%W,y=(j/W)|0;return x>=O&&x<O+OW&&y>=O&&y<O+OW};
  const t={ground:new Array(W*H).fill(0),floor:new Array(W*H).fill(''),obj:new Array(W*H).fill(''),dyn:{},ref:{},hp:{},rot:{},regrow:[],flags:{},res:[],world:d.world||0};genWorld(t,d.world||0);
  const G=t.ground.map((v,j)=>inner(j)?0:v),F=t.floor.map((v,j)=>inner(j)?'':v),Ob=t.obj.map((v,j)=>inner(j)?'':v),Dy={},Rf={};
  for(const k in t.dyn)if(!inner(+k))Dy[k]=t.dyn[k];for(const k in t.ref)if(!inner(+k))Rf[k]=t.ref[k];
  for(let j=0;j<OW*OW;j++){const n=mi(j);G[n]=d.ground[j];F[n]=d.floor[j];Ob[n]=d.obj[j]}
  d.hi=(t.hi||[]).map((v,j)=>inner(j)?0:v);/* 段差：まわりの新しい土地だけ */
  const mk=o=>{const r={};for(const k in o||{}){const m=/^([A-Za-z]*)(\d+)$/.exec(k);r[m?m[1]+mi(+m[2]):k]=o[k]}return r};/* マスの番号がキーのもの（「L12」などの頭の文字はそのまま） */
  d.ground=G;d.floor=F;d.obj=Ob;d.dyn=Object.assign(Dy,mk(d.dyn));
  const rf=mk(d.ref);for(const k in rf)rf[k]=mi(rf[k]);d.ref=Object.assign(Rf,rf);
  for(const f of['hp','rot','win','rug','rugRot','roof','bud','ovenSet','bedOwn','freeB','trapCd','wreq'])if(d[f])d[f]=mk(d[f]);
  if(d.st2)for(const f of['fire','frz','ash','hvb'])if(d.st2[f])d.st2[f]=mk(d.st2[f]);if(d.st2&&Array.isArray(d.st2.bw))d.st2.bw=d.st2.bw.map(mi);
  if(d.imoSeedQuestPlots)d.imoSeedQuestPlots=d.imoSeedQuestPlots.map(mi);
  for(const L of[d.regrow,d.broken])for(const q of L||[])q.j=mi(q.j);
  for(const L of[d.drops,d.seeds,d.finds])for(const q of L||[]){q.x+=O;q.y+=O}
  for(const q of[d.nushi,d.b2At])if(q){q.x+=O;q.y+=O;if(q.path)q.path=[]}
  for(const e of d.enemies||[]){e.x+=O;e.y+=O;e.path=[]}
  for(const r of d.res||[]){r.x+=O;r.y+=O;if(r.stX!=null)r.stX+=O;if(r.stY!=null)r.stY+=O;r.act=null;r.path=[];delete r.avoidJ;delete r.faceObj;delete r.lastToy;if(r.cing&&r.cing.ov!=null)r.cing.ov=mi(r.cing.ov)}/* 歩いている途中・作業の途中は、やりなおし */
  delete d.fst}
function load(w){try{const t=KV.getItem(SAVE_KEYS[w||0]);if(!t)return null;const d=JSON.parse(t);if(d&&d.v===8){if(d.ground&&d.ground.length===OW*OW)expandMap(d);if((d.mig||0)<1){const fx=v=>{if(!v)return;if(v.key){v.lash=false;v.cheek=true}};/* キーキャラは、まつげなし・ほっぺあり */(d.res||[]).concat(d.buried||[],d.lost||[]).forEach(r=>{if(r.like==='flower')r.like='chat'});(d.res||[]).forEach(r=>{fx(r.vr);if(r.name==='ノドカ'&&r.vr)r.vr.lash=false});(d.buried||[]).forEach(r=>fx(r.vr));(d.lost||[]).forEach(r=>fx(r.vr))}/* 古いセーブを直すのは、1回だけ（mig） */return d}}catch(e){}return null}
