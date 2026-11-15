/* ---------- 魚のしゅるい ----------
   つれる魚は、ステージ（w）・水（at：river 川＝マップのはしにつながる水、pond 池＝それいがいの水、onsen 温泉）・時間（tm：any いつでも、day 昼 6〜17時、eve 夕方 17〜20時、night 夜 20〜6時）・雨（rain：雨の日だけ、rainday：雨の日は昼も）できまる。
   魚は食べ物（FOODS、fish:1）。料理の材料の「さかな」（need の fish）は、どの魚でもよい（needR）。
   つった魚は、ステージごとに数える（S.fishRec）。図鑑の「さかな」に、つった魚だけ出す。 */
const FISHI={
 funa:{w:0,at:'pond',tm:'any'},koi:{w:0,at:'pond',tm:'day'},nijimasu:{w:0,at:'river',tm:'day'},yumasu:{w:0,at:'river',tm:'eve'},namazu:{w:0,at:'river',tm:'night',rain:'day'},dojo:{w:0,at:'pond',tm:'any',rain:'only'},
 iwana:{w:1,at:'river',tm:'any'},yamame:{w:1,at:'river',tm:'day'},ayu:{w:1,at:'river',tm:'eve'},unagi:{w:1,at:'river',tm:'night'},yuami:{w:1,at:'onsen',tm:'any'},akahara:{w:1,at:'pond',tm:'any',rain:'only'}};
const FISHK=Object.keys(FISHI),FISHBASE={0:{pond:'funa',river:'nijimasu'},1:{pond:'akahara',river:'iwana',onsen:'yuami'}};
const FISHAT={river:'川',pond:'池',onsen:'温泉'},FISHTM={any:'いつでも',day:'昼',eve:'夕方',night:'夜'};
const isFish=k=>!!FOODS[k]&&!!FOODS[k].fish;
const fishWhen=k=>{const f=FISHI[k];if(!f)return '';return FISHAT[f.at]+'・'+(f.rain==='only'?'雨の日':FISHTM[f.tm]+(f.rain==='day'?'（雨の日は昼も）':''))};
let WKM=null,WKS=null;
function waterKind(w){/* 水のマス w は、川・池・温泉のどれか（水がかわったら作りなおす） */if(w<0||S.ground[w]!==1)return 'pond';if(typeof hotW==='function'&&hotW(w))return 'onsen';
  if(WKS!==S||!WKM||WKM.n!==S.ground.length||WKM.h!==fishWaterHash()){WKS=S;WKM={n:S.ground.length,h:fishWaterHash(),k:new Uint8Array(W*H)}}
  const M=WKM.k;if(!M[w]){const comp=[],q=[w],seen=new Set([w]);let edge=false;while(q.length){const k=q.pop();comp.push(k);const x=k%W,y=(k/W)|0;if(x===0||y===0||x===W-1||y===H-1)edge=true;for(const n of[x>0?k-1:-1,x<W-1?k+1:-1,k-W,k+W]){if(n<0||n>=W*H||seen.has(n)||S.ground[n]!==1)continue;seen.add(n);q.push(n)}}for(const k of comp)M[k]=edge?1:2}
  return M[w]===1?'river':'pond'}
function fishWaterHash(){let h=0,c=0;for(let j=0;j<S.ground.length;j++)if(S.ground[j]===1){h=(h*31+j)|0;c++}return c+':'+h}
function fishTime(){const h=hour();return h>=6&&h<17?'day':h>=17&&h<20?'eve':'night'}
function fishOK(k,at,tm,rain){const f=FISHI[k];if(f.at!==at)return false;if(f.rain==='only')return rain;if(f.tm==='any')return true;if(f.tm===tm)return true;return f.rain==='day'&&rain&&tm==='day'}
function fishPick(stand){/* その場所・いまの時間・天気でつれる魚 */const w=typeof fishW==='function'?fishW(stand):-1,at=waterKind(w),tm=fishTime(),rain=!!S.rain,st=WD===1?1:0;
  const L=FISHK.filter(k=>FISHI[k].w===st&&fishOK(k,at,tm,rain));if(L.length)return pick(L);const b=FISHBASE[st];return b[at]||b.river}
