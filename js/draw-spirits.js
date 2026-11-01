'use strict';

function darkness(){const h=hour();if(h>=7&&h<17)return 0;if(h>=17&&h<20.5)return (h-17)/3.5*.58;if(h>=20.5||h<4.5)return .58;return .58*(1-(h-4.5)/2.5)}
const rain=Array.from({length:70},()=>({x:Math.random(),y:Math.random(),s:rnd(.6,1)}));
const motes=Array.from({length:26},()=>({x:Math.random(),y:Math.random(),p:Math.random()*6,s:rnd(.4,1)}));
let selRect=null;

function drawMark(el,px,by,now){
  const c=ctx;
  if(el==='wood'){c.strokeStyle='#3f8a3d';c.lineWidth=1.5;c.beginPath();c.moveTo(px,by-9);c.lineTo(px,by-13);c.stroke();
    c.fillStyle='#5fbf4f';c.beginPath();c.ellipse(px-3,by-14,3.5,2,-.5,0,7);c.fill();c.beginPath();c.ellipse(px+3,by-14,3.5,2,.5,0,7);c.fill()}
  else if(el==='water'){c.fillStyle='#3f9ee8';c.beginPath();c.moveTo(px,by-19);c.quadraticCurveTo(px+4,by-13,px,by-10);c.quadraticCurveTo(px-4,by-13,px,by-19);c.fill();circ(c,px-1,by-13,1,'#dff2ff')}
  else if(el==='fire'){const f=Math.sin(now/120);c.fillStyle='#ff6a3d';c.beginPath();c.moveTo(px-4,by-9);c.quadraticCurveTo(px-4,by-15,px+f,by-19);c.quadraticCurveTo(px+4,by-15,px+4,by-9);c.fill();circ(c,px,by-11,2,'#ffd35c')}
  else if(el==='earth'){c.fillStyle='#9a6f30';c.beginPath();c.ellipse(px,by-11,5,3,0,0,7);c.fill();c.fillStyle='#d9b06a';c.fillRect(px-2,by-13,3,1.5)}
  else if(el==='wind'){c.strokeStyle='#3fc0a0';c.lineWidth=1.8;c.beginPath();c.arc(px,by-13,3.5,Math.PI*.2+now/400,Math.PI*1.7+now/400);c.stroke()}
}
/* ---------- 精霊の絵 ---------- */
const SPC={
  earth:{hood:'#8f6a50',cheek:'#c6b1a0',dark:'#6f4f3a',eye:'#5e3d2a',hand:'#e3c3a3',line:'#ead6bd',leaf:'#5e8f43'},
  water:{hood:'#78c3fb',cheek:'#badef5',dark:'#4fa6e8',eye:'#1d4f7c',hand:'#f3dfc6',line:'#ecd9c0'},
  fire:{hood:'#e8604f',cheek:'#f2ac9f',dark:'#c94a3c',eye:'#8f3a22',hand:'#ffc887',line:'#f0d4ae'},
  wind:{hood:'#a6cc8a',cheek:'#d2e2bc',dark:'#86b46a',eye:'#456a2a',hand:'#c8e2b4',line:'#c2dcaa',tend:'#e8cdb0'},
  wood:{hood:'#6fae4c',cheek:'#b6d39e',dark:'#4f8a35',eye:'#3f5e26',hand:'#d6e8c2',line:'#e2d6bc',vein:'#9fd27e'},
};
const CREAM='#fdf8ef';
// 見た目の微調整用の数値（デザイン調整ツールで作った値をここに入れる）
const KEYTUNE={head:1.13,faceW:24.5,faceH:21,faceY:2,eyeY:1,eyeGap:11,eyeW:2.8,eyeH:4.6,cheekS:1,cheekA:.42,bodyW:1,bodyH:1,armL:1,armW:.88,hand:1,tail:1.04,line:2.4,sEye:3,sCheek:-16,sFaceX:9.5,sFaceW:8,sHead:.95,sHoodX:4.5,sMouth:3};/* キーキャラ（フタバ・ノドカ）の見た目 */
const BASETUNE={head:1.13,faceW:24.5,faceH:21,faceY:2,eyeY:1,eyeGap:11,eyeW:2.8,eyeH:4.6,cheekS:1,cheekA:.42,bodyW:1,bodyH:1,armL:1,armW:.88,hand:1,tail:1.04,line:2.4,sEye:3,sCheek:-16,sFaceX:9.5,sFaceW:8,sHead:.95,sHoodX:4.5,sMouth:3};
// 足元(0,0)基準・高さ約100単位。右向きで描いてfで反転。o:{t,back,turn(0正面〜1真横),walk,work,sleep,blink,lean}
const PSPR={"wmBody":{"src": "assets/g/67ccde7704.webp"},"wmSail":{"src": "assets/g/a6e83e73cf.webp"},"well":{"w": 192, "h": 168, "src": "assets/g/4076e7cf97.webp"},"lumber":{"w": 96, "h": 95, "src": "assets/g/1cf99a0e22.webp"},"quarry":{"w": 96, "h": 90, "src": "assets/g/def842f310.webp"},"puddle":{"w": 96, "h": 58, "src": "assets/g/7d236e5659.webp"},"spike":{"w": 96, "h": 73, "src": "assets/g/f6d36cad57.webp"},"firetrap":{"w": 96, "h": 95, "src": "assets/g/c7a01d832d.webp"},"gust":{"w": 96, "h": 94, "src": "assets/g/c3f6e5b647.webp"},"torch":{"w": 34, "h": 96, "src": "assets/g/377580bdc3.webp"},"can":{"w":80,"h":44,"src":"assets/g/a152791e98.webp"},"hammer":{"w":80,"h":48,"src":"assets/g/c4e04e0342.webp"},"axe":{"w":80,"h":48,"src":"assets/g/f28741502b.webp"},"saw":{"w":80,"h":32,"src":"assets/g/678b62430a.webp"},"pick":{"w":80,"h":72,"src":"assets/g/6c33c2cfb4.webp"},"hoe":{"w":80,"h":36,"src":"assets/g/39079f38b3.webp"},"swing":{"w":80,"h":63,"src":"assets/g/cbdd29487c.webp"}};
for(const k in PSPR){const g=PSPR[k];g.img=new Image();g.img.onload=()=>{g.ok=1;dirty=true;if(typeof iconCache!=="undefined"){delete iconCache[k];if(k.startsWith("wm"))delete iconCache.windmill}};g.img.src=g.src}
// 顔・手のアイコン（絵文字のかわりに使う）
const EMOS={"muscle": "assets/g/5554bd7111.webp", "one": "assets/g/88db2f2e48.webp", "point": "assets/g/00ac3e5a20.webp", "palm": "assets/g/ebf1b027f0.webp", "thumb": "assets/g/8f7bd1849e.webp", "laugh": "assets/g/9a40ea6fe9.webp", "shock": "assets/g/824f985b69.webp", "bang": "assets/g/3b6a37fa64.webp", "q": "assets/g/b78fb718c4.webp", "cry": "assets/g/3367f045df.webp"};
const EMO_OF={'💪':'muscle','👆':'one','☝️':'one','👉':'point','✋':'palm','👋':'palm','👍':'thumb','😆':'laugh','😊':'laugh','😱':'shock','😵':'shock','❗':'bang','‼️':'bang','❓':'q','😭':'shock','😩':'shock','😣':'shock'};
const EMOI={};for(const k in EMOS){const im=new Image();im.onload=()=>{im.ok=1;dirty=true};im.src=EMOS[k];EMOI[k]=im}
document.querySelectorAll('img.emo').forEach(e=>{e.src=EMOS[EMO_OF[e.dataset.emo]]});
let ROCKI=null;const rockImg=()=>{if(!ROCKI){const c=document.createElement('canvas');c.width=60;c.height=52;const g=c.getContext('2d');g.scale(2,2);g.translate(-2.5,-5);const x=0,y=0;
  blob(g,'#b9ad9f',[[x+4,y+27],[x+5,y+15],[x+12,y+7],[x+21,y+8],[x+26,y+16],[x+27,y+27]]);blob(g,'#d3c9bd',[[x+6,y+18],[x+12,y+8],[x+20,y+9],[x+17,y+15],[x+9,y+21]]);blob(g,'#c5baae',[[x+19,y+29],[x+19,y+22],[x+24,y+19],[x+30,y+22],[x+30,y+29]]);blob(g,'#d9d0c5',[[x+20,y+23],[x+24,y+20],[x+28,y+22],[x+24,y+24]]);ROCKI=c}return ROCKI};/* 石は絵文字ではなく、マップの石と同じ絵 */
/* 食べ物・素材のアイコン（いただいた絵を切りぬいたもの） */
const ICONS={shina:'assets/g/acf901b1ec.webp',kasa:'assets/g/7149963860.webp',kuru:'assets/g/a85522db2a.webp',chiri:'assets/g/d932e1905b.webp',funba:'assets/g/fd9fee6be7.webp',/* 草の素材のアイコン（もらった絵） */bamboo:'assets/g/1675ff02af.webp',takenoko:'assets/g/ff79aa3650.webp',yakisoba:'assets/g/11c3354584.webp',takoyaki:'assets/g/896abbdd21.webp',ringoame:'assets/g/81d8416232.webp',"berry": "assets/g/02a387993f.webp", "apple": "assets/g/4def88f772.webp", "fish": "assets/g/5abe67cf54.webp", "mugi": "assets/g/f341bb15ca.webp", "yakizakana": "assets/g/d5490ee70a.webp", "bread": "assets/g/44418dc796.webp", "wood": "assets/g/005f870f70.webp", "stone": "assets/g/6a7d29f99a.webp","yakiimo": "assets/g/7362585a89.webp", "soup": "assets/g/8e1f8b863a.webp", "salad": "assets/g/96ea0984e5.webp", "yakiberry": "assets/g/66e34ef9f6.webp", "yakiapple": "assets/g/9a25149269.webp","potato": "assets/g/12bb46830f.webp","f_smile": "assets/g/27ad3fc163.webp", "f_angry": "assets/g/5f6e4b8e20.webp", "f_cry": "assets/g/50191c34fc.webp", "f_laugh": "assets/g/4639c8a46b.webp", "f_sleep": "assets/g/b4cd35c3fa.webp","m_support": "assets/g/8a489fd5b4.webp", "m_goal": "assets/g/2e7239e58d.webp", "m_manual": "assets/g/48c642512e.webp", "m_oracle": "assets/g/e296fc09a6.webp", "m_chat": "assets/g/b495abb0e1.webp", "m_maps": "assets/g/728271789e.webp", "m_settings": "assets/g/63c2d28666.webp", "m_record": "assets/g/24756785e1.webp", "m_box": "assets/g/281aef7121.webp", "fire": "assets/g/ea2c3266d1.webp", "pan": "assets/g/f758a535d1.webp",kakigori:'assets/g/bfb5ea466b.webp',wataame:'assets/g/2921901dec.webp'};for(const k of['eda','kinoko','can']){/* 草（しなやかな草・かさかさ草・くるくる草・ちりちり草・ふんばり草）は、もらったアイコンの絵（ICONS のはじめ） */const cv=document.createElement('canvas');cv.width=cv.height=48;drawMatIc(cv.getContext('2d'),k,24,24,44);ICONS[k]=cv.toDataURL();const ck={shina:'weed0g',kasa:'weed0k',kuru:'weed1g',chiri:'weed1k',funba:'weedc#0',kinoko:'kinoko#0',eda:'drop:eda',can:'drop:can'}[k];if(window.CHIPS&&CHIPS[ck]){const c=chipImgs(CHIPS[ck],ck)[0],set=()=>{ICONS[k]=c.toDataURL();try{delete iconCache[k]}catch(e){}};if(c.ok)set();else chipPage(CHIPS[ck].f[0][0]).q.push(set)}}/* もらった絵があれば、それを素材のアイコンに *//* あたらしい素材のアイコン（仮の絵） */
/* やきいも・スープ（ユーザー画像）、焼きベリー・焼きりんご */
/* 表情アイコン（いただいた絵） */
/* メニューと吹き出しのアイコン */
const EMO_IC={'🎋':'bamboo','🎍':'takenoko','🍧':'kakigori','🍬':'wataame','🍝':'yakisoba','🐙':'takoyaki','🍭':'ringoame','😊':'f_smile','😌':'f_smile','😆':'f_laugh','😠':'f_angry','😤':'f_angry','💤':'f_sleep','😴':'f_sleep','🌾':'mugi','🫐':'berry','🍎':'apple','🐟':'fish','🐠':'yakizakana','🍞':'bread','🍠':'yakiimo','🍮':'yakiberry','🥧':'yakiapple','🍲':'soup','🪵':'wood','🪨':'stone','🔥':'fire','🍳':'pan','📦':'m_box','💬':'m_chat','🥔':'potato','🥗':'salad','☕':'m_support'};
const ICI={};for(const k in ICONS){const im=new Image();im.onload=()=>{im.ok=1;dirty=true};im.onerror=()=>{im.bad=1};im.src=ICONS[k];ICI[k]=im}
const icURL=t=>EMO_IC[t]?ICONS[EMO_IC[t]]:null;
const OBJIC=new Map();/* 'obj:<id>'：その物の絵のアイコン */const emoImg=t=>{if(typeof t==='string'&&t.startsWith('chip:')){const k=t.slice(5),C=window.CHIPS;if(!C||!C[k])return null;const im=chipImgs(C[k],k)[0];return im&&im.ok?im:null}if(typeof t==='string'&&t.startsWith('ic:')){const q=ICI[t.slice(3)];return q&&q.ok?q:null}if(typeof t==='string'&&t.startsWith('obj:')){let im=OBJIC.get(t);if(!im){const u=iconURL(t.slice(4));if(!u)return null;im=new Image();im.src=u;OBJIC.set(t,im)}return im.complete&&im.naturalWidth?im:null}const ic=EMO_IC[t];if(ic&&ICI[ic].ok)return ICI[ic];if(t==='🪨')return rockImg();const k=EMO_OF[t];if(k&&EMOI[k].ok)return EMOI[k];const e=typeof EIMGI==='undefined'?null:EIMGI[nfe(t)];return e&&e.ok?e:null};
const EIMG={"🥬": "assets/g/5060956a16.webp","🌱": "assets/g/ddb81b127a.webp", "🌼": "assets/g/0ed6b4aade.webp", "🍇": "assets/g/8e281cad26.webp", "🍙": "assets/g/b6579368c3.webp", "🎁": "assets/g/3b401b133d.webp", "🎈": "assets/g/5425865b42.webp", "🎣": "assets/g/dfb64cc0a7.webp", "🎵": "assets/g/55ef8edddb.webp", "👏": "assets/g/be7b7ab2f2.webp", "💚": "assets/g/5b43ce83e8.webp", "💦": "assets/g/6915a2afb8.webp", "💧": "assets/g/62e219622c.webp", "🔨": "assets/g/d16cde1f6d.webp", "🧺": "assets/g/2958eee0a3.webp", "🪓": "assets/g/aeb012eedf.webp", "⛏": "assets/g/e9f2ed80d0.webp", "✨": "assets/g/72f109c9a6.webp", "🏠": "assets/g/85c1f2f80d.webp", "🎉": "assets/g/766f579af3.webp", "♨": "assets/g/d36dfb2330.webp", "🤝": "assets/g/aef0a1bcc3.webp", "⚔": "assets/g/350754662b.webp", "💎": "assets/g/f37efc10fd.webp", "🏡": "assets/g/2e7280b902.webp", "🌙": "assets/g/85ca409800.webp", "🌑": "assets/g/528f694f20.webp", "🏆": "assets/g/5b656fb4a5.webp", "📌": "assets/g/04c7ab4501.webp", "🍃": "assets/g/1eb15e6975.webp", "🌟": "assets/g/adfec7ff83.webp", "🎯": "assets/g/6b1cb0d850.webp", "🪑": "assets/g/2e65a41c7d.webp", "⬆": "assets/g/3b473890f6.webp", "☀": "assets/g/df54e16892.webp", "☔": "assets/g/431750b5a8.webp", "★": "assets/g/0c3128f3de.webp", "☆": "assets/g/f442887829.webp", "♥": "assets/g/ce24a2a5c7.webp", "♪": "assets/g/92f4a76d1d.webp", "✓": "assets/g/301536d4a0.webp", "⚙": "assets/g/05c75a8ddf.webp", "⛩": "assets/g/fc15f6a949.webp", "📔": "assets/g/b5ad2cfa77.webp", "📜": "assets/g/6b126952c1.webp", "📺": "assets/g/5220592373.webp", "🔒": "assets/g/46046e6402.webp", "🧭": "assets/g/3b0b9bbe3e.webp", "🦌": "assets/g/b284f951ef.webp", "⭐": "assets/g/e239d430f8.webp", "💫": "assets/g/9fcb4f768d.webp", "👻": "assets/g/e415a63d84.webp", "🍅": "assets/g/bdf6d4891c.webp", "😋": "assets/g/4d4933be73.webp", "🌰": "assets/g/ddb81b127a.webp"};/* 絵文字のかわりに使う絵（いただいたもの） */

