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
/* 木の絵（ドット）：1ドット1.5px のキャンバス（TRW×TRH）。枝は、ひらいた所が明るい木の色、まだの所がくすんだ色 */
const TRW=216,TRH=232,TRX=c=>18+36*c,TRY=i=>[134,90,46][i],TRBASE=154,TRFORK=[108,196];
const TRPAL={1:['#a39377','#bcae92','#cbbfa4','#ddd3bf'],2:['#6b4428','#8a5a32','#a8743f','#d29a5a']};/* ふち・かげ・もと・光 */
const TRICON={k1:'box',k2:'heart',k3:'house',s1:'hammer',s2:'boot',s3:'log',m1:'target',m2:'compass',m3:'sword',cd:'bulb',pow:'sun',stun:'clock',area:'shield',leaf:'leaf'};
let TREEPEND=null;/* ひらいたばかりの点（光がとどくまで、前のようすで描く） */
function treeNodes(){const N=[];VPATH.forEach((b,c)=>{let open=true;b.L.forEach((p,i)=>{const on=vpOn(p.id)&&TREEPEND!=='v:'+p.id;N.push({k:'v:'+p.id,c,i,st:on?'done':open?'can':'lock',p,b,cost:p.c,on});open=open&&on})});
  const lv=k=>Math.max(0,gupLv(k)-(TREEPEND==='g:'+k?1:0)),gn=(k,c,i,st)=>{const n=lv(k);return {k:'g:'+k,c,i,st:st||(n>=10?'done':'can'),g:gupOf(k),n,cost:n<10?GUPC[n]:0,on:n>0}};
  ['cd','pow','stun'].forEach((k,i)=>N.push(gn(k,3,i)));
  N.push(gn('area',4,0,!(S.flags&&S.flags.areaSkill)?'hid':0));
  N.push(leafOK()&&TREEPEND!=='learn'?gn('leaf',5,0):{k:'learn',c:5,i:0,st:'can',cost:LEAFLEARN,on:false});
  return N}
function treeDisc(st){/* 段々のドットの丸（26×26、1ドット1.5px）：ふち2ドット・上半分が明るい */const[a,b,e]=TREEC[st],R=13;let o='';const row=(y,r,col)=>{const w=Math.round(Math.sqrt(Math.max(0,r*r-(y+.5-R)**2)));if(w>0)o+='<rect x="'+(R-w)+'" y="'+y+'" width="'+2*w+'" height="1" fill="'+col+'"/>'};
  for(let y=0;y<26;y++)row(y,R,e);for(let y=2;y<24;y++)row(y,R-2,y<R?a:b);o+='<rect x="7" y="5" width="2" height="2" fill="#fff" opacity=".7"/>';return '<svg class="tdisc" viewBox="0 0 26 26" shape-rendering="crispEdges" aria-hidden="true">'+o+'</svg>'}
const TREEC={can:['#fbf3e2','#efe1c3','#a8743f'],done:['#c08a50','#a8743f','#6b4428'],lock:['#e2d9c6','#d6cab2','#b3a68c'],hid:['#e2d9c6','#d6cab2','#b3a68c']};
function treeRing(){/* ひらける点のまわりの光の輪（34×34） */let o='';for(let y=0;y<34;y++){const d=y+.5-17,w=Math.round(Math.sqrt(Math.max(0,289-d*d))),w2=Math.round(Math.sqrt(Math.max(0,225-d*d)));if(w>0){if(w2>0){o+='<rect x="'+(17-w)+'" y="'+y+'" width="'+(w-w2)+'" height="1" fill="#f6d36a"/><rect x="'+(17+w2)+'" y="'+y+'" width="'+(w-w2)+'" height="1" fill="#f6d36a"/>'}else o+='<rect x="'+(17-w)+'" y="'+y+'" width="'+2*w+'" height="1" fill="#f6d36a"/>'}}
  return '<svg class="tglow" viewBox="0 0 34 34" shape-rendering="crispEdges" aria-hidden="true">'+o+'</svg>'}
