/* 本（思い出帳・図鑑）：ページをめくる本。book.js
   bookMake(body,pages,o)：pages（ページの中身の要素）をならべた本を body に作る。o = {key, at, toc, cover:{t,sub,c}, shutOnly, onAt}（shutOnly：ひらいたときは表紙を出さず、とじるときだけ表紙がとじる）
   ・たての画面は1ページ、よこの画面（はば720より広い）は見開き（左右2ページ、まん中にとじ目）。
   ・めくる：はしから、紙がもち上がって、まるくそりながらとじ目のほうへたおれる（うらの面・かげ）。絵は1ドット（BKD）のキャンバスに、コマごとに描く。
     ページの中身は切りとるだけ（ちぢめない）。前へもどるときは、つぎへめくる動きを、さかさに流す。
   ・指でつまんでめくる：ページのはし（外がわ 4わり）から、よこに引く。とちゅうではなすと、半分より先なら、めくれる。
   ・遠くのページへは、あいだのページを、ぱらぱらと何まいもめくる（BKRIFF まいまで）。
   ・表紙：ひらいたとき、布の表紙がひらく。とじるときは、表紙がとじてから画面がとじる（bookShut）。
   ・音：めくる mpage（めくるたびにべつの録音）・ぱらぱら pflick・表紙 bkopen・bkclose・紙をなでる pslide（なでる速さで大きさがかわる）。
   ・見た目と音だけ（数字・セーブはかえない）。うごきをへらす設定では、めくる絵を出さない。 */
const BKD=1.5,BKMS=480,BKFAST=150,BKRIFF=5,BKLIFT=6,BKCOVMS=560,BKTHK=2;
const BKC={back:'#e9dab8',hi:'#fff8e6',lit:'#f5e9cc',mid:'#e0cea8',edge:'#c4ab80',sh:'90,60,30'};/* めくれた紙のうら（色は tools/ui/colors.md の「本」） */
let BK=null,BKSEEN=null,BKSLIDE=null;
function bkClone(n){/* 写し：キャンバス（図鑑のコワイノなど）の絵もうつす */const c=n.cloneNode(true),a=n.querySelectorAll?n.querySelectorAll('canvas'):[],b=c.querySelectorAll?c.querySelectorAll('canvas'):[];a.forEach((v,i)=>{try{b[i].getContext('2d').drawImage(v,0,0)}catch(_){}});return c}
function bkSpread(){return innerWidth>innerHeight&&innerWidth>=720}
function bkEase(p){return p<.5?2*p*p:1-2*(1-p)*(1-p)}
function bookMake(body,pages,o){o=o||{};const sp=bkSpread(),N=pages.length;let at=Math.max(0,Math.min(N-1,o.at|0));if(sp)at-=at%2;
  const b=el('<div class="bk"><div class="bkin"><div class="bkboard"><i></i><i></i><i></i><i></i></div><div class="bkp bkL"><div class="bkc"></div><span class="bkn"></span></div><div class="bkp bkR"><i class="bkpeek" aria-hidden="true"></i><div class="bkc"></div><span class="bkn"></span></div><i class="bkrib" aria-hidden="true"></i><canvas class="bkfx" aria-hidden="true"></canvas></div><div class="mnav"><button class="btn mpv" type="button" aria-label="まえのページ">'+pxi('next','prev')+'</button><button class="btn mtc" type="button">もくじ</button><span class="mpn"></span><button class="btn mnx" type="button" aria-label="つぎのページ">'+pxi('next','nxr')+'</button></div></div>');
  bkTapes(pages);b.dataset.sp=sp?1:0;if(o.cover&&o.cover.c)b.style.setProperty('--cv',o.cover.c);{const st=document.createElement('div');st.className='bkstore';st.hidden=true;for(const pg of pages)st.appendChild(pg);b.appendChild(st)}/* まだひらいていないページも、本の中にしまっておく（さがせる） */if(o.cls)b.classList.add(o.cls);body.appendChild(b);
  const B=BK={el:b,in:b.querySelector('.bkin'),L:b.querySelector('.bkL'),R:b.querySelector('.bkR'),cv:b.querySelector('.bkfx'),pages,N,sp,at,o,busy:0,q:null};
  b.style.setProperty('--stk',16*BKD+'px');/* ページをわけるときは、紙のたばがいちばんあつい（14まい）ときの高さではかる（あとで、ページがはみ出さない） */
  if(!sp)B.L.hidden=true;/* 1ページの画面では、左のページを先にかくす（ページをわける前。かくさないと、はばが半分のままはかる） */
  {const P=bkPaginate(B,pages);B.pages=P.pages;B.N=P.pages.length;at=Math.max(0,Math.min(B.N-1,at));if(sp)at-=at%2;B.at=at;if(o.onPaged)o.onPaged(P.map)}/* ページはスクロールさせない：入りきらない分は、つぎのページへ */
  b.querySelector('.mpv').onclick=()=>{if(B.closed)return;if(B.at===0&&o.cover){if(!o.shutOnly)bkCoverClose(B);return}bkGo(B,B.at-(sp?2:1))};b.querySelector('.mnx').onclick=()=>B.closed?bkCoverGo(B):bkGo(B,B.at+(sp?2:1));b.querySelector('.mtc').onclick=()=>bkGo(B,0);
  if(!o.toc)b.querySelector('.mtc').remove();
  bkMount(B,at);bkDrag(B);bkStroke(B);
  if(BKSNAP)bkEnter(B);
  else if(o.cover&&!o.shutOnly&&BKSEEN!==o.key){BKSEEN=o.key;bkCoverShow(B)}/* ひらいたときは、とじた表紙。めくるのは、さわる人 */
  return B}
