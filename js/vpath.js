/* ---------- むらのちから（メニュー。守り神のちからと1つの木） ----------
   パワーをつかって、村の力を3つの道（くらし・しごと・まもり）で、じゅんにひらいていく。ステージごと（S.vpath）。
   どれも実数：a はたし算する数（はたらく速さ・移動速度・持てる数・攻撃力・住み心地・見張り台の威力と射程）、box はしまえる数の%、fun はたのしさのへりかた。 */
const VPATH=[/* 点：x・y は木の絵の上の場所（1ドット1.5px）、r はひらくのに先にひらく点（ぜんぶ） */
 {k:'kurashi',n:'くらし',lx:40,ly:772,at:785,L:[
  {id:'kb1',c:50,t:'箱のしまえる数+5%',a:{box:5},x:84,y:770,r:[]},
  {id:'kb2',c:80,t:'箱のしまえる数+5%',a:{box:5},x:40,y:736,r:['kb1']},
  {id:'kc1',c:120,t:'料理の速さ+10%',a:{cook:10},x:24,y:702,r:['kb2']},
  {id:'kc2',c:160,t:'料理の速さ+10%',a:{cook:10},x:24,y:668,r:['kc1']},
  {id:'kf1',c:100,t:'たのしさのへりかた－5%',a:{fun:5},x:84,y:736,r:['kb1']},
  {id:'kh1',c:150,t:'家の住み心地+5',a:{comf:5},x:58,y:702,r:['kf1']},
  {id:'kh2',c:200,t:'家の住み心地+5',a:{comf:5},x:58,y:668,r:['kh1']},
  {id:'kr1',c:150,t:'つかれのとれる速さ+10%',a:{rec:10},x:92,y:702,r:['kf1']},
  {id:'kf2',c:250,t:'たのしさのへりかた－5%',a:{fun:5},x:92,y:668,r:['kr1']}]},
 {k:'shigoto',n:'しごと',lx:194,ly:692,at:710,L:[
  {id:'sw1',c:50,t:'はたらく速さ+1',a:{work:1},x:150,y:690,r:[]},
  {id:'sw2',c:120,t:'はたらく速さ+1',a:{work:1},x:128,y:656,r:['sw1']},
  {id:'sf1',c:100,t:'つりに行く確率+5%',a:{fish:5},x:128,y:622,r:['sw2']},
  {id:'sm1',c:60,t:'移動速度+1',a:{move:1},x:162,y:656,r:['sw1']},
  {id:'sm2',c:140,t:'移動速度+1',a:{move:1},x:162,y:622,r:['sm1']},
  {id:'ss1',c:100,t:'スタミナ+2',a:{sta:2},x:196,y:656,r:['sw1']},
  {id:'sh1',c:150,t:'おなかのへりかた－5%',a:{hun:5},x:196,y:622,r:['ss1']},
  {id:'sc1',c:400,t:'持てる数+1',a:{cap:1},x:145,y:578,r:['sf1','sm2']}]},
 {k:'mamori',n:'まもり',lx:22,ly:602,at:620,L:[
  {id:'md1',c:70,t:'見張り台の威力+1',a:{wdmg:1},x:60,y:600,r:[]},
  {id:'md2',c:100,t:'見張り台の威力+1',a:{wdmg:1},x:36,y:566,r:['md1']},
  {id:'mc1',c:180,t:'見張り台のうつ間かく－5%',a:{wcd:5},x:36,y:532,r:['md2']},
  {id:'mr1',c:150,t:'見張り台の射程+0.5マス',a:{wrng:.5},x:36,y:498,r:['mc1']},
  {id:'mr2',c:200,t:'見張り台の射程+0.5マス',a:{wrng:.5},x:36,y:464,r:['mr1']},
  {id:'mt1',c:120,t:'罠のダメージ+2',a:{trap:2},x:84,y:566,r:['md1']},
  {id:'ma1',c:170,t:'攻撃力+1',a:{atk:1},x:84,y:532,r:['mt1']},
  {id:'ma2',c:220,t:'攻撃力+1',a:{atk:1},x:84,y:498,r:['ma1']},
  {id:'mp1',c:300,t:'「コワイノ」を追いはらうとパワー+1',a:{kpt:1},x:84,y:464,r:['ma2']}]}];