const EIMGI={};for(const k in EIMG){const im=new Image();im.onload=()=>{im.ok=1;dirty=true};im.src=EIMG[k];EIMGI[k]=im}
const nfe=t=>t.replace(/️/g,'').replace('🎵','♪');/* 音符はぜんぶ黒い音符 */
const emoSrc=t=>{t=nfe(t);return EIMG[t]||(EMO_IC[t]&&ICONS[EMO_IC[t]])||(EMO_OF[t]&&EMOS[EMO_OF[t]])||(EMO_OF[t+'️']&&EMOS[EMO_OF[t+'️']])||null};
{const L=[...new Set(Object.keys(EIMG).concat(Object.keys(EMO_IC),Object.keys(EMO_OF)).map(nfe))].sort((a,b)=>b.length-a.length);
 const RX=new RegExp('('+L.join('|')+')️?','g'),SKIP=new Set(['SCRIPT','STYLE','TEXTAREA','CANVAS','INPUT']);
 const conv=n=>{if(n.nodeType===3){const t=n.nodeValue;if(!t||t.length>400)return;RX.lastIndex=0;if(!RX.test(t))return;RX.lastIndex=0;const f=document.createDocumentFragment();let i=0,m;while((m=RX.exec(t))){const src=emoSrc(m[1]);if(!src)continue;if(m.index>i)f.appendChild(document.createTextNode(t.slice(i,m.index)));const im=document.createElement('img');im.className='emi';im.alt='';im.src=src;f.appendChild(im);i=m.index+m[0].length}if(i===0)return;if(i<t.length)f.appendChild(document.createTextNode(t.slice(i)));n.parentNode&&n.parentNode.replaceChild(f,n)}
  else if(n.nodeType===1){if(SKIP.has(n.tagName))return;for(const c of [...n.childNodes])conv(c)}};
 const mo=new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')conv(m.target);else for(const n of m.addedNodes)conv(n)}});
 mo.observe(document.body,{childList:true,subtree:true,characterData:true});conv(document.body)}/* 画面の文字に出てくる絵文字は、ぜんぶ絵にさしかえる */
const hex2hsl=h=>{const n=parseInt(h.slice(1),16),r=(n>>16)/255,g=(n>>8&255)/255,b=(n&255)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let H=0,S2=0;if(mx!==mn){const d=mx-mn;S2=l>.5?d/(2-mx-mn):d/(mx+mn);H=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;H*=60}return[H,S2,l]};
const hsl2hex=(H,S2,l)=>{const k=n=>(n+H/30)%12,a=S2*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1));return'#'+[f(0),f(8),f(4)].map(v=>Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join('')};
const SPCV={};function spcVar(el,v){const B=SPC[el]||SPC.wood;if(!v||(!v.h&&!v.l))return B;const k=el+v.h+'_'+v.l;if(SPCV[k])return SPCV[k];const o={};for(const q in B){if(q==='line'||q==='hand'){o[q]=B[q];continue}const[H,S2,l]=hex2hsl(B[q]);o[q]=hsl2hex((H+v.h+360)%360,S2,Math.max(.08,Math.min(.92,l+v.l)))}return SPCV[k]=o}
let HOODB=[4,-.05];
let EATSIDE=-.1;
function spPose(o,t,tr,back){/* せいれいの動きの計算：腕の角度・かたむき・道具など（描き方とは別） */
  const br=o.sleep?Math.sin(t*1.6)*.035:Math.sin(t*2.6)*.022;
  const st=o.walk?Math.sin(t*9):0,arm=o.carry?0:o.work?Math.sin(t*12)*.6:o.walk?st*.35:Math.sin(t*1.7)*.08;
  // 作業ごとの動き：aN=手前の腕、aF=奥の腕（負で上がる）
  const A=o.anim||'',cyc=(sp)=>(t*sp)%1;let aN=null,aF=null,prop='',lean2=0,sq=0,frontArm=false,bothF=false;
  if(A==='climb'){aN=-1.5+Math.sin(t*8)*.25;aF=-1.5-Math.sin(t*8)*.25;lean2=-.05;sq=Math.abs(Math.sin(t*8))*.02;frontArm=bothF=true}/* 段差をよじのぼる：両手を頭の左右へ、ななめ上にのばして、こうごに動かす（頭の前・うしろに手をかさねない） */
  else if(A==='bowidle'){aN=-.2+Math.sin(t*1.7)*.04;aF=.15;prop='bow';o.bowPull=0;frontArm=true}/* 見張り台でまつ：弓を持った手を下げる */
  else if(A==='bow'){const p=o.pp==null?1:Math.max(0,Math.min(1,o.pp)),pull=p<.6?p/.6:p<.7?1:0;aN=-1.45;aF=-1.45+.75*pull;prop='bow';o.bowPull=pull;lean2=-.03*pull;frontArm=bothF=true}/* 見張り台で弓をうつ：前の手で弓をかまえ、うしろの手で弦を引いて、はなす */
  else if(A==='punch'){const p=Math.min(1,o.pp||0),v=p<.55?-1.95*(p/.55):-1.95+2.4*((p-.55)/.45);aN=aF=v;lean2=p<.55?-.04:.07;frontArm=bothF=true}/* 攻撃：両手を振り上げて、ぽかっと振り下ろす */
  else if(A==='pray'){aN=aF=-2.4+Math.sin(t*1.4)*.03;lean2=.07+Math.sin(t*1.4)*.015;frontArm=bothF=true}/* おいのり：胸の前で手を合わせて、少しうつむく */
  else if(A==='pluck'){aN=-1.95+Math.sin(t*9)*.28;aF=.15;lean2=.03;frontArm=true}/* ベリーをむしる：片手を上げて、ひっぱる */
  else if(A==='hold'){aN=aF=-.85+Math.sin(t*3)*.03;frontArm=bothF=true}/* 手に持つ */
  else if(A==='eat'){aN=aF=(tr?EATSIDE:-2.45)+Math.sin(t*7)*.06;frontArm=bothF=true}/* 横向きは、両手を前にのばして、食べ物を持つ */
  else if(A==='chop'||A==='mine'||A==='till'){const p=cyc(1.4),v=p<.72?-2.3*(p/.72):-2.3+2.9*((p-.72)/.28);aN=v;aF=v;prop=A==='chop'?'axe':A==='mine'?'pick':'hoe';lean2=p<.72?-.06*(p/.72):-.06+.2*((p-.72)/.28);frontArm=true}
  else if(A==='build'||A==='repair'||A==='craft'){const p=cyc(2.6),v=p<.6?-1.3*(p/.6):-1.3+1.7*((p-.6)/.4);aN=v;aF=.2;prop='hammer';lean2=p>.6?.06:0;frontArm=true}
  else if(A==='water'||A==='tend'){aN=-.55+Math.sin(t*2)*.08;aF=.25;prop='can';lean2=.05;frontArm=true}
  else if(A==='cook'){aN=-.5+Math.sin(t*5)*.22;aF=.15;prop='ladle';frontArm=true}
  else if(A==='talk'){aN=-.6+Math.sin(t*4.7)*.4;aF=-.15+Math.sin(t*3.3)*.2;lean2=Math.sin(t*2.4)*.025;frontArm=true}
  else if(A==='talkjoy'){aN=-1.35+Math.sin(t*7)*.38;aF=-1.25-Math.sin(t*7)*.32;sq=Math.sin(t*7)*.025;frontArm=bothF=true}
  else if(A==='talkshock'){aN=aF=-1.7+Math.sin(t*8)*.12;lean2=-.075;sq=.04;frontArm=bothF=true}
  else if(A==='talkthink'){aN=-2.05+Math.sin(t*2)*.06;aF=.15;lean2=-.06;frontArm=true}
  else if(A==='talksad'){aN=.18+Math.sin(t*2)*.08;aF=.18;lean2=.07;sq=.025;frontArm=bothF=true}
  else if(A==='wave'){aN=-2.55+Math.sin(t*9)*.35;frontArm=true}/* 手をふる */
  else if(A==='clap'){const c=Math.sin(t*16);aN=-1.05+c*.32;aF=-1.05+c*.32;frontArm=bothF=true}
  else if(A==='tubbath'){aN=.5+Math.sin(t*1.3)*.1;aF=.5-Math.sin(t*1.3)*.1;lean2=Math.sin(t*1.1)*.05;sq=.02+Math.sin(t*1.8)*.012}/* バスタブ：ゆったりつかる */
  else if(A==='bathe'){const p=cyc(1.2),v=p<.45?.5-3.4*(p/.45):-2.9+3.4*((p-.45)/.55);aN=aF=v;frontArm=bothF=true;sq=.04+Math.sin(t*7.5)*.02;prop='splash'}
  else if(A==='fish'){aN=-.95+Math.sin(t*1.4)*.05;aF=-.15;prop='rod';frontArm=true}
  else if(A==='weed'){const p=cyc(1.1),pull=p<.6?p/.6:1-(p-.6)/.4;sq=.12-pull*.06;aN=aF=.75-pull*.35;lean2=.14-pull*.3;frontArm=bothF=true}/* 雑草：しゃがんで両手でつかみ、うしろへひっぱって抜く */
  else if(A==='plant'||A==='sow'||A==='harvest'||A==='gather'||A==='forage'||A==='pickseed'||A==='pickdrop'){sq=.09+Math.sin(t*5)*.025;aN=.6+Math.sin(t*6)*.35;aF=.6-Math.sin(t*6)*.35;lean2=.1;frontArm=bothF=true}
  else if(A==='store'||A==='smat'||A==='fetch'||A==='cgrab'){sq=.05;aN=.4+Math.sin(t*5)*.2;aF=aN;frontArm=bothF=true}
  else if(A==='offer'){aN=aF=-1.5+Math.sin(t*3)*.1;frontArm=bothF=true}
  else if(A==='play'){aN=aF=-1.7+Math.sin(t*7)*.35;frontArm=bothF=true}
  else if(A==='chat'||A==='chatwait'){aN=-.7+Math.sin(t*5)*.45}
  if(o.banzai){aN=aF=-1+Math.sin(t*4)*.07;frontArm=bothF=true}/* わーい */
  if(o.carry&&!back){frontArm=bothF=true}
  if(tr>.5)bothF=false;
  return {br,st,arm,A,aN,aF,prop,lean2,sq,frontArm,bothF}}
function spProp(c,prop,sx,a,t,o){/* せいれいが手に持つ道具 */c.save();c.translate(sx*15,0);if(prop!=='food'&&prop!=='splash'){const g=sx*(.35+a);c.translate(Math.sin(g)*6,Math.cos(g)*6)}/* 道具は、手より下（画面の下へ6）で持つ */if(prop!=='food')c.scale(1.5,1.5);
    if(prop==='splash'){for(let k=0;k<5;k++){const ph=(t*1.2+k*.2)%1,dx=sx*(-4+k*2.2)+Math.sin(k*2.1)*2,dy=-8-ph*16+ph*ph*30;c.globalAlpha=Math.max(0,1-ph);c.fillStyle=k%2?'#d6f2ff':'#6fc0ff';c.beginPath();c.arc(dx*1.4,dy,2.6-ph,0,7);c.fill()}c.globalAlpha=1;c.restore();return}/* 水しぶき */
    const TPL={hammer:[-5,.5,26],axe:[-5,.68,30],pick:[-5,.5,30],saw:[-6,.4,32],hoe:[-5,.8,32]}[prop];
    if(TPL&&PSPR[prop]&&PSPR[prop].ok){const g=PSPR[prop],h=TPL[2]*g.h/g.w;c.save();c.scale(sx,prop==='axe'||prop==='hoe'?-1:1);/* 斧・くわの刃は、ふりおろす向き（下）に */c.drawImage(g.img,TPL[0],-h*TPL[1],TPL[2],h);c.restore()}
    else if(prop==='axe'||prop==='pick'||prop==='hoe'||prop==='hammer'||prop==='saw'){
      if(prop==='saw'){c.fillStyle='#b9bfc6';c.beginPath();c.moveTo(sx*2,-4);c.lineTo(sx*30,-3);c.lineTo(sx*30,5);c.lineTo(sx*2,6);c.closePath();c.fill();c.fillStyle='#8a5a33';rr(c,sx>0?-4:-4,-5,8,12,3)}
      else{const L=prop==='hammer'?16:24;c.strokeStyle='#b5764a';c.lineWidth=4.5;c.beginPath();c.moveTo(-sx*3,0);c.lineTo(sx*L,0);c.stroke();c.fillStyle='#a8a29a';
        if(prop==='axe'){c.beginPath();c.moveTo(sx*(L-7),-2);c.quadraticCurveTo(sx*(L-6),-16,sx*(L+5),-17);c.quadraticCurveTo(sx*(L+6),-8,sx*(L+3),2);c.closePath();c.fill();c.fillStyle='#e6e1d8';c.beginPath();c.moveTo(sx*(L+5),-17);c.quadraticCurveTo(sx*(L+7),-8,sx*(L+3),2);c.lineTo(sx*(L+1),1);c.quadraticCurveTo(sx*(L+4),-8,sx*(L+2.5),-16);c.closePath();c.fill();c.fillStyle='#7d5238';rr(c,sx>0?L-4:-L-1,-4,5,8,1.5)}
        else if(prop==='pick'){c.fillStyle='#a8a29a';c.beginPath();c.moveTo(sx*(L-1),-1);c.quadraticCurveTo(sx*(L-10),-14,sx*(L-20),-15);c.quadraticCurveTo(sx*(L-6),-17,sx*(L+2),-5);c.quadraticCurveTo(sx*(L+7),5,sx*(L+4),17);c.quadraticCurveTo(sx*(L+1),5,sx*(L-1),-1);c.closePath();c.fill();c.fillStyle='#7d5238';rr(c,sx>0?L-3:-L-2,-4,5,8,1.5)}
        else if(prop==='hoe'){c.fillStyle='#a7adb5';c.beginPath();c.moveTo(sx*L,-2);c.lineTo(sx*(L+2),-2);c.lineTo(sx*(L+2),12);c.lineTo(sx*(L-6),12);c.closePath();c.fill()}
        else{c.fillStyle='#8f949b';rr(c,sx>0?L-2:-L-5,-7,7,14,2)}}}
    else{c.rotate(-sx*(.35+a));
      if(prop==='food'&&o.food){const ei=emoImg(o.food);if(ei){const ih=44,iw=ih*ei.width/ei.height;c.drawImage(ei,-iw/2,-4-ih/2,iw,ih)}else{c.font='44px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#000';c.fillText(o.food,0,-4);c.textAlign='start';c.textBaseline='alphabetic'}}
      else if(prop==='can'&&PSPR.can.ok){const g=PSPR.can,h=30*g.h/g.w;c.scale(sx,1);c.drawImage(g.img,-12.6,-9.7,30,h);
        for(let k=0;k<3;k++){const ph=(t*1.8+k/3)%1;c.fillStyle='rgba(120,190,255,'+(1-ph)+')';c.beginPath();c.ellipse(18+ph*3,-6+ph*24,1.8,2.6,0,0,7);c.fill()}}
      else if(prop==='can'){c.fillStyle='#8fb4c8';rr(c,-9,-8,18,14,4);c.fillStyle='#a9c8d9';rr(c,-9,-8,18,4,2);c.strokeStyle='#8fb4c8';c.lineWidth=3.5;c.beginPath();c.moveTo(8,-2);c.lineTo(20,-10);c.stroke();
        for(let k=0;k<3;k++){const ph=(t*1.8+k/3)%1;c.fillStyle='rgba(120,190,255,'+(1-ph)+')';c.beginPath();c.ellipse(21+ph*3,-8+ph*26,1.8,2.6,0,0,7);c.fill()}}
      else if(prop==='bow'){const pl=o.bowPull||0;c.strokeStyle='#5e3a1f';c.lineWidth=4.4;c.beginPath();c.arc(-4,-6,13,-1.2,1.2);c.stroke();c.strokeStyle='#b5764a';c.lineWidth=2.4;c.beginPath();c.arc(-4,-6,13,-1.2,1.2);c.stroke();const ex=-4+13*Math.cos(1.2),ey=13*Math.sin(1.2);c.strokeStyle='rgba(245,236,214,.95)';c.lineWidth=1;c.beginPath();c.moveTo(ex,-6-ey);c.lineTo(ex-7*pl,-6);c.lineTo(ex,-6+ey);c.stroke();if(pl>0){c.strokeStyle='#c9a06a';c.lineWidth=1.6;c.beginPath();c.moveTo(ex-7*pl,-6);c.lineTo(ex-7*pl+18,-6);c.stroke();c.fillStyle='#cfd6de';c.beginPath();c.moveTo(ex-7*pl+21,-6);c.lineTo(ex-7*pl+17,-8.5);c.lineTo(ex-7*pl+17,-3.5);c.closePath();c.fill()}}/* 弓（引いているあいだは矢をつがえる） */
      else if(prop==='ladle'){c.strokeStyle='#9a6a48';c.lineWidth=3;c.beginPath();c.moveTo(0,-6);c.lineTo(6,14);c.stroke();c.fillStyle='#8f949b';c.beginPath();c.ellipse(7,16,5,3,0,0,7);c.fill()}
      else if(prop==='rod'){c.strokeStyle='#9a6a48';c.lineWidth=3;c.beginPath();c.moveTo(-4,4);c.lineTo(30,-34);c.stroke();const bb=Math.sin(t*3)*3;c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1.2;c.beginPath();c.moveTo(30,-34);c.lineTo(38,14+bb);c.stroke();c.fillStyle='#e8604f';c.beginPath();c.arc(38,14+bb,3,0,7);c.fill()}}
    c.restore()}