/* ページをスロットに入れる（見開きは左 i・右 i+1） */
function bkMount(B,at){B.at=at;const sp=B.sp,store=B.el.querySelector('.bkstore'),put=(slot,i)=>{const c=slot.querySelector('.bkc'),n=slot.querySelector('.bkn'),pg=B.pages[i];for(const x of[...c.children])store.appendChild(x);if(pg){pg.hidden=false;c.appendChild(pg)}c.scrollTop=0;slot.classList.toggle('blank',!pg);n.textContent=pg&&i>0?String(i):''};
  if(sp){put(B.L,at);put(B.R,at+1)}else put(B.R,at);
  const b=B.el,last=sp?B.N-1-((B.N-1)%2):B.N-1;b.querySelector('.mpv').disabled=!!B.closed||at<=0&&(!B.o.cover||!!B.o.shutOnly);b.querySelector('.mnx').disabled=at>=last;const tc=b.querySelector('.mtc');if(tc)tc.hidden=at===0;
  {const k=B.o.toc?0:1,T=B.N-1+k;/* もくじのない本（日記）は、1ページめから数える */b.querySelector('.mpn').textContent=B.closed?'表紙':at===0&&B.o.toc?'もくじ':sp?(at+k||1)+(at+1<B.N?'-'+(at+1+k):'')+' / '+T:(at+k)+' / '+T}
  /* 重なった紙のあつみ：のこりのページは右、よんだページは左。ページのわりあいで1〜14まい（bkEdge が絵で描く） */const T=Math.max(1,B.N-1),th=n=>1+Math.round(13*Math.max(0,n)/T);B.thR=th(B.N-1-(sp?at+1:at));B.thL=sp?th(at):0;B.el.style.setProperty('--stk',(B.thR+2)*BKD+'px');if(at===0)B.el.dataset.at0='';else delete B.el.dataset.at0;requestAnimationFrame(()=>bkEdge(B));
  if(B.o.onAt)B.o.onAt(at)}
function bkSnd(k,v,rt){if(typeof playU==='function'&&typeof AC!=='undefined'&&AC&&AC.state==='running'&&SND.sfx)playU(k,v,rt||1)}
/* 本の中の場所（.bkin のなかの px）：とじ目 S・1ページのはば w・上と下 */
function bkGeo(B){const r=B.in.getBoundingClientRect(),R=B.R.getBoundingClientRect();return{r,S:R.left-r.left,w:R.width,top:R.top-r.top,bot:R.bottom-r.top}}
/* めくる絵のしたく：A＝前のページ（切りとって上にのせる写し）、下には B のページ（本物） */
function bkSetup(B,from,to,coverEl){B.el.classList.toggle('bkcovon',!!coverEl);const g=bkGeo(B),cv=B.cv;cv.width=Math.ceil(g.r.width/BKD);cv.height=Math.ceil(g.r.height/BKD)+BKLIFT*2;cv.style.width=cv.width*BKD+'px';cv.style.height=cv.height*BKD+'px';cv.style.top=-BKLIFT*BKD+'px';cv.hidden=false;
  const fw=to>from,A=fw?from:to,Bi=fw?to:from,wrap=(slot,clone)=>{const w=document.createElement('div');w.className='bkwrap';const s=slot.getBoundingClientRect(),r=g.r;w.style.cssText='left:'+(s.left-r.left)+'px;top:'+(s.top-r.top)+'px;height:'+s.height+'px;width:'+s.width+'px';const c=clone;c.style.width=s.width+'px';c.style.height=s.height+'px';w.appendChild(c);B.in.insertBefore(w,B.cv);return w};
  const snap=(slot,i)=>{if(coverEl&&slot===B.R)return coverEl;const c=slot.cloneNode(false),cc=document.createElement('div');cc.className='bkc';const pg=B.pages[i];if(pg)cc.appendChild(bkClone(pg));c.appendChild(cc);c.classList.toggle('blank',!pg);c.classList.remove('bkL','bkR');c.classList.add(slot===B.L?'bkL':'bkR','bksnap');c.hidden=false;const n=document.createElement('span');n.className='bkn';n.textContent=pg&&i>0?String(i):'';c.appendChild(n);return c};
  const sc=B.R.querySelector('.bkc').scrollTop;
  /* いま見えている所の写しは、スクロールの場所もそのまま */
  const aR=coverEl?null:snap(B.R,B.sp?A+1:A),aL=B.sp&&!coverEl?snap(B.L,A):null;
  bkMount(B,coverEl?B.at:Bi);
  let gc=g,wR;if(coverEl){/* 表紙は、うら表紙（.bkboard）と同じ大きさ：上・右・下へ、ページよりはみ出す（とじ目のがわはそのまま） */const bd=B.el.querySelector('.bkboard'),R=B.R.getBoundingClientRect(),bb=bd?bd.getBoundingClientRect():R,et=Math.max(0,R.top-bb.top),er=Math.max(0,bb.right-R.right),eb=et;
    gc=Object.assign({},g,{w:g.w+er,top:g.top-et,bot:g.bot+eb});wR=document.createElement('div');wR.className='bkwrap';wR.style.cssText='left:'+(R.left-g.r.left)+'px;top:'+(R.top-g.r.top-et)+'px;height:'+(R.height+et+eb)+'px;width:'+(R.width+er)+'px';coverEl.style.width=(R.width+er)+'px';coverEl.style.height=(R.height+et+eb)+'px';wR.appendChild(coverEl);B.in.insertBefore(wR,B.cv)}
  const st={g:gc,fw,A,Bi,wR:wR||wrap(B.R,aR),wL:aL?wrap(B.L,aL):null,cover:!!coverEl,hard:!!coverEl,hideL:!!coverEl&&B.sp};if(fw&&!coverEl){const c=aR.querySelector('.bkc');if(c)c.scrollTop=sc}
  return st}