const vpOn=id=>!!(S&&S.vpath&&S.vpath[id]);
function pathA(k){/* ひらいた所の、たし算する数 */if(!S||!S.vpath)return 0;let n=0;for(const b of VPATH)for(const p of b.L)if(p.a[k]&&S.vpath[p.id])n+=p.a[k];return n}
const pathBox=()=>pathA('box')/100,pathFun=()=>1-pathA('fun')/100;
const VPATH_OLD={k1:100,k2:200,k3:300,s1:100,s2:200,s3:400,m1:150,m2:250,m3:350};/* 前の木（1つの道に3つ）の点と、ひらくのにつかったパワー */
function vpathMigrate(){/* 前の木でひらいた点は、とじて、つかったパワーをもどす（1回だけ） */if(S.flags.vpath2)return;S.flags.vpath2=1;let back=0;for(const k in S.vpath||{})if(VPATH_OLD[k])back+=VPATH_OLD[k];S.vpath={};if(back){S.pt+=back;toast('むらのちからの木が新しくなり、パワー'+back+'がもどった','good')}}
function pathBuy(p){if(vpOn(p.id))return false;if(!p.r.every(vpOn))return false;if(S.pt<p.c){sfx('tap');toast(lackPt(p.c),'warn');return false}S.pt-=p.c;(S.vpath||(S.vpath={}))[p.id]=1;sfx('power');toast('むらのちから：'+p.t,'good');logEv('むらのちからをひらいた：'+p.t);recount();dirty=true;return true}
/* 木（スキルツリー）：たてに長い大木。下は村の枝（くらし・しごと・まもり。枝わかれして上へひらく）、上は守り神の枝（まもりの光のチャージ・威力・とめる時間・範囲は5段まで、こもれびのまもり・葉のかべは10段まで。1つの点が1つのLv。GUP は night.js）。点をタップすると、ポップアップでひらく・強化 */
/* 木の絵（ドット）：1ドット1.5px のキャンバス（TRW×TRH） */
const TRW=216,TRH=816,TRGY=798,TRFORK=410,TRG=[{k:'cd',x:18,n:'チャージ'},{k:'pow',x:54,n:'威力'},{k:'stun',x:90,n:'とめる時間'},{k:'rng',x:126,n:'範囲'},{k:'area',x:162,n:'こもれび'},{k:'leaf',x:198,n:'葉のかべ'}],TRGY0=346,TRGD=34,TRLEARN=380;
const TRPAL={1:['#86715a','#bcae92','#cbbfa4','#ddd3bf'],2:['#6b4428','#8a5a32','#a8743f','#d29a5a']};/* ふち・かげ・もと・光 */
const TRICON={box:'box',cook:'rice',fun:'heart',comf:'house',rec:'moon',work:'hammer',fish:'fish',move:'boot',sta:'sun',hun:'apple',cap:'log',wdmg:'target',wcd:'clock',wrng:'compass',trap:'gear',atk:'sword',kpt:'power',cd:'bulb',pow:'sun',stun:'clock',rng:'grng',area:'shield',leaf:'lwall'};
let TREEPEND=null,TREESCR=null;/* ひらいたばかりの点（光がとどくまで、前のようすで描く）・描きなおす前のスクロール */
function treeNodes(){const N=[],on=id=>vpOn(id)&&TREEPEND!=='v:'+id;
  for(const b of VPATH)for(const p of b.L){const o=on(p.id);N.push({k:'v:'+p.id,x:p.x,y:p.y,st:o?'done':p.r.every(on)?'can':'lock',p,b,cost:p.c,on:o,icon:TRICON[Object.keys(p.a)[0]],par:p.r.map(r=>'v:'+r),at:p.r.length?null:b.at})}
  const learned=leafOK()&&TREEPEND!=='learn';
  for(const G of TRG){const pend=TREEPEND&&TREEPEND.startsWith('g:'+G.k+':')?1:0,lv=Math.max(0,gupLv(G.k)-pend),hid=G.k==='area'&&!(S.flags&&S.flags.areaSkill),lock=G.k==='leaf'&&!learned;
    if(G.k==='leaf')N.push({k:'learn',x:G.x,y:TRLEARN,st:learned?'done':'can',cost:learned?0:LEAFLEARN,on:learned,icon:'leaf',par:[],crown:1});
    for(let n=1,mx=gupOf(G.k).max;n<=mx;n++){const o=lv>=n;N.push({k:'g:'+G.k+':'+n,x:G.x+(n%2?-3:3),/* すこしずつ左右にずらして、枝らしく */y:TRGY0-(n-1)*TRGD,st:hid?'hid':o?'done':!lock&&lv===n-1?'can':'lock',g:gupOf(G.k),G,n,cost:gupOf(G.k).c[n-1],on:o,icon:TRICON[G.k],par:n>1?['g:'+G.k+':'+(n-1)]:G.k==='leaf'?['learn']:[],crown:n===1&&G.k!=='leaf'?1:0})}}
  return N}