function trQ(p0,c,p1,n){const o=[];for(let k=0;k<=n;k++){const t=k/n,u=1-t;o.push([u*u*p0[0]+2*u*t*c[0]+t*t*p1[0],u*u*p0[1]+2*u*t*c[1]+t*t*p1[1]])}return o}
function treeSegs(N){/* 枝のならび：{pts,w0,w1,lit}。光の通り道（treePath）にも使う */const on=(c,i)=>{const n=N.find(x=>x.c===c&&x.i===i);return !!(n&&n.on)},anyC=c=>[0,1,2].some(i=>on(c,i)),side=s=>[0,1,2].some(d=>anyC(s*3+d));
  const S0=[];S0.push({id:'trunk',pts:trQ([108,226],[108,210],TRFORK,8),w0:17,w1:13,lit:side(0)||side(1)});
  [-1,1].forEach(s=>{const r=s<0?0:1;S0.push({id:'root'+r,pts:trQ([108+s*4,218],[108+s*10,228],[108+s*24,229],8),w0:6,w1:2,lit:side(0)||side(1)});S0.push({id:'rootb'+r,pts:trQ([108+s*2,222],[108+s*5,230],[108+s*13,231],6),w0:4,w1:2,lit:side(0)||side(1)})});
  [0,1].forEach(s=>{/* 大きな枝は外のはしの道まで。内がわの道は、その枝から上へ生える */const sg=s?1:-1,end=[TRX(s?5:0),TRBASE+2],M=trQ(TRFORK,[TRFORK[0]+sg*58,TRFORK[1]+4],end,40),cs=s?[3,4,5]:[2,1,0];let k0=0;
    cs.forEach((c,d)=>{const x=TRX(c);let k=M.length-1;if(d<2){k=0;while(k<M.length-1&&Math.abs(M[k][0]-x)>Math.abs(M[k+1][0]-x)||k<1)k++}
      S0.push({id:'main'+c,pts:M.slice(k0,k+1),w0:10-d*1.5,w1:10-(d+1)*1.5,lit:cs.slice(d).some(anyC)});k0=k;
      let y0=M[k][1]-(d<2?3:0);for(let i=0;i<3;i++){if(!N.some(n=>n.c===c&&n.i===i))break;const y1=TRY(i);S0.push({id:'col'+c+'_'+i,pts:[[x,y0],[x+(i%2?1:-1)*1.2,(y0+y1)/2],[x,y1]],w0:(i?6-i:7),w1:5-i,lit:on(c,i)});y0=y1}})});
  return S0}
function treePath(n){/* 根もとから、その点までの光の通り道（点のならび） */const sg=treeSegs(treeNodes()),g=id=>(sg.find(s=>s.id===id)||{pts:[]}).pts,s=n.c<3?0:1,o=[...g('trunk'),...g('main'+s),...g('sub'+n.c)];for(let i=0;i<=n.i;i++)o.push(...g('col'+n.c+'_'+i));
  const d=[];for(let k=1;k<o.length;k++){const[a,b]=[o[k-1],o[k]],L=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])));for(let q=0;q<L;q++)d.push([a[0]+(b[0]-a[0])*q/L,a[1]+(b[1]-a[1])*q/L])}return d}
