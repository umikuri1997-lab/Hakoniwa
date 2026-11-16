/* ---------- むらのちから（メニュー。守り神のちからと1つの木） ----------
   パワーをつかって、村の力を3つの道（くらし・しごと・まもり）で、じゅんにひらいていく。ステージごと（S.vpath）。
   どれも実数：a はたし算する数（はたらく速さ・移動速度・持てる数・攻撃力・住み心地・見張り台の威力と射程）、box はしまえる数の%、fun はたのしさのへりかた。 */
const VPATH=[
 {k:'kurashi',n:'くらし',L:[{id:'k1',c:100,t:'箱のしまえる数+10%',box:10},{id:'k2',c:200,t:'たのしさのへりかた0.9倍',fun:.9},{id:'k3',c:300,t:'家の住み心地+10',a:{comf:10}}]},
 {k:'shigoto',n:'しごと',L:[{id:'s1',c:100,t:'はたらく速さ+5',a:{work:5}},{id:'s2',c:200,t:'移動速度+5',a:{move:5}},{id:'s3',c:400,t:'持てる数+1',a:{cap:1}}]},
 {k:'mamori',n:'まもり',L:[{id:'m1',c:150,t:'見張り台の威力+2',a:{wdmg:2}},{id:'m2',c:250,t:'見張り台の射程+1',a:{wrng:1}},{id:'m3',c:350,t:'攻撃力+2',a:{atk:2}}]}];
const vpOn=id=>!!(S&&S.vpath&&S.vpath[id]);
function pathA(k){/* ひらいた所の、たし算する数 */if(!S||!S.vpath)return 0;let n=0;for(const b of VPATH)for(const p of b.L)if(p.a&&p.a[k]&&S.vpath[p.id])n+=p.a[k];return n}
const pathBox=()=>vpOn('k1')?.1:0,pathFun=()=>vpOn('k2')?.9:1;
function pathBuy(p){if(vpOn(p.id))return false;if(S.pt<p.c){sfx('tap');toast(lackPt(p.c),'warn');return false}S.pt-=p.c;(S.vpath||(S.vpath={}))[p.id]=1;sfx('power');toast('むらのちから：'+p.t,'good');logEv('むらのちからをひらいた：'+p.t);recount();dirty=true;return true}
/* 木（スキルツリー）：左は村の枝（くらし・しごと・まもり。上へじゅんにひらく）、右は守り神の枝（まもりの光・こもれびのまもり・葉のかべ。GUP は night.js）。点をタップすると、ポップアップでひらく・強化 */
function treeNodes(){const N=[];VPATH.forEach((b,c)=>{let open=true;b.L.forEach((p,i)=>{const on=vpOn(p.id);N.push({k:'v:'+p.id,c,i,st:on?'done':open?'can':'lock',p,b});open=open&&on})});
  ['cd','pow','stun'].forEach((k,i)=>{const n=gupLv(k);N.push({k:'g:'+k,c:3,i,st:n>=10?'done':'can',g:gupOf(k),n})});
  {const ok=!!(S.flags&&S.flags.areaSkill),n=gupLv('area');N.push({k:'g:area',c:4,i:0,st:!ok?'hid':n>=10?'done':'can',g:gupOf('area'),n})}
  {const n=gupLv('leaf');N.push(leafOK()?{k:'g:leaf',c:5,i:0,st:n>=10?'done':'can',g:gupOf('leaf'),n}:{k:'learn',c:5,i:0,st:'can'})}
  return N}
const TREEC={can:['#f4e9d2','#e8d9b9','#a8743f','#5b3f24'],done:['#b7834c','#a8743f','#7a5230','#fff'],lock:['#ddd3bf','#d2c6ae','#b3a68c','#9a8c72'],hid:['#ddd3bf','#d2c6ae','#b3a68c','#9a8c72']};
function treeDisc(st){/* 段々のドットの丸（24×24、1ドット1.5px）：ふち2ドット・上半分が明るい */const[a,b,e]=TREEC[st],R=12;let o='';const row=(y,r,col)=>{const w=Math.round(Math.sqrt(Math.max(0,r*r-(y+.5-R)**2)));if(w>0)o+='<rect x="'+(R-w)+'" y="'+y+'" width="'+2*w+'" height="1" fill="'+col+'"/>'};
  for(let y=0;y<24;y++)row(y,R,e);for(let y=2;y<22;y++)row(y,R-2,y<R?a:b);return '<svg class="tdisc" width="36" height="36" viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">'+o+'</svg>'}