function bkClean(B,st){B.el.classList.remove('bkcovon');B.L.style.visibility='';if(st.wR)st.wR.remove();if(st.wL)st.wL.remove();const c=B.cv.getContext('2d');c.clearRect(0,0,B.cv.width,B.cv.height);B.cv.hidden=true}
/* 1コマを描く：e＝めくれぐあい（0〜1）・a＝めくれた紙のこさ（さいごに紙がおちつく所） */
function bkFrame(B,st,e,a,pal){if(st.hard)return bkHard(B,st,e,pal);const{g}=st,D=BKD,S=g.S,w=g.w,sp=B.sp,f=S+w*(1-e),k=1-.42*Math.sin(Math.PI*e),fw=(S+w-f)*k,xl=f-fw,s=Math.sin(Math.PI*e),q=v=>Math.round(v/D)*D;
  if(st.hideL)B.L.style.visibility=e>.96?'':'hidden';if(sp)a*=Math.min(1,(1-e)/.08);st.wR.style.width=Math.max(0,q(f-S))+'px';if(st.wL)st.wL.style.width=Math.max(0,Math.min(w,q(xl-(S-w))))+'px';
  const c=B.cv.getContext('2d'),O=BKLIFT;c.clearRect(0,0,B.cv.width,B.cv.height);const P=pal||BKC;
  const t0=Math.round(g.top/D)+O,b0=Math.round(g.bot/D)+O,xf=Math.round(f/D),xL=Math.max(sp?-1e9:Math.round(S/D),Math.round(xl/D)),fwD=Math.max(1,xf-Math.round(xl/D));
  /* めくれた紙の下のページに落ちるかげ（おり目の右） */for(let i=0;i<4&&e>0&&e<1;i++){c.fillStyle='rgba('+P.sh+','+([.2,.13,.07,.03][i]*s*a).toFixed(3)+')';c.fillRect(xf+i,t0,1,b0-t0)}
  if(fw<D*.5||a<=0)return;
  /* めくれた紙（うらの面）：おり目の近くは光、外のはしは少しかげ。はしほど上へもち上がる */
  for(let x=xL;x<xf;x++){const d=(xf-x)/fwD,dd=xf-x,L=Math.round(BKLIFT*s*Math.pow(d,1.6)),y0=t0-L,y1=b0-Math.round(L*.45);
    c.globalAlpha=a;c.fillStyle=dd<=1?P.hi:dd<=3?P.lit:d>.8?P.mid:P.back;c.fillRect(x,y0,1,y1-y0);
    c.fillStyle=P.edge;c.fillRect(x,y0,1,1);c.fillRect(x,y1-1,1,1);if(x===xL&&(sp||xl>=S))c.fillRect(x,y0,1,y1-y0)}
  /* めくれた紙が、まだめくっていない紙に落とすかげ（外のはしの左） */if(sp||xl>S+D)for(let i=1;i<=2;i++){c.globalAlpha=1;c.fillStyle='rgba('+P.sh+','+([.12,.05][i-1]*s*a).toFixed(3)+')';c.fillRect(xL-i,t0,1,b0-t0)}
  c.globalAlpha=1}
