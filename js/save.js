/* セーブの版の番号（S.mig）と、古いセーブの読みかえ。
   読みかえを足すときは、MIGRATIONS のうしろに {v: 前の v + 1, f(S){...}} を1つ足す。
   新しいゲームは newState が SAVE_VER からはじめるので、読みかえは走らない。
   S.flags の印で1回だけにする読みかえ（continueGame の中の前からの物）は、もう足さない。 */
const MIGRATIONS = [
  {v: 11, f(S) { if (S.ts && typeof tsRubGen === 'function') tsRubGen(S); }}, /* 土：谷のはしの、くずれた岩の山（tsuchi.js） */
  {v: 12, f(S) { if (S.ts && S.flags && S.flags.tsOokDown) S.enemyOn = true; }}, /* 土：ツチノオオカゲを追いかえしたあとは、夜に地われから来る（tsuchi-night.js） */
  {v: 13, f(S) { if (!S.ts || !S.res) return; for (const r of S.res) if (r.name === 'コノハ') { r.name = 'ハニ'; r.elem = 'earth'; } }}, /* 土：2人めのキーキャラのコノハ（木）は、土のせいれいハニになった */
  {v: 14, f(S) { if (S.cvClr > 3) S.cvClr = 3; if (S.ts && S.ground && typeof tsRubGen === 'function') tsRubGen(S); }}, /* 洞窟は10階：いま行けるのは3階まで（cave.js の cvFlOpen）・くずれた岩の山は10（tsuchi.js） */
];
const SAVE_VER = MIGRATIONS.length ? MIGRATIONS[MIGRATIONS.length - 1].v : 10;
function runMigrations(S) {
  for (const m of MIGRATIONS) {
    if ((S.mig || 0) < m.v) {
      m.f(S);
      S.mig = m.v;
    }
  }
}
'use strict';

/* ---------- 保存 ---------- */
let NOSAVE=false;/* 読みこみ直後は、いまの状態で上書きしない */
function save(){if(IS_STORY_REPLAY||(typeof STORY_REPLAY_SHELL!=='undefined'&&STORY_REPLAY_SHELL)||NOSAVE||!S||!S.introSeen)return false;recSync();playFlush();try{const d=Object.assign({},S,{savedAt:Date.now(),res:S.res.concat(S.cvAway||[]).map(r=>{const c=Object.assign({},r);if(r.act&&r.act.type==='watchpost'&&r.act.sx!=null){c.x=r.act.sx;c.y=r.act.sy}/* 見張り台の上の子は、のぼる前の場所でしまう */if(r.act&&r.act.type==='eat'&&r.act.stage==='do'&&r.act.m&&!c.meal){const m=r.act.m;c.meal=Object.assign({},m,{u:Math.max(0,(r.act.to-r.hunger)*fullN(r)/500)})}/* 食べているとちゅう：のこりの分を持ったまましまう（読みこんだら食べなおす。食べ物だけへらない） */c.act=null;c.path=[];c.hidden=false;return c}),cvAway:[],orders:S.orders.map(o=>Object.assign({},o,{worker:null}))});const ok=KV.setItem(SAVE_KEYS[S.world||0],JSON.stringify(d));coverNote(S);return ok}catch(e){return false}}
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
  for(const f of['hp','rot','win','rug','rugRot','edge','roof','bud','ovenSet','bedOwn','wpOwn','useOwn','jobOwn','freeB','trapCd','wreq','vreq','smQ','smIn','prQ','prIn','prOut','prW','web','webq','stay','grn','vx'])if(d[f])d[f]=mk(d[f]);
  if(d.st2)for(const f of['fire','frz','ash','hvb'])if(d.st2[f])d.st2[f]=mk(d.st2[f]);if(d.st2&&Array.isArray(d.st2.bw))d.st2.bw=d.st2.bw.map(mi);
  if(d.imoSeedQuestPlots)d.imoSeedQuestPlots=d.imoSeedQuestPlots.map(mi);
  for(const L of[d.regrow,d.broken,d.fogF])for(const q of L||[])q.j=mi(q.j);if(d.fogReq)d.fogReq=d.fogReq.map(mi);
  for(const L of[d.drops,d.seeds,d.finds,d.ng&&d.ng.L])for(const q of L||[]){q.x+=O;q.y+=O}for(const e of d.bp||[]){e.x+=O;e.y+=O;e.cells=e.cells.map(mi);for(const p of e.ps)p.j=mi(p.j)}if(d.hname)d.hname=mk(d.hname);/* 家の設計図 */if(d.tx!=null)d.tx=mi(d.tx);/* 宝の場所 */for(const q of d.snowm||[])q.j=mi(q.j);/* 雪だるま */for(const q of d.ani||[]){q.x+=O;q.y+=O;q.h=mi(q.h);q.path=null;q.go=null}/* 飼う生き物 */
  for(const q of[d.nushi,d.b2At])if(q){q.x+=O;q.y+=O;if(q.path)q.path=[]}
  for(const e of d.enemies||[]){e.x+=O;e.y+=O;e.path=[]}
  for(const r of d.res||[]){r.x+=O;r.y+=O;if(r.stX!=null)r.stX+=O;if(r.stY!=null)r.stY+=O;r.act=null;r.path=[];delete r.avoidJ;delete r.faceObj;delete r.lastToy;if(r.cing&&r.cing.ov!=null)r.cing.ov=mi(r.cing.ov)}/* 歩いている途中・作業の途中は、やりなおし */
  delete d.fst}
function load(w){try{const t=KV.getItem(SAVE_KEYS[w||0]);if(!t)return null;const d=JSON.parse(t);if(d&&d.v===8){if(d.ground&&d.ground.length===OW*OW)expandMap(d);if((d.mig||0)<1){const fx=v=>{if(!v)return;if(v.key){v.lash=false;v.cheek=true}};/* キーキャラは、まつげなし・ほっぺあり */(d.res||[]).concat(d.buried||[],d.lost||[]).forEach(r=>{if(r.like==='flower')r.like='chat'});(d.res||[]).forEach(r=>{fx(r.vr);if(r.name==='ノドカ'&&r.vr)r.vr.lash=false});(d.buried||[]).forEach(r=>fx(r.vr));(d.lost||[]).forEach(r=>fx(r.vr))}/* 古いセーブを直すのは、1回だけ（mig） */return d}}catch(e){}return null}
