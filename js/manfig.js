/* ひでんのしょの図（manfig.js）：ゲームのドット絵（チップ・せいれい・コワイノ）を、ページの上にならべた小さな場面。
   MANFIG[項目の名前] = [はば（マス）, 高さ（マス）, 地面, ならべる物]。地面：'g' 草地・'d' あれ地・'f' 床・'n' 夜の草地・'s' 空だけ。
   ならべる物：['o',家具のid,x,y]・['c',チップ,x,y]・['s',属性,x,y,{姿勢}]・['e',コワイノ,x,y,向き]・['a',x0,y0,x1,y1] 矢じるし・['b',x0,y0,x1,y1] 点線のかこみ・
   ['l',x,y] 光の柱・['m',月の形 0〜1]・['r'] 雨・['f'] 霧・['t'] 星・['w'] 風。x・y はマス（左上が0。せいれい・コワイノは足もと）。
   1マスは64ドット（ゲームの2倍の細かさ）のキャンバスに描き、画面では1:1で出す（ちぢめない）。絵がまだ読みこめていなければ、あとでもう1回。
   見た目だけ。まだ出会っていない項目の図は出さない（manMet）。 */
const MANFIG={
  'あそびかた':[4,2,'g',[['c','story:stump',1.5,0],['s','wood',.6,1.7,{mood:'joy'}],['s','fire',3.3,1.6,{anim:'wave'}],['s','water',2.4,1.9,{mood:'joy'}],['o','clover',0,1],['o','bellf',3.2,.4]]],
  'おなか':[4,2,'f',[['o','crate',1,.6],['s','wood',2.2,1.6,{anim:'eat'}],['s','earth',.5,1.7,{}]]],
  'たのしさ':[4,2,'g',[['o','swing',1,.2],['s','wind',1.6,1.6,{mood:'joy',banzai:1}],['o','sandbox',2.8,1]]],
  'つかれ':[4,2,'f',[['o','bed',1,.4],['s','water',2.6,1.8,{sleep:1,sitF:1}]]],
  '住み心地':[4,2,'f',[['o','bed',0,.3],['o','table',1.5,.8],['o','chair',2.6,.8],['o','candle',3.3,.3]]],
  '木':[4,2,'g',[['o','tree',.6,0],['s','wood',2.3,1.7,{mood:'joy'}],['o','clover',3,1]]],
  '水':[4,2,'g',[['c','farm:15',1.6,1],['c','farm:15',2.6,1],['s','water',1,1.8,{}]]],
  '火':[4,2,'n',[['s','fire',1.2,1.7,{mood:'joy'}],['e','basic',2.9,1.8,-1],['a',1.9,1.2,2.4,1.2]]],
  '土':[4,2,'g',[['o','fence',1.4,1],['o','fence',2.4,1],['s','earth',1,1.85,{}]]],
  '風':[4,2,'g',[['c','drop:eda',2.2,1.1],['c','drop:eda',3,.6],['s','wind',1.1,1.7,{mood:'joy'}],['a',1.6,1.3,2.1,1.3]]],
  'みんな':[4,2,'g',[['s','wood',.5,1.7,{mood:'joy'}],['s','water',1.25,1.8,{}],['s','fire',2,1.7,{anim:'wave'}],['s','earth',2.75,1.8,{}],['s','wind',3.5,1.7,{mood:'joy'}]]],
  '【ダイニング家具】':[4,2,'f',[['o','table',1,.6],['o','chair',.2,.7],['o','chair',2.5,.7]]],
  '【料理家具】':[4,2,'f',[['o','cooktable',.5,.4],['o','oven',2.2,.2]]],
  '【あかり】':[4,2,'n',[['o','candle',.6,.6],['o','lantern',1.8,.4],['o','campfire',2.9,.8]]],
  '【庭の家具】':[4,2,'g',[['o','bench',.8,.6],['o','clover',2.6,1],['o','salvia',3.2,.6]]],
  '【あそび道具】':[4,2,'g',[['o','swing',.4,.2],['o','sandbox',2.4,.8]]],
  '畑とたね':[4,2,'d',[['c','farm:15',.6,1],['c','farm:15',1.6,1],['c','farm:15',2.6,1],['s','earth',3.5,1.8,{}]]],
  'ベッド':[4,2,'f',[['o','bed',1.4,.3]]],
  'かまど':[4,2,'f',[['o','oven',1.4,.2]]],
  '調理台':[4,2,'f',[['o','cooktable',1.4,.3]]],
  '加工':[4,2,'f',[['o','loom',1.2,.2],['s','wind',3,1.8,{}]]],
  '飼う生き物':[4,2,'g',[['o','coop',.8,.1],['c','ani:hane#0',2.8,1]]],
  '水浴び':[4,2,'f',[['o','tub',1.4,.4]]],
  'あかり':[4,2,'n',[['o','lantern',1.5,.5],['s','wood',2.6,1.8,{sleep:1,sitF:1}]]],
  'スポット':[4,2,'g',[['o','bench',.6,.7],['o','clover',2.2,1],['o','bellf',2.9,.6],['b',.4,.5,3.6,1.9]]],
  'せいれいパワー':[4,2,'g',[['o','statue',1.2,0],['s','wood',.4,1.8,{mood:'joy'}],['s','water',3.4,1.8,{mood:'joy'}]]],
  '依頼ボード':[4,2,'g',[['o','board',1,.6],['s','earth',3.3,1.8,{}]]],
  'なかまを呼ぶ':[4,2,'g',[['o','statue',1.2,0],['s','wind',3.3,1.8,{mood:'joy',banzai:1}]]],
  '「コワイノ」':[4,2,'n',[['e','basic',.8,1.8,1],['e','fast',2,1.5,1],['e','thief',3.2,1.85,-1],['a',2,1.9,2,1.1]]],
  '見張り台':[4,3,'n',[['o','watch',.4,.6],['e','basic',3.2,2.8,-1],['a',1.4,1.4,2.8,2.4]]],
  'たたかう':[4,2,'n',[['s','fire',1.4,1.7,{mood:'joy'}],['e','basic',2.6,1.8,-1]]],
  'まもりの光':[4,2,'n',[['e','basic',2,1.8,1],['l',2.5,1.8]]],
  '直す':[4,2,'g',[['o','fence',1.4,1],['o','fence',2.4,1],['s','earth',2,1.95,{}]]],
  '霧の夜':[4,1,'s',[['f']]],'群れの夜':[4,1,'n',[['e','basic',.6,.95,1],['e','basic',1.2,.9,1],['e','basic',1.8,.95,1],['e','fast',2.4,.9,1],['e','basic',3,.95,1]]],
  '雨の夜':[4,1,'s',[['r']]],'あらしの夜':[4,1,'s',[['r'],['w']]],'風の強い夜':[4,1,'s',[['w']]],'満月':[4,1,'s',[['m',1]]],'新月':[4,1,'s',[['m',0]]],
  'おだやかな夜':[4,1,'s',[['t'],['m',.5]]],'星空の夜':[4,1,'s',[['t']]],'オオカゲの夜':[4,2,'n',[['e','boss',2,1.9,1]]]
};
const MFWAIT=new Set();let MFT=0;
function manFig(key){if(!MANFIG[key]||!window.CHIPS)return null;const c=document.createElement('canvas');c.className='mfig';c.setAttribute('aria-hidden','true');const[w,h]=MANFIG[key];c.width=w*64;c.height=h*64;c.style.width=w*64+'px';c.style.height=h*64+'px';
  if(!mfDraw(c,key)){MFWAIT.add([c,key]);clearTimeout(MFT);MFT=setTimeout(mfRetry,400)}return c}