// せいれいのドット絵：パーツ（頭・体・うで・手・しっぽ・表情）を、spPoseの動きで組み立てる。体・うで・手・表情は全属性で共通の絵を、色だけかえて使う
const SPDOT={},SPDOK={};
function spDot(key,el,vr){/* 絵の色を、その子の色にかえる（もとの色：共通の絵は木、ほかはその属性） */
  const ch=window.CHIPS&&CHIPS[key];if(!ch)return null;const im=chipImgs(ch,key)[0];if(!im.ok)return null;
  const se=key.startsWith('sp:')?'wood':el,k=key+'|'+el+'|'+(vr&&vr.h||0)+'_'+(vr&&vr.l||0);if(SPDOT[k])return SPDOT[k];
  const A=SPC[se],B=spcVar(el,vr);if(A===B)return SPDOT[k]=im;
  const cv=document.createElement('canvas');cv.width=ch.w;cv.height=ch.h;const g=cv.getContext('2d');g.drawImage(im,0,0);
  const d=g.getImageData(0,0,ch.w,ch.h),p=d.data,M={};for(const r in A)if(B[r])M[A[r].toLowerCase()]=B[r];
  for(let i=0;i<p.length;i+=4){if(!p[i+3])continue;const h='#'+((1<<24)|(p[i]<<16)|(p[i+1]<<8)|p[i+2]).toString(16).slice(1),to=M[h];if(to){p[i]=parseInt(to.slice(1,3),16);p[i+1]=parseInt(to.slice(3,5),16);p[i+2]=parseInt(to.slice(5,7),16)}}
  g.putImageData(d,0,0);return SPDOT[k]=cv}
function spDotReady(el){if(SPDOK[el])return true;if(!window.CHIPS)return false;
  for(const k in CHIPS)if((k.startsWith('sp:')||k.startsWith('sp_'+el+':'))&&!chipImgs(CHIPS[k],k)[0].ok)return false;return SPDOK[el]=true}
const bowNow=(r,now)=>!!r.bowT&&now>=r.bowT&&now-r.bowT<700;/* 弓をうった直後か（セーブに残った前の時刻は、いまより先になることがあるので見ない） */
function drawSpiritDot(c,el,x,y,s,f,o){
  if(!spDotReady(el))return false;
  const TUNE=o.vr&&o.vr.key?KEYTUNE:BASETUNE,vr=o.vr,t=o.t||0,back=!!o.back,tr=(o.turn||0)>.5?1:0,D=1/.87;/* せいれいの絵は、ゲームの1ドットを2×2に分けた細かさ */
  let {br,st,arm,A,aN,aF,prop,lean2,sq,frontArm,bothF}=spPose(o,t,tr,back);
  const spr=(key,X,Y)=>{const ch=CHIPS[key],im=spDot(key,el,vr);if(im)c.drawImage(im,(X||0)+ch.ax*D,(Y||0)+ch.ay*D,ch.w*D,ch.h*D)};
  const E0='sp_'+el+':',S=tr?'S':'';
  // いきをする・しゃがむ・かたむくは、絵を回さずに、頭とうでをドット単位でずらす（ドットがくずれないように）
  const L=(o.lean||0)+lean2,hDy=-Math.round((br-sq)*44)*D,aDy=-Math.round((br-sq)*20)*D,hDx=Math.round(L*52)*D,aDx=Math.round(L*22)*D;
  c.save();c.translate(x,y);c.scale(s*f,s);
  const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
  const tail=(tx,ty,rot)=>{c.save();c.translate(tx,ty);c.rotate((rot||0)+Math.sin(t*3)*.18);spr(E0+'tail');c.restore()};
  const wings=bk=>{if(o.bed)return;const fl=Math.sin(t*(o.walk?10:3.2))*.12,W=[[-16,-60,44,-2.5-fl],[16,-60,44,-.64+fl],[-18,-40,38,2.75+fl],[18,-40,38,.39-fl]];
    const lf=(w,k)=>{c.save();c.translate(w[0],w[1]);c.rotate(w[3]);if(w[2]!==44)c.scale(w[2]/44,w[2]/44);spr(E0+k);c.restore()};
    for(const w of W)lf(w,'leaf');if(bk){c.globalAlpha=.25;lf(W[0],'leafW');lf(W[1],'leafW');c.globalAlpha=1}};/* うしろ向きは、上のはねを少し白っぽく */
  if(el==='wind'&&!back){c.save();c.translate(-tr*9+hDx,hDy);c.scale(1-tr*.3,1);wings();c.restore()}
  if(!back&&el!=='wind'&&tr)tail(-18,-16,-.85);
  const armD=(sx,a)=>{c.save();c.translate(sx*14*TUNE.bodyW*(1-tr*.9)+(back?-1:1)*tr*2,-26*TUNE.bodyH+aDy);c.translate(aDx,0);c.rotate(sx*(.35+a));
    c.save();c.scale(sx,1);spr('sp:arm'+S);c.restore();if(prop&&sx===-farA&&!back)spProp(c,prop,sx,a,t,o);c.save();c.scale(sx,1);spr('sp:hand');c.restore();c.restore()};
  const farA=back?1:-1,aA0=sx=>o.carry?-1.85+Math.sin(t*9)*.08:tr?1.22+(o.walk?st*.6:Math.sin(t*1.7)*.05):(back?1:-1)*sx*arm+(back?0:.35),aA=sx=>sx===-farA?(aN!=null?aN:aA0(sx)):(aF!=null&&!o.carry?aF:aA0(sx));
  if(!bothF&&!tr)armD(farA,aA(farA));if(!tr&&!frontArm)armD(-farA,aA(-farA));
  {const ws=o.walk?st:0,up=v=>-Math.max(0,v)*3*D;/* 足：もとの体の下の部分を切り分けた絵。体より先にかいて、上のはしは体の下にもぐらせる（つけねに線を出さない）。止まっているときは、もとの形と同じ。歩くときは交互に上げる（横向きは前後にもふる） */
    if(tr){if(o.sit){spr('sp:rumpS');c.save();c.translate(4*D,-6*D);c.rotate(-Math.PI/2);c.scale(.8,1.3);c.translate(.5*D,8*D);spr('sp:footS');c.restore()}/* 横向きにすわる：まるいおしり（sp:rumpS）をかいて、足をつけねを中心に90度回して前へのばす */
      else{spr('sp:footS',-ws*3*D,up(ws));spr('sp:footS',ws*3*D,up(-ws))}}
    else{spr('sp:footL',0,up(ws));spr('sp:footR',0,up(-ws))}}
  spr('sp:body'+S+'0');
  if(tr&&!frontArm)armD(-farA,aA(-farA));
  if(back&&el!=='wind')tail(-tr*12,-17);
  // 頭と顔（食べるときは、うなずく）
  const nod=A==='eat'?Math.round(Math.max(0,Math.sin(t*7))*2.8)*D:0;c.save();c.translate(hDx,hDy+nod);
  // 頭巾だけ属性ごと。顔の丸は共通（風の子は頭巾のかわりに、まるい頭とつる）。小さく動く所（頭巾の先・芽・火の玉・つる）は別のパーツ
  const H=TUNE.head,hs=tr&&!back?'S':'',hp=(lx,ly)=>[(hs?-TUNE.sHoodX+lx*TUNE.sHead:lx)*H,-30*TUNE.bodyH+H*(ly+36)],/* 頭の中の位置→体の位置 */
    rot=(k,lx,ly,a)=>{const[px,py]=hp(lx,ly);c.save();c.translate(px,py);c.rotate(a);c.translate(-px,-py);spr(k);c.restore()},dd=v=>Math.round(v*H*.87)*D;
  if(el==='wind'){const[px,py]=[(back?1:-1)*tr*4*H,-30*TUNE.bodyH+H*(-79+36)];c.save();c.translate(px,py);c.rotate(Math.sin(t*2)*.15);c.translate(-px,-py);spr(E0+'vine'+hs);c.restore()}
  spr(E0+'hood'+hs);
  if(el==='wood'||el==='fire'){const v=dd(Math.sin(t*(el==='fire'?7:2.2))*(el==='fire'?2.5:1.4));spr(E0+'tip'+hs,v,0)}/* 頭巾の先が左右にゆれる */
  if(el==='water'){const v=dd(Math.sin(t*2.2)*1.4);if(v<0)spr(E0+'tip'+hs);spr(E0+'tip'+hs,0,v)}/* 水の子は上下（上がるときは、すきまがあかないように元の位置にも描く） */
  if(el==='fire')spr(E0+'ember'+hs,0,dd(Math.sin(t*3)*2.5));/* 火の玉がふわふわ */
  if(el==='earth')rot(E0+'sprout'+hs,1,-88,Math.sin(t*2.4)*.18);/* 芽がゆれる */
  if(el==='wind'&&back){c.save();c.translate(0,-30*TUNE.bodyH);c.scale(TUNE.head,TUNE.head);c.translate(0,36);c.scale(1-tr*.3,1);wings(1);c.restore()}/* うしろ向きのはねは、頭といっしょに */
  if(!back){if(el!=='wind')spr('sp:head'+S);if(el==='fire'&&!tr)spr(E0+'bang');
    const md=o.sleep?'':o.mood==='cry'?'teary':o.mood||'',fy=el==='wind'?-3*D:0;
    const fm=o.sleep||(o.blink&&!md)?'shut':md==='smile'||md==='joy'||md==='eat'?'hap':['teary','tear','shock','strain','sad','brave'].includes(md)?md:'n';
    if(vr&&vr.cheek)spr('sp:cheek'+S,0,fy);
    spr('sp:face'+S+'#'+fm,0,fy);
    if(vr&&vr.lash&&fm!=='strain')spr('sp:lash'+S+'#'+fm,0,fy)}/* まつげは、表情ごとの目に合わせた絵 */
  c.restore();
  if(bothF)armD(farA,aA(farA));if(frontArm)armD(-farA,aA(-farA));
  if((A==='eat'||A==='hold')&&o.food&&!back){const ei=emoImg(o.food),yy=A==='hold'?-17:-27+Math.sin(t*7)*.8,xx=tr?25:0;/* 横向きのときは、食べ物を顔の前に（体の大きさ0.435で、およそ11ドット前） */if(ei){const ih=40,iw=ih*ei.width/ei.height;c.drawImage(ei,xx-iw/2,yy-ih/2,iw,ih)}else{c.font='40px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#000';c.fillText(o.food,xx,yy);c.textAlign='start';c.textBaseline='alphabetic'}}
  if(A==='eat'&&tr&&o.food&&!back)armD(-farA,aA(-farA));/* 横向きで食べるときは、手前の手を食べ物の上にかさねて、持っている形に */
  c.imageSmoothingEnabled=sm;c.restore();return true}