/* ハードカバーの表紙：かたい板なので、まがらない。とじ目を軸に、まっすぐまわる（e＝0〜1。おもては右へちぢみ、90度をこえるとうら（見返し）が左にひろがる）。外のふちほど上へもち上がる（まっすぐな線）。板のあつみ BKTHK */
function bkHard(B,st,e,pal){const{g}=st,D=BKD,S=g.S,w=g.w,sp=B.sp,th=Math.PI*e,co=Math.cos(th),s=Math.sin(th),q=v=>Math.round(v/D)*D;
  if(st.hideL)B.L.style.visibility=e>.96?'':'hidden';st.wR.style.width=(co>0?Math.max(0,q(w*co)):0)+'px';
  const c=B.cv.getContext('2d'),O=BKLIFT,P=pal||BKC;c.clearRect(0,0,B.cv.width,B.cv.height);
  const t0=Math.round(g.top/D)+O,b0=Math.round(g.bot/D)+O,xs=Math.round(S/D),W=Math.round(w*Math.abs(co)/D),L=Math.round(BKLIFT*s),T=Math.round(BKTHK*s),dk='rgba('+P.sh+',.28)';
  if(co>0){/* おもて：上のふちが外へむかって、まっすぐ上がる */for(let i=0;i<W;i++){const l=Math.round(L*(i+1)/Math.max(1,W));if(l>0){c.fillStyle=P.edge;c.fillRect(xs+i,t0-l,1,l)}}
    /* 板のあつみ（外のふちの横の面） */for(let i=0;i<T;i++){c.fillStyle=P.edge;c.fillRect(xs+W+i,t0-L,1,b0-t0+L);c.fillStyle=dk;c.fillRect(xs+W+i,t0-L,1,b0-t0+L)}
    /* 下のページに落ちるかげ */for(let i=0;i<4&&e>0;i++){c.fillStyle='rgba('+P.sh+','+([.2,.13,.07,.03][i]*s).toFixed(3)+')';c.fillRect(xs+W+T+i,t0,1,b0-t0)}
    return}
  if(!sp||W<1)return;/* 1ページの画面では、うらはとじ目の左（画面の外）へ */
  /* うら（見返しの紙）：とじ目の近くは光、外のはしほど上へ */for(let i=0;i<W;i++){const x=xs-1-i,l=Math.round(L*(i+1)/W),y0=t0-l;
    c.fillStyle=i<=1?P.hi:i<=3?P.lit:i>W*.8?P.mid:P.back;c.fillRect(x,y0,1,b0-y0);c.fillStyle=P.edge;c.fillRect(x,y0,1,1);c.fillRect(x,b0-1,1,1)}
  for(let i=0;i<Math.max(1,T);i++){c.fillStyle=P.edge;c.fillRect(xs-W-1-i,t0-L,1,b0-t0+L)}
  for(let i=1;i<=2;i++){c.fillStyle='rgba('+P.sh+','+([.12,.05][i-1]*s).toFixed(3)+')';c.fillRect(xs-W-Math.max(1,T)-i,t0,1,b0-t0)}}
/* めくれぐあいを e0→e1 へ、ms かけて動かす。さいごに紙がおちつく3コマ（こさ .66・.33・0） */
function bkRun(B,st,e0,e1,ms,done,pal){const t0=performance.now();const step=now=>{if(!B.el.isConnected){bkClean(B,st);B.busy=0;return}
    const p=Math.min(1,(now-t0)/ms),e=e0+(e1-e0)*bkEase(p);
    bkFrame(B,st,e,1,pal);if(p<1){requestAnimationFrame(step);return}
    if(st.keep){done&&done();return}if(st.undo)st.undo(),st.undo=null;bkClean(B,st);if(!st.cover)bkMount(B,e1>=1?st.Bi:st.A);done&&done()};requestAnimationFrame(step)}
/* to のページへ。となりならめくる、遠ければ、ぱらぱら */
function bkGo(B,to,fast){const sp=B.sp;if(sp)to-=((to%2)+2)%2;const last=sp?B.N-1-((B.N-1)%2):B.N-1;to=Math.max(0,Math.min(last,to));if(to===B.at||B.busy)return;
  const red=typeof uiReduced==='function'&&uiReduced(),stp=sp?2:1,n=Math.abs(to-B.at)/stp;
  if(red){bkSnd('mpage',.3);bkMount(B,to);return}
  if(n>1&&!fast){/* あいだのページを、何まいか、ぱらぱら */const dir=to>B.at?1:-1,k=Math.min(BKRIFF,n),L=[];for(let i=1;i<=k;i++){let v=B.at+dir*Math.round(n*i/k)*stp;L.push(v)}
    const go=()=>{const v=L.shift();if(v==null)return;bkFlip(B,v,L.length?BKFAST:BKMS*.7,go,L.length>0)};go();return}
  bkFlip(B,to,fast?BKFAST:BKMS)}
function bkFlip(B,to,ms,done,riff){if(B.busy)return;B.busy=1;const from=B.at,fw=to>from;bkSnd(riff?'pflick':'mpage',riff?.22:.32,.94+Math.random()*.12);
  const st=bkSetup(B,from,to);bkRun(B,st,fw?0:1,fw?1:0,ms,()=>{B.busy=0;done&&done()})}