function mfRetry(){for(const q of[...MFWAIT]){if(!q[0].isConnected){MFWAIT.delete(q);continue}if(mfDraw(q[0],q[1]))MFWAIT.delete(q)}if(MFWAIT.size)MFT=setTimeout(mfRetry,400)}
/* 1まい描く。絵がまだのせいれいがいたら false（あとでもう1回） */
function mfDraw(c,key){const[w,h,gd,L]=MANFIG[key],g=c.getContext('2d'),W=c.width,H=c.height;g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;g.clearRect(0,0,W,H);let ok=true;
  const night=gd==='n'||gd==='s';
  if(gd==='s'){/* 夜空：2ドットずつの段 */const SK=['#28305a','#2d3763','#333e6c','#3a4675','#41507e','#4a5a86'];for(let i=0;i<6;i++){g.fillStyle=SK[i];g.fillRect(0,Math.floor(i*H/6)&~1,W,Math.ceil(H/6)+2)}}
  else{const tx=gd==='d'?'tex:dry':gd==='f'?'floor#0':'tex:grass',T=CHIPS[tx];g.setTransform(2,0,0,2,0,0);if(T)for(let y=0;y<H/2;y+=T.h||32)for(let x=0;x<W/2;x+=T.w||32)drawChip(g,T,tx.split(/[#:]/)[0],x,y,1);g.setTransform(1,0,0,1,0,0)}
  const D=L.map((it,i)=>[it,i]).filter(([it])=>'ocse'.includes(it[0])).sort((a,b)=>(a[0][3]+(a[0][0]==='s'||a[0][0]==='e'?0:.9))-(b[0][3]+(b[0][0]==='s'||b[0][0]==='e'?0:.9))||a[1]-b[1]);
  for(const[it]of D){const[k,id,x,y,o]=it;g.setTransform(2,0,0,2,0,0);
    try{if(k==='o'){if(BL[id]){ICON=true;try{drawObj(g,id,x*32,y*32,7,0,1)}finally{ICON=false}}}
      else if(k==='c'){const C=CHIPS[id];if(C)drawChip(g,C,id.split(/[#:]/)[0],x*32,y*32,1)}
      else if(k==='s'){if(!spDotReady(id))ok=false;else{const oo=Object.assign({dot:1,t:1.3,blink:false},o||{}),f=x>w/2?-1:1;g.fillStyle='rgba(40,60,30,.22)';g.fillRect(x*32-7,y*32+1,14,2);drawSpiritDot(g,id,x*32,y*32,.435,oo.sleep?1:f,oo)}}
      else if(k==='e'){g.setTransform(2,0,0,2,0,0);drawShade(g,id,x*32,y*32,(EN[id]&&EN[id].boss?.42:.5)*((EN[id]&&EN[id].size)||1),o||1,{t:.4,dot:1})}}catch(_){}}
  g.setTransform(1,0,0,1,0,0);
  if(night&&gd==='n'){g.fillStyle='rgba(24,28,60,.42)';g.fillRect(0,0,W,H)}
  for(const it of L){const k=it[0],P=v=>Math.round(v*64/2)*2;
    if(k==='a')mfArrow(g,P(it[1]),P(it[2]),P(it[3]),P(it[4]));
    else if(k==='b'){g.fillStyle='#fff6d0';const x0=P(it[1]),y0=P(it[2]),x1=P(it[3]),y1=P(it[4]);for(let x=x0;x<x1;x+=8){g.fillRect(x,y0,4,2);g.fillRect(x,y1-2,4,2)}for(let y=y0;y<y1;y+=8){g.fillRect(x0,y,2,4);g.fillRect(x1-2,y,2,4)}
      g.fillStyle='#fffbe8';for(const[sx,sy]of[[.3,.2],[.7,.35],[.5,.8]]){const px=Math.round((x0+(x1-x0)*sx)/2)*2,py=Math.round((y0+(y1-y0)*sy)/2)*2;g.fillRect(px-1,py-5,2,10);g.fillRect(px-5,py-1,10,2)}}
    else if(k==='l'){const x=P(it[1]),y=P(it[2]);const C=['#fff6c8','#ffe58a','#ffd35c'];for(let i=0;i<3;i++){g.globalAlpha=.55+i*.15;g.fillStyle=C[i];const hw=10-i*3;g.fillRect(x-hw,0,hw*2,y)}g.globalAlpha=1;g.fillStyle='#fffbe0';g.fillRect(x-14,y-4,28,4);g.fillRect(x-20,y-2,40,2)}
    else if(k==='m'){const cx=W*.78|0,cy=H*.42|0,R=14;for(let y=-R;y<R;y+=2)for(let x=-R;x<R;x+=2){if(x*x+y*y>=R*R)continue;const lit=it[1]>=1||(it[1]>0&&x>-R+R*2*(1-it[1])*.9);g.fillStyle=it[1]===0?(x*x+y*y>(R-3)*(R-3)?'#8a93b8':'#3a4470'):lit?'#fff3c4':'#5a628e';g.fillRect(cx+x,cy+y,2,2)}}
    else if(k==='t'){g.fillStyle='#fffbe0';for(let i=0;i<14;i++){const x=Math.floor(Math.abs(Math.sin(i*12.9898)*43758.5)%1*W)&~1,y=Math.floor(Math.abs(Math.sin(i*78.233)*12345.6)%1*H*.8)&~1;g.fillRect(x,y,2,2);if(i%4===0){g.fillRect(x-2,y,6,2);g.fillRect(x,y-2,2,6)}}}
    else if(k==='r'){g.fillStyle='rgba(200,220,255,.7)';for(let i=0;i<40;i++){const x=Math.floor(Math.abs(Math.sin(i*3.7)*999)%1*W)&~1,y=Math.floor(Math.abs(Math.sin(i*7.1)*777)%1*H)&~1;for(let j=0;j<4;j++)g.fillRect(x-j*2,y+j*2,2,2)}}
    else if(k==='w'){g.fillStyle='rgba(230,240,255,.55)';for(let i=0;i<5;i++){const y=(10+i*H/5)&~1,x0=(Math.abs(Math.sin(i*5.3))*W*.5)&~1;g.fillRect(x0,y,W*.4|0,2);g.fillRect(x0+W*.4-6|0,y-2,6,2)}}
    else if(k==='f'){for(let i=0;i<4;i++){g.fillStyle='rgba(235,238,245,'+(.18+i*.06)+')';g.fillRect(0,(H*.3+i*H*.15)&~1,W,(H*.12)&~1)}}}
  return ok}
function mfArrow(g,x0,y0,x1,y1){/* ドットの矢じるし：こい色のふち＋明るい中 */const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))/2|0,dx=Math.sign(x1-x0),dy=Math.sign(y1-y0);
  for(const[col,s]of[['#5a3c1e',4],['#fff3c4',2]]){g.fillStyle=col;for(let i=0;i<=n;i++){const x=x0+Math.round((x1-x0)*i/Math.max(1,n)/2)*2,y=y0+Math.round((y1-y0)*i/Math.max(1,n)/2)*2;g.fillRect(x-s/2,y-s/2,s,s)}
    for(let k=1;k<=4;k++){const a=k*2;g.fillRect(x1-dx*a-dy*a-s/2,y1-dy*a+dx*a-s/2,s,s);g.fillRect(x1-dx*a+dy*a-s/2,y1-dy*a-dx*a-s/2,s,s)}}}
