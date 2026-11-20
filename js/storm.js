/* ---------- あらしの日 ----------
   5日めより後、前のあらしから7日たっていれば5%で「あらしの日」（天気のよほう weather.js の wxRoll が前もってきめる。S.stormNext はあしたのとき）。前の日の17時に知らせる。
   あらしの日（S.storm）：雨。外にいるせいれいは、たのしさのへりかた1.5倍（STORMFUN）。木のまわりに枝が落ちる（STORMEDA 本）。木と花が大きくゆれ、空が暗く、雨がななめに強くふる。
   つぎの朝：水べに、ながれついた物（STORMDRIFT こ。木材・空き缶・地図の切れはし・ふしぎなふくろ）。 */
const STORMP=.05,STORMGAP=7,STORMFUN=1.5,STORMEDA=10,STORMDRIFT=4;
const stormNow=()=>!!S&&S.storm===dayNo();
function stormMorning(){if(!S||IS_STORY_REPLAY)return;const d=dayNo();
  if(S.storm!=null&&S.storm===d-1&&!S.stormDrift){S.stormDrift=1;stormDriftDrop()}/* あらしのつぎの朝 */
  if(S.stormNext===d){S.storm=d;S.stormNext=null;S.stormDrift=0;S.rain=true;S.rbDay=null;stormBranches();setTimeout(()=>toast('きょうは、あらし','warn'),900);logEv('あらしの日')}}/* あらしの日は、天気のよほう（weather.js の wxRoll）で前もってきめる */
function stormTick(){/* 前の日の17時に知らせる */if(!S||S.stormNext==null||S.stormWarn||S.stormNext!==dayNo()+1||hour()<17)return;S.stormWarn=1;toast('あしたは、あらしになりそう','warn');memo('rain','あしたは、あらしになりそう')}
function stormBranches(){/* 木のまわりに枝が落ちる */const T=[];for(let j=0;j<W*H;j++)if(TREES.has(S.obj[j])&&!(S.fog&&fogAt(j)))T.push(j);if(!T.length)return;S.drops=S.drops||[];
  for(let i=0;i<STORMEDA;i++){const t=pick(T),x=t%W+((Math.random()*5)|0)-2,y=((t/W)|0)+((Math.random()*5)|0)-2;if(x<0||y<0||x>=W||y>=H)continue;const q=y*W+x;if(S.obj[q]||!walk(q)||S.drops.some(d=>d.y*W+d.x===q))continue;S.drops.push({x,y,id:'mat:eda',n:1})}}
function stormDriftDrop(){/* 水べに、ながれついた物 */const L=[];for(let q=0;q<W*H;q++){if(S.obj[q]||S.ground[q]||!walk(q)||(S.fog&&fogAt(q)))continue;if([q-1,q+1,q-W,q+W].some(n=>n>=0&&n<W*H&&waterJ(n)))L.push(q)}if(!L.length)return;S.drops=S.drops||[];let n=0;
  for(let i=0;i<STORMDRIFT;i++){const q=pick(L);if(S.drops.some(d=>d.y*W+d.x===q))continue;const r=Math.random(),it=r<.15?['fukuro',1]:r<.35?['mapPc',1]:r<.6?['mat:can',1]:['mat:wood',3];S.drops.push({x:q%W,y:(q/W)|0,id:it[0],n:it[1],tap:1});n++}
  if(n)setTimeout(()=>toast('あらしのあと、水べに、なにかがながれついている','good'),1400)}
const stormFun=r=>{if(!stormNow())return 1;return roomOf((r.y|0)*W+(r.x|0))?1:STORMFUN};/* 家の中なら、ふだんどおり */
function drawStorm(now){/* 暗い空（雨つぶ・とぶ葉・かみなりは weather-fx.js） */if(!stormNow())return;const g=typeof wxGust==='function'?wxGust(now):0;ctx.fillStyle='rgba(40,52,72,'+(.2+g*.08)+')';ctx.fillRect(0,0,VW,VH)}
