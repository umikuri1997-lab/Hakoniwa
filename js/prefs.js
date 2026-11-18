/* ---------- せいれいの好み：はじめは「？？？」。出会ったとき・本人が話したときにわかる ----------
   r.kn：わかった好み（lk 好きな遊び・lf 好きな家具・fd 好きな料理・ng にがてな遊び）。
   出会う（はじめて遊ぶ・食べる・見にくる・じぶんの家にある）と、とくべつによろこぶ（prefMeet）。
   お話・ひとことで本人が言ったら、会話のあとにわかる（prefKnow）。 */
const PREFNM={lk:'遊び',lf:'家具',fd:'料理',ng:'にがてな遊び'};
const prefKnown=(r,k)=>!!(r&&r.kn&&r.kn[k]);
function prefName(r,k){if(k==='lk')return LIKES[r.like]||'';if(k==='lf'){const f=likeF(r);return f&&BL[f]?BL[f].name:''}if(k==='fd'){const d=FOODS[favDish(r)];return d?d.name:''}if(k==='ng')return (NIGATE[r.elem]||[]).map(o=>BL[o]&&BL[o].name).filter(Boolean).join('・')||'とくにない';return ''}
function prefShow(r,k){return prefKnown(r,k)?prefName(r,k):'？？？'}
function prefKnow(r,k){if(!r||prefKnown(r,k)||IS_STORY_REPLAY||!S.res.includes(r))return false;(r.kn||(r.kn={}))[k]=1;
  toast(r.name+(k==='ng'?'の、にがてな遊びがわかった':'の好きな'+PREFNM[k]+'がわかった'),'good');dirty=true;return true}
const PREFJOY={lk:['#joy|わあ……！ これ、だいすき！','#joy|これだよ、これ！ ずっと、やりたかったんだ！','#joy|たのしい！ ぼく、これがいちばん好きかも！'],
 fd:['#joy|これ……だいすきな味だ！','#joy|おいしい！ ぼく、これに目がないんだ！','#joy|わあ、しあわせ……！ これ、いちばん好き！'],
 lf:['#joy|わあ……！ こういうの、だいすきなんだ！','#joy|すてき！ ずっと、ながめていたいな！','#joy|これ、いちばん好き！ 見てるだけで、うれしい！']};
function prefMeet(r,k){if(!r||r.hidden||!prefKnow(r,k))return;const now=performance.now();JUMP.set(r,now);JOYU.set(r,now+3500);r.bubble='💕';
  fxSpr('hearts',r.x*TS,(r.y-.7)*TS);addFloat(r.x,r.y-1.6,chatTone(pickFresh('pj:'+k,PREFJOY[k]).replace(/^#[^|]*\|/,''),r,0),'#ffd6e6');sfx('good')}
/* お話で話した好み（話の名前から）。会話をさいごまで読んだら prefKnow */
const PREFTK=[['t:fv','lf'],['lk','lk'],['fd','fd'],['lf','lf'],['ng','ng']];
const prefOfTopic=key=>{if(!key)return null;for(const[p,k]of PREFTK)if(key.indexOf(p)===0)return k;return null};
/* じぶんの家に、好きな家具がある（5秒に1回） */
let PREFT=0;function prefTick(){if((PREFT=(PREFT+1)%5)||IS_STORY_REPLAY||isNight())return;for(const r of S.res){if(r.hidden||prefKnown(r,'lf')||r.act&&r.act.type==='sleep')continue;const h=homeOf(r);if(h&&roomOf((r.y|0)*W+(r.x|0))===h&&hasLikeF(h,r))prefMeet(r,'lf')}}