function drawSpirit(c,el,x,y,s,f,o){
  if(o.dot&&drawSpiritDot(c,el,x,y,s,f,o))return;
  const TUNE=o.vr&&o.vr.key?KEYTUNE:BASETUNE;
  const P=spcVar(el,o.vr),t=o.t||0,back=!!o.back,tr=o.turn||0;
  let {br,st,arm,A,aN,aF,prop,lean2,sq,frontArm,bothF}=spPose(o,t,tr,back);
  c.save();c.translate(x,y);c.scale(s*f*(1-br*.6+sq*.35),s*(1+br-sq));if(o.lean)c.rotate(o.lean);if(lean2)c.rotate(lean2);
  c.lineJoin='round';c.lineCap='round';
  const E=(cx,cy,rx,ry,rot,fill,stroke,lw)=>{c.beginPath();c.ellipse(cx,cy,rx,ry,rot||0,0,7);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw||2.4;c.stroke()}};
  const leaf=(cx,cy,len,w,rot,col)=>{c.save();c.translate(cx,cy);c.rotate(rot);c.fillStyle=col;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(len*.35,-w,len,0);c.quadraticCurveTo(len*.55,w*.9,0,0);c.fill();c.restore()};
  // しっぽ（前向きは横、うしろ向きは真ん中）
  const tail=(tx,ty,sc,rot)=>{c.save();c.translate(tx,ty);sc*=TUNE.tail;c.scale(sc,sc);c.rotate((rot||0)+Math.sin(t*3)*.18);
    if(el==='earth'){c.fillStyle=P.hood;c.beginPath();c.moveTo(-9,-11);c.lineTo(6,-12);c.lineTo(11,-2);c.lineTo(8,9);c.lineTo(-6,11);c.lineTo(-11,1);c.closePath();c.fill()}
    else if(el==='water'){const w=Math.sin(t*4)*1.5;c.fillStyle=P.hood;c.beginPath();c.moveTo(0+w,-16);c.quadraticCurveTo(11,0,7,7);c.quadraticCurveTo(0,14,-7,7);c.quadraticCurveTo(-11,0,0+w,-16);c.fill()}
    else if(el==='fire'){const w=Math.sin(t*11)*2.5;c.fillStyle=P.hood;c.beginPath();c.moveTo(w,-17);c.quadraticCurveTo(-2,-6,8,-2);c.quadraticCurveTo(12,8,2,11);c.quadraticCurveTo(-11,9,-9,0);c.quadraticCurveTo(-7,-8,w,-17);c.fill()}
    else if(el==='wood'){c.fillStyle=P.hood;c.beginPath();c.moveTo(0,-15);c.quadraticCurveTo(12,-4,0,12);c.quadraticCurveTo(-12,-4,0,-15);c.fill();c.strokeStyle=P.vein;c.lineWidth=1.8;c.beginPath();c.moveTo(0,-11);c.lineTo(0,9);c.stroke()}
    c.restore()};
  // 葉っぱの羽（木）
  const wings=front=>{if(o.bed)return;/* ベッドではねをたたむ（ふとんからはみ出さない） */const fl=Math.sin(t*(o.walk?10:3.2))*.12;
    leaf(-16,-60,44,19,-2.5-fl,P.hood);leaf(16,-60,44,19,-.64+fl,P.hood);
    leaf(-18,-40,38,16,2.75+fl,P.hood);leaf(18,-40,38,16,.39-fl,P.hood);
    if(!front){c.globalAlpha=.25;leaf(-16,-60,44,19,-2.5-fl,'#fff');leaf(16,-60,44,19,-.64+fl,'#fff');c.globalAlpha=1}};
  if(el==='wind'&&!back){c.save();c.translate(-tr*9,0);c.scale(1-tr*.3,1);wings(true);c.restore()}
  if(!back&&el!=='wind'&&tr>0)tail(-13-tr*5,-16,1,-.85*tr);/* 正面からはしっぽは見えない *//* 横向きは、ななめにして体のうしろに刺す（体より先に描く） */
  // 腕
  const drawProp=(sx,a)=>spProp(c,prop,sx,a,t,o);
  const armD=(sx,a)=>{c.save();c.translate(sx*14*TUNE.bodyW*(1-tr*.9)+(back?-1:1)*tr*2,-26*TUNE.bodyH);c.rotate(sx*(.35+a));E(sx*9*TUNE.armL,0,10*TUNE.armL,6*TUNE.armW*(tr>.5?1.5:1),0,CREAM,P.line,TUNE.line*.92);if(prop&&sx===-farA&&!back)drawProp(sx,a);E(sx*15*TUNE.armL,0,5*TUNE.hand,5.2*TUNE.hand,0,P.hand);c.restore()};
  const farA=back?1:-1,aA0=sx=>o.carry?-1.85+Math.sin(t*9)*.08:tr>.5?1.22+(o.walk?st*.6:Math.sin(t*1.7)*.05):(back?1:-1)*sx*arm+(back?0:.35)/* 正面は腕を少し下ろす */,/* 横向きは、腕を体の真横にさげて前後にふる */aA=sx=>sx===-farA?(aN!=null?aN:aA0(sx)):(aF!=null&&!o.carry?aF:aA0(sx));if(!bothF&&tr<=.5)armD(farA,aA(farA));if(tr<=.5&&!frontArm)armD(-farA,aA(-farA));
  // からだと足
  c.save();c.scale((1-tr*.18)*TUNE.bodyW,TUNE.bodyH);const sh=o.walk?st*4*tr:0;
  const l1=o.walk?Math.max(0,st)*4*(1-tr*.5):0,l2=o.walk?Math.max(0,-st)*4*(1-tr*.5):0;
  c.fillStyle=CREAM;c.strokeStyle=P.line;c.lineWidth=TUNE.line;c.beginPath();
  if(tr>.5){const sw=o.walk?st*5:0,lf=o.walk?Math.abs(st)*2.5:0;/* 横向きは足を1本だけ見せる */
    c.moveTo(-15,-32);c.quadraticCurveTo(-19,-18,-10+sw,-8-lf);c.quadraticCurveTo(-8+sw,0-lf,-1+sw,0-lf);c.quadraticCurveTo(6+sw,0-lf,9+sw,-8-lf);c.quadraticCurveTo(19,-18,15,-32);c.closePath();c.fill();c.stroke()}
  else{
  c.moveTo(-15,-32);c.quadraticCurveTo(-19,-18,-17-sh,-8-l1);c.quadraticCurveTo(-14-sh,0-l1,-8-sh,0-l1);c.quadraticCurveTo(-3-sh,0-l1,-1,-8);c.lineTo(1,-8);
  c.quadraticCurveTo(3+sh,0-l2,8+sh,0-l2);c.quadraticCurveTo(14+sh,0-l2,17+sh,-9-l2);c.quadraticCurveTo(19,-18,15,-32);c.closePath();c.fill();c.stroke()}c.restore();
  if(tr>.5&&!frontArm)armD(-farA,aA(-farA));
  if(back&&el!=='wind')tail(-tr*12,-17,1.05-tr*.15);
  // 頭
  const nod=A==='eat'?Math.max(0,Math.sin(t*7))*3.2:0;c.save();c.translate(0,-30*TUNE.bodyH+nod);c.rotate(nod*.012);c.scale(TUNE.head,TUNE.head);c.translate(0,36);
  const hx=0,hy=-55;
  if(el==='wind'){
    // つる
    const sw=Math.sin(t*2)*.15;c.save();c.translate((back?1:-1)*tr*4,hy-24);c.rotate(sw);c.strokeStyle=P.tend;c.lineWidth=3;c.beginPath();c.moveTo(0,4);c.quadraticCurveTo(-2,-8,6,-12);c.arc(6,-18,6,Math.PI*.5,Math.PI*2.2);c.stroke();c.restore();
    E(hx,hy,25,22,0,CREAM,P.line,2.6);
    if(back){c.save();c.translate(-tr*9,0);c.scale(1-tr*.3,1);wings(false);c.restore()}
  }else{
    const sw=Math.sin(t*(el==='fire'?7:2.2))*(el==='fire'?2.5:1.4);
    c.save();if(tr>0&&!back){c.translate(-tr*TUNE.sHoodX,0);c.scale(1-tr*(1-TUNE.sHead),1)}/* 横向きは頭巾を少しうしろへ。顔より前に出ないように */
    c.fillStyle=P.hood;c.beginPath();
    if(el==='earth'){c.moveTo(-36,-36);c.quadraticCurveTo(-42,-46,-30,-56);c.quadraticCurveTo(-26,-80,-6,-82);c.quadraticCurveTo(14,-84,22,-70);c.quadraticCurveTo(30,-56,36,-52);c.quadraticCurveTo(44,-44,34,-34);c.quadraticCurveTo(0,-26,-36,-36)}
    else if(el==='water'){c.moveTo(-28,-36);c.quadraticCurveTo(-38,-50,-28,-66);c.quadraticCurveTo(-14,-80,0,-94+sw);c.quadraticCurveTo(10,-108,22,-100+sw);c.quadraticCurveTo(28,-94,22,-92);c.quadraticCurveTo(16,-94,15,-86);c.quadraticCurveTo(18,-76,26,-64);c.quadraticCurveTo(36,-48,26,-36);c.quadraticCurveTo(0,-28,-28,-36)}
    else if(el==='fire'){c.moveTo(-28,-36);c.quadraticCurveTo(-38,-54,-24,-68);c.quadraticCurveTo(-12,-78,-6,-88);c.quadraticCurveTo(0,-100,12+sw,-102);c.quadraticCurveTo(4,-92,10,-82);c.quadraticCurveTo(28,-70,30,-56);c.quadraticCurveTo(34,-44,26,-36);c.quadraticCurveTo(0,-28,-28,-36)}
    else{c.moveTo(-30,-36);c.quadraticCurveTo(-42,-56,-26,-74);c.quadraticCurveTo(-12,-90,6+sw,-104);c.quadraticCurveTo(26,-88,30,-66);c.quadraticCurveTo(38,-48,28,-36);c.quadraticCurveTo(0,-28,-30,-36)}
    c.fill();
    if(el==='wood'){c.strokeStyle=P.vein;c.lineWidth=2.4;c.beginPath();c.moveTo(4+sw*.6,-98);c.quadraticCurveTo(2,-86,0,-76);c.moveTo(1,-86);c.lineTo(-10,-78);c.moveTo(2,-88);c.lineTo(12,-80);c.stroke();c.strokeStyle=P.dark;c.lineWidth=3;c.beginPath();c.moveTo(6+sw,-104);c.quadraticCurveTo(10,-112,16,-112);c.stroke()}
    if(el==='fire'){const dy=Math.sin(t*3)*2.5;c.save();c.translate(24,-112+dy);c.fillStyle=P.hood;c.beginPath();c.moveTo(2,-9);c.quadraticCurveTo(8,0,5,4);c.quadraticCurveTo(0,8,-4,3);c.quadraticCurveTo(-6,-3,2,-9);c.fill();c.restore()}
    if(el==='earth'){const ls=Math.sin(t*2.4)*.18;c.strokeStyle=P.leaf;c.lineWidth=2.6;c.beginPath();c.moveTo(0,-80);c.lineTo(1,-88);c.stroke();leaf(1,-88,20,9,-2.6+ls,P.leaf);leaf(1,-88,30,12,-.55+ls,P.leaf)}
    c.restore();
    if(!back){E(hx+tr*TUNE.sFaceX,hy+TUNE.faceY,TUNE.faceW-tr*TUNE.sFaceW,TUNE.faceH,0,CREAM);/* 横顔は奥行きを短く */
      if(el==='fire'&&tr<.5){c.save();c.translate(tr*9,0);c.fillStyle=P.hood;c.beginPath();c.moveTo(-6,-76);c.quadraticCurveTo(8,-66,4,-50);c.quadraticCurveTo(10,-60,12,-74);c.fill();c.restore()}}
  }
  // 顔
  if(!back){const ey=(el==='wind'?-53:-50)+TUNE.eyeY,xn=TUNE.eyeGap+tr*TUNE.sEye,xf=-TUNE.eyeGap+tr*14,/* 横顔の目は少し奥 */sf=1,showF=tr<.85;
    const md=o.sleep?'':o.mood==='cry'?'teary':o.mood||'',my=ey+9,mx=(xn+xf)/2+tr*TUNE.sMouth;c.strokeStyle=P.eye;c.fillStyle=P.eye;c.lineWidth=2.1;
    const eyeL=(x,w,k)=>{c.beginPath();if(k==='happy'){c.moveTo(x-3*w,ey+1.5);c.quadraticCurveTo(x,ey-3.5,x+3*w,ey+1.5)}else{c.moveTo(x-3*w,ey);c.quadraticCurveTo(x,ey+2.5,x+3*w,ey)}c.stroke()};
    if(o.vr&&o.vr.cheek){const ck=P.cheek;/* ほっぺは、頭巾の色をうすくした色 */E(xn+5+tr*TUNE.sCheek,ey+8-tr*2,4.2*TUNE.cheekS*(1-tr*.25),2.6*TUNE.cheekS,0,ck);if(showF)E(xf-5*sf,ey+8,4.2*TUNE.cheekS*sf,2.6*TUNE.cheekS,0,ck)}/* ほっぺ（目より下のレイヤー） */
    if(o.sleep||(o.blink&&!md))[[xn,1],showF&&[xf,sf]].forEach(e=>e&&eyeL(e[0],e[1]));
    else if(md==='smile'||md==='joy'||md==='eat')[[xn,1],showF&&[xf,sf]].forEach(e=>e&&eyeL(e[0],e[1],'happy'));
    else if(md==='teary'||md==='tear'){/* うるうる・片目の涙：目を開いたまま潤ませる */
      const watery=(x,w)=>{c.save();c.globalAlpha=.7;c.strokeStyle='#8fd3ff';c.lineWidth=1.8;c.beginPath();c.ellipse(x,ey+1.5,TUNE.eyeW*w*.88,TUNE.eyeH*.72,0,0,Math.PI*2);c.stroke();c.globalAlpha=.88;c.fillStyle='#b5e7ff';c.beginPath();c.ellipse(x+TUNE.eyeW*w*.55,ey+TUNE.eyeH*.65,1.4,2,0,0,7);c.fill();c.restore()};
      E(xn,ey+1,TUNE.eyeW,TUNE.eyeH*.92,0,P.eye);if(showF)E(xf,ey+1,TUNE.eyeW*sf,TUNE.eyeH*.92,0,P.eye);
      if(md==='tear'){watery(xn,1)}else{watery(xn,1);if(showF)watery(xf,sf)}
    }
    else if(md==='shock'){E(xn,ey,TUNE.eyeW*1.14,TUNE.eyeH*1.13,0,P.eye);if(showF)E(xf,ey,TUNE.eyeW*1.14*sf,TUNE.eyeH*1.13,0,P.eye)}
    else if(md==='strain'){c.lineWidth=2.3;const ch=(x,d)=>{c.beginPath();c.moveTo(x-3*d,ey-3.5);c.lineTo(x+3*d,ey);c.lineTo(x-3*d,ey+3.5);c.stroke()};if(showF){ch(Math.min(xn,xf),1);ch(Math.max(xn,xf),-1)}else ch(xn,1)}
    else{const eh=md==='sad'?TUNE.eyeH*.78:TUNE.eyeH;E(xn,ey+(md==='sad'?1:0),TUNE.eyeW,eh,0,P.eye);if(showF)E(xf,ey+(md==='sad'?1:0),TUNE.eyeW*sf,eh,0,P.eye)}
    if(md==='sad'){c.lineWidth=2;c.beginPath();c.moveTo(xn-5,ey-10);c.lineTo(xn+3,ey-8);c.stroke()}/* 悲しいときの眉は片側だけ */
    if(o.vr&&o.vr.lash&&md!=='strain'){/* まつ毛：目の外がわに1本。目の形に合わせて付け根をかえる */
      const shut=o.sleep||(o.blink&&!md),hap=!shut&&(md==='smile'||md==='joy'||md==='eat'),k=md==='shock'?1.14:1,sy=md==='sad'?1:0,eh=(md==='sad'?.78:1)*TUNE.eyeH*k;
      const lash=(x,d)=>{let bx,by;if(shut){bx=x+3*d;by=ey}else if(hap){bx=x+3*d;by=ey+1.5}else{bx=x+TUNE.eyeW*k*.8*d;by=ey+sy-eh*.6}
        c.moveTo(bx,by);c.quadraticCurveTo(bx+1.8*d,by-.6,bx+3*d,by-2.4)};
      c.strokeStyle=P.eye;c.lineWidth=1.5;c.beginPath();lash(xn,1);if(showF)lash(xf,-1);c.stroke()}
}
  c.restore();if(bothF)armD(farA,aA(farA));if(frontArm)armD(-farA,aA(-farA));if((A==='eat'||A==='hold')&&o.food&&!back){const ei=emoImg(o.food),yy=A==='hold'?-17:-27+Math.sin(t*7)*.8;if(ei){const ih=40,iw=ih*ei.width/ei.height;c.drawImage(ei,-iw/2,yy-ih/2,iw,ih)}else{c.font='40px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#000';c.fillText(o.food,0,yy);c.textAlign='start';c.textBaseline='alphabetic'}}c.restore();
}
const portCache={};
function spiritPort(el,sz,vr){const k=el+sz+(vr?JSON.stringify(vr):'');if(portCache[k])return portCache[k];const cv=document.createElement('canvas');cv.width=cv.height=sz;const g=cv.getContext('2d');drawSpirit(g,el,sz/2,sz*.97,sz/124,1,{t:0,vr});return portCache[k]=cv.toDataURL()}
const WALLHIT=new Map(),JUMP=new WeakMap(),DOOROP=new Map(),SPV=new WeakMap();
/* ドアの開き：せいれいが近づいたら、通る前に開く（開きはじめにガチャ） */
function doorOp(i,x,y,ax,ay){let d=DOOROP.get(i);if(!d){d={op:0};DOOROP.set(i,d)}d.cx=x/TS+.5;d.cy=y/TS+.5;d.ax=ax;d.ay=ay;return d.op}/* 描くときは読むだけ。開け閉めは stepLooks で進める（ax・ay：せいれいが近いとみなす はんい） */
/* レベルアップ：みんながこっちを向いて拍手する */
/* レベルアップの画面が出ているあいだ、せいれいはこっちを向いて拍手する。タップでおわり */
let CLAPT=-1e9,CLAPON=false,CLAPS=0;function startClap(){CLAPT=performance.now();CLAPON=true;CLAPS=CLAPT}
function endClap(){CLAPON=false;CLAPT=-1e9;if(S)for(const r of S.res)if(r.bubble==='👏')r.bubble=''}
const LVSLOT=[[-21,-30],[21,-18],[-23,-11],[23,-38],[-28,-46],[28,-6]];
function lvCharm(c,el,x,y,t){c.save();c.translate(x,y);c.rotate(Math.sin(t*1.3)*.25);
  if(el==='wood'){c.fillStyle='#5fbf4f';c.beginPath();c.moveTo(0,-5.5);c.quadraticCurveTo(5,-1,0,5.5);c.quadraticCurveTo(-5,-1,0,-5.5);c.fill();c.strokeStyle='#3f8f37';c.lineWidth=1;c.beginPath();c.moveTo(0,-4);c.lineTo(0,4.5);c.stroke()}/* 葉っぱ */
  else if(el==='earth'){c.fillStyle='#a99a86';c.beginPath();c.moveTo(-4.5,1.5);c.lineTo(-3,-3);c.lineTo(1.5,-4.2);c.lineTo(4.6,-1);c.lineTo(3.6,3.4);c.lineTo(-1.5,4.2);c.closePath();c.fill();c.fillStyle='#cbbfae';c.beginPath();c.ellipse(-.8,-1.4,1.8,1.1,-.4,0,7);c.fill()}/* 小石 */
  else if(el==='water'){c.fillStyle='#5fb4f0';c.beginPath();c.moveTo(0,-5.5);c.quadraticCurveTo(4.5,0,3.6,2.4);c.arc(0,2.4,3.6,0,Math.PI);c.quadraticCurveTo(-4.5,0,0,-5.5);c.fill();c.fillStyle='rgba(255,255,255,.75)';c.beginPath();c.ellipse(-1.2,1.6,1,1.5,0,0,7);c.fill()}/* しずく */
  else if(el==='fire'){const f=1+Math.sin(t*9)*.08;c.scale(1,f);c.fillStyle='#ff7a3d';c.beginPath();c.moveTo(0,-6);c.quadraticCurveTo(4.5,-1,3.4,2.4);c.arc(0,2.4,3.4,0,Math.PI);c.quadraticCurveTo(-4,-1,0,-6);c.fill();c.fillStyle='#ffd25a';c.beginPath();c.moveTo(0,-1.5);c.quadraticCurveTo(2.2,1.5,0,4.2);c.quadraticCurveTo(-2.2,1.5,0,-1.5);c.fill()}/* ひのこ */
  else{c.rotate(.6);c.fillStyle='#9fe8d2';c.beginPath();c.moveTo(0,-6.5);c.quadraticCurveTo(4,-1,.6,5.5);c.quadraticCurveTo(-3.6,-1,0,-6.5);c.fill();c.strokeStyle='#3fae8e';c.lineWidth=1;c.lineCap='round';c.beginPath();c.moveTo(0,-5);c.quadraticCurveTo(.6,0,.4,7);c.stroke()}/* 風の羽根 */
  c.restore()}
function carryIcon(r){
  if(r.coffin)return r.act&&r.act.type==='pray'&&r.act.stage==='do'?'':'⚰️';/* おいのりのあいだは、棺はおろしている */
  if(r.act&&r.act.stage==='do'&&r.act.type==='cook')return null;
  if(r.carry&&carryN(r)>0){if(typeof r.carry==='number')return FOODS.mugi.e;const k=r.carryLast&&r.carry[r.carryLast]>0?r.carryLast:Object.keys(r.carry).find(k=>r.carry[k]>0);return FOODS[k]?FOODS[k].e:'🧺'}
  if(r.cmat)return r.cmat.wood?'🪵':'🪨';
  if(r.meal)return typeof r.meal==='number'?'🍙':(r.meal.e||'🍙');
  if(r.cing&&!isNight()){const R=RECIPES.find(x=>x.out===r.cing.rec);return R?FOODS[Object.keys(R.need)[0]].e:'🧺'}/* 夜は料理ができないので、材料を持っている絵は出さない */
  return null}
let COFFIN=null;function coffinBmp(){/* 棺の絵文字を一度だけ描いて、見えている部分だけ切り出す（機種で絵文字の位置がちがっても、まんなかに置ける） */if(COFFIN)return COFFIN.w?COFFIN:null;const N=288,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d');x.font='117px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('⚰️',N/2,N/2);let d;try{d=x.getImageData(0,0,N,N).data}catch(e){return null}let x0=N,y0=N,x1=-1,y1=-1;for(let y=0;y<N;y++)for(let i=0;i<N;i++)if(d[(y*N+i)*4+3]>20){if(i<x0)x0=i;if(i>x1)x1=i;if(y<y0)y0=y;if(y>y1)y1=y}
  if(x1<0){COFFIN={};return null}const w=x1-x0+1,h=y1-y0+1,o=document.createElement('canvas');o.width=w;o.height=h;o.getContext('2d').drawImage(c,x0,y0,w,h,0,0,w,h);COFFIN={c:o,w:w/3,h:h/3};return COFFIN}/* 3倍の大きさで描いて、くっきりさせる（表示は39pxぶん） */
function carryIcons(r){/* 持っているものを、そのまま1つずつ並べる（上に積むほど新しい） */
  const em=k=>FOODS[k]?FOODS[k].e:'🧺',out=[];
  if(r.coffin)return['⚰️'];/* 棺を持っているときは、それだけ */
  if(r.act&&r.act.stage==='do'&&r.act.type==='cook')return out;
  if(typeof r.carry==='number')for(let i=0;i<r.carry;i++)out.push(FOODS.mugi.e);
  else if(r.carry){const ks=Object.keys(r.carry).filter(k=>r.carry[k]>0);if(r.carryLast&&ks.includes(r.carryLast)){ks.splice(ks.indexOf(r.carryLast),1);ks.push(r.carryLast)}for(const k of ks)for(let i=0;i<r.carry[k];i++)out.push(em(k))}
  if(r.cmat){for(let i=0;i<(r.cmat.wood||0);i++)out.push('🪵');for(let i=0;i<(r.cmat.stone||0);i++)out.push('🪨');for(let i=0;i<(r.cmat.bamboo||0);i++)out.push('🎋');for(const[k,e]of[['shina','ic:shina'],['kasa','ic:kasa'],['kuru','ic:kuru'],['chiri','ic:chiri'],['funba','ic:funba'],['eda','chip:drop:eda'],['kinoko','obj:kinoko'],['can','chip:drop:can']])/* 枝・空き缶は、落ちているときと同じ絵 *//* 草・きのこは、その物の絵（小麦などの絵文字にしない） */for(let i=0;i<(r.cmat[k]||0);i++)out.push(e)}
  if(r.meal){if(r.meal.items&&r.meal.items.length)for(const k of r.meal.items)out.push(em(k));else for(let i=0,n=Math.ceil(typeof r.meal==='number'?r.meal:r.meal.u||1);i<n;i++)out.push(typeof r.meal==='number'?'🍙':(r.meal.e||'🍙'))}
  if(!out.length&&r.cing&&!isNight()){const R=RECIPES.find(x=>x.out===r.cing.rec);out.push(R?em(Object.keys(R.need)[0]):'🧺')}
  return out}