/* 表紙をひらく（ひらいたとき1回）・とじる（bookShut） */
function bkCoverEl(B){const cv=B.o.cover,d=el('<div class="bkp bkR bkcov"><div class="bkcl"><b></b><small></small></div></div>');d.style.setProperty('--cv',cv.c||'#7d4a3a');d.querySelector('b').textContent=cv.t||'';d.querySelector('small').textContent=cv.sub||'';return d}
function bkCovPal(B){const c=B.o.cover.c||'#7d4a3a';return Object.assign({},BKC,{back:'#d8c49b',hi:'#efe0bd',lit:'#e2d0a8',mid:'#cdb68a',edge:c})}/* 表紙のうら（見返しの紙）と、ふちは表紙の色 */
function bkCoverShow(B){/* とじた表紙をのせる（B.closed にしたく。めくるまでそのまま） */const st=bkSetup(B,0,1,bkCoverEl(B));st.cover=1;st.keep=1;B.closed=st;bkFrame(B,st,0,1,bkCovPal(B));bkMount(B,B.at)}
function bkCoverGo(B){/* 表紙をひらく（ボタン・たたく） */const st=B.closed;if(!st||B.busy)return;B.busy=1;bkSnd('bkopen',.5);bkRun(B,st,0,1,BKCOVMS,()=>{B.busy=0;B.closed=null;bkClean(B,st);bkMount(B,0)},bkCovPal(B))}
function bkCoverClose(B,after){/* もくじから前へ：表紙がかぶさって、とじる。とじた音 */if(B.busy||B.closed)return;B.busy=1;const st=bkSetup(B,0,1,bkCoverEl(B));st.cover=1;st.keep=1;bkSnd('pflick',.2);bkRun(B,st,1,0,BKCOVMS*.85,()=>{bkSnd('bkclose',.6);B.closed=st;B.busy=0;bkMount(B,B.at);after&&after()},bkCovPal(B))}
function bookShut(after){const B=BK;if(!B||!B.el.isConnected||!B.o.cover||B.busy||(typeof uiReduced==='function'&&uiReduced()))return false;
  const fin=()=>setTimeout(()=>{BKSEEN=null;after&&after()},160);if(B.closed){bkSnd('bkclose',.6);fin();return true}/* もうとじている：とじる音だけ */
  if(B.at>0){/* まん中のページなら、いったん表紙のページまで、めくりもどしてから、とじる */bkGo(B,0);const t0=performance.now(),w=()=>{if(!B.el.isConnected)return after&&after();if((B.busy||B.at!==0)&&performance.now()-t0<4000)return setTimeout(w,40);if(B.busy)return after&&after();bkCoverClose(B,fin)};setTimeout(w,40);return true}
  bkCoverClose(B,fin);return true}
/* 指でつまんでめくる：ページの外がわから、よこに引く */
function bkDrag(B){const I=B.in;let s=null;
  I.addEventListener('pointerdown',e=>{if(B.busy||e.button>0)return;const g=bkGeo(B),x=e.clientX-g.r.left,sp=B.sp,last=sp?B.N-1-((B.N-1)%2):B.N-1;let dir=0;
    if(B.closed){if(x>g.S)s={id:e.pointerId,x0:e.clientX,y0:e.clientY,dir:1,g,on:0,st:null,lx:e.clientX,lt:performance.now(),v:0,e:0,cov:1};return}/* とじた表紙：どこからでも、ひらく向きに */
    if(x>g.S+g.w*.6&&B.at<last)dir=1;else if((sp?x<g.S-g.w*.6:x<g.S+g.w*.4)&&B.at>0)dir=-1;if(!dir)return;s={id:e.pointerId,x0:e.clientX,y0:e.clientY,dir,g,on:0,st:null,lx:e.clientX,lt:performance.now(),v:0,e:0}});
  I.addEventListener('pointermove',e=>{if(!s||e.pointerId!==s.id)return;const dx=e.clientX-s.x0,dy=e.clientY-s.y0;
    if(!s.on){if(Math.abs(dx)<8||Math.abs(dx)<Math.abs(dy)*1.3||Math.sign(dx)!==-s.dir){if(Math.abs(dy)>14)s=null;return}
      s.on=1;try{I.setPointerCapture(e.pointerId)}catch(_){}B.busy=1;if(s.cov){s.st=B.closed;s.pal=bkCovPal(B)}else{const to=B.at+s.dir*(B.sp?2:1);s.to=to;s.st=bkSetup(B,B.at,to)}}
    const g=s.g,rg=B.sp?g.w*1.5:g.w*.95,u=Math.max(0,Math.min(1,-s.dir*dx/rg));s.e=s.dir>0?u:1-u;bkFrame(B,s.st,s.e,1,s.pal);
    const now=performance.now(),dt=Math.max(1,now-s.lt);s.v=(e.clientX-s.lx)/dt;s.lx=e.clientX;s.lt=now;bkSlide(Math.min(1,Math.abs(s.v)*1.2)*.5);e.preventDefault()});
  const end=e=>{if(!s||e.pointerId!==s.id)return;const q=s;s=null;if(!q.on){if(q.cov&&e.type==='pointerup')bkCoverGo(B);return}/* 表紙をたたいても、ひらく */
    if(q.cov){const go=q.e>.35||q.v<-.4;if(go)bkSnd('bkopen',.5);bkRun(B,q.st,q.e,go?1:0,Math.max(90,BKCOVMS*Math.abs((go?1:0)-q.e)),()=>{B.busy=0;if(go){B.closed=null;bkClean(B,q.st);bkMount(B,0)}},q.pal);return}const u=q.dir>0?q.e:1-q.e,go=u>.42||-q.dir*q.v>.45,e1=go===(q.dir>0)?1:0,ms=Math.max(90,BKMS*Math.abs(e1-q.e));
    if(go)bkSnd('mpage',.3,1.04);bkRun(B,q.st,q.e,e1,ms,()=>{B.busy=0})};
  I.addEventListener('pointerup',end);I.addEventListener('pointercancel',end)}
/* 紙をなでる音：ページをスクロールした・マウスでなでた速さで、こすれる音の大きさがかわる */
function bkStroke(B){let ly=null,lt=0;const on=(v)=>bkSlide(Math.min(1,v)*.35);
  for(const c of B.el.querySelectorAll('.bkc'))c.addEventListener('scroll',()=>{const now=performance.now(),y=c.scrollTop;if(ly!=null&&now-lt<200)on(Math.abs(y-ly)/Math.max(1,now-lt)*.8);ly=y;lt=now},{passive:true});
  B.in.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||!e.buttons||B.busy)return;on(Math.hypot(e.movementX||0,e.movementY||0)/12)})}