function fishGot(k){/* つった魚を数える（図鑑） */const R=S.fishRec||(S.fishRec={});R[k]=(R[k]||0)+1;(S.seenIt||(S.seenIt={}))['f:'+k]=1}
function needR(R,r){/* 料理の材料（「さかな」は、どの魚でもよい）：持っている魚・とりかけの魚があれば、その魚。なければ、いちばん多い魚 */if(!R||!R.need||!R.need.fish)return R?R.need:{};const o={};for(const k in R.need)if(k!=='fish')o[k]=R.need[k];
  let sp=null;const held=r&&r.cing&&r.cing.rec===R.out&&r.cing.nd?r.cing.nd:r&&r.cgot&&r.cgot.rec===R.out?r.cgot.m:null;if(held)for(const k in held)if((k==='fish'||isFish(k))&&held[k]>0){sp=k;break}
  if(!sp){let bn=0;for(const k of ['fish',...FISHK]){const n=S.fs[k]||0;if(n>bn){bn=n;sp=k}}}
  o[sp||'fish']=R.need.fish;return o}
const fshade=(h,k)=>{const n=parseInt(h.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(k>1?v+(255-v)*(k-1):v*k)));return '#'+[n>>16,n>>8&255,n&255].map(v=>f(v).toString(16).padStart(2,'0')).join('')};/* いつも #rrggbb をかえす */
/* ---- 絵（36×36 のドット。1ドット4で144に。形・色・もようから描く） ---- */
function pxGrid(){const N=36,G=new Array(N*N).fill(null);return {N,G,set(x,y,c){x|=0;y|=0;if(x>=0&&y>=0&&x<N&&y<N)G[y*N+x]=c},get(x,y){return x>=0&&y>=0&&x<N&&y<N?G[y*N+x]:null}}}
function pxEllipse(g,cx,cy,rx,ry,f){for(let y=0;y<g.N;y++)for(let x=0;x<g.N;x++){const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry;if(dx*dx+dy*dy<=1)g.set(x,y,f(x,y,dx,dy))}}
function pxPoly(g,P,f){for(let y=0;y<g.N;y++)for(let x=0;x<g.N;x++){const px=x+.5,py=y+.5;let ins=false;for(let i=0,k=P.length-1;i<P.length;k=i++){const[xi,yi]=P[i],[xk,yk]=P[k];if((yi>py)!==(yk>py)&&px<(xk-xi)*(py-yi)/(yk-yi)+xi)ins=!ins}if(ins)g.set(x,y,f(x,y))}}
function pxOutline(g){/* ふちの外がわに、となりの色より少し暗い色の1ドット */const add=[];for(let y=0;y<g.N;y++)for(let x=0;x<g.N;x++){if(g.get(x,y))continue;let c=null;for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]]){const q=g.get(x+a,y+b);if(q&&q!=='#ffffff'){c=q;break}}if(c)add.push([x,y,fshade(c,.7)])}for(const[x,y,c]of add)g.set(x,y,c)}
function pxURL(key,g){if(GICON['fs:'+key])return GICON['fs:'+key];const c=document.createElement('canvas');c.width=c.height=144;const x=c.getContext('2d');for(let j=0;j<g.N;j++)for(let i=0;i<g.N;i++){const q=g.G[j*g.N+i];if(!q)continue;x.fillStyle=q;x.fillRect(i*4,j*4,4,4)}const u=c.toDataURL();c.width=c.height=0;return GICON['fs:'+key]=u}
const FSPEC={/* 形：L 長さの半分・h 高さの半分・cx まん中。色：c 体・b おなか・p もよう（stripe 帯・spot 点・wspot 白い点・patch まだら・gill えらの点）・wh ひげ・fin ひれの色 */
 funa:{L:11,h:6.5,c:'#b7ae84',b:'#ddd5ae'},koi:{L:12,h:6,c:'#f1a36e',b:'#f7d2b2',p:'patch',pc:'#fbf3e6'},nijimasu:{L:12.5,h:5.5,c:'#a9bccd',b:'#e3e9ee',p:'stripe',pc:'#eaa3a3',sp:1},yumasu:{L:12,h:5.5,c:'#f0ad8a',b:'#f8dcc8',p:'stripe',pc:'#f5c96f'},
 namazu:{L:12.5,h:5,c:'#a3a98a',b:'#d8dac4',wh:1,flat:1},dojo:{L:14,h:2.6,c:'#bda27c',b:'#dccaa6',wh:1,long:1,p:'spot',pc:'#9f8662'},
 iwana:{L:12,h:5.5,c:'#9eab92',b:'#dfe3cf',p:'wspot',pc:'#f1f1e4'},yamame:{L:12,h:5.5,c:'#b3bfcc',b:'#e8ecef',p:'spot',pc:'#8e9db0'},ayu:{L:12,h:5,c:'#c4cba1',b:'#ecefd8',p:'gill',pc:'#f2d36a'},
 unagi:{L:15.5,h:2.4,c:'#8d9aa3',b:'#cfd6da',long:1},yuami:{L:8,h:5.5,c:'#f1bfa9',b:'#fae0d3',small:1},akahara:{L:11.5,h:6,c:'#b8a58e',b:'#e7967c'},fish:{L:12,h:6,c:'#a9bccd',b:'#e3e9ee'}};
