/* ---------- パワーのひらき道（メニュー） ----------
   パワーをつかって、村の力を3つの道（くらし・しごと・まもり）で、じゅんにひらいていく。ステージごと（S.vpath）。
   どれも実数：a はたし算する数（はたらく速さ・移動速度・持てる数・攻撃力・住み心地・見張り台の威力と射程）、box はしまえる数の%、fun はたのしさのへりかた。 */
const VPATH=[
 {k:'kurashi',n:'くらし',L:[{id:'k1',c:100,t:'箱のしまえる数+10%',box:10},{id:'k2',c:200,t:'たのしさのへりかた0.9倍',fun:.9},{id:'k3',c:300,t:'家の住み心地+10',a:{comf:10}}]},
 {k:'shigoto',n:'しごと',L:[{id:'s1',c:100,t:'はたらく速さ+5',a:{work:5}},{id:'s2',c:200,t:'移動速度+5',a:{move:5}},{id:'s3',c:400,t:'持てる数+1',a:{cap:1}}]},
 {k:'mamori',n:'まもり',L:[{id:'m1',c:150,t:'見張り台の威力+2',a:{wdmg:2}},{id:'m2',c:250,t:'見張り台の射程+1',a:{wrng:1}},{id:'m3',c:350,t:'攻撃力+2',a:{atk:2}}]}];
const vpOn=id=>!!(S&&S.vpath&&S.vpath[id]);
function pathA(k){/* ひらいた所の、たし算する数 */if(!S||!S.vpath)return 0;let n=0;for(const b of VPATH)for(const p of b.L)if(p.a&&p.a[k]&&S.vpath[p.id])n+=p.a[k];return n}
const pathBox=()=>vpOn('k1')?.1:0,pathFun=()=>vpOn('k2')?.9:1;
function pathBuy(p){if(vpOn(p.id))return false;if(S.pt<p.c){sfx('tap');toast(lackPt(p.c),'warn');return false}S.pt-=p.c;(S.vpath||(S.vpath={}))[p.id]=1;sfx('power');toast('ひらき道：'+p.t,'good');logEv('ひらき道をひらいた：'+p.t);recount();dirty=true;return true}
function pathSec(body){body.appendChild(el('<p class="note">パワーを使って、村の力をのばす。道ごとに、上からじゅんにひらく。</p>'));
  for(const b of VPATH){const sec=el('<div class="sec"><h3></h3><div class="rows"></div></div>'),rw=sec.querySelector('.rows');sec.querySelector('h3').textContent=b.n;let open=true;
    for(const p of b.L){const on=vpOn(p.id),r=rowEl(p.t,on?'ひらいた':open?SP(p.c):'まえの所をひらくと、ひらける');if(on)r.classList.add('done');
      if(!on&&open){const bt=el('<button class="btn pri" style="flex:none">ひらく</button>');lackOn(bt,lackPt(p.c));bt.onclick=()=>{if(pathBuy(p))renderSheet()};r.appendChild(bt)}
      open=open&&on;rw.appendChild(r)}
    body.appendChild(sec)}}