function bkSlide(v){/* こすれる音（pslide）をつづけて鳴らし、大きさを v（0〜1）にする。とだえたら、すっと消える */if(typeof AC==='undefined'||!AC||AC.state!=='running'||!SND.sfx)return;const L=(SBUF.pslide||[]).filter(Boolean);if(!L.length)return;const t=AC.currentTime;
  if(!BKSLIDE){const src=AC.createBufferSource(),g=AC.createGain();src.buffer=L[0];src.loop=true;g.gain.value=0;src.connect(g);g.connect(sfxG);src.start(t,Math.random()*src.buffer.duration);BKSLIDE={src,g,tm:0}}
  const S0=BKSLIDE;S0.g.gain.setTargetAtTime(v*SFXV,t,.04);clearTimeout(S0.tm);S0.tm=setTimeout(()=>{if(BKSLIDE!==S0)return;BKSLIDE=null;try{S0.g.gain.setTargetAtTime(0,AC.currentTime,.08);S0.src.stop(AC.currentTime+.5)}catch(_){}},140)}
/* よこ・たての画面がかわったら、本を作りなおす（見開き ⇔ 1ページ） */
let BKRSZ=0;addEventListener('resize',()=>{const B=BK;if(!B||!B.el.isConnected)return;bkEdge(B);clearTimeout(BKRSZ);BKRSZ=setTimeout(()=>{const B=BK;if(!B||!B.el.isConnected||B.busy)return;const c=B.R.querySelector('.bkc');if((bkSpread()!==B.sp||Math.abs(c.clientHeight-B.ch)>2||Math.abs(c.clientWidth-B.cw)>2)&&typeof renderSheet==='function'&&typeof sheet!=='undefined'&&sheet)renderSheet()},200)});/* 画面の大きさがかわったら、ページをわけなおす */
/* 章をかえる（図鑑のしおり）：いまのページを写しておき（bkTabSnap）、作りなおした本で、ぱらぱらとめくって見せる（bkEnter） */
let BKSNAP=null;
function bkTabSnap(dir){const B=BK;BKSNAP=null;if(!B||!B.el.isConnected||B.busy||(typeof uiReduced==='function'&&uiReduced()))return;const cl=s=>{const c=bkClone(s);c.hidden=false;c.style.visibility='';return c};BKSNAP={key:B.o.key,dir,R:cl(B.R),L:B.sp?cl(B.L):null,sc:B.R.querySelector('.bkc').scrollTop}}
function bkEnter(B){const Q=BKSNAP;BKSNAP=null;if(!Q||Q.key!==B.o.key||!!Q.L!==B.sp)return;B.busy=1;const g=bkGeo(B),cv=B.cv,r=g.r;
  cv.width=Math.ceil(r.width/BKD);cv.height=Math.ceil(r.height/BKD)+BKLIFT*2;cv.style.width=cv.width*BKD+'px';cv.style.height=cv.height*BKD+'px';cv.style.top=-BKLIFT*BKD+'px';cv.hidden=false;
  const wrap=(slot,c)=>{const w=document.createElement('div');w.className='bkwrap';const s=slot.getBoundingClientRect();w.style.cssText='left:'+(s.left-r.left)+'px;top:'+(s.top-r.top)+'px;height:'+s.height+'px;width:'+s.width+'px';c.classList.add('bksnap');c.style.width=s.width+'px';c.style.height=s.height+'px';w.appendChild(c);B.in.insertBefore(w,B.cv);return w};
  const fw=Q.dir>0;let st;
  if(fw){st={g,fw,wR:wrap(B.R,Q.R),wL:Q.L?wrap(B.L,Q.L):null,keep:0,cover:1};const c=Q.R.querySelector('.bkc');if(c)c.scrollTop=Q.sc}
  else{/* もどる向き：下には前の章の写し、上に新しい章（切りとって、ひろがってくる） */const nR=bkClone(B.R),nL=B.sp?bkClone(B.L):null,put=(slot,src)=>{slot.dataset.real='1';slot.__keep=[...slot.childNodes];slot.replaceChildren(...[...src.childNodes].map(n=>bkClone(n)))};put(B.R,Q.R);if(B.sp)put(B.L,Q.L);
    st={g,fw,wR:wrap(B.R,nR),wL:nL?wrap(B.L,nL):null,cover:1,undo:()=>{for(const s of[B.R,B.L])if(s.__keep){s.replaceChildren(...s.__keep);s.__keep=null}}}}
  [0,70,140].forEach((d,i)=>setTimeout(()=>bkSnd('pflick',.16+i*.03,.95+i*.05),d));
  bkRun(B,st,fw?0:1,fw?1:0,BKMS*.8,()=>{if(st.undo)st.undo();B.busy=0})}

/* 本の紙のたば（ページの下と外がわ）：1まいずつの紙のふちを、奥ほど少しずつずらしてかさねる。紙ごとに色が少しちがい、数まいごとにすきまのかげ、
   とじ目に近い所は紙がとじ目へまるくしずむ。奥ほど暗い。いちばん奥にふちの線。1ドット BKD のキャンバス（ページのうしろ） */