function fishGrid(k){const F=FSPEC[k],g=pxGrid(),cx=F.small?19:18,cy=18,L=F.L,h=F.h,c=F.c,hi=fshade(c,1.18),dk=fshade(c,.86),fin=F.fin||fshade(c,.93);
  /* しっぽ */const tx=cx-L+1;if(F.long){pxPoly(g,[[tx+1,cy-h*.9],[tx-3,cy-h*1.2],[tx-3,cy+h*1.2],[tx+1,cy+h*.9]],()=>fin)}else pxPoly(g,[[tx+1.5,cy],[tx-4.5,cy-h*.95],[tx-3,cy],[tx-4.5,cy+h*.95]],(x,y)=>y<cy?fin:dk);
  /* せびれ・はらびれ */if(!F.long){pxPoly(g,[[cx-3,cy-h+.6],[cx+1,cy-h-2.6],[cx+3,cy-h+.4]],()=>fin);pxPoly(g,[[cx-1,cy+h-.6],[cx+1,cy+h+2],[cx+3,cy+h-.6]],()=>dk)}
  /* からだ */pxEllipse(g,cx,cy,L,h,(x,y,dx,dy)=>{if(F.long&&dx<-.92)return null;const by=dy>.25?F.b:dy<-.55?dk:c;let q=by;if(dy<-.15&&dy>-.5&&dx>-.6&&dx<.55)q=dy<-.3?hi:q;/* 光 */return q});
  /* もよう */if(F.p==='stripe'){for(let x=Math.ceil(cx-L+3);x<cx+L-4;x++){g.set(x,cy,F.pc);if(F.sp)g.set(x,cy+1,F.pc)}}
  if(F.p==='spot'||F.p==='wspot'){const P=F.long?[[cx-8,cy-1],[cx-4,cy],[cx,cy-1],[cx+4,cy],[cx-6,cy+1]]:[[cx-6,cy-2],[cx-2,cy-3],[cx+2,cy-2],[cx-4,cy+1],[cx,cy]];for(const[x,y]of P)g.set(x,y,F.pc)}
  if(F.p==='patch'){for(const[x,y]of[[cx-4,cy-3],[cx-3,cy-3],[cx-4,cy-2],[cx+2,cy-1],[cx+3,cy-1],[cx+3,cy],[cx-2,cy+1],[cx-1,cy+1]])g.set(x,y,F.pc)}
  if(F.p==='gill'){g.set(cx+3,cy-1,F.pc);g.set(cx+4,cy-1,F.pc);g.set(cx+3,cy,F.pc)}
  /* えら */if(!F.long){const gx=cx+L-6;for(let y=Math.ceil(cy-h*.55);y<cy+h*.55;y++)if(g.get(gx,y))g.set(gx,y,fshade(g.get(gx,y),.88))}
  /* 目 */const ex=Math.round(cx+L-(F.long?3:F.small?3.5:4)),ey=Math.round(cy-(F.long?1:F.flat?1:2));g.set(ex,ey,'#5b4a3e');g.set(ex+1,ey,'#5b4a3e');g.set(ex,ey+1,'#5b4a3e');g.set(ex+1,ey+1,'#5b4a3e');g.set(ex,ey,'#ffffff');
  /* ひげ */if(F.wh){const mx=Math.round(cx+L-1),my=cy+1;for(let i=0;i<4;i++){g.set(mx+i,my+1+(i>1?1:0),'#8a7860')}for(let i=0;i<3;i++)g.set(mx+i,my-1-i*0+(i>1?-1:0),'#8a7860')}
  pxOutline(g);return g}