const NOFACE={'😊':'🎵','😌':'🎵','😆':'✨','😋':'🍴','😣':'💦','😩':'💤','😴':'💤','😭':'💧','😢':'💧','😨':'💦','😱':'❗','😵':'💫','😠':'💢','😤':'💢'};/* 吹き出しに顔の絵文字は出さない（かわりの絵） */
let BUBQ=null;
function objBelow(r){const j=r.faceObj;if(j==null||j<0)return false;return ((j/W)|0)+.5>r.y+.3&&Math.abs(j%W+.5-r.x)<.6}/* 下にある木・岩は正面のまま */
function drawRes(r,now){
  if(r.spawnT){const e=now-r.spawnT;if(e<450)return;if(e<1300){const k=e<900?(e-450)/450:1,sq=e<900?1:1+Math.sin((e-900)/400*Math.PI)*.18,px=r.x*TS,py=r.y*TS+9,rise=(1-k)*14;
    ctx.save();ctx.translate(px,py-rise);ctx.scale(k*(2-sq),k*sq);ctx.translate(-px,-py);drawRes0(r,now);ctx.restore();return}}
  const yk=r.act&&r.act.type==='shopkeep'&&r.act.stage==='do'&&r.elem!=='wind';if(yk){ctx.save();ctx.translate(0,-20)}/* 屋台の中の店番の子は、20点上に（屋台の台のうしろから見える） */
  drawRes0(r,now);if((r.shU||0)>S.t||r.shDemo&&now<r.shDemo&&r.shDemo-now<4000)drawLeaf(r,now)/* shDemo：おぼえる場面で見せるだけ（守りはかけない） */;if(yk)ctx.restore()}
// ベンチ。front=true のときは、すわった子の前に来る座面のふちと脚だけ
function drawBench(c,x,y,front){/* ベンチは横2マス */
  const L=64;
  if(!front){shadow(c,x+L/2,y+30,L/2-2,3);c.fillStyle='#8a5a33';c.fillRect(x+4,y+5,3,17);c.fillRect(x+L-7,y+5,3,17);
    c.fillStyle='#b9824f';rr(c,x+2,y+6,L-4,4.5,2);rr(c,x+2,y+12,L-4,4,2);c.fillStyle='rgba(255,255,255,.18)';c.fillRect(x+4,y+6.6,L-8,1.2);
    c.fillStyle='#c9935f';rr(c,x+1,y+18,L-2,4,2)}
  c.fillStyle='#a8733f';rr(c,x+1,y+21,L-2,4,1.5);c.fillStyle='#8a5a33';c.fillRect(x+4,y+24,3.2,7);c.fillRect(x+L/2-1.6,y+24,3.2,7);c.fillRect(x+L-7.2,y+24,3.2,7);c.fillStyle='rgba(0,0,0,.12)';c.fillRect(x+1,y+24,L-2,1)}
const SHINE=[[-22,-46,12],[21,-58,13],[-8,-74,8],[25,-30,10],[-27,-22,8],[11,-10,7]];
function star4(c,x,y,r){c.save();c.translate(x,y);c.fillStyle='rgba(255,240,170,.35)';c.beginPath();c.arc(0,0,r*.7,0,7);c.fill();c.fillStyle='#fffbe0';c.strokeStyle='#f2c94c';c.lineWidth=1.2;c.beginPath();c.moveTo(0,-r);c.quadraticCurveTo(r*.18,-r*.18,r,0);c.quadraticCurveTo(r*.18,r*.18,0,r);c.quadraticCurveTo(-r*.18,r*.18,-r,0);c.quadraticCurveTo(-r*.18,-r*.18,0,-r);c.fill();c.stroke();c.fillStyle='#ffd84a';c.beginPath();c.arc(0,0,r*.22,0,7);c.fill();c.restore()}
function rDepth(r){return r.y}
const forageAnim=r=>{const t=r.act.t||0;return t<2?'pluck':t<3.5?'hold':'eat'};
function drawRes0(r,now){
  if(r.hidden&&!peekH(r))return;
  const sleeping=r.act&&r.act.type==='sleep'&&r.act.stage==='do',bedJ=sleeping&&r.act.obj!=null&&BEDSET.has(S.obj[r.act.obj])&&BEDSPR.ok?r.act.obj:-1,benchJ=r.act&&r.act.type==='rest'&&r.act.stage==='do'&&BENCHES.has(S.obj[r.act.obj])?(r.act.seat??r.act.obj):-1;/* ベンチではすわって見える *//* ベッドで眠るときは、まくらに頭をのせて、ふとんをかける */
  const bedH=bedJ>=0&&rotAt(bedJ)===1;/* 横に置いたベッド */const benchR=benchJ>=0?rotAt(r.act.obj):0,benchV=benchJ>=0&&benchR%2===1,benchD=benchR===3?-1:1;/* ベンチは、置いたときの向き（前・右・後ろ・左）にすわる */let sj=bedJ>=0?bedJ:benchJ,px=bedH?(bedJ%W)*TS+BEDHX:sj>=0?(sj%W+.5)*TS:r.x*TS,py=bedH?((bedJ/W)|0)*TS+BEDHY:bedJ>=0?((bedJ/W)|0)*TS+BEDVY:benchJ>=0?(((benchJ/W)|0)+.5)*TS+1:r.y*TS;const talking=DLGA.who===r.name&&!(DLGEL||(DLGEL=$('#dialog'))).hidden,walking=!talking&&r.act&&(r.act.stage==='walk'&&r.path.length>0||r.act.type==='tag');/* 話しているときはこっちを向く */
  const working=!onHold(r)&&r.act&&r.act.stage==='do'&&['till','sow','plant','build','craft','water','tend','repair','harvest','gather','chop','mine','cook'].includes(r.act.type);
  if(!SPV.has(r))SPV.set(r,{x:r.x,y:r.y,back:false,turn:0,bl:now+2000+Math.random()*3000});const v=SPV.get(r),dx=r.x-v.x,dy=r.y-v.y;
  if(!walking){v.back=false;v.turn=r.act&&r.act.stage==='do'&&(r.act.type==='chop'||r.act.type==='mine')&&!objBelow(r)||benchV?1:0}/* 木・岩は横向きで、そちらを向いて切る */else if(Math.abs(dx)+Math.abs(dy)>.002){const ax=Math.abs(dx),ay=Math.abs(dy);v.turn=ax>ay*1.2?1:0;v.back=!v.turn&&dy<0}{const cj=(r.y|0)*W+(r.x|0),n=r.path&&r.path.length?r.path[0]:-1;if(n>=0&&n===cj-W&&(jumpEdge(cj,n)&&hiAt(n)>hiAt(cj)||ladderLink(n,cj))||LADDERS.has(S.obj[cj])&&ladderDir(cj)===0&&n>=0){v.back=true;v.turn=0}}/* 正面のがけをよじのぼるときは、うしろ向き */v.x=r.x;v.y=r.y;
  v.side=false;{const sj=(r.y|0)*W+(r.x|0),so=S.obj[sj];if(!walking&&r.act&&r.act.stage==='do'&&so&&ROTS[so]===4&&SEATS.includes(so)){const ro=rotAt(sj);v.back=ro===2;v.turn=ro===1||ro===3?1:0;if(v.turn)r.face=ro===1?1:-1;v.side=!!v.turn}if(!walking&&benchJ>=0)v.back=benchR===2}/* ベンチで「後ろ」向きなら、せなかが見える *//* いすにすわっている子は、いすの向きにすわる（うしろ向きのいすなら、うしろ向き） */
  const at=r.act&&r.act.type,ad=r.act&&r.act.stage==='do',jt=JUMP.get(r),held=HOLD.has(r.id),jumping=held||jt!=null&&now-jt<1000;
  const reacting=(at==='sevreact'||at==='phew')&&ad&&r.act.reactAt!=null,rm=reacting?r.act.reactMotion:'',rp=reacting?dialoguePose(rm,now-r.act.reactAt):null;if(rp){const k=rm==='phew'?1:.4;px+=rp.x*k;py+=rp.y*k}
  const brave=now-(BRAVET.get(r)||-1e9)<1500;/* 勇ましい顔は、行動の切りかわりや、たたかれた時に、ちらちら消えないよう、1.5秒つづける */
  const mood=reacting?({joy:'joy',shock:'shock',sad:'teary',think:'sad',nod:'smile',phew:'smile'}[rm]||'smile'):at==='watchpost'&&ad?(hostileNow(r)?'shock':bowNow(r,now)?'brave':'')/* 見張り台の上：コワイノが来るとこわがる（泣かない） */:((r.cryU||0)>S.t&&at!=='sleep'||r.coffin||at==='bury'||at==='pray'||at==='shiver')?'teary':/* 棺をはこぶ・埋葬するときは、うるうる顔 */r.hunger<20?'sad':(JOYU.get(r)||0)>now?'joy':(ad&&['chop','mine','till','build','repair','weed'].includes(at))?'strain'/* 雑草をぬくときも >< の顔 */:jumping?'joy':at==='flee'?'strain':brave?'brave'/* たたかいに行く・たたいているときは、勇ましい顔 */:r.hurt>25?'strain':(at==='eat'&&ad)?'eat':(ad&&['play','chat','chatwait','npl','fish','tag','rest','bathe','bon','yatai','fwalk','hanabi','dance','shopkeep'].includes(at))||at==='tag'?'smile':'';
  const bob=(walking?Math.abs(Math.sin(now/110+r.id))*2.5:0)+(()=>{const jt=JUMP.get(r),d=jt==null?-1:now-jt;return d>=0&&d<1000?Math.abs(Math.sin(d/130))*9*(1-d/1000):0})();
  {const sw=Math.max(r.swing||0,r.swingT||0),sd=now-sw;if(sw&&sd>=0&&sd<280)px+=(r.face<0?-1:1)*Math.sin(sd/280*Math.PI)*8}/* 攻撃のとき、前にとびだす */
  if(at==='shiver'&&ad)px+=Math.sin(now/26+r.id*3)*1.4;/* ふるえる */
  const tubB=at==='bathe'&&ad&&r.act.tub!=null&&r.act.in>0,wade=at==='bathe'&&ad&&r.act.in>0?r.act.in:0;/* 水浴び：水の中では下半分がかくれる */
  {const tp=toyPose(r,now);if(tp){px=tp.x;py=tp.y-9}}/* 遊具の上で遊ぶ */if(sj<0&&!wade&&!toyR(r))shadow(ctx,px,py+8,12,3.6);
  const lvR=rLv(r);
  const tt=now/1000+r.id*1.7,fy=py+9-bob;
  if(at==='craft'&&ad){const o=S.orders.find(q=>q.id===r.act.order),mx=px+(r.face<0?-1:1)*15,my=py+11;/* 材料（板）を、せいれいの前に置く。のこぎりが板の上にくるよう、せいれいより先に描く */
    shadow(ctx,mx,my+1,12,2.6);ctx.fillStyle='#8a5a33';ctx.fillRect(mx-9,my-6,2.4,7);ctx.fillRect(mx+6.6,my-6,2.4,7);
    ctx.fillStyle='#c9935f';rr(ctx,mx-12,my-9,24,4.5,1.5);ctx.fillStyle='#b9824f';rr(ctx,mx-11,my-13,20,4,1.5);ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(mx-10,my-12.6,17,1);
    if(o&&o.type&&BL[o.type].mat&&BL[o.type].mat.stone){circ(ctx,mx+9,my-10,3.4,'#a3a6ae');circ(ctx,mx+8,my-11,1.4,'#d4d5da')}}
  ctx.save();// 発熱対策：ぼかし影はなし
  if(bedH){ctx.translate(px,fy);ctx.rotate(-Math.PI/2);ctx.scale(BEDHS,1);ctx.translate(-px,-fy)}/* 横のベッドでは、頭をまくら（左）にして横になる */
  if(wade){ctx.beginPath();ctx.rect(px-40,fy-90,80,tubB?Math.max(0,fy+(((r.act.tub/W)|0)*TS+17-fy)*wade-(fy-90)):90-wade*11);ctx.clip()}
  const wpA=r.act&&r.act.type==='watchpost'&&r.act.stage==='do'?r.act:null,onWP=wpA&&(wpA.cl||0)>=1;if(wpA&&!onWP)v.back=true;{const sw=Math.max(r.swing||0,r.swingT||0);if(sw&&now>=sw&&now-sw<700)v.back=!!r.fback}/* たたくときは、敵のほうを向く（うしろの敵には、うしろ向き） *//* 見張り台のハシゴは、うしろ向きでよじのぼる。上では弓をかまえる */
  const ci0=carryIcon(r),an=r.act&&r.act.stage==='do'&&!sleeping&&!onHold(r)?(r.act.type==='bathe'&&r.act.tub!=null?'tubbath':r.act.type):'';const joy=(JOYU.get(r)||0)>now&&!sleeping,clap=(CLAPON||now-CLAPT<3200||joy)&&!sleeping,wv=!clap&&!sleeping&&(r.waveU||0)>S.t,facePlayer=!$('#dialog').hidden&&DLGN.has(r.name)&&!clap&&!sleeping;/* 会話中は話し手がこちらを向く */const pk=(()=>{const sw=Math.max(r.swing||0,r.swingT||0),sd=now-sw;return sw&&sd>=0&&sd<420&&!clap&&!sleeping?sd/420:null})();drawSpirit(ctx,r.elem,px,fy,.435,clap?1:benchV&&!facePlayer?benchD:r.face<0?-1:1,{dot:1,t:tt,vr:r.vr,banzai:held,pp:onWP?(bowNow(r,now)?(now-r.bowT)/700:1):pk,anim:CLIMB.has(r)?'climb':onWP?(bowNow(r,now)?'bow':'bowidle'):pk!=null?'punch':clap?'clap':wv?'wave':reacting?({shock:'talkshock',think:'talkthink',sad:'talksad',nod:'talk'}[rm]||(an==='forage'?forageAnim(r):an)):(an==='forage'?forageAnim(r):an),food:(an==='eat'||an==='forage'&&r.act.t>=2)&&!clap?(r.act.e||'🍙'):'',/* ベリーを直接とって食べるときも、手に持って食べる */carry:!!ci0&&!clap&&an!=='pray',back:clap||wv||facePlayer?false:v.back,turn:clap||wv||facePlayer?0:v.turn,mood,walk:walking,work:working,sleep:sleeping,bed:bedJ>=0,sit:(benchV||v.side)&&!facePlayer/* 横に置いたいす・ベンチは、横向きにすわる */,blink:now>v.bl,lean:rp?rp.angle:sleeping?Math.sin(tt*.8)*.06:0});ctx.restore();{const sj2=(r.y|0)*W+(r.x|0),o2=S.obj[sj2];if(o2&&SEATS.includes(o2)&&r.act&&r.act.stage==='do'&&!walking){const f=chipOf(o2,sj2,null,'.front');if(f)drawChip(ctx,f,o2,(sj2%W)*TS,((sj2/W)|0)*TS,now,sj2)}}/* いすにすわる子の手前に、いすの「.front」（後ろ向きのいすの背もたれなど）を重ねる */
  if(lvR>=5&&!sleeping&&!wade){const n=Math.min(6,Math.floor(lvR/5));for(let i=0;i<n;i++){const SL=LVSLOT[i],bx=px+SL[0]+Math.cos(now/900+i*2.1+r.id)*1.5,by=fy+SL[1]+Math.sin(now/700+i*1.7+r.id)*2.6;lvCharm(ctx,r.elem,bx,by,now/1000+i+r.id)}}/* Lv5ごとに1つ、属性の小物がまわりにふわふわ浮かぶ（顔や体にはかさねない） */
  if(r.shine&&now>=r.shine&&now-r.shine<3500&&!wade){const e=(now-r.shine)/3500;for(let i=0;i<6;i++){const SP=SHINE[i],tw=Math.sin(now/160+i*1.9),k=Math.max(0,(.55+.45*tw)*(e>.75?(1-e)/.25:1));if(k>0)star4(ctx,px+SP[0],fy+SP[1]-e*8,SP[2]*k)}}/* 水浴びのあと：キラキラ */
  if(tubB){const wl=((r.act.tub/W)|0)*TS+17;ctx.fillStyle='rgba(255,255,255,.85)';for(let k=0;k<5;k++){const bx=px-9+k*4.5+Math.sin(now/700+k*1.7)*1.2,ph=(now/1400+k*.23+r.id)%1;ctx.globalAlpha=.55+.4*Math.sin(now/500+k);ctx.beginPath();ctx.arc(bx,wl+.5-Math.sin(ph*Math.PI)*.8,1.7+((k*7)%3)*.45,0,7);ctx.fill()}ctx.globalAlpha=1}/* 湯ぶねのあわ */
  else if(wade){const wl=fy-wade*11,rp=(now/900+r.id)%1;ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(px,wl,11+rp*6,3+rp*1.5,0,0,7);ctx.globalAlpha=1-rp*.8;ctx.stroke();ctx.globalAlpha=1;ctx.strokeStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.ellipse(px,wl,10,2.6,0,0,7);ctx.stroke()}/* 水面の波紋 */
  /* ベンチは1つの物として、すわった子の後ろにまとめて描く */
  let by=fy-27;
  const ci=carryIcon(r);
  const over=()=>{
  if(ci){const cb=walking?Math.abs(Math.sin(now/110+r.id))*1.2:0;ctx.font='26px sans-serif';ctx.fillStyle='#000';ctx.textAlign='center';ctx.textBaseline='middle';{let cl=carryIcons(r);if(!cl.length)cl=[ci];if(!cl[0])cl=[];const hn=cl.length;/* 持っている数だけ、そのまま積む */if(cl[0]==='⚰️'){const cb0=coffinBmp(),cy=fy-(r.elem==='wood'?34:29)-cb+10;if(cb0)ctx.drawImage(cb0.c,px-cb0.w/2,cy-cb0.h,cb0.w,cb0.h);cl=[]}/* 棺は、いつもの1.5倍の大きさ（39px）で、頭の上に乗せる（木の子は葉っぱの上） */for(let i=0;i<cl.length;i++){const e1=cl[i],ei=emoImg(e1),ox=(i%2?3:-3)*(hn>1?1:0),oy=-i*7;if(ei){const k=30/Math.max(ei.width,ei.height),iw=ei.width*k,ih=ei.height*k;ctx.drawImage(ei,px-iw/2+ox,fy-47-cb-ih/2+oy+(e1==='⚰️'?7:0),iw,ih)}else if(!/^(obj|ic|chip):/.test(String(e1)))ctx.fillText(e1,px+ox,fy-47-cb+oy)}}/* たくさん持つときは、アイコンを上へ重ねる（いちばん下の位置は、数がふえても下げない） */ctx.textAlign='start';ctx.textBaseline='alphabetic'}
  const gx=bedH?px-10:px,gy=bedH?py+20:py+11;/* 横のベッドで寝ているときは、横になった体の下のまん中に出す */
  if(!(r.hurt>0)&&S.t-(r.eUp||-9)<3&&r.energy<99.5){const v=r.energy/100,bx=gx-12,byy=gy;ctx.fillStyle='rgba(0,0,0,.45)';rr(ctx,bx,byy,24,5,2.5);ctx.fillStyle='#7ed99a';rr(ctx,bx+1,byy+1,Math.max(2,22*v),3,1.5);const ph=(now/600)%1;ctx.globalAlpha=1-ph;ctx.fillStyle='#7ed99a';ctx.font='9px \"PixelMplus10\",\"Hikomi\",\"Hiragino Maru Gothic ProN\",sans-serif';ctx.textAlign='center';ctx.fillText('+',gx+15,byy+4-ph*8);ctx.globalAlpha=1}/* 元気が回復中：みどりのバー */
  if(r.hurt>0){const v=r.hunger/hMax(r),a=Math.min(1,r.hurt/8);ctx.globalAlpha=a;ctx.fillStyle='rgba(0,0,0,.6)';rr(ctx,gx-12,gy,24,5,2.5);ctx.fillStyle=v>.5?'#7ee08a':v>.25?'#ecdcbc':'#ff6b6b';rr(ctx,gx-11,gy+1,Math.max(2,22*v),3,1.5);ctx.globalAlpha=1}
  if(at==='craft'&&ad){const o=S.orders.find(q=>q.id===r.act.order);if(o){const f=Math.min(1,o.prog/o.need),bx=px-16,byy=py+(r.hurt>0?19:12);ctx.fillStyle='rgba(150,115,75,.5)';rr(ctx,bx-1.5,byy-1.5,35,8,4);ctx.fillStyle='#e8dcc0';rr(ctx,bx,byy,32,5,2.5);ctx.fillStyle='#e0a43a';rr(ctx,bx,byy,Math.max(2.5,32*f),5,2.5)}}/* 依頼の作業の進み具合は足もと。吹き出しは上に出す */
  if(r.act&&r.act.stage==='do'&&WORKP[r.act.type]&&WORKP[r.act.type](r,r.act)!=null){const f=Math.max(0,Math.min(1,WORKP[r.act.type](r,r.act)||0)),bx=px-16,byy=py+(r.hurt>0?19:12);ctx.fillStyle='rgba(150,115,75,.5)';rr(ctx,bx-1.5,byy-1.5,35,8,4);ctx.fillStyle='#e8dcc0';rr(ctx,bx,byy,32,5,2.5);ctx.fillStyle='#e0a43a';rr(ctx,bx,byy,Math.max(2.5,32*f),5,2.5)}/* 木を切る・石を掘る・畑・建てる・料理など、作業の進み具合 */
  if(r.act&&r.act.type==='repair'&&r.act.stage==='do'&&r.act.obj!=null){const a=r.act,p=Math.min(1,(a.t||0)/repairTime(a)),gx=(a.obj%W)*TS+2,gy=((a.obj/W)|0)*TS-8,g=()=>{ctx.fillStyle='rgba(0,0,0,.5)';rr(ctx,gx,gy,28,6,3);ctx.fillStyle='#ecdcbc';rr(ctx,gx+1,gy+1,26*p,4,2)};if(BUBQ)BUBQ.push(g);else g()}/* 修理の進みぐあい *//* 話したそうな吹き出しが出ていても、修理・料理のバーは出す（その場所のバーなので） */
  if(r.act&&r.act.type==='cook'&&r.act.stage==='do'&&r.act.obj!=null&&r.cing){const a=r.act,tot=cookTime(r,a.obj),p=Math.min(1,(a.t||0)/Math.max(1,tot)),gx=(a.obj%W)*TS+2,gy=((a.obj/W)|0)*TS-12,g=()=>{ctx.fillStyle='rgba(0,0,0,.5)';rr(ctx,gx,gy,28,6,3);ctx.fillStyle='#ffd38a';rr(ctx,gx+1,gy+1,26*p,4,2)};if(BUBQ)BUBQ.push(g);else g()}/* 料理の進みぐあい */
  {const a=r.act;if(a&&a.stage==='do'&&a.obj!=null&&(a.type==='repair'||a.type==='cook'&&r.cing)){const gx=(a.obj%W)*TS+2,gy=((a.obj/W)|0)*TS-(a.type==='cook'?12:8);if(Math.abs(px-(gx+14))<34&&by-45<gy+6&&by-15>gy)by=gy+13}}/* 修理・料理のバーとふきだしが重なるときは、ふきだしをバーの上へ */
  const zzz=r.act&&r.act.type==='sleep';/* 寝ているあいだは、話しかけの吹き出しを出さない */
  if(!zzz&&QUESTCLEARW===r.name&&!isNight()){talkBub(px,by,now,'#ffd56b');return}
  if(r.act&&(r.act.type==='eat'||r.act.type==='forage')&&r.act.stage==='do'&&!zzz){const p=Math.max(0,Math.min(1,r.hunger/hMax(r))),gx=px-12,gy=py+11,g=()=>{ctx.fillStyle='rgba(0,0,0,.5)';rr(ctx,gx,gy,24,6,3);ctx.fillStyle=p>=.999?'#8fd36a':'#ffc766';rr(ctx,gx+1,gy+1,Math.max(2,22*p),4,2)};if(BUBQ)BUBQ.push(g);else g()}/* ごはん中の、お腹ゲージの回復 */
  if(!zzz&&TALKW===r.name){talkBub(px,by,now);return}
  if(!zzz&&SEVW[r.name]){talkBub(px,by,now,'#ffb3d1');return}
  if(!zzz&&SUBW[r.name]){talkBub(px,by,now,'#ffd56b');return}/* サブクエスト：黄色の吹き出し *//* 話したそうにしている：水色の吹き出し */
  if(CLAPON)return;/* 拍手中は吹き出しを出さない */
  const warn=r.hunger<20;
  if(!ci&&(r.bubble||warn)){const t=NOFACE[warn&&!r.bubble?'🍙':r.bubble]||(warn&&!r.bubble?'🍙':r.bubble);/* 顔の絵文字は使わない */
    {const a=r.act;if(a&&a.stage==='do'&&(a.type==='mine'||a.type==='chop')&&NATHIT.has(a.obj)&&Math.abs((a.obj%W+.5)*TS-px)<TS+20){const yb=natBarY(a.obj);if(by-45<yb+7&&by-15>yb-2)by=yb+12}}/* 木・岩ののこりのバーと重なるときは、ふきだしをバーの上へ */
    ctx.font='16px sans-serif';const pic=/^(obj|ic|chip):/.test(String(t)),bw=pic?27:Math.max(27,Math.ceil(ctx.measureText(t).width)+9);/* 絵のアイコンは、絵文字と同じはば *//* 吹き出しは1.5倍 */
    ctx.fillStyle=warn?'#ffd2cc':'#fff';rr(ctx,px-bw/2,by-45,bw,24,9);ctx.beginPath();ctx.moveTo(px-4.5,by-21.5);ctx.lineTo(px,by-15);ctx.lineTo(px+4.5,by-21.5);ctx.fill();
    if(t==='💬'){for(let d=-1;d<=1;d++)circ(ctx,px+d*6.5,by-33,2.3,'#7a7064')}/* おしゃべりは点々だけ */
    else if(t==='🪓'&&PSPR.axe&&PSPR.axe.ok){const g=PSPR.axe.img,ih=17,iw=ih*g.width/g.height;ctx.save();ctx.translate(px,by-33);ctx.rotate(-Math.PI/4);ctx.drawImage(g,-iw/2,-ih/2,iw,ih);ctx.restore()}else{const ei=emoImg(t);if(ei){const ih=19.5,iw=ih*ei.width/ei.height;ctx.drawImage(ei,px-iw/2,by-33-ih/2,iw,ih)}else{ctx.font='16px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#000';if(!pic)ctx.fillText(t,px,by-33);ctx.textAlign='start';ctx.textBaseline='alphabetic'}}}};
  if(BUBQ){const T=ctx.getTransform();BUBQ.push(()=>{ctx.save();ctx.setTransform(T);over();ctx.restore()})}else over();/* あとで描くふきだしも、見張り台・段差の上の高さのまま */
}
let GODP=[-.82,-.6];const godX=()=>STATUE>=0?STATUE%W+.5+GODP[0]:CX+.5,godY=()=>STATUE>=0?((STATUE/W)|0)+(S.obj[STATUE+W]==='altar'?GODP[1]:1.9):CY-6.4;/* カミサマは神殿の左の柱の前（おそなえ箱のうしろ）に立つ */
const godHere=()=>S.godShown&&(!S.godGone||S.godVisit);
function talkBub(px,by,now,col){const bw=30,bb=by-Math.abs(Math.sin(now/260))*3;ctx.fillStyle=col||'#9fdcff';rr(ctx,px-bw/2,bb-48,bw,27,10);ctx.beginPath();ctx.moveTo(px-5,bb-21.5);ctx.lineTo(px,bb-14);ctx.lineTo(px+5,bb-21.5);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect?ctx.roundRect(px-bw/2,bb-48,bw,27,10):ctx.rect(px-bw/2,bb-48,bw,27);ctx.stroke();
    for(let d=-1;d<=1;d++)circ(ctx,px+d*7,bb-34.5,2.6,'#1f5f86');}
