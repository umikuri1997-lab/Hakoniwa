/* 守りのしくみ（ほかのタワーディフェンスから）
   高い所の見張り台：段差1だんごとに射程+HIRNG。強化の2つの道：Lv5から、とおめ（射程+1）か、はやうち（うつ間かく0.7倍）。S.dyn[j].wp にしまう（ひっこしミトン・広げるときも、いっしょにうつる）。
   合図の太鼓（drum）：まわり5マスの見張り台の、うつ間かく0.8倍（重複なし）。
   天気の夜：雨（ほのおの罠のダメージ半分・延焼なし・水の足止め1.5倍）・風の強い日（射程+1・つむじ風9マス）・あらし（射程−1）。夜20時に知らせる。
   守り神の目印：まもりの光を当てたコワイノ（e.mark）を、見張り台が先にねらう。
   朝のおくりもの：けがもこわされた物もない夜の朝に、守りの品を3つから1つ（S.mgift）。
   ヨロイカゲ（armor）：矢は半分、火・どく・延焼は2倍。ヒカリカゲ（shiny）：まれに来て、村の南を横切って帰る。たおすと、やすらぎの砂かふしぎなふくろ。
   波のあいまの修理：波と波のあいだ（waveLull）、土のせいれいが、こわれた物を直しにいく。 */
const HIRNG=.5,WPATHLV=5,WPATH={far:{n:'とおめ',rng:1,cd:1,t:'射程+1マス'},fast:{n:'はやうち',rng:0,cd:.7,t:'うつ間かく0.7倍'}},DRUMR=5,DRUMCD=.8,MGBOOST=5,SHINYP=.1;
function wpathOf(j){const d=j!=null&&S.dyn[j];return d&&WPATH[d.wp]?d.wp:null}
function wpathSet(j,k){if(!WPATH[k]||wpathOf(j))return;(S.dyn[j]||(S.dyn[j]={})).wp=k;sfx('kankan');toast(BL.watch.name+'を「'+WPATH[k].n+'」にした','good');dirty=true}
function nightWx(){if(typeof stormNow==='function'&&stormNow())return 'storm';if(S.rain)return 'rain';if(S.today==='kaze')return 'kaze';return null}/* 今夜の天気（あらしは雨もふくむ） */
const wxRain=()=>{const w=nightWx();return w==='rain'||w==='storm'};
function drumNear(j){const x=j%W+1,y=((j/W)|0)+1;return DRUMS.some(q=>S.obj[q]==='drum'&&Math.hypot(q%W+.5-x,((q/W)|0)+.5-y)<=DRUMR)}
function towerRng(j){const w=nightWx();let a=(w==='kaze'?1:w==='storm'?-1:0);if(j!=null&&S.obj[j]==='watch'){a+=(hiAt(j)||0)*HIRNG;const p=wpathOf(j);if(p)a+=WPATH[p].rng}return a}
function mgBoostOn(){const d=S.flags.mgBoost;if(d==null)return false;const h=hour(),t=dayNo();return d===t&&h>=18||d===t-1&&h<6}
function towerMod(j,st){const p=wpathOf(j);return Object.assign({},st,{range:Math.max(1,st.range+towerRng(j)),cd:st.cd*(p?WPATH[p].cd:1)*(drumNear(j)?DRUMCD:1),dmg:st.dmg+(mgBoostOn()?MGBOOST:0)})}
const fireTrapDmg=()=>wxRain()?20:40,gustDist=()=>nightWx()==='kaze'?9:6,waterStunMul=()=>wxRain()?1.5:1;
const WXNOTE={rain:'雨の夜：ほのおの罠のダメージ半分・延焼なし。水の足止め1.5倍',storm:'あらしの夜：見張り台の射程−1。ほのおの罠のダメージ半分・延焼なし。水の足止め1.5倍',kaze:'風の強い夜：見張り台の射程+1。つむじ風の罠は9マスとばす'};
function wxNightNote(){const d=dayNo();if(S.flags.wxNote===d||!(S.wave&&S.wave.length))return;S.flags.wxNote=d;const w=nightWx();if(w)toast(WXNOTE[w],'warn')}
/* ---------- ヨロイカゲ・ヒカリカゲ ---------- */
function armorMul(e,o){if(!EN[e.type]||!EN[e.type].armor)return 1;const t=o&&o.dt;return t==='arrow'?.5:t==='fire'||t==='poison'||t==='burn'?2:1}
function defWave(list,alv){/* 草原：はじめてオオカゲを追いはらったあと、平均レベル7から、ヨロイカゲがまじる */if(WD!==0||S.free||!((S.bossKills||0)>0)||alv<7)return;for(let i=0;i<list.length;i++)if(list[i]==='basic'&&i%7===6)list[i]='armor'}
function shinyAdd(){/* ヒカリカゲ：波の夜に、まれに1ぴき */if(Math.random()>=SHINYP)return 0;const hp=EN.shiny.hp;S.enemies.push({id:S.nid++,type:'shiny',x:0,y:0,hp,max:hp,delay:WAVES[1]+20,side:Math.random()<.5?'w':'e',shiny:1,spawned:false,path:[],repath:0,atk:0,stun:0,flash:0,flee:false});return 1}
function shinyTick(e){if(!e.shiny||e.flee)return false;if(e.sx0==null){e.sx0=e.x;S.flags.shinySeen=1;toast('ヒカリカゲがあらわれた！','good')}if(Math.abs(e.x-e.sx0)>5&&(e.x<1.5||e.x>W-1.5||(fogOn()&&(fogAt((e.y|0)*W+Math.min(W-1,(e.x|0)+1))||fogAt((e.y|0)*W+Math.max(0,(e.x|0)-1)))))){e.dead=true;toast('ヒカリカゲは、行ってしまった');return false}return true}
function shinyGoal(e){/* 来たのと反対のはしへ（行けるいちばん近い所） */const s=e.side==='w'?'e':'w',G=bfsE(e.x|0,e.y|0,40,e.sd||(e.sd=(Math.random()*1e9)|0));let b=-1,bd=1e9;for(let y=0;y<H;y++){const x=sideEdge(y,s);if(x<0)continue;const q=y*W+x;if(G.dist[q]<0)continue;if(G.dist[q]<bd){bd=G.dist[q];b=q}}return b}
function shinyDrop(e){if(!e.shiny)return;const id=Math.random()<.5?'sand':'fukuro';dropAt(e.x,e.y,id,1);toast('ヒカリカゲが、'+(id==='sand'?'やすらぎの砂':'ふしぎなふくろ')+'を落とした！','good')}
/* ---------- 守り神の目印 ---------- */
function drawMarks(c,e,px,py,z,now){/* 目印：コワイノの頭の上の、ゆれる光のひしがた（ドット） */if(!e.mark||e.dead)return;const s=2,yy=Math.round(py+Math.sin(now/240)*1.5),xx=Math.round(px);c.fillStyle='#fff6c8';for(const[dx,dy]of[[0,-2],[-1,-1],[0,-1],[1,-1],[-2,0],[-1,0],[0,0],[1,0],[2,0],[-1,1],[0,1],[1,1],[0,2]])c.fillRect(xx+dx*s-1,yy+dy*s-1,s,s);c.fillStyle='#ffd35c';c.fillRect(xx-1,yy-1,s,s)}
/* ---------- 朝のおくりもの ---------- */
const MGIFT={arrow:{n:'木の矢20本',give(){S.inv.arrow=(S.inv.arrow||0)+20}},arrow2:{n:'かなものの矢10本',give(){S.inv.arrow2=(S.inv.arrow2||0)+10}},spike:{n:'とげの罠2つ',give(){giveItem('spike',2)}},firetrap:{n:'ほのおの罠1つ',give(){giveItem('firetrap',1)}},boost:{n:'今夜だけ、見張り台の威力+5',give(){S.flags.mgBoost=dayNo()}}};
function mgiftMorning(){/* 朝6時：ゆうべ、コワイノが来て、けがもこわされた物もなかったら */if(!S.ns||S.nightHurt||S.ns.broke||!(S.ns.n>0)||!S.enemyOn)return;const k=Object.keys(MGIFT);for(let i=k.length-1;i>0;i--){const q=(Math.random()*(i+1))|0;[k[i],k[q]]=[k[q],k[i]]}S.mgift={d:dayNo(),o:k.slice(0,3)}}
function mgiftTick(){const g=S.mgift;if(!g||document.querySelector('.idea-reveal')||!$('#dialog').hidden||sheet||(typeof GIFT_ACTIVE!=='undefined'&&GIFT_ACTIVE)||(typeof NOSAVE!=='undefined'&&NOSAVE))return;if(g.d!==dayNo()){S.mgift=null;return}
  const ov=el('<div class="idea-reveal" role="dialog" aria-modal="true"></div>'),cd=el('<div class="idea-card"><h2>朝のおくりもの</h2><p class="note">ゆうべは、だれもけがをしなかった。ひとつえらぼう。</p><div class="mgopts"></div></div>'),bx=cd.querySelector('.mgopts');
  for(const k of g.o){const b=el('<button class="btn" type="button" style="width:100%;margin-top:6px"></button>');b.textContent=MGIFT[k].n;b.onclick=()=>{if(S.mgift!==g)return;S.mgift=null;MGIFT[k].give();sfx('power');toast(MGIFT[k].n+'をうけとった','good');ov.remove();if(sheet==='inv')renderSheet()};bx.appendChild(b)}
  ov.appendChild(cd);document.body.appendChild(ov)}