function dishGrid(k){const g=pxGrid(),plate=()=>{pxEllipse(g,18,24,14,5,(x,y,dx,dy)=>dy<-.1?'#f6f1e6':dy<.5?'#ece4d4':'#d8ccb8')};
  if(k==='marine'){plate();for(const[x,y,w]of[[10,20,5],[15,19,6],[21,20,5]]){for(let i=0;i<w;i++){g.set(x+i,y,'#f6c2b0');g.set(x+i,y+1,'#ee9f88');g.set(x+i,y+2,'#e88c76')}}for(const[x,y]of[[9,22],[10,23],[26,22],[25,23],[18,22],[13,23],[22,23]])g.set(x,y,'#9cc47a');g.set(16,18,'#f2e3a0');g.set(20,18,'#f2e3a0')}
  if(k==='kushiyaki'){const f=fishGrid('funa');for(let i=0;i<f.G.length;i++)if(f.G[i]){const x=i%36,y=(i/36)|0;g.set(x,y,f.G[i]===FSPEC.funa.c?'#d9a473':f.G[i]===FSPEC.funa.b?'#ead0a8':f.G[i])}for(const x of[14,18,22])for(let y=13;y<24;y++)if(g.get(x,y))g.set(x,y,'#9a6a42');for(let y=7;y<31;y++){g.set(17,y,'#d7b07c');g.set(18,y,y%5===0?'#c49a66':'#e2bf8c')}}
  if(k==='foil'){plate();pxPoly(g,[[6,22],[10,14],[26,13],[31,21],[28,25],[8,25]],(x,y)=>y<16?'#f2f5f8':y<19?'#dfe4ea':(x+y)%5===0?'#c7ced6':'#d3d9e0');for(const[x,y]of[[12,16],[17,15],[22,16],[27,18]])g.set(x,y,'#ffffff');for(let i=0;i<3;i++){g.set(14+i*4,9-i,'#ffffff');g.set(15+i*4,8-i,'#ffffff')}}
  if(k==='fishsoup'){pxEllipse(g,18,21,14,4,(x,y,dx,dy)=>dy<-.3?'#e9cf8f':'#e3c27a');pxPoly(g,[[4,21],[32,21],[28,30],[8,30]],(x,y)=>y<=21?null:y<26?'#d8b386':'#c49d70');pxEllipse(g,18,20.5,12.5,2.6,(x,y,dx,dy)=>'#efd69c');for(const[x,y]of[[13,20],[14,20],[15,21],[21,20],[22,20]])g.set(x,y,'#f3b8a2');for(const[x,y]of[[18,20],[24,21],[10,21]])g.set(x,y,'#9cc47a');for(let i=0;i<3;i++){g.set(12+i*6,15-i%2,'#ffffff');g.set(13+i*6,14-i%2,'#ffffff')}}
  if(k==='kabayaki'){plate();pxPoly(g,[[8,17],[28,16],[29,22],[9,23]],(x,y)=>y<18?'#d8994f':(x%5===0?'#8f5a2c':'#b97a40'));for(let x=10;x<28;x+=5){g.set(x+1,18,'#e9b36c');g.set(x+2,18,'#e9b36c')}}
  pxOutline(g);return g}
for(const k in FSPEC){if(k==='fish')continue;const u=pxURL(k,fishGrid(k));ICONS[k]=u;const im=new Image();im.onload=()=>{im.ok=1;dirty=true};im.src=u;ICI[k]=im}
for(const k of['marine','kushiyaki','foil','fishsoup','kabayaki']){const u=pxURL(k,dishGrid(k));ICONS[k]=u;const im=new Image();im.onload=()=>{im.ok=1;dirty=true};im.src=u;ICI[k]=im}
function fishZukan(d,add){/* 図鑑の「さかな」：つった魚だけ */const R=d.fishRec||{};for(const k of FISHK){if(!(R[k]>0))continue;const F=FOODS[k];add(F.name,fishWhen(k)+'・おなか'+F.v+(F.fx?'・'+F.fx:'')+'・つった数 '+R[k],ICONS[k]||null)}}
