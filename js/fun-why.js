/* たのしさのわけ：たのしさがかわる所は、ぜんぶ funAdd(せいれい,数,わけ) を通す。
   朝6時からの合計を、わけごとに r.fd にのこす（{d:callDay(),f0:朝の数,k:{わけ:合計}}）。
   ふえた・へった数は、0〜100にまるめたあとの、じっさいにかわった数。
   funAdd を通らずにかわった分（思い出の場面・おそなえなど、じかに数を入れる所）は「そのほか」。
   せいれいの画面で、たのしさをタップすると funPop で一覧を出す。 */
const FUNW={time:'時間でへる',env:'まわりのけしき',play:'あそび',chat:'おしゃべり',rest:'ひとやすみ',own:'じぶんの場所',meal:'ごはん',bath:'おふろ',fish:'つり',fest:'おまつり',solo:'ひとりのたのしみ',admire:'あたらしい物を見た',care:'お世話',ev:'イベント',dream:'ゆめ',trouble:'こまりごとがなおった',sleep:'ねむり',night:'夜をぶじに守った',foe:'「コワイノ」',bell:'村の鐘',star:'流れ星',mvp:'ゆうべのかつやく',tree:'御神木',altar:'守護の台座',heat:'熱の装置',bp:'設計図',ani:'いきもの'};
const FUNHOUR=90,FUNPH=5;/* ゲームの時計の1時間（dt の数）・起きているあいだ、時計の1時間にへる、たのしさ */
function funDay(r){const d=callDay();if(!r.fd||r.fd.d!==d){if(r.fd)r.fdP={d:r.fd.d,min:r.fd.min??r.fd.f0};r.fd={d,f0:r.fun||0,min:r.fun||0,k:{}}}return r.fd}/* fdP：前の日のいちばん低い数（ひらめきの日 inspire.js） */
function funAdd(r,n,k){if(!r||!n||!isFinite(n))return;const fd=funDay(r),b=r.fun||0;r.fun=clamp(b+n,0,100);const d=r.fun-b;if(r.fun<(fd.min??fd.f0))fd.min=r.fun;if(d)fd.k[k]=(fd.k[k]||0)+d}
/* 時間でへる、へりかたの倍（spirit-work.js の毎コマのへり） */
function funDecayList(r){const L=[],G=gearStat(r);
  if(trt(r,'genki'))L.push(['とくせい（元気いっぱい）',.6]);
  {const st=suteki().st;if(SUTEKI_FUN[st]!==1)L.push(['すてきな村（★'+st+'）',SUTEKI_FUN[st]])}
  if(typeof pathFun==='function'&&pathFun()!==1)L.push(['むらのちから',pathFun()]);
  if(typeof stormFun==='function'&&stormFun(r)!==1)L.push(['あらし',stormFun(r)]);
  if(G.fun!==1)L.push(['そうび',G.fun]);
  if(S.rain&&G.rain)L.push(['そうび（雨）',0]);
  if(rainbowToday())L.push(['虹',RB_FUN]);
  if(r.grief)L.push(['しょんぼり',GRIEF_FUN]);
  if(r.qrF)L.push(['けんか中',QR_FUN]);
  if(r.evb&&r.evb.fh&&r.evb.d===callDay())L.push(['ほこらまいり',r.evb.fh]);
  return L}
function funDecayK(r){let k=1;for(const[,m]of funDecayList(r))k*=m;return k}
function funEnvNow(r){if(!ENVG)return 0;const j=(r.y|0)*W+(r.x|0);return ENVG[j]+(ENVE[r.elem]?ENVE[r.elem][j]:0)}
function funPop(r){if(!r)return;const P=pxPop('たのしさのわけ'),R=el('<div class="recs comfyCalc"></div>'),f1=v=>Math.round(v*10)/10,sg=v=>(v<0?'－':'+')+Math.abs(v);
  const row=(a,b,cls)=>{const d=el('<div class="st'+(cls?' '+cls:'')+'"><span></span><b></b></div>');d.firstChild.textContent=a;d.lastChild.textContent=b;R.appendChild(d)};
  const hd=t=>{const d=el('<div class="funHd"></div>');d.textContent=t;R.appendChild(d)};
  hd('いま');{const K=funDecayK(r);row('時間でへる','－'+f1(FUNPH*K)+'／1時間');for(const[n,m]of funDecayList(r))row(n,'×'+f1(m),'sub')}
  {const ev=funEnvNow(r);if(ev>0)row('まわりのけしき','+'+f1(ev*.004*FUNHOUR)+'／1時間')}
  hd('きょう');const fd=funDay(r),ks=Object.keys(fd.k).map(k=>[k,Math.round(fd.k[k])]).filter(x=>x[1]).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]));let sum=0;
  for(const[k,v]of ks){row(FUNW[k]||k,sg(v));sum+=v}
  {const o=Math.round(r.fun-fd.f0)-sum;if(o)row('そのほか',sg(o))}
  if(!ks.length&&Math.round(r.fun-fd.f0)===0)row('まだ、かわっていない','');
  row('たのしさ',Math.round(r.fun)+' / 100','tot');P.body.appendChild(R)}