function bkEdge(B){if(!B||!B.el.isConnected)return;bkSpine(B);const r=B.in.getBoundingClientRect();
  for(const[slot,n,dir,key]of[[B.R,B.thR||1,1,'eR'],[B.L,B.sp?(B.thL||1):0,-1,'eL']]){let cv=B[key];if(!n||slot.hidden){if(cv)cv.hidden=true;continue}
    if(!cv){cv=B[key]=document.createElement('canvas');cv.className='bkedge';cv.setAttribute('aria-hidden','true');B.in.insertBefore(cv,B.in.querySelector('.bkp'))}cv.hidden=false;
    const s=slot.getBoundingClientRect(),W=Math.round(s.width/BKD),H=Math.round(s.height/BKD),ox=Math.ceil(n*.6)+2,CW=W+ox,CH=H+n+2;cv.width=CW;cv.height=CH;
    cv.style.width=CW*BKD+'px';cv.style.height=CH*BKD+'px';cv.style.top=(s.top-r.top)+'px';cv.style.left=(dir>0?s.left-r.left:s.left-r.left-ox*BKD)+'px';
    const c=cv.getContext('2d');c.clearRect(0,0,CW,CH);c.save();if(dir<0){c.translate(CW,0);c.scale(-1,1)}
    const P=['#f4e8cb','#efe2c2','#e8d9b6','#f1e5c8','#e2d1a9'],hs=k=>{const x=Math.sin(k*91.7+n*3.1)*43758.5;return x-Math.floor(x)},mix=(a,b,t)=>{const A=parseInt(a.slice(1),16),Bc=parseInt(b.slice(1),16),f=(s)=>Math.round(((A>>s)&255)*(1-t)+((Bc>>s)&255)*t);return'rgb('+f(16)+','+f(8)+','+f(0)+')'};
    for(let k=n;k>=1;k--){const dx=Math.floor(k*.6),dy=k,t=k/(n+1)*.38,gap=k%3===0,col=mix(gap?'#d6c197':P[Math.floor(hs(k)*P.length)],'#a88a5a',t),jit=hs(k+7)<.35?1:0;
      c.fillStyle=col;c.fillRect(dx,dy,W-jit,H);/* 紙1まい */
      const cr=Math.min(14,W>>2);for(let x=0;x<cr;x++){const u=Math.round(Math.pow(1-x/cr,2)*k*.55);if(u>0){c.clearRect(dx+x,dy+H-u,1,u)}}/* とじ目の近くは、紙のはしがまるくしずむ */}
    c.fillStyle='#9a7a4c';const dx=Math.floor((n+1)*.6),dy=n+1;c.fillRect(dx,dy+H-1,W,1);c.fillRect(dx+W-1,dy,1,H);/* いちばん奥のふち */
    for(let x=0;x<Math.min(14,W>>2);x++){const u=Math.round(Math.pow(1-x/Math.min(14,W>>2),2)*(n+1)*.55);c.clearRect(dx+x,dy+H-1-u,1,u+1);c.fillRect(dx+x,dy+H-1-u,1,1)}
    c.restore()}}

/* 見出し・日づけのマスキングテープ：字から色（4しゅるい）と、ななめの向きをきめる（同じ字はいつも同じテープ） */
function bkTapes(pages){for(const pg of pages)for(const t of pg.querySelectorAll('.mtt,.tape,:scope>.sec>h3')){let h=0;for(const ch of t.textContent)h=(h*31+ch.charCodeAt(0))>>>0;t.style.backgroundImage='var(--tp'+(h%4)+((h>>2)&1?'u':'d')+')'}}

/* ページわけ：ページの中身を右のスロットに入れて、はみ出したら、うしろの物からつぎのページへうつす（節・一覧・リストは中をわける）。map：もとのページ→わけたあとのページ */
/* 絵日記のページ：絵と文が1ページに入るように、絵をちぢめる（できごとなど .dyMore は、入らなければつぎのページへ） */
function bkFitPic(pg,over){if(!pg.classList||!pg.classList.contains('mdy')||!pg.querySelector('.dyTx'))return;const f=pg.querySelector('.dyph');if(!f)return;f.style.width='';
  const more=pg.querySelector(':scope>.dyMore'),nx=more&&more.nextSibling;if(more)more.remove();
  for(let k=0;k<20&&over();k++){const w=f.getBoundingClientRect().width*.9;if(w<72)break;f.style.width=Math.round(w)+'px'}
  if(more)pg.insertBefore(more,nx)}
function bkPaginate(B,pages){const c=B.R.querySelector('.bkc'),store=B.el.querySelector('.bkstore'),out=[],map=[],over=()=>c.scrollHeight>c.clientHeight+1;B.ch=c.clientHeight;B.cw=c.clientWidth;B.el.style.setProperty('--pgh',B.ch+'px');/* 写真などは、ページの高さにおさまる大きさ（--pgh） */
  const inner=el=>{if(!el.children.length)return null;const sh=el.cloneNode(false);while(over()){const last=el.lastElementChild;if(!last)break;if(el.children.length>1){sh.prepend(last);continue}const q=inner(last);if(!q)break;sh.prepend(q)}return sh.children.length?sh:null};
  pages.forEach((pg,i)=>{map[i]=out.length;let cur=pg;for(let k=0;k<40&&cur;k++){c.replaceChildren(cur);cur.hidden=false;let nx=null;bkFitPic(cur,over);
      if(over()){nx=cur.cloneNode(false);while(over()){const last=cur.lastElementChild;if(!last)break;if(cur.children.length>1){nx.prepend(last);continue}const q=inner(last);if(!q)break;nx.prepend(q)}if(!nx.children.length)nx=null}
      out.push(cur);cur=nx}});
  c.replaceChildren();for(const pg of out)store.appendChild(pg);return{pages:out,map}}