function treeDisc(st){/* 段々のドットの丸（26×26、1ドット1.5px）：ふち2ドット・上半分が明るい */const[a,b,e]=TREEC[st],R=13;let o='';const row=(y,r,col)=>{const w=Math.round(Math.sqrt(Math.max(0,r*r-(y+.5-R)**2)));if(w>0)o+='<rect x="'+(R-w)+'" y="'+y+'" width="'+2*w+'" height="1" fill="'+col+'"/>'};
  for(let y=0;y<26;y++)row(y,R,e);for(let y=2;y<24;y++)row(y,R-2,y<R?a:b);o+='<rect x="7" y="5" width="2" height="2" fill="#fff" opacity=".7"/>';return '<svg class="tdisc" viewBox="0 0 26 26" shape-rendering="crispEdges" aria-hidden="true">'+o+'</svg>'}
const TREEC={can:['#fbf3e2','#efe1c3','#a8743f'],done:['#c08a50','#a8743f','#6b4428'],lock:['#e2d9c6','#d6cab2','#b3a68c'],hid:['#e2d9c6','#d6cab2','#b3a68c']};
function treeRing(){/* ひらける点のまわりの光の輪（34×34） */let o='';for(let y=0;y<34;y++){const d=y+.5-17,w=Math.round(Math.sqrt(Math.max(0,289-d*d))),w2=Math.round(Math.sqrt(Math.max(0,225-d*d)));if(w>0){if(w2>0){o+='<rect x="'+(17-w)+'" y="'+y+'" width="'+(w-w2)+'" height="1" fill="#f6d36a"/><rect x="'+(17+w2)+'" y="'+y+'" width="'+(w-w2)+'" height="1" fill="#f6d36a"/>'}else o+='<rect x="'+(17-w)+'" y="'+y+'" width="'+2*w+'" height="1" fill="#f6d36a"/>'}}
  return '<svg class="tglow" viewBox="0 0 34 34" shape-rendering="crispEdges" aria-hidden="true">'+o+'</svg>'}
function trQ(p0,c,p1,n){const o=[];for(let k=0;k<=n;k++){const t=k/n,u=1-t;o.push([u*u*p0[0]+2*u*t*c[0]+t*t*p1[0],u*u*p0[1]+2*u*t*c[1]+t*t*p1[1]])}return o}
function trEdge(a,b){/* 点から点への枝：よこへ出てから上へまがる（同じ列なら、すこしうねる） */if(Math.abs(a.x-b.x)<2)return [[a.x,a.y],[a.x+(((a.y/34)|0)%2?1.2:-1.2),(a.y+b.y)/2],[b.x,b.y]];return trQ([a.x,a.y],[b.x,a.y],[b.x,b.y],12)}
function treeSegs(N){/* 枝のならび：{id,pts,w0,w1,lit}。光の通り道（treePath）にも使う */const by={};for(const n of N)by[n.k]=n;const any=N.some(n=>n.on),S0=[];
  S0.push({id:'trunk',pts:trQ([108,TRGY+2],[108,600],[108,TRFORK],16),w0:19,w1:10,lit:any});
  [-1,1].forEach(s=>{const r=s<0?0:1;S0.push({id:'root'+r,pts:trQ([108+s*5,TRGY-6],[108+s*12,TRGY+4],[108+s*28,TRGY+5],8),w0:7,w1:2,lit:any});S0.push({id:'rootb'+r,pts:trQ([108+s*2,TRGY-2],[108+s*6,TRGY+6],[108+s*15,TRGY+7],6),w0:4,w1:2,lit:any})});
  for(const n of N){if(n.at){const sx=n.x<108?103:113;S0.push({id:'in:'+n.k,pts:trQ([sx,n.at],[n.x,n.at],[n.x,n.y],12),w0:8,w1:6,lit:n.on})}
    if(n.crown)S0.push({id:'in:'+n.k,pts:trQ([108,TRFORK+8],[n.x,TRFORK+4],[n.x,n.y],12),w0:8,w1:5,lit:n.on});
    for(const pk of n.par){const p=by[pk];if(p)S0.push({id:'e:'+n.k+'<'+pk,pts:trEdge(p,n),w0:n.g?4.5:6,w1:n.g?4:5,lit:n.on})}}
  return S0}