/* ---------- 波のあいまの修理 ---------- */
function waveLull(){if(!S||WD!==0||!isNight()||!S.enemies||!S.enemies.length)return false;let wait=false;for(const e of S.enemies){if(e.dead)continue;if(e.spawned)return false;if(e.wv!=null)wait=true}return wait}/* まだ来ていない波があって、いまは1ぴきもいない */
let NFIX={t:-1,v:false};function nightFixNeed(){if(NFIX.t===S.t)return NFIX.v;NFIX.t=S.t;let v=!!(S.broken&&S.broken.length);if(!v)for(const k in S.hp){const q=+k;if(!(q>=0))continue;const o=S.obj[q];if(o&&breakable(o)&&S.hp[q]<(BL[o].hp||0)){v=true;break}}return NFIX.v=v}
function nightFixWake(r,sleeping){/* 波のあいまに、ねている土のせいれいを起こす（直す物があるときだけ。行けなかったら、しばらく起こさない） */return sleeping&&r.elem==='earth'&&!fighter(r)&&r.energy>=50&&r.hunger>=550&&!(r.nfixNo>S.t)&&!(r.nfixW>S.t)&&waveLull()&&nightFixNeed()}
function nightFixGo(r,G){if(r.elem!=='earth'||fighter(r)||r.energy<25||r.hunger<550||(r.nfixNo>S.t)||!waveLull()||!nightFixNeed())return false;if(tryJob(r,G,'repair'))return true;r.nfixNo=S.t+60;return false}