/* とじ目（背表紙）のまわり：ひらいた本のまん中の形。紙の上と下のふちは、とじ目へまるくしずみ（上はさがる・下はあがる）、紙のたばもそれにそう。
   1ページの画面では、左に見切れたとなりのページも描く（よんだページのたば・とじ目のかげ）。表紙の板は、とじ目の下でまるくふくらむ（背）。1ドット BKD のキャンバス */
function bkSpine(B){const r=B.in.getBoundingClientRect(),s=B.R.getBoundingClientRect(),sp=B.sp,D=BKD;let cv=B.spc;
  if(!cv){cv=B.spc=document.createElement('canvas');cv.className='bkspine';cv.setAttribute('aria-hidden','true');B.in.appendChild(cv)}
  const WL=sp?18:Math.round(72/D),WR=18,top=8,stk=(B.thR||1)+3,H=Math.round(s.height/D),CW=WL+WR,CH=top+H+stk+8,sx=WL,py0=top,py1=top+H;
  cv.width=CW;cv.height=CH;cv.style.width=CW*D+'px';cv.style.height=CH*D+'px';cv.style.left=(s.left-r.left-WL*D)+'px';cv.style.top=(s.top-r.top-top*D)+'px';
  const c=cv.getContext('2d'),cvc=getComputedStyle(B.el).getPropertyValue('--cv').trim()||'#a5352e',K=14,dip=d=>d>=K?0:Math.round(4*Math.pow(1-d/K,2)),rise=d=>d>=K?0:Math.round(3*Math.pow(1-d/K,2));
  c.clearRect(0,0,CW,CH);const closed=B.el.classList.contains('bkcovon');
  const paper='#f3e5c5',edge='#d4bb8a',Lc=['#f4e8cb','#e8d9b6','#efe2c2','#d6c197','#e2d1a9'];
  /* 左のページ（1ページの画面だけ：見切れたとなりのページ） */
  if(!sp&&!closed){const at0=B.at===0,n=at0?0:Math.max(2,B.thL||Math.min(10,1+Math.round(13*B.at/Math.max(1,B.N-1))));
    for(let k=n;k>=1;k--){c.fillStyle=Lc[k%Lc.length];for(let x=0;x<sx;x++){const d=sx-1-x,t=py0+dip(d),b=py1-rise(d)+k;c.fillRect(x,t+k,1,b-(t+k)+1)}}/* よんだページのたば */
    for(let x=0;x<sx;x++){const d=sx-1-x,t=py0+dip(d),b=py1-rise(d);c.fillStyle=at0?'#d8c49b':paper;c.fillRect(x,t,1,b-t);c.fillStyle=at0?'#b9a274':edge;c.fillRect(x,t,1,1);c.fillRect(x,b-1,1,1)}/* はじめのページの左は表紙のうら（見返し） */
    if(!at0){c.fillStyle='rgba(122,90,48,.05)';for(let i=0;i<40;i++){const x=(i*37)%sx,y=py0+6+((i*53)%(H-12));c.fillRect(x,y,1,1)}}
    for(let i=0;i<7;i++){c.fillStyle='rgba(74,46,22,'+[.22,.16,.12,.08,.05,.03,.015][i]+')';for(let y=py0;y<py1;y++){const x=sx-1-i;const d=i;if(y>=py0+dip(d)&&y<py1-rise(d))c.fillRect(x,y,1,1)}}/* とじ目へ落ちるかげ */}
  /* とじ目のまわりの、ページの上と下：とじ目へまるくしずむ（上は板の色でけずる・下は紙のたばの色） */
  const sides=sp?[[1,sx],[-1,sx-1]]:[[1,sx]];
  for(const[dir,x0]of sides){for(let i=0;i<(dir>0?WR:WL);i++){const x=x0+dir*i,d=i,u=dip(d),v=rise(d);
      if(u){c.fillStyle=cvc;c.fillRect(x,py0,1,u);c.fillStyle='rgba(0,0,0,.18)';c.fillRect(x,py0,1,u);c.fillStyle=edge;c.fillRect(x,py0+u,1,1)}
      if(v){c.fillStyle=Lc[1];c.fillRect(x,py1-v,1,v);c.fillStyle='#c9ad80';c.fillRect(x,py1-v,1,1)}}}
  /* 背：表紙の板が、とじ目の下でまるくふくらむ */
  {const bw=9,by=py1+stk+1;for(let i=-bw;i<=bw;i++){const h=Math.round(3*Math.sqrt(Math.max(0,1-(i/bw)*(i/bw))));if(!h)continue;c.fillStyle=cvc;c.fillRect(sx+i,by,1,h);c.fillStyle='rgba(0,0,0,.22)';c.fillRect(sx+i,by+h-1,1,1)}
    c.fillStyle='rgba(255,255,255,.18)';c.fillRect(sx-3,by,2,1)}}
