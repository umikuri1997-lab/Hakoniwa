/* ---------- なかよしと夜の戦い・コワイノのねらい線 ----------
   ならんで戦う力（supportTick・supAtk）：たたかうせいれいの3マス以内（SUPR）に、たたかっている、なかよし30・60・100の子がいると、
     攻撃力+2・+3・+5（SUPATK。何人いても、いちばん高い1人ぶん）。毎秒つくりなおす（SUPA）。火は spirit-work の攻撃、ほかは rMul の atk にたす。
   助けてにげる（escTick・ACT.escort・escGuard・escStep）：おなかが500より少なくなってにげる、たたかうせいれいの3マス以内（ESCR）に、
     なかよし30以上・おなか500以上の、たたかうせいれいがいると、となりについて、にげる先まで行く。そのあいだ、にげる子への攻撃は、
     2マス以内（ESCG）にいる助ける子がうける。とどけたら、なかよし+2（ESCBOND）。そのあと、助けた子は、いつもの夜の動きにもどる。
   ねらい線（tgtShow・drawTgtLine）：「しらべる」でタップしたコワイノの、いまねらっている物（e.tg）へ、4秒（TGTMS）ドットの点線。 */
const SUPATK=[[100,5],[60,3],[30,2]],SUPR=3,ESCR=3,ESCG=2,ESCBOND=2,ESCMAX=60,TGTMS=4000;
const SUPA=new Map();
NIGHT_OK.push('escort');KEEPC.add('escort');
function supOut(r){return !r||r.hidden||onTower(r)||r.hunger<250||r.act&&['flee','faint','watchpost','escort'].includes(r.act.type)||!!(r.act&&r.act.run)}/* いま、ならんで戦えない子 */
function supAtkOf(v){for(const [b,n] of SUPATK)if(v>=b)return n;return 0}
function supAtk(r){return SUPA.get(r)||0}
function supportTick(){SUPA.clear();if(!S||IS_STORY_REPLAY||!isNight()||!S.enemies||!S.enemies.some(e=>e.spawned&&!e.dead))return;
  if(S.bond){const F=S.res.filter(r=>fighter(r)&&!supOut(r));
    for(let i=0;i<F.length;i++)for(let k=i+1;k<F.length;k++){const a=F[i],b=F[k];if(Math.hypot(a.x-b.x,a.y-b.y)>SUPR)continue;const n=supAtkOf(bondOf(a,b));if(!n)continue;
      if(n>(SUPA.get(a)||0))SUPA.set(a,n);if(n>(SUPA.get(b)||0))SUPA.set(b,n);supFx(a,b)}}
  escTick()}
function supFx(a,b){const ns=S.ns;if(!ns)return;const K=ns.sup||(ns.sup={}),pk=bondKey(a,b);if(K[pk])return;K[pk]=1;/* 1晩に1回、2人がならんだときだけ */
  for(const r of[a,b])fxSpr('hearts',r.x*TS,(r.y-.7)*TS,null,0,r.y*TS);addFloat((a.x+b.x)/2,Math.min(a.y,b.y)-1.4,'なかよしの力','#ffb3c8')}

/* ---- 助けてにげる ---- */
const resById=id=>S.res.find(q=>q.id===id);
function escWard(r){return fighter(r)&&!r.hidden&&r.hunger<250&&!!r.act&&(r.act.type==='flee'||!!r.act.run)&&r.act.stand>=0}/* にげている、たたかうせいれい */
function escTick(){
  for(const h of S.res){const a=h.act;if(!a||a.type!=='escort')continue;const w=resById(a.who);
    if(!w||!isNight()||h.hunger<250||S.t-(a.t0||S.t)>ESCMAX||w.act&&w.act.type==='faint'){escEnd(h,w);continue}
    const there=w.hidden||!!w.act&&w.act.stage==='do'&&(w.act.type==='flee'||!!w.act.run);
    if(!there&&!escWard(w)){escEnd(h,w);continue}/* にげるのをやめた */
    if(there&&Math.hypot(h.x-w.x,h.y-w.y)<=ESCR+.5){if(!a.ok){a.ok=1;bondAdd(h,w,ESCBOND,'save');if(typeof dyGuard==='function')dyGuard(h);/* ゆうべのかつやくの、守った数 */toast(h.name+'が'+w.name+'をつれて、にげた','good');for(const r of[h,w])fxSpr('hearts',r.x*TS,(r.y-.7)*TS,null,0,r.y*TS)}escEnd(h,w)}}
  if(!S.enemies.some(e=>e.spawned&&!e.dead&&!e.flee))return;
  for(const w of S.res){if(!escWard(w))continue;if(w.escBy!=null){const h=resById(w.escBy);if(h&&h.act&&h.act.type==='escort'&&h.act.who===w.id)continue;w.escBy=null}
    if(!S.enemies.some(e=>e.spawned&&!e.dead&&!e.flee&&Math.hypot(e.x-w.x,e.y-w.y)<7))continue;
    let best=null,bv=0;for(const h of S.res){if(h===w||!fighter(h)||supOut(h)||Math.hypot(h.x-w.x,h.y-w.y)>ESCR)continue;const v=bondOf(h,w);if(v>=SUPATK[2][0]&&v>bv){bv=v;best=h}}
    if(!best)continue;const st=w.act.stand,sx=st%W,sy=(st/W)|0,G=bfs(best.x|0,best.y|0);
    const k=nearest(G,j=>j!==st&&walk(j)&&Math.abs(j%W-sx)+Math.abs(((j/W)|0)-sy)<=2,80);if(k<0)continue;/* にげる先のとなり */
    endAct(best);startAct(best,G,'escort',k,{run:true,who:w.id,t0:S.t});if(best.act&&best.act.type==='escort'){w.escBy=best.id;best.bubble='❗'}}}
