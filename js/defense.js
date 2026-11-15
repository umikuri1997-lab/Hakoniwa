/* 守りのしくみ（ほかのタワーディフェンスから）
   高い所の見張り台：段差1だんごとに射程+HIRNG。強化の2つの道：Lv5から、とおめ（射程+1）か、はやうち（うつ間かく0.7倍）。S.dyn[j].wp にしまう（ひっこしミトン・広げるときも、いっしょにうつる）。
   合図の太鼓（drum）：まわり5マスの見張り台の、うつ間かく0.8倍（重複なし）。
   天気の夜：雨（ほのおの罠のダメージ半分・延焼なし・水の足止め1.5倍）・風の強い日（射程+1・つむじ風9マス）・あらし（射程−1）。夜20時に知らせる。
   ヨロイカゲ（armor）：矢は半分、火・どく・延焼は2倍。ヒカリカゲ（shiny）：まれに来て、村の南を横切って帰る。たおすと、やすらぎの砂かふしぎなふくろ。 */
const HIRNG=.5,WPATHLV=5,WPATH={far:{n:'とおめ',rng:1,cd:1,t:'射程+1マス'},fast:{n:'はやうち',rng:0,cd:.7,t:'うつ間かく0.7倍'}},DRUMR=5,DRUMCD=.8,SHINYP=.1;
function wpathOf(j){const d=j!=null&&S.dyn[j];return d&&WPATH[d.wp]?d.wp:null}
function wpathSet(j,k){if(!WPATH[k]||wpathOf(j))return;(S.dyn[j]||(S.dyn[j]={})).wp=k;sfx('kankan');toast(BL.watch.name+'を「'+WPATH[k].n+'」にした','good');dirty=true}
function nightWx(){if(typeof stormNow==='function'&&stormNow())return 'storm';if(S.rain)return 'rain';if(S.today==='kaze')return 'kaze';return null}/* 今夜の天気（あらしは雨もふくむ） */
const wxRain=()=>{const w=nightWx();return w==='rain'||w==='storm'};
function drumNear(j){const x=j%W+1,y=((j/W)|0)+1;return DRUMS.some(q=>S.obj[q]==='drum'&&Math.hypot(q%W+.5-x,((q/W)|0)+.5-y)<=DRUMR)}
function towerRng(j){const w=nightWx();let a=(w==='kaze'?1:w==='storm'?-1:0);if(j!=null&&S.obj[j]==='watch'){a+=(hiAt(j)||0)*HIRNG;const p=wpathOf(j);if(p)a+=WPATH[p].rng}return a}
function towerMod(j,st){const p=wpathOf(j);return Object.assign({},st,{range:Math.max(1,st.range+towerRng(j)),cd:st.cd*(p?WPATH[p].cd:1)*(drumNear(j)?DRUMCD:1)})}
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