function treeSec(body){body.appendChild(el('<p class="note">パワーを使って、村と守り神の力をのばす。</p>'));
  const X=c=>(c+.5)/6*100,Y=i=>[178,118,58][i],HB=214,HUB=238,MID=272,ROOT=296,LBL=10;
  const w=el('<div class="stree" style="position:relative;height:330px;margin:8px 0 12px"></div>'),line=(x0,y0,x1,y1)=>{const d=el('<i class="tline"></i>');if(y0===y1)d.style.cssText='left:'+x0+'%;width:'+(x1-x0)+'%;top:'+(y0-1.5)+'px;height:3px';else d.style.cssText='left:calc('+x0+'% - 1.5px);width:3px;top:'+y0+'px;height:'+(y1-y0)+'px';w.appendChild(d)},
    txt=(x,y,t,cls)=>{const d=el('<span class="tlbl'+(cls?' '+cls:'')+'"></span>');d.textContent=t;d.style.left=x+'%';d.style.top=y+'px';w.appendChild(d)};
  const N=treeNodes(),top={};for(const n of N)top[n.c]=Math.max(top[n.c]||0,n.i);
  for(let c=0;c<6;c++){line(X(c),Y(top[c]),X(c),HB)}line(X(0),HB,X(2),HB);line(X(3),HB,X(5),HB);line(X(1),HB,X(1),MID);line(X(4),HB,X(4),MID);line(X(1),MID,X(4),MID);line(50,MID,50,ROOT);
  ['くらし','しごと','まもり','まもりの光','こもれび','葉のかべ'].forEach((t,c)=>txt(X(c),LBL,c===4&&!(S.flags&&S.flags.areaSkill)?'？？？':t));
  txt(X(1),HUB,'村','hub side');txt(X(4),HUB,'守り神','hub side');txt(50,ROOT+4,'むらのちから','hub');
  for(const n of N){const b=el('<button class="tnode"></button>');b.dataset.node=n.k;b.dataset.st=n.st;b.style.left=X(n.c)+'%';b.style.top=Y(n.i)+'px';b.innerHTML=treeDisc(n.st)+'<b></b>';
    const t=b.querySelector('b');if(n.g)t.textContent=n.st==='hid'?'？':n.n;else if(n.st==='done')t.innerHTML='<svg class="pxi ck" viewBox="0 0 7 6" aria-hidden="true"><path d="'+CKD+'"/></svg>';
    b.setAttribute('aria-label',n.p?n.p.t:n.g?(n.st==='hid'?'？？？':n.g.n):'葉のかべ');b.onclick=()=>{sfx('tap');treePop(n.k)};w.appendChild(b)}
  body.appendChild(w);skillSec(body)/* わざの枠（defense.js） */}
function treePop(k){const old=document.getElementById('treePop');if(old)old.remove();const n=treeNodes().find(x=>x.k===k);if(!n)return;
  const o=el('<div id="treePop" style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.45);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:320px;width:100%;color:var(--ink)"><b class="t" style="display:block;font-size:16px;margin-bottom:6px"></b><p class="note n" style="margin:0;white-space:pre-line"></p><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="btn x">とじる</button></div></div></div>'),
    T=o.querySelector('.t'),D=o.querySelector('.n'),bar=o.querySelector('.x').parentNode,close=()=>o.remove();o.querySelector('.x').onclick=close;o.onclick=e=>{if(e.target===o)close()};
  const go=(label,c,fn)=>{const bt=el('<button class="btn pri go"></button>');bt.textContent=label+'　'+SP(c);lackOn(bt,lackPt(c));bt.onclick=()=>{if(S.pt<c){sfx('tap');return toast(lackPt(c),'warn')}if(fn()){renderSheet();treePop(k)}};bar.appendChild(bt)};
  if(n.p){T.textContent=n.b.n+'（'+(n.i+1)+'/'+n.b.L.length+'）';D.textContent=n.p.t+'\n'+(n.st==='done'?'ひらいた':n.st==='lock'?'まえの所をひらくと、ひらける':SP(n.p.c));if(n.st==='can')go('ひらく',n.p.c,()=>pathBuy(n.p))}
  else if(n.k==='learn'){T.textContent='葉のかべ';D.textContent='夜、地面をなぞると、葉のかべが生える。コワイノの道をふさぐ';go('おぼえる',LEAFLEARN,()=>{leafLearn();return leafOK()})}
  else if(n.st==='hid'){T.textContent='？？？';D.textContent='？？？'}
  else{const g=n.g,v=n.n;T.textContent=g.n+'（Lv'+v+'/10）';D.textContent=v>=10?'いま '+g.t[v]:'いま '+g.t[v]+'\nつぎ '+g.t[v+1];if(v<10)go('強化',GUPC[v],()=>gupBuy(g.k))}
  document.body.appendChild(o)}