function treeDraw(cv,N){/* 枝をマスクにして、ふち・光・かげ・木の皮のすじを1ドットずつぬる */const M=new Uint8Array(TRW*TRH);
  for(const s of treeSegs(N)){const P=s.pts,v=s.lit?2:1;let tot=0;const L=[0];for(let k=1;k<P.length;k++){tot+=Math.hypot(P[k][0]-P[k-1][0],P[k][1]-P[k-1][1]);L.push(tot)}
    for(let k=1;k<P.length;k++){const[a,b]=[P[k-1],P[k]],len=Math.max(1,Math.hypot(b[0]-a[0],b[1]-a[1]));for(let q=0;q<=len*3;q++){const t=q/(len*3),x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,w=s.w0+(s.w1-s.w0)*((L[k-1]+len*t)/(tot||1)),r=w/2;
      for(let yy=Math.floor(y-r);yy<=y+r;yy++)for(let xx=Math.floor(x-r);xx<=x+r;xx++){if(xx<0||yy<0||xx>=TRW||yy>=TRH)continue;if((xx+.5-x)**2+(yy+.5-y)**2<=r*r){const j=yy*TRW+xx;if(M[j]<v)M[j]=v}}}}}
  const c=cv.getContext('2d'),im=c.createImageData(TRW,TRH),D=im.data,hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)],PC={1:TRPAL[1].map(hex),2:TRPAL[2].map(hex)},m=(x,y)=>x<0||y<0||x>=TRW||y>=TRH?0:M[y*TRW+x];
  const put=(j,col)=>{D[j*4]=col[0];D[j*4+1]=col[1];D[j*4+2]=col[2];D[j*4+3]=255};
  /* 地面：根もとの土 */for(let y=225;y<TRH;y++){const hw=Math.round(Math.sqrt(Math.max(0,1-((y-225)/8)**2))*46);for(let x=108-hw;x<108+hw;x++)put(y*TRW+x,hex(y===225||x===108-hw?'#d8c29a':x===107+hw||y===TRH-1?'#b49a70':'#c9b088'))}
  for(let y=0;y<TRH;y++)for(let x=0;x<TRW;x++){const j=y*TRW+x,v=M[j];
    if(!v){let nv=0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])nv=Math.max(nv,m(x+dx,y+dy));if(nv)put(j,PC[nv][0]);continue}
    const P=PC[v],eL=!m(x-1,y),eU=!m(x,y-1),eR=!m(x+1,y)||!m(x+2,y),eD=!m(x,y+1);
    put(j,eL||eU?P[3]:eR||eD?P[1]:((x*7+y*3)%11===0&&m(x+1,y)&&m(x-1,y))||(y%5===0&&(x*5+y)%7===0)?P[1]:P[2])}
  c.putImageData(im,0,0)}
function treeBuild(){/* 木（1まい）：キャンバスの絵と、点のボタン・名前・いるパワー */
  const w=el('<div class="stree"><canvas class="tcv" width="'+TRW+'" height="'+TRH+'"></canvas><canvas class="tfx" width="'+TRW+'" height="'+TRH+'"></canvas></div>'),pc=(v,a)=>(v/a*100)+'%',
    txt=(x,y,t,cls)=>{const d=el('<span class="tlbl'+(cls?' '+cls:'')+'"></span>');d.textContent=t;d.style.left=pc(x,TRW);d.style.top=pc(y,TRH);w.appendChild(d)};
  const N=treeNodes();treeDraw(w.querySelector('.tcv'),N);
  ['くらし','しごと','まもり','まもりの光','こもれび','葉のかべ'].forEach((t,c)=>txt(TRX(c),6,c===4&&!(S.flags&&S.flags.areaSkill)?'？？？':t));
  txt(44,196,'村','hub');txt(172,196,'守り神','hub');
  for(const n of N){const b=el('<button class="tnode"></button>'),ic=n.k==='learn'?'leaf':TRICON[n.k.slice(2)],cost=n.st==='done'||n.st==='hid'?0:n.cost,can=n.st==='can'&&S.pt>=cost;
    b.dataset.node=n.k;b.dataset.st=n.st;b.style.left=pc(TRX(n.c),TRW);b.style.top=pc(TRY(n.i),TRH);
    b.innerHTML=(can?treeRing():'')+treeDisc(n.st)+'<b>'+(n.st==='hid'?'？':pxi(ic,'tic'))+'</b>'+(n.g&&n.st!=='hid'?'<i class="tlv">'+(n.n>=10?'MAX':'Lv'+n.n)+'</i>':'')+(cost?'<i class="tcost'+(S.pt<cost?' lack':'')+'">'+pxi('power')+cost+'</i>':'');
    b.setAttribute('aria-label',n.p?n.p.t:n.g?(n.st==='hid'?'？？？':n.g.n):'葉のかべ');b.onclick=()=>{sfx('tap');treePop(n.k)};w.appendChild(b)}
  return w}
