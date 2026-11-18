/* 日ざしと月明かり（光の帯・ゴッドレイ）
   晴れた日の朝・夕方と、月のある夜に、画面の上からななめの光の帯をさす（画面の座標、虹と同じ）。
   帯はドット（RAYP px のマス目）の絵を、帯ごと・色ごとに1回だけ作っておき、毎コマはならべるだけ（rayCache）。
   夜は、帯の所の暗さを少しけずる（rayCutDark：地面そのものが少し明るく見える）。
   帯の中の花粉の粒は、きらっと光る（rayInside）。雨・あらし・霧の夜・オオカゲの夜・最後の夜は出さない。 */
const RAYP=3,/* 1ドットの大きさ（px） */
  RAYS=[{f:.12,w:26,l:.78,ph:0},{f:.35,w:14,l:.62,ph:1.7},{f:.58,w:34,l:.85,ph:3.1},{f:.84,w:18,l:.68,ph:4.6}],/* 帯の場所（画面のはばのわりあい）・はば（ドット）・長さ（画面の高さのわりあい） */
  RAYK={morn:{c:[255,240,196],a:.5,s:.42},eve:{c:[255,196,132],a:.5,s:-.42},moon:{c:[200,220,255],a:.12,s:.3}},/* 色・いちばん明るいときのこさ・かたむき（たて1ドットで、よこにずれる数） */
  RAYMOON={full:1,new:0},RAYMOONN=.6,/* 月の明るさ：満月1・新月0・ふだん .6 */
  RAYCUT=.5;/* 夜、帯の所の暗さをけずるこさ（帯のこさにかける） */
const RAYC=new Map();let RAYCW=0,RAYCH=0;
function rayCache(i,kind){if(RAYCW!==VW||RAYCH!==VH){for(const c of RAYC.values())c.width=c.height=0;RAYC.clear();RAYCW=VW;RAYCH=VH}
  const key=i+kind;let c=RAYC.get(key);if(c)return c;const R=RAYS[i],K=RAYK[kind],w=R.w,len=Math.max(8,Math.round(VH*R.l/RAYP)),sl=K.s,cw=w+Math.ceil(Math.abs(sl)*len),ox=sl<0?cw-w:0;
  c=document.createElement('canvas');c.width=cw;c.height=len;const g=c.getContext('2d'),im=g.createImageData(cw,len),d=im.data;
  for(let y=0;y<len;y++){const fy=1-y/len,ly=Math.ceil(fy*4)/4;/* 長さの向きは4だんでうすく */const cx=ox+w/2+sl*y;
    for(let x=0;x<cw;x++){const q=Math.abs(x+.5-cx)/(w/2);if(q>=1)continue;const lx=q<.35?1:q<.7?.62:.3;/* よこは3だん（まん中ほどこい） */const p=(y*cw+x)*4;d[p]=K.c[0];d[p+1]=K.c[1];d[p+2]=K.c[2];d[p+3]=Math.round(255*lx*ly)}}
  g.putImageData(im,0,0);c._ox=ox;RAYC.set(key,c);return c}
function rayBlocked(){return !S||S.rain||(typeof stormNow==='function'&&stormNow())||(typeof BOSSEVE!=='undefined'&&BOSSEVE)||!WD&&S.ns&&(S.ns.final||S.ns.rush)&&!S.cleared}
function rayNow(){/* いまの光：{kind,a}（出さないときは null） */if(rayBlocked())return null;const h=hour(),sm=(a,b)=>Math.max(0,Math.min(1,(h-a)/(b-a)));
  if(h>=5.5&&h<8){const a=sm(5.5,6.5)*(1-sm(7,8));/* 昼（8時〜15時半、hd2d.js の hdTint と同じ）には出さない */return a>0?{kind:'morn',a}:null}
  if(h>=15.5&&h<18.5){const a=sm(15.5,16.5)*(1-sm(17.5,18.5));return a>0?{kind:'eve',a}:null}
  if(h>=19.5||h<5.5){if(typeof nightVarNow==='function'&&nightVarNow()==='kiri')return null;const mk=typeof moonOf==='function'?moonOf(h>=17?dayNo():dayNo()-1):null,m=mk in RAYMOON?RAYMOON[mk]:RAYMOONN;if(!m)return null;const a=(h>=19.5?sm(19.5,20.5):1-sm(4.5,5.5))*m;return a>0?{kind:'moon',a}:null}
  return null}
function rayLay(i,kind,now){/* 帯の左上の場所と、ゆれ（こさ）。ずれはドットのマス目にそろえる */const R=RAYS[i],c=rayCache(i,kind),sw=Math.round(Math.sin(now/7000+R.ph)*2)*RAYP,x=Math.round(R.f*VW/RAYP)*RAYP-c._ox*RAYP-R.w*RAYP/2+sw;return {c,x,y:0,k:.75+.25*Math.sin(now/3000+R.ph)}}
function rayDraw(g,now,mul){/* g：描く先（dpr の座標）。mul：こさにかける数 */const L=rayNow();if(!L)return null;const K=RAYK[L.kind];g.save();g.imageSmoothingEnabled=false;
  for(let i=0;i<RAYS.length;i++){const p=rayLay(i,L.kind,now);g.globalAlpha=Math.min(1,K.a*L.a*p.k*mul);g.drawImage(p.c,p.x,p.y,p.c.width*RAYP,p.c.height*RAYP)}g.restore();return L}
function rayCutDark(g,now){/* 夜：月明かりの帯の所の暗さを少しけずる（g は DMK、destination-out のまま） */const L=rayNow();if(!L||L.kind!=='moon')return;g.save();g.setTransform(dpr,0,0,dpr,0,0);g.imageSmoothingEnabled=false;
  for(let i=0;i<RAYS.length;i++){const p=rayLay(i,'moon',now);g.globalAlpha=Math.min(1,RAYCUT*L.a*p.k);g.drawImage(p.c,p.x,p.y,p.c.width*RAYP,p.c.height*RAYP)}g.restore()}
function rayInside(px,py,now){/* 画面の点が、いまの帯の中か（花粉の粒をきらっとさせる） */const L=rayNow();if(!L)return 0;const K=RAYK[L.kind];
  for(let i=0;i<RAYS.length;i++){const R=RAYS[i],len=VH*R.l;if(py>len)continue;const sw=Math.round(Math.sin(now/7000+R.ph)*2)*RAYP,cx=Math.round(R.f*VW/RAYP)*RAYP+sw+K.s*py;if(Math.abs(px-cx)<R.w*RAYP/2)return L.a*(1-py/len)}return 0}