function escEnd(h,w){if(w&&w.escBy===h.id)w.escBy=null;if(h.act&&h.act.type==='escort')endAct(h)}
ACT.escort={start(r,a){r.bubble='❗'},tick(r,a){const w=resById(a.who);if(w)r.face=w.x>=r.x?1:-1},done:(r,a)=>a.t>=8};/* とどいたら、escTick がおわらせる */
function escGuard(w){if(!w||w.escBy==null)return null;const h=resById(w.escBy);if(!h||h.hidden||!h.act||h.act.type!=='escort'||h.act.who!==w.id||Math.hypot(h.x-w.x,h.y-w.y)>ESCG)return null;return h}/* にげる子への攻撃をうける、助ける子 */
function escStep(r){const a=r.act;if(!a||a.type!=='escort'||a.stage!=='walk')return 1;const w=resById(a.who);if(!w||w.hidden)return 1;if(Math.hypot(w.x-r.x,w.y-r.y)<=1.3)return 1;/* となりにいるあいだは、同じ速さ */
  const g=a.stand,gx=g%W+.5,gy=((g/W)|0)+.5;return Math.hypot(gx-r.x,gy-r.y)<Math.hypot(gx-w.x,gy-w.y)?.4:1.25}/* 先に出たら待つ（止まりきると、まよったあつかいになるので、ゆっくり）・おくれたら急ぐ */

/* ---- ねらい線 ---- */
let TGTL=null;
function tgtShow(e){TGTL={e,S,until:performance.now()+TGTMS}}
function tgtCell(j){if(!(j>=0)||j>=W*H)return null;const o=S.obj[j],z=o&&BL[o]&&BL[o].sz||[1,1];return {x:j%W+z[0]/2,y:((j/W)|0)+z[1]/2,j}}
function tgtPoint(e){const t=e.tg;if(t==null)return null;
  if(typeof t==='number'){const r=resById(t);return r?{x:r.x,y:r.y,j:(r.y|0)*W+(r.x|0)}:null}
  if(t==='sc')return tgtCell(e.sg);if(t==='tw')return tgtCell(S.obj.indexOf('tower'));
  if(/^[asd]\d+$/.test(t))return tgtCell(+t.slice(1));return null}
function drawTgtLine(now){const L=TGTL;if(!L)return;const e=L.e;if(L.S!==S||now>L.until||!e||e.dead||!e.spawned||!(S.enemies||[]).includes(e)){TGTL=null;return}
  const p=tgtPoint(e);if(!p)return;const ISO=isoOn(),hz=j=>j>=0&&j<W*H?liftOf(j):0,P0=ISO?isoSP(e.x*TS,e.y*TS):null,P1=ISO?isoSP(p.x*TS,p.y*TS):null,x0=ISO?P0.x:e.x*TS,y0=ISO?P0.y:e.y*TS-hz((e.y|0)*W+(e.x|0))+10,x1=ISO?P1.x:p.x*TS,y1=ISO?P1.y:p.y*TS-hz(p.j)-2;if(ISO){ctx.save();isoScreenTf(ctx)}/* クォータービュー：足もとから足もとへ、画面の向きで *//* 足もとから足もとへ（顔にかけない） */
  const d=Math.hypot(x1-x0,y1-y0);if(d<8){if(ISO)ctx.restore();return}const a=Math.min(1,(L.until-now)/500),sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;ctx.globalAlpha=a;
  const ph=Math.floor(now/120)%3,n=Math.floor(d/6);/* 2ドットの点を6ドットおき。コワイノからねらう物へ、ながれる */
  for(let i=1;i<n;i++){if((i+3-ph)%3===0)continue;const q=i/n,x=Math.round(x0+(x1-x0)*q),y=Math.round(y0+(y1-y0)*q);ctx.fillStyle='#5a1f2a';ctx.fillRect(x-1,y,3,2);ctx.fillStyle='#ff8a8a';ctx.fillRect(x-1,y-1,2,2)}
  const X=Math.round(x1),Y=Math.round(y1),b=Math.floor(now/250)%2,RX=11+b,RY=5+b;/* ねらう物の足もとの、四すみのかぎ（下に1ドットのかげ） */
  for(const[col,oy]of[['#5a1f2a',1],['#ff8a8a',0]]){ctx.fillStyle=col;for(const[sx,sy]of[[-1,-1],[1,-1],[-1,1],[1,1]]){const cx=X+sx*RX,cy=Y+sy*RY+oy;ctx.fillRect(sx<0?cx:cx-2,cy,3,1);ctx.fillRect(cx,sy<0?cy:cy-2,1,3)}}
  ctx.globalAlpha=1;ctx.imageSmoothingEnabled=sm;if(ISO)ctx.restore()}