function treeSec(body){body.appendChild(el('<p class="note">パワーを使って、村と守り神の力をのばす。</p>'));body.appendChild(treeBuild());skillSec(body)/* わざの枠（defense.js） */
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
function treeSwap(w0,k,fx){/* 光がとどいたら、木をいまのようすに描きなおし、点をぽんと光らせる */const w=treeBuild();w0.replaceWith(w);if(!fx)return;if(k==='learn')k='g:leaf';const b=w.querySelector('.tnode[data-node="'+k+'"]');if(!b)return;
  b.classList.add('tpop');sfx('chime');const n=treeNodes().find(x=>x.k===k),cx=TRX(n.c),cy=TRY(n.i),c=w.querySelector('.tfx').getContext('2d'),T0=performance.now();
  const step=now=>{if(!w.isConnected)return;const t=(now-T0)/520;c.clearRect(0,0,TRW,TRH);if(t>=1)return;const r=Math.round(14+t*12);c.globalAlpha=Math.round((1-t)*4)/4;
    c.fillStyle='#ffe58a';for(let a=0;a<16;a++){const q=a/16*Math.PI*2;c.fillRect(Math.round(cx+Math.cos(q)*r)-1,Math.round(cy+Math.sin(q)*r)-1,2,2)}
    c.fillStyle='#fffbe8';for(let a=0;a<8;a++){const q=a/8*Math.PI*2+.39,d=Math.round(10+t*20);c.fillRect(Math.round(cx+Math.cos(q)*d),Math.round(cy+Math.sin(q)*d),1,1)}c.globalAlpha=1;requestAnimationFrame(step)};
  requestAnimationFrame(step)}
function treePop(k){const old=document.getElementById('treePop');if(old)old.remove();const n=treeNodes().find(x=>x.k===k);if(!n)return;
  const o=el('<div id="treePop" style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.45);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:320px;width:100%;color:var(--ink)"><b class="t" style="display:block;font-size:16px;margin-bottom:6px"></b><p class="note n" style="margin:0;white-space:pre-line"></p><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="btn x">とじる</button></div></div></div>'),
    T=o.querySelector('.t'),D=o.querySelector('.n'),bar=o.querySelector('.x').parentNode,close=()=>o.remove();o.querySelector('.x').onclick=close;o.onclick=e=>{if(e.target===o)close()};
  const go=(label,c,fn)=>{const bt=el('<button class="btn pri go"></button>');bt.textContent=label+'　'+SP(c);lackOn(bt,lackPt(c));bt.onclick=()=>{if(S.pt<c){sfx('tap');return toast(lackPt(c),'warn')}if(fn()){close();TREEPEND=k;renderSheet()}};bar.appendChild(bt)};
  if(n.p){T.textContent=n.b.n+'（'+(n.i+1)+'/'+n.b.L.length+'）';D.textContent=n.p.t+'\n'+(n.st==='done'?'ひらいた':n.st==='lock'?'まえの所をひらくと、ひらける':SP(n.p.c));if(n.st==='can')go('ひらく',n.p.c,()=>pathBuy(n.p))}
  else if(n.k==='learn'){T.textContent='葉のかべ';D.textContent='夜、地面をなぞると、葉のかべが生える。コワイノの道をふさぐ';go('おぼえる',LEAFLEARN,()=>{leafLearn();return leafOK()})}
  else if(n.st==='hid'){T.textContent='？？？';D.textContent='？？？'}
  else{const g=n.g,v=n.n;T.textContent=g.n+'（Lv'+v+'/10）';D.textContent=v>=10?'いま '+g.t[v]:'いま '+g.t[v]+'\nつぎ '+g.t[v+1];if(v<10)go('強化',GUPC[v],()=>gupBuy(g.k))}
  document.body.appendChild(o)}