function treePath(n){/* 根もとから、その点までの光の通り道（点のならび） */const N=treeNodes(),by={},sg={};for(const x of N)by[x.k]=x;for(const s of treeSegs(N))sg[s.id]=s.pts;
  const ch=[];let c=n;while(c){ch.unshift(c);c=c.par.length?by[c.par[0]]:null}const r=ch[0],top=r.at||TRFORK+8,o=[];for(let y=TRGY;y>top;y-=2)o.push([108,y]);o.push(...(sg['in:'+r.k]||[]));
  for(let i=1;i<ch.length;i++)o.push(...(sg['e:'+ch[i].k+'<'+ch[i-1].k]||sg['e:'+ch[i].k+'<'+ch[i].par[0]]||[]));
  const d=[];for(let k=1;k<o.length;k++){const[a,b]=[o[k-1],o[k]],L=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])));for(let q=0;q<L;q++)d.push([a[0]+(b[0]-a[0])*q/L,a[1]+(b[1]-a[1])*q/L])}return d}
function treeDraw(cv,N){/* 枝をマスクにして、ふち・光・かげ・木の皮のすじを1ドットずつぬる */const M=new Uint8Array(TRW*TRH);
  for(const s of treeSegs(N)){const P=s.pts,v=s.lit?2:1;let tot=0;const L=[0];for(let k=1;k<P.length;k++){tot+=Math.hypot(P[k][0]-P[k-1][0],P[k][1]-P[k-1][1]);L.push(tot)}
    for(let k=1;k<P.length;k++){const[a,b]=[P[k-1],P[k]],len=Math.max(1,Math.hypot(b[0]-a[0],b[1]-a[1]));for(let q=0;q<=len*2;q++){const t=q/(len*2),x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,w=s.w0+(s.w1-s.w0)*((L[k-1]+len*t)/(tot||1)),r=w/2;
      for(let yy=Math.floor(y-r);yy<=y+r;yy++)for(let xx=Math.floor(x-r);xx<=x+r;xx++){if(xx<0||yy<0||xx>=TRW||yy>=TRH)continue;if((xx+.5-x)**2+(yy+.5-y)**2<=r*r){const j=yy*TRW+xx;if(M[j]<v)M[j]=v}}}}}
  const c=cv.getContext('2d'),im=c.createImageData(TRW,TRH),D=im.data,hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)],PC={1:TRPAL[1].map(hex),2:TRPAL[2].map(hex)},m=(x,y)=>x<0||y<0||x>=TRW||y>=TRH?0:M[y*TRW+x];
  const put=(j,col)=>{D[j*4]=col[0];D[j*4+1]=col[1];D[j*4+2]=col[2];D[j*4+3]=255};
  /* 地面：根もとの土 */for(let y=TRGY;y<TRH;y++){const hw=Math.round(Math.sqrt(Math.max(0,1-((y-TRGY)/(TRH-TRGY))**2))*52);for(let x=108-hw;x<108+hw;x++)put(y*TRW+x,hex(y===TRGY||x===108-hw?'#d8c29a':x===107+hw||y===TRH-1?'#b49a70':'#c9b088'))}
  for(let y=0;y<TRH;y++)for(let x=0;x<TRW;x++){const j=y*TRW+x,v=M[j];
    if(!v){let nv=0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])nv=Math.max(nv,m(x+dx,y+dy));if(nv)put(j,PC[nv][0]);continue}
    const P=PC[v],eL=!m(x-1,y),eU=!m(x,y-1),eR=!m(x+1,y)||!m(x+2,y),eD=!m(x,y+1);
    put(j,eL||eU?P[3]:eR||eD?P[1]:((x*7+y*3)%11===0&&m(x+1,y)&&m(x-1,y))||(y%5===0&&(x*5+y)%7===0)?P[1]:P[2])}
  c.putImageData(im,0,0)}