const HB={t:0,rk:[],ps:[],fl:[]};
function drawHanabi(now){const dt=Math.min(.05,Math.max(0,(now-(HB.t||now))/1000));HB.t=now;const h=hour();
  if(festOn()&&h>=20&&h<21&&!sheet&&Math.random()<dt*1.1){const C=['#ff6b6b','#ffd84a','#7fe8ff','#9cff7a','#ff8cc0','#c9a2ff'];HB.rk.push({x:VW*(.15+Math.random()*.7),y:VH*.62,ty:VH*(.2+Math.random()*.2),col:pick(C),col2:pick(C)})}/* 夜8時から9時は、空に花火 */
  if(!HB.rk.length&&!HB.ps.length&&!HB.fl.length)return;ctx.globalCompositeOperation='lighter';
  for(const k of HB.rk){k.y-=220*dt;ctx.fillStyle='rgba(255,230,180,.8)';ctx.fillRect(k.x-1,k.y,2,6);if(k.y<=k.ty){k.done=1;HB.fl.push({x:k.x,y:k.y,life:.3,col:k.col});for(let i=0;i<48;i++){const a=i/48*6.283,v=95+Math.random()*25;HB.ps.push({x:k.x,y:k.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1.8,col:k.col})}for(let i=0;i<20;i++){const a=i/20*6.283+.15,v=50;HB.ps.push({x:k.x,y:k.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1.4,col:k.col2})}sfx('hanabi')}}/* 外がわの輪と、内がわの輪（べつの色） */
  for(const f of HB.fl){f.life-=dt;const R=70*(1-f.life/.3)+20,g=ctx.createRadialGradient(f.x,f.y,1,f.x,f.y,R);g.addColorStop(0,'rgba(255,250,230,'+(f.life*1.6)+')');g.addColorStop(1,'rgba(255,250,230,0)');ctx.fillStyle=g;ctx.fillRect(f.x-R,f.y-R,R*2,R*2)}HB.fl=HB.fl.filter(f=>f.life>0);/* ひらいた瞬間の光 */
  HB.rk=HB.rk.filter(k=>!k.done);
  ctx.lineCap='round';for(const q of HB.ps){q.life-=dt;const ox=q.x,oy=q.y;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=30*dt;q.vx*=.985;q.vy*=.985;ctx.globalAlpha=Math.max(0,Math.min(1,q.life));ctx.strokeStyle=q.col;ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(ox-q.vx*.06,oy-q.vy*.06);ctx.lineTo(q.x,q.y);ctx.stroke()}/* 光の粒は、すこし尾をひく */
  HB.ps=HB.ps.filter(q=>q.life>0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}
const FESTA={F:{"st_wood":[0,0,94,92,0],"st_fire":[96,0,94,93,0],"st_water":[192,0,94,92,0],"st_earth":[288,0,94,94,0],"st_wind":[384,0,94,94,0],"pole_on":[480,0,27,52,0],"pole_off":[0,96,27,52,0]},img:new Image(),ok:false};FESTA.img.onload=()=>{FESTA.ok=true;dirty=true};FESTA.img.src='assets/g/c8a18330c4.webp';/* おまつりの屋台とちょうちんの柱（いただいた絵）。[x,y,幅,高さ,台のはし]：台のはしより下は、店番の前にかく */
function drawYatai(px,py,front,now,st){const f=FESTA.F['st_'+st.el];if(!FESTA.ok||!f)return;const[sx,sy,w,h]=f,sp=st.el==='wind'?h:0,x0=Math.round(px-w/2),y0=Math.round(py+28-h);/* わたあめの屋台は、店番の子が前に立つので、ぜんぶうしろにかく。ほかの屋台は、ぜんぶ店番の子の前にかく（うしろの板はない） */
  const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;if(front){if(h>sp)ctx.drawImage(FESTA.img,sx,sy+sp,w,h-sp,x0,y0+sp,w,h-sp)}else ctx.drawImage(FESTA.img,sx,sy,w,sp,x0,y0,w,sp);ctx.imageSmoothingEnabled=sm}/* front=0は店番のうしろ、1は前 */
function drawGod(now){
  if(!godHere())return;const GX=godX(),GY=godY(),px=GX*TS,py=GY*TS+Math.sin(now/700)*3;
  shadow(ctx,px,GY*TS+16,14,4);
  if(QUESTCLEARW===GOD){const f=()=>talkBub(px,py-28,now,'#ffd56b');if(BUBQ)BUBQ.push(f);else f()}
  else if(TALKW===GOD){const f=()=>talkBub(px,py-28,now);if(BUBQ)BUBQ.push(f);else f()}
  else if(S.feat.shop){ctx.fillStyle='rgba(31,59,58,.9)';rr(ctx,px-17,py-58,34,13,6);ctx.fillStyle='#ecdcbc';ctx.font='9px \"PixelMplus10\",\"Hikomi\",\"Hiragino Maru Gothic ProN\",sans-serif';ctx.textAlign='center';ctx.fillText('こうかん',px,py-48.5);ctx.textAlign='start'}
  const g=ctx.createRadialGradient(px,py-12,4,px,py-12,36);g.addColorStop(0,'rgba(255,250,210,.4)');g.addColorStop(1,'rgba(255,250,210,0)');ctx.fillStyle=g;ctx.fillRect(px-36,py-48,72,72);
  const G2=SPR.god,GC=window.CHIPS&&CHIPS.god,GI=GC&&chipImgs(GC,'god')[0];if(GI&&GI.ok){const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;ctx.drawImage(GI,Math.round(px*2)/2+GC.ax/2,Math.round((py+16)*2)/2+GC.ay/2,GC.w/2,GC.h/2);ctx.imageSmoothingEnabled=sm}/* ドット絵（1ドットを2×2に分けた細かさ） */else if(G2.ok){const h=58,w=h*G2.w/G2.h;ctx.drawImage(G2.img,px-w/2,py+16-h,w,h)}else{
  circ(ctx,px-10,py+6,7,'#fff');circ(ctx,px+10,py+6,7,'#fff');circ(ctx,px,py+4,9,'#fff');circ(ctx,px-4,py+9,6,'#eef4ff');circ(ctx,px+5,py+9,6,'#eef4ff');
  circ(ctx,px,py-7,8,'#f6d6b0');
  ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(px-7,py-5);ctx.quadraticCurveTo(px,py+8,px+7,py-5);ctx.quadraticCurveTo(px,py-1,px-7,py-5);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(px-6,py-11,3,2,-.4,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(px+6,py-11,3,2,.4,0,7);ctx.fill();
  ctx.fillStyle='#2b2b33';ctx.fillRect(px-4,py-9,3,1.3);ctx.fillRect(px+1,py-9,3,1.3);
  ctx.strokeStyle='#ffd85c';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(px,py-17,6,2,0,0,7);ctx.stroke();}
}
const NSPR={top:{w:232,h:301,src:'assets/g/852a3ab4c0.webp'},L0:{w:30,h:99,src:'assets/g/4d02effd21.webp'},L3:{w:37,h:100,src:'assets/g/92a36730df.webp'},L5:{w:39,h:100,src:'assets/g/a728176f3b.webp'}};/* 草原のヌシ：いただいたデザインの絵（からだ＋脚4本） */
for(const k in NSPR){const g=NSPR[k];g.img=new Image();g.img.onload=()=>{g.ok=1;if(k!=='top'){const cv=document.createElement('canvas');cv.width=g.w;cv.height=g.h;const c=cv.getContext('2d');c.filter='brightness(.9)';c.drawImage(g.img,0,0);g.dark=cv}};g.img.src=g.src}
const NSHEET={f:[[0,0,84,146,1,0,0],[86,0,84,150,1,0,0],[172,0,124,151,1,0,0],[298,0,94,146,1,0,1],[394,0,92,145,1,0,1],[488,0,92,144,1,0,0],[0,153,90,146,1,0,1],[92,153,92,149,1,0,3],[186,153,92,146,1,-1,0],[280,153,92,151,1,0,1],[374,153,90,150,1,-1,0],[466,153,92,155,1,0,3],[0,310,90,150,1,-1,0],[92,310,92,150,1,0,0],[186,310,96,150,1,0,0],[284,310,132,149,1,-3,-1],[418,310,132,151,1,-3,1],[0,463,132,149,1,-3,-1],[134,463,132,149,1,-3,-1],[268,463,132,152,1,-3,2],[402,463,132,153,1,-3,3]],img:new Image(),ok:false};NSHEET.img.onload=()=>{NSHEET.ok=true;dirty=true};NSHEET.img.src='assets/g/5cc61920e6.webp';/* 草原のヌシ様の絵：[x,y,はば,高さ,大きさ]。0〜2：正面・うしろ・横の立ち姿、3〜8：正面を歩く、9〜14：うしろを歩く、15〜20：横を歩く */
const NSHEET2={f:[[0,0,98,157,1,0,1],[100,0,98,163,1,1,1],[200,0,198,151,1,1,0],[400,0,126,155,1,0,0],[0,165,128,155,1,1,0],[130,165,132,154,1,1,-1],[264,165,124,159,1,-2,-2],[390,165,128,155,1,1,0],[0,326,126,155,1,1,1],[128,326,94,164,1,0,0],[224,326,104,163,1,1,0],[330,326,100,163,1,-2,-1],[432,326,106,164,1,1,0],[540,326,100,163,1,-1,-1],[0,492,108,163,1,1,0],[110,492,178,151,1,-1,0],[290,492,180,150,1,-1,0],[0,657,184,150,1,1,0],[186,657,180,150,1,-2,0],[368,657,188,151,1,2,0],[0,810,212,151,1,13,1]],img:new Image(),ok:false};NSHEET2.img.onload=()=>{NSHEET2.ok=true;dirty=true};NSHEET2.img.src='assets/g/c5892fedf5.webp';/* 火のヌシの絵（ならびは草原のヌシと同じ） */
function drawNushi(now){
  const n=S.nushi;if(!n)return;const FIRE=WD!==0,SH=FIRE?NSHEET2:NSHEET;if(FIRE&&!SH.ok)return drawNushiOld(now);/* 火のヌシ */
  const T=NSPR.top;if(!FIRE&&!T.ok)return;
  const px=n.x*TS,py=n.y*TS,f=n.face||1,mv=n.mv||0,K=.5,ph=now/150,st=Math.sin(ph)*mv*.3,bob=mv?Math.abs(Math.sin(ph))*-1.6:Math.sin(now/600)*.8;ctx.save();ctx.globalAlpha=n.app==null?1:n.app;
  const g=ctx.createRadialGradient(px,py-60,8,px,py-60,100);g.addColorStop(0,FIRE?'rgba(255,200,140,.32)':'rgba(190,255,200,.32)');g.addColorStop(1,FIRE?'rgba(255,200,140,0)':'rgba(190,255,200,0)');ctx.fillStyle=g;ctx.fillRect(px-100,py-160,200,200);
  shadow(ctx,px,py+3,34,7);
  if(SH.ok){const fi=(n.dir>0?0:n.dir<0?1:2),F=SH.f[mv?3+fi*6+Math.floor(now/150)%6:fi];/* 0正面・1うしろ・2横（左向き）。歩くときは6コマ */
    const[sx,sy,sw,sh,sc]=F,dw=sw*sc,dh=sh*sc;ctx.save();ctx.imageSmoothingEnabled=false;const hp=n.hop&&now-n.hop<450?Math.sin(Math.PI*(now-n.hop)/450)*7:0;/* 遊びにきた子といっしょに、ぴょんとはねる */ctx.translate(Math.round(px),Math.round(py+4+(mv?0:bob)-hp));/* ドット絵（1ドット＝ゲームの1点）。ドットがくずれないように、整数の位置にかく */if(!n.dir&&f>0)ctx.scale(-1,1);/* 絵は左向き。右を向くときは反転 */ctx.drawImage(SH.img,sx,sy,sw,sh,-dw/2+(F[5]||0)*sc,-dh+(F[6]||0)*sc,dw,dh)/* 6・7番めは、からだの位置をそろえるずらし（ドット） */;ctx.restore()}
  else if(n.dir){drawNushiFB(ctx,px,py+4+bob,n.dir<0,now,mv)}else{
  ctx.save();ctx.translate(px,py+4+bob);ctx.scale(-f*K,K);ctx.translate(-117,-301);/* 絵は左向き。f=1で右を向く */
  /* 脚は、からだより先にかく（つけ根はからだにかくれる）。奥の脚は少し暗く */
  const LG=[['L5',154,201,1,1],['L3',77,203,1,-1],['L5',164,201,0,-1],['L0',68,203,0,1]];
  for(const[k,x,y,dk,sg]of LG){const L=NSPR[k];if(!L.ok)continue;ctx.save();ctx.translate(x+15.2,y+13.5);ctx.rotate(st*sg);ctx.drawImage(dk&&L.dark?L.dark:L.img,-15.2,-13.5,L.w,L.h);ctx.restore()}
  ctx.drawImage(T.img,0,0,T.w,T.h);
  ctx.restore()}
  // まう葉と光
  for(let i=0;i<7;i++){const t=now/1800+i*.9,r=36+(i%3)*10,x=px+Math.cos(t)*r,y=py-66+Math.sin(t*1.3)*24-(i%2)*14;ctx.globalAlpha=.5+.35*Math.sin(t*2);
    if(FIRE){circ(ctx,x,y,i%2?2.2:1.6,i%2?'#ffb35a':'#fff0c8')}else if(i%2){ctx.fillStyle='#7fe39a';ctx.beginPath();ctx.ellipse(x,y,3.5,1.6,t*2,0,7);ctx.fill()}else{circ(ctx,x,y,1.8,'#eaffd8')}}/* 火のヌシのまわりは、火の粉 */
  ctx.globalAlpha=1;ctx.restore();
}
/* ヌシ様の正面・うしろ姿（横向きの絵にあわせて、スクリプトで描く） */
function drawNushiFB(c,px,py,back,now,mv){
  const CR='#fdf8ec',OL='#e2d9c3',GR='#7ccf86',GD='#4fae63',PK='#f7a8bf',ph=now/150,lg=k=>mv?Math.max(0,Math.sin(ph+k*Math.PI))*-4:0;
  const leaf=(x,y,rx,ry,a,col)=>{c.fillStyle=col||GR;c.beginPath();c.ellipse(x,y,rx,ry,a,0,7);c.fill()};
  const legC=(x,y0,h,w,col)=>{c.fillStyle=col;c.strokeStyle=OL;c.lineWidth=1;c.beginPath();c.roundRect(x-w/2,y0,w,h,w/2);c.fill();c.stroke()};
  const antl=(sg)=>{c.strokeStyle=GD;c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(sg*5,-96);c.quadraticCurveTo(sg*14,-112,sg*22,-128);c.moveTo(sg*12,-108);c.lineTo(sg*26,-112);c.moveTo(sg*17,-118);c.lineTo(sg*12,-132);c.stroke();
    leaf(sg*22,-131,4,7,sg*.4);leaf(sg*28,-113,6,3.5,sg*-.3);leaf(sg*11,-135,3.5,6,sg*-.3);leaf(sg*19,-122,5,3,sg*.6,GD);circ(c,sg*25,-120,2.6,PK)};
  const head=()=>{antl(-1);antl(1);
    for(const sg of[-1,1]){c.save();c.translate(sg*14,-91);c.rotate(sg*-.35);c.fillStyle=CR;c.strokeStyle=OL;c.beginPath();c.moveTo(-sg*3,-3);c.quadraticCurveTo(sg*6,-5,sg*10,0);c.quadraticCurveTo(sg*6,4,-sg*3,3);c.fill();c.stroke();if(!back){c.fillStyle=PK;c.beginPath();c.moveTo(-sg*1,-1.5);c.quadraticCurveTo(sg*5,-2.5,sg*7.5,0);c.quadraticCurveTo(sg*5,2,-sg*1,1.5);c.fill()}c.restore()}
    c.fillStyle=CR;c.strokeStyle=OL;c.lineWidth=1.2;c.beginPath();c.ellipse(0,-86,12,13,0,0,7);c.fill();c.stroke();
    leaf(-6,-98,6,3,-.3);leaf(5,-99,6,3,.3);leaf(0,-101,4,3,0,GD);/* つのの根もとの葉 */
    if(!back){c.fillStyle='#fffdf6';c.beginPath();c.ellipse(0,-77,7,6,0,0,7);c.fill();circ(c,0,-74.5,2.2,'#3a3a3a');
      c.fillStyle='#2f6a43';for(const sg of[-1,1]){c.beginPath();c.ellipse(sg*5.5,-87,2.2,2.8,0,0,7);c.fill()}}};
  const mane=()=>{for(let i=0;i<5;i++){const y=-70+i*5;leaf(-8+i*.5,y,6,3.2,-.5,i%2?GD:GR);leaf(8-i*.5,y,6,3.2,.5,i%2?GR:GD)}};
  c.save();c.translate(px,py-2);
  if(!back){
    legC(-12,-26+lg(1),26,5,'#f1ead8');legC(12,-26+lg(0),26,5,'#f1ead8');/* うしろ脚 */
    c.fillStyle=CR;c.strokeStyle=OL;c.lineWidth=1.2;c.beginPath();c.ellipse(0,-36,18,15,0,0,7);c.fill();c.stroke();leaf(-12,-32,3,5.5,.3);leaf(13,-38,3,5,-.3);
    legC(-7,-24+lg(0),24,5.5,CR);legC(7,-24+lg(1),24,5.5,CR);/* 前脚 */
    c.fillStyle=CR;c.beginPath();c.moveTo(-8,-46);c.lineTo(-6,-80);c.lineTo(6,-80);c.lineTo(8,-46);c.fill();mane();head();
  }else{
    head();c.fillStyle=CR;c.beginPath();c.moveTo(-8,-46);c.lineTo(-6,-80);c.lineTo(6,-80);c.lineTo(8,-46);c.fill();mane();
    legC(-7,-24+lg(0),24,5,'#f1ead8');legC(7,-24+lg(1),24,5,'#f1ead8');/* 前脚（奥） */
    c.fillStyle=CR;c.strokeStyle=OL;c.lineWidth=1.2;c.beginPath();c.ellipse(0,-36,18,15,0,0,7);c.fill();c.stroke();
    c.strokeStyle=GR;c.lineWidth=2;c.beginPath();c.moveTo(0,-50);c.quadraticCurveTo(-6,-40,0,-32);c.quadraticCurveTo(6,-26,0,-22);c.stroke();/* せなかのつる */
    legC(-12,-24+lg(1),24,5.5,CR);legC(12,-24+lg(0),24,5.5,CR);/* うしろ脚（手前） */
    leaf(-4,-30,5,7,-.4,GR);leaf(4,-30,5,7,.4,GD);leaf(0,-34,4,6,0,GR);/* しっぽの葉 */
  }
  c.restore()}

function drawNushiOld(now){
  const n=S.nushi;if(!n)return;const px=n.x*TS,py=n.y*TS,f=n.face||1,b=Math.sin(now/500)*1.5;
  const g=ctx.createRadialGradient(px,py-16,6,px,py-16,60);g.addColorStop(0,'rgba(220,255,220,.35)');g.addColorStop(1,'rgba(220,255,220,0)');ctx.fillStyle=g;ctx.fillRect(px-60,py-76,120,120);
  shadow(ctx,px,py+6,26,6);
  ctx.save();ctx.translate(px,py);ctx.scale(f,1);
  ctx.strokeStyle='#e9efe6';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-14,-8);ctx.lineTo(-15,4);ctx.moveTo(-6,-8);ctx.lineTo(-5,4);ctx.moveTo(8,-8);ctx.lineTo(9,4);ctx.moveTo(15,-8);ctx.lineTo(16,4);ctx.stroke();
  ctx.fillStyle='#f4f8f0';ctx.beginPath();ctx.ellipse(0,-14+b,22,11,0,0,7);ctx.fill();
  ctx.fillStyle='#dfe8dc';ctx.beginPath();ctx.ellipse(-2,-9+b,18,5,0,0,7);ctx.fill();
  ctx.fillStyle='#f4f8f0';ctx.beginPath();ctx.moveTo(14,-20+b);ctx.lineTo(22,-34+b);ctx.lineTo(28,-30+b);ctx.lineTo(22,-16+b);ctx.fill();
  circ(ctx,26,-34+b,7,'#f4f8f0');ctx.fillStyle='#2b2b33';ctx.fillRect(27,-36+b,2,2);
  ctx.strokeStyle='#9ff0b0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(24,-40+b);ctx.lineTo(20,-52+b);ctx.lineTo(14,-56+b);ctx.moveTo(21,-48+b);ctx.lineTo(26,-55+b);ctx.moveTo(28,-40+b);ctx.lineTo(34,-50+b);ctx.lineTo(40,-52+b);ctx.moveTo(33,-47+b);ctx.lineTo(32,-56+b);ctx.stroke();
  ctx.lineCap='butt';ctx.restore();
}
/* ---------- 「コワイノ」の絵 ---------- */
// 足元(0,0)基準・高さ約100単位。o:{t,back,walk,flash}
const KGS={basic_f:{w:100,h:167,arms:[[-1, 30.0, 119.8, 13], [1, 68.0, 120.5, 14]],src:'assets/g/eb6bcf47cf.webp'},
basic_b:{w:99,h:168,arms:[[-1, 28.0, 120.5, 14], [1, 68.0, 120.5, 14]],src:'assets/g/aedd528ff2.webp'},
fast_f:{w:139,h:169,arms:[],src:'assets/g/b4bf6cc5ec.webp'},
fast_b:{w:137,h:168,arms:[],src:'assets/g/3efce8d30c.webp'},
thief_f:{w:144,h:166,arms:[[-1, 35.0, 114.2, 17]],src:'assets/g/a26c29eafd.webp'},
thief_b:{w:117,h:165,arms:[[-1, 32.0, 115.0, 18]],src:'assets/g/611848f979.webp'},
brute_f:{w:139,h:161,arms:[[-1, 48.0, 114.8, 13], [1, 86.0, 115.2, 13]],src:'assets/g/4a39f03f83.webp'},
brute_b:{w:138,h:159,arms:[[-1, 47.0, 112.5, 12], [1, 87.0, 113.0, 12]],src:'assets/g/a312cdf470.webp'},
boss_f:{w:266,h:201,arms:[],src:'assets/g/1c122dcb9e.webp'},
boss_b:{w:220,h:200,arms:[],src:'assets/g/9ed430b84b.webp'}};
// イラストを切り抜いた絵。腕だけ消してあり、下ろした腕をコードで描いて動かす
const BEDSPR={w:160,h:163,src:'assets/g/88c626b7df.webp'};BEDSPR.img=new Image();BEDSPR.img.onload=()=>{BEDSPR.ok=1;if(typeof iconCache!=='undefined')delete iconCache.bed;if(typeof rebuildStatic==='function'&&S)rebuildStatic(true)};BEDSPR.img.src=BEDSPR.src;
const SPR={god:{w:72,h:150,src:'assets/g/c48b773300.webp'},site:{w:104,h:91,src:'assets/g/e757fabc49.webp'}};
for(const k in SPR){const g=SPR[k];g.img=new Image();g.img.onload=()=>{g.ok=1;if(k==='site')artLoaded()};g.img.src=g.src}
for(const k in KGS){const g=KGS[k];g.img=new Image();g.img.onload=()=>{const cv=document.createElement('canvas');cv.width=g.w;cv.height=g.h;const x=cv.getContext('2d');x.drawImage(g.img,0,0);x.globalCompositeOperation='source-atop';x.fillStyle='#f4eefa';x.fillRect(0,0,g.w,g.h);g.white=cv;g.ok=1};g.img.src=g.src}
// 攻撃：ためは短く、最後にすばやくふりかぶって叩きつける
function atkLift(p){if(p<=0)return 0;if(p<.84)return Math.sin(p*40)*.04;if(p<.95)return (p-.84)/.11*2.7;if(p<.985)return 2.7-(p-.95)/.035*3.1;return -.4}
function atkLean(p){return p>=.95&&p<1?.12:p>.84?-.08*(p-.84)/.11:0}
const KGH={basic:100,fast:100,thief:100,brute:100,boss:118};
// コワイノのドット絵：モーション（待機・歩き・攻撃・やられ）ごとのコマを切りかえる。コマはたてにならべた1まいの絵（n＝コマ数）。大きさは種類ごとの絵（どれも1ドット＝1）
const KGDOT={},KGDOK={};
function kgDot(key,white){const ch=CHIPS[key],im=chipImgs(ch,key)[0];if(!white)return im;const k=key+'|w';if(KGDOT[k])return KGDOT[k];
  const cv=document.createElement('canvas');cv.width=im.width;cv.height=im.height;const g=cv.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#f4eefa';g.fillRect(0,0,cv.width,cv.height);return KGDOT[k]=cv}/* ひかったときは白いかげ */
function drawShadeDot(c,ty,x,y,s,f,o){
  const K='kg_'+ty+':';if(!window.CHIPS||!CHIPS[K+'idle'])return false;
  if(!KGDOK[ty]){for(const k in CHIPS)if(k.startsWith(K)&&!chipImgs(CHIPS[k],k)[0].ok)return false;KGDOK[ty]=1}
  const t=o.t||0,B=o.back?'B':'',p=o.atk||0,sc=s/(.27*EN[ty].size*2);
  // どのモーションの、何コマ目か
  let mo='idle',fi=Math.floor(t*1.6);
  if(o.die!=null){mo='hurt';fi=o.die}/* たおされたとき：やられの3コマ目（たおれる）まで */else if(o.hurt!=null){mo='hurt';fi=o.hurt<.5?0:1}/* 攻撃をうけただけのときは、いたがる2コマだけ（たおれない） */
  else if(o.walk){mo='walk';fi=Math.floor(t*6)}
  else if(p>=.84){mo='atk';const n=(CHIPS[K+'atk'+B]||CHIPS[K+'atk']).n||3;fi=p<.95?0:Math.min(n-1,1+Math.floor((p-.95)/.05*(n-1)))}/* ふりかぶる → ふりおろす → もどる */
  const key=mo==='hurt'||!CHIPS[K+mo+B]?K+mo:K+mo+B,ch=CHIPS[key];fi=mo==='hurt'?Math.min(fi,ch.n-1):fi%(ch.n||1);
  const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=sc<.9;/* 図鑑などで小さく描くときだけ、なめらかに縮める */
  c.save();c.translate(x,y);c.scale(sc*f,sc);c.drawImage(kgDot(key,!!o.flash),0,fi*ch.h,ch.w,ch.h,ch.ax,ch.ay,ch.w,ch.h);c.restore();
  c.imageSmoothingEnabled=sm;return true}
function drawShade(c,ty,x,y,s,f,o){const ty0=ty;
  if(o.dot&&drawShadeDot(c,ty,x,y,s,f,o))return;
  if(ty==='trapper'||ty==='rockc')ty='brute';else if(ty==='ash'||ty==='breaker')ty='basic';else if(ty==='hino'||ty==='yama')ty='boss';/* ワナクイは、カタカゲに似たとげとげの形（小さめ） */
  const g=KGS[ty+(o.back?'_b':'_f')];if(!g||!g.ok)return drawShadeV(c,ty,x,y,s,f,o);
  const t=o.t||0,BD=o.flash?'#f4eefa':'#3e383e',u=(KGH[ty]||100)/g.h;
  const st=o.walk?Math.sin(t*10):0,bob=o.walk?Math.abs(st)*3:Math.sin(t*3)*1.5,sq=o.walk?Math.abs(st)*.04:Math.sin(t*3)*.015;
  const p=o.atk||0,lift=atkLift(p);
  c.save();c.translate(x,y);c.scale(s*f,s);c.lineCap='round';
  c.rotate(o.walk?st*.06:atkLean(p));c.scale(1+sq,1-sq);c.translate(0,-bob);
  for(const[side,rx,ry,th]of g.arms){
    const ang=o.flash?-.25:1.0+(o.walk?side*st*.45:Math.sin(t*2.2+side)*.08)-lift,T=Math.max(2.6,th*u*.5),L=20;
    c.save();c.translate((rx-g.w/2)*u,(ry-g.h)*u);c.scale(side,1);c.rotate(ang);
    c.strokeStyle=BD;c.lineWidth=T*2;c.beginPath();c.moveTo(-2,0);c.lineTo(L*.75,0);c.stroke();
    c.fillStyle=BD;c.beginPath();c.ellipse(L*.8,0,T*1.45,T*1.2,0,0,7);c.fill();c.restore()}
  // 腕は体のうしろから出す
  c.drawImage(o.flash?g.white:g.img,-g.w/2*u,-g.h*u,g.w*u,g.h*u);
  if((ty0==='breaker'||ty0==='trapper')&&!o.flash){/* 見た目で区別：カベクダキはハンマー、ワナクイは罠のあご */
    const hx=g.w*u*.5,hy=-g.h*u*.8;c.save();c.translate(hx,hy);c.rotate(-.5+Math.sin(t*3)*.08);c.scale(1.7,1.7);
    if(ty0==='breaker'){c.fillStyle='#8a5a34';c.fillRect(-2.5,-4,5,30);c.fillStyle='#9aa0a8';c.fillRect(-11,-14,22,12);c.fillStyle='#c9ced4';c.fillRect(-11,-14,22,3.5);c.strokeStyle='#3e383e';c.lineWidth=2;c.strokeRect(-11,-14,22,12)}
    else{c.fillStyle='#b9b3ad';c.strokeStyle='#3e383e';c.lineWidth=2;c.beginPath();c.arc(0,0,12,Math.PI,0);c.closePath();c.fill();c.stroke();c.fillStyle='#fff';for(let k=-2;k<=2;k++){c.beginPath();c.moveTo(k*4.4-2,0);c.lineTo(k*4.4,-5);c.lineTo(k*4.4+2,0);c.fill()}c.fillStyle='#d94a4a';c.beginPath();c.arc(0,-13,3,0,7);c.fill()}
    c.restore()}
  c.restore();
}
function drawShadeV(c,ty,x,y,s,f,o){
  const t=o.t||0,back=!!o.back,BD=o.flash?'#f4eefa':'#3f3842',EY='#b7a3d8',CR='#a993c6',SK='#d8b48a';
  const st=o.walk?Math.sin(t*10):0,bob=o.walk?Math.abs(Math.sin(t*10))*2:Math.sin(t*3)*1.5,fl=Math.sin(t*(ty==='fast'?16:6))*.25;
  const p=o.atk||0,lift=atkLift(p);
  c.save();c.translate(x,y);c.scale(s*f,s);c.lineJoin='round';c.lineCap='round';
  const E=(cx,cy,rx,ry,rot,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(cx,cy,rx,ry,rot||0,0,7);c.fill()};
  const P=(pts,col)=>{c.fillStyle=col;c.beginPath();pts.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();c.fill()};
  const legs=(w,ry)=>{const l1=Math.max(0,st)*4,l2=Math.max(0,-st)*4;E(-w,-6-l1,5.5,ry||7,0,BD);E(w,-6-l2,5.5,ry||7,0,BD)};
  const torso=(w,top)=>{c.fillStyle=BD;c.beginPath();c.moveTo(-w+3,top);c.quadraticCurveTo(-w-2,top+12,-w+1,-8);c.quadraticCurveTo(0,-1,w-1,-8);c.quadraticCurveTo(w+2,top+12,w-3,top);c.closePath();c.fill()};
  // 腕：ふだんは下ろして、歩くと前後にふる。攻撃のときはふりあげて叩きつける
  const armAng=sx=>o.flash?-.25:1.15+(o.walk?sx*Math.sin(t*10)*.45:Math.sin(t*2.2+sx)*.08)-lift;
  const arm=(sx,y0,x0,len,th,fix)=>{c.save();c.translate(sx*x0,y0);c.scale(sx,1);c.rotate(fix??armAng(sx));c.strokeStyle=BD;c.lineWidth=th*2;c.beginPath();c.moveTo(0,0);c.lineTo(len*.75,0);c.stroke();E(len*.8,0,th*1.5,th*1.25,0,BD);c.restore()};
  const arms=(y0,x0,len,th)=>{arm(-1,y0,x0,len,th);arm(1,y0,x0,len,th)};
  const eyes=(ex,ey,rx,ry,angry)=>{if(back)return;if(angry){for(const sx of[-1,1]){c.fillStyle=EY;c.beginPath();c.moveTo(sx*(ex-rx),ey-ry*.2);c.quadraticCurveTo(sx*ex,ey+ry*1.1,sx*(ex+rx),ey-ry*.9);c.quadraticCurveTo(sx*ex,ey-ry*.2,sx*(ex-rx),ey-ry*.2);c.fill()}}else{E(-ex,ey,rx,ry,0,EY);E(ex,ey,rx,ry,0,EY)}};
  const wing=(sx,wx,wy,sz)=>{c.save();c.translate(sx*wx,wy);c.scale(sx*sz,sz);c.rotate(-fl);c.fillStyle=BD;c.beginPath();c.moveTo(0,-6);c.quadraticCurveTo(14,-14,24,-10);c.quadraticCurveTo(22,-2,26,4);c.quadraticCurveTo(19,1,16,8);c.quadraticCurveTo(11,3,6,8);c.quadraticCurveTo(4,2,0,4);c.closePath();c.fill();c.restore()};
  c.translate(0,-bob);
  if(ty==='basic'){
    legs(6);torso(10,-30);arms(-27,8,18,3.2);
    c.fillStyle=BD;c.beginPath();c.moveTo(-25,-50);c.quadraticCurveTo(-26,-72,-8,-78);c.quadraticCurveTo(0,-81,2,-86);c.quadraticCurveTo(8,-80,12,-77);c.quadraticCurveTo(27,-70,25,-48);c.quadraticCurveTo(23,-29,0,-28);c.quadraticCurveTo(-23,-29,-25,-50);c.fill();
    const cw=Math.sin(t*2.5)*.2;c.save();c.translate(2,-86);c.rotate(cw);c.strokeStyle=BD;c.lineWidth=5;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-3,-8,2,-12);c.arc(6,-12,4,Math.PI,Math.PI*2.6);c.stroke();c.restore();
    eyes(10.5,-41,2.6,5.6,false);
  }else if(ty==='fast'){
    legs(6);wing(-1,8,-20,.9);wing(1,8,-20,.9);torso(10,-30);arms(-28,9,19,3.1);
    E(0,-52,23,22,0,BD);
    for(const sx of[-1,1]){c.fillStyle=BD;c.beginPath();c.moveTo(sx*7,-70);c.quadraticCurveTo(sx*24,-74,sx*15,-97);c.quadraticCurveTo(sx*33,-84,sx*22,-62);c.closePath();c.fill()}
    eyes(8.5,-44,2.4,5,false);
  }else if(ty==='thief'){
    legs(6);torso(11,-30);
    const sk=()=>{c.save();c.translate(back?-21:23,-20+(o.walk?Math.abs(st)*-2:0));c.rotate(Math.sin(t*4)*.08);E(0,0,14,13,0,SK);c.fillStyle='#c49a6c';c.beginPath();c.ellipse(-3,-12,6,3,-.3,0,7);c.fill();c.restore()};
    if(back){sk();arm(-1,-27,8,17,3.2,.55);arm(1,-27,8,17,3.2)}else{arm(-1,-27,8,17,3.2)}
    c.fillStyle=BD;c.beginPath();c.moveTo(-24,-34);c.quadraticCurveTo(-30,-64,-6,-82);c.quadraticCurveTo(8,-92,18,-88);c.quadraticCurveTo(11,-83,15,-76);c.quadraticCurveTo(28,-60,24,-34);c.quadraticCurveTo(0,-26,-24,-34);c.fill();
    if(!back){E(0,-50,17,13,0,'#2c262f');eyes(8,-50,5.5,4,true);c.strokeStyle='#5c4a3a';c.lineWidth=2;c.beginPath();c.moveTo(-10,-34);c.quadraticCurveTo(0,-30,10,-34);c.stroke();sk();arm(1,-27,8,17,3.2,.55)}
  }else if(ty==='brute'){
    legs(8);torso(14,-30);arms(-30,18,18,3.8);
    const N=11,pts=[];for(let k=0;k<N*2;k++){const a=-Math.PI/2+k/(N*2)*Math.PI*2,r=k%2?26:34+(k===0?6:0);pts.push([Math.cos(a)*r,-54+Math.sin(a)*r*.95])}P(pts,BD);
    for(const[cx,cy,rot,h]of[[-24,-74,-.5,14],[22,-78,.45,16],[-34,-56,-1.1,10],[32,-58,1.1,11]]){c.save();c.translate(cx,cy);c.rotate(rot);P([[-4,4],[-3,-h*.6],[0,-h],[3,-h*.6],[4,4]],CR);c.restore()}
    eyes(11,-37,2.7,5.2,false);
  }else if(ty==='boss'){
    legs(14,8);
    wing(-1,28,-44,1.5);wing(1,28,-44,1.5);
    arms(-30,30,18,5);
    E(0,-46,40,36,0,BD);
    for(const sx of[-1,1]){c.fillStyle=BD;c.beginPath();c.moveTo(sx*18,-76);c.quadraticCurveTo(sx*30,-88,sx*24,-100);c.quadraticCurveTo(sx*38,-94,sx*30,-74);c.closePath();c.fill();
      c.fillStyle=CR;c.globalAlpha=.7;c.beginPath();c.moveTo(sx*34,-82);c.quadraticCurveTo(sx*42,-92,sx*38,-100);c.quadraticCurveTo(sx*46,-90,sx*38,-78);c.closePath();c.fill();c.globalAlpha=1}
    P([[-12,-80],[-10,-90],[-5,-84],[0,-96],[5,-84],[10,-90],[12,-80]],BD);
    if(!back){const op=.75+Math.sin(t*1.3)*.25;c.fillStyle=EY;c.beginPath();c.moveTo(0,-77);c.quadraticCurveTo(10,-62,0,-47);c.quadraticCurveTo(-10,-62,0,-77);c.fill();E(0,-62,2.4*op,8*op,0,BD);
      eyes(17.5,-39,6.5,5,true)}
  }else if(ty==='boss2'){/* ヨルノオオカゲ：この土地の夜が、ひとつにあつまったもの。体の中に星がまたたき、ひたいに三日月 */
    const NB=o.flash?BD:'#272143',NI=o.flash?BD:'#342c58',MO='#ffe08a';
    for(const sx of[-1,1]){c.save();c.translate(sx*30,-26);c.scale(sx,1);c.rotate(armAng(sx));c.strokeStyle=NB;c.lineWidth=9.2;c.beginPath();c.moveTo(0,0);c.lineTo(16.5,0);c.stroke();E(17.6,0,6.9,5.8,0,NB);c.restore()}
    c.fillStyle=NB;c.beginPath();c.moveTo(-34,-4);c.quadraticCurveTo(-40,-34,-28,-52);c.quadraticCurveTo(-14,-68,0,-68);c.quadraticCurveTo(14,-68,28,-52);c.quadraticCurveTo(40,-34,34,-4);
    for(let k=0;k<4;k++){const x0=34-k*17,w=Math.sin(t*2+k*1.3)*1.5;c.quadraticCurveTo(x0-8.5+w,6,x0-17,-4)}/* すそは、夜の霧のようにゆれる */c.closePath();c.fill();
    for(const sx of[-1,1]){c.fillStyle=NB;c.beginPath();c.moveTo(sx*14,-64);c.quadraticCurveTo(sx*30,-80,sx*22,-92);c.quadraticCurveTo(sx*38,-82,sx*28,-58);c.closePath();c.fill()}/* 三日月のような角 */
    c.fillStyle=NI;c.beginPath();c.ellipse(0,-30,24,22,0,0,7);c.fill();/* 夜空の奥 */
    if(!o.flash)for(const[sx2,sy2,r]of[[-16,-44,2.2],[14,-48,1.6],[-24,-22,1.6],[20,-20,2.2],[-6,-14,1.4],[8,-36,1.2],[0,-54,1.4]]){const tw=.4+.6*Math.abs(Math.sin(t*1.7+sx2*.3+sy2*.11));c.globalAlpha=tw;c.fillStyle=MO;c.beginPath();c.moveTo(sx2,sy2-r*2);c.lineTo(sx2+r*.6,sy2-r*.6);c.lineTo(sx2+r*2,sy2);c.lineTo(sx2+r*.6,sy2+r*.6);c.lineTo(sx2,sy2+r*2);c.lineTo(sx2-r*.6,sy2+r*.6);c.lineTo(sx2-r*2,sy2);c.lineTo(sx2-r*.6,sy2-r*.6);c.closePath();c.fill()}c.globalAlpha=1;/* またたく星 */
    if(!back){if(!o.flash){c.fillStyle=MO;c.beginPath();c.arc(0,-56,7,0,7);c.fill();c.fillStyle=NB;c.beginPath();c.arc(3.5,-58,6,0,7);c.fill()}/* ひたいの三日月 */
      eyes(12,-32,6.5,5.5,true)}
  }else{E(0,-40,24,22,0,BD);eyes(8,-42,3.6,6,false)}
  c.restore();
}