function treeBuild(){/* 木（1まい）：キャンバスの絵と、点のボタン・名前・いるパワー */
  const w=el('<div class="stree"><canvas class="tcv" width="'+TRW+'" height="'+TRH+'"></canvas><canvas class="tfx" width="'+TRW+'" height="'+TRH+'"></canvas></div>'),pc=(v,a)=>(v/a*100)+'%',
    txt=(x,y,t,cls)=>{const d=el('<span class="tlbl'+(cls?' '+cls:'')+'"></span>');d.textContent=t;d.style.left=pc(x,TRW);d.style.top=pc(y,TRH);w.appendChild(d)};
  const N=treeNodes();treeDraw(w.querySelector('.tcv'),N);
  txt(72,TRGY0-4*TRGD-44,'まもりの光','hub');TRG.forEach(G=>txt(G.x,TRGY0-(gupOf(G.k).max-1)*TRGD-22,G.k==='area'&&!(S.flags&&S.flags.areaSkill)?'？？？':G.n));for(const b of VPATH)txt(b.lx,b.ly,b.n,'hub');
  for(const n of N){const b=el('<button class="tnode"></button>'),cost=n.st==='can'?n.cost:0,can=n.st==='can'&&S.pt>=cost;
    b.dataset.node=n.k;b.dataset.st=n.st;b.style.left=pc(n.x,TRW);b.style.top=pc(n.y,TRH);
    b.innerHTML=(can?treeRing():'')+treeDisc(n.st)+'<b>'+(n.st==='hid'?'？':pxi(n.icon,'tic'))+'</b>'+(cost?'<i class="tcost'+(S.pt<cost?' lack':'')+'">'+pxi('power')+cost+'</i>':'');
    b.setAttribute('aria-label',n.p?n.p.t:n.g?(n.st==='hid'?'？？？':n.g.n+' Lv'+n.n):'葉のかべ');b.onclick=()=>{sfx('tap');treePop(n.k)};w.appendChild(b)}
  return w}
function treeScroller(w){let e=w.parentNode;while(e&&e!==document.body){const s=getComputedStyle(e).overflowY;if((s==='auto'||s==='scroll')&&e.scrollHeight>e.clientHeight)return e;e=e.parentNode}return null}
function treeSec(body){body.appendChild(el('<p class="note">パワーを使って、村と守り神の力をのばす。</p>'));const w=treeBuild();body.appendChild(w);skillSec(body)/* わざの枠（defense.js） */
  const sy=TREESCR;TREESCR=null;requestAnimationFrame(()=>{const sc=treeScroller(w);if(!sc)return;if(sy!=null){sc.scrollTop=sy;return}/* はじめは、いまひらける点（いちばん下）が見える所へ */
    const bs=[...w.querySelectorAll('.tnode[data-st=can]')];if(!bs.length)return;const b=bs.reduce((a,x)=>parseFloat(x.style.top)>parseFloat(a.style.top)?x:a),r=b.getBoundingClientRect(),R=sc.getBoundingClientRect();sc.scrollTop+=r.top-R.top-R.height/2});
  if(TREEPEND)treeOpenFx(TREEPEND)}
function treeOpenFx(k){/* ひらいた：光が根もとから枝をのぼって点にとどき、点がぽんと光る（実時間） */const w0=document.querySelector('.stree');if(!w0){TREEPEND=null;return}
  const n=treeNodes().find(x=>x.k===k);if(!n||uiReduced()){TREEPEND=null;return treeSwap(w0,k,false)}
  const P=treePath(n),cv=w0.querySelector('.tfx'),c=cv.getContext('2d'),T0=performance.now(),DUR=Math.min(1100,450+P.length*3),pass=new Float32Array(P.length).fill(-1);sfx('leaf');
  const step=now=>{if(!w0.isConnected){TREEPEND=null;return}const t=Math.min(1,(now-T0)/DUR),e=t<.5?2*t*t:1-2*(1-t)*(1-t),at=Math.min(P.length-1,Math.floor(e*(P.length-1)));
    for(let q=0;q<=at;q++)if(pass[q]<0)pass[q]=now;c.clearRect(0,0,TRW,TRH);
    for(let q=0;q<=at;q++){const a=1-(now-pass[q])/380;if(a<=0)continue;c.globalAlpha=Math.round(a*4)/4;c.fillStyle='#ffe58a';c.fillRect(Math.round(P[q][0])-1,Math.round(P[q][1]),2,1)}
    c.globalAlpha=1;const[x,y]=P[at].map(Math.round);c.fillStyle='#ffd45a';c.fillRect(x-3,y-1,7,3);c.fillRect(x-1,y-3,3,7);c.fillRect(x-2,y-2,5,5);c.fillStyle='#fffbe8';c.fillRect(x-1,y-1,3,3);
    if(t<1)requestAnimationFrame(step);else{TREEPEND=null;treeSwap(w0,k,true)}};
  requestAnimationFrame(step)}
function treeSwap(w0,k,fx){/* 光がとどいたら、木をいまのようすに描きなおし、点をぽんと光らせる */const w=treeBuild();w0.replaceWith(w);if(!fx)return;const b=w.querySelector('.tnode[data-node="'+k+'"]');if(!b)return;
  b.classList.add('tpop');sfx('chime');const n=treeNodes().find(x=>x.k===k),cx=n.x,cy=n.y,c=w.querySelector('.tfx').getContext('2d'),T0=performance.now();
  const step=now=>{if(!w.isConnected)return;const t=(now-T0)/520;c.clearRect(0,0,TRW,TRH);if(t>=1)return;const r=Math.round(14+t*12);c.globalAlpha=Math.round((1-t)*4)/4;
    c.fillStyle='#ffe58a';for(let a=0;a<16;a++){const q=a/16*Math.PI*2;c.fillRect(Math.round(cx+Math.cos(q)*r)-1,Math.round(cy+Math.sin(q)*r)-1,2,2)}
    c.fillStyle='#fffbe8';for(let a=0;a<8;a++){const q=a/8*Math.PI*2+.39,d=Math.round(10+t*20);c.fillRect(Math.round(cx+Math.cos(q)*d),Math.round(cy+Math.sin(q)*d),1,1)}c.globalAlpha=1;requestAnimationFrame(step)};
  requestAnimationFrame(step)}
function treePop(k){const old=document.getElementById('treePop');if(old)old.remove();const n=treeNodes().find(x=>x.k===k);if(!n)return;
  const o=el('<div id="treePop" style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(40,30,15,.35);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:320px;width:100%;color:var(--ink)"><b class="t" style="display:block;font-size:15px;margin-bottom:6px"></b><p class="note n" style="margin:0;white-space:pre-line"></p><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="btn x">とじる</button></div></div></div>'),
    T=o.querySelector('.t'),D=o.querySelector('.n'),bar=o.querySelector('.x').parentNode,close=()=>o.remove();o.querySelector('.x').onclick=close;o.onclick=e=>{if(e.target===o)close()};
  const go=(label,c,fn)=>{const bt=el('<button class="btn pri go"></button>');bt.textContent=label+'　'+SP(c);lackOn(bt,lackPt(c));bt.onclick=()=>{if(S.pt<c){sfx('tap');return toast(lackPt(c),'warn')}if(fn()){close();TREEPEND=k;renderSheet()}};bar.appendChild(bt)};
  const sv=()=>{const sc=treeScroller(document.querySelector('.stree'));TREESCR=sc?sc.scrollTop:null};
  if(n.p){T.textContent=n.b.n;D.textContent=n.p.t+'\n'+(n.st==='done'?'ひらいた':n.st==='lock'?'つながった下の点をひらくと、ひらける':SP(n.p.c));if(n.st==='can')go('ひらく',n.p.c,()=>{sv();return pathBuy(n.p)})}
  else if(n.k==='learn'){T.textContent='葉のかべ';D.textContent='夜、地面をなぞると、葉のかべが生える。「コワイノ」の道をふさぐ'+(n.st==='done'?'\nおぼえた':'');if(n.st==='can')go('おぼえる',LEAFLEARN,()=>{sv();leafLearn();return leafOK()})}
  else if(n.st==='hid'){T.textContent='？？？';D.textContent='？？？'}
  else{const g=n.g;T.textContent=g.n+'（Lv'+n.n+'）';D.textContent=g.t[n.n]+'\n'+(n.st==='done'?'強化した':n.st==='lock'?'つながった下の点をひらくと、ひらける':SP(n.cost));if(n.st==='can')go('強化',n.cost,()=>{sv();return gupBuy(g.k)})}
  document.body.appendChild(o)}
