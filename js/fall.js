/* ---------- 落下ダメージ ----------
   高い所から低い所へは、何だんでもとびおりられる（のぼるのは、いまどおり1だんずつ cliffUp）。2だんいじょう、とびおりると、ダメージ。
   せいれいは、おなかがへる（0にはしない）。コワイノは体力がへる（hurtEn）。ダメージは 2だんで50、1だんごとに+50（FALLDMG）。
   せいれいの道さがしは、ほかに道があれば、とびおりをさける（FALLCOST）。どのマスにいたかは、セーブしない（FALLAT）。 */
const FALLDMG=50,FALLCOST=60;/* 1だんぶんのダメージ・道さがしの1だんぶんの手間 */
const FALLAT=new WeakMap();
const fallDmg=drop=>drop>=2?FALLDMG*(drop-1):0;
function fallOne(o,isEnemy){if(o.hidden||o.dead||o.hp!=null&&o.hp<=0&&isEnemy)return;const j=(o.y|0)*W+(o.x|0),p=FALLAT.get(o);FALLAT.set(o,j);if(p==null||p===j)return;
  if(isEnemy?o.onTower:typeof uLift==='function'&&o.act&&o.act.type==='watchpost')return;const d=fallDmg(hiAt(p)-hiAt(j));if(!d)return;
  const x=j%W+.5,y=((j/W)|0)+.7;fxSpr('dust',x*TS,y*TS);sfxAt('slip',x,y);
  if(isEnemy){hurtEn(o,d,{exact:true,dt:'fall'});return}
  const n=Math.min(d,Math.max(0,(o.hunger||0)-1));o.hunger=(o.hunger||0)-n;addFloatG(x,y,-1.2,'－'+d,'#e8a08a');SHOCKU.set(o,performance.now()+1200)}/* せいれい：おなかがへる（落ちて消えることはない） */
function fallTick(){if(!S||!S.hi)return;for(const r of S.res)fallOne(r,false);for(const e of S.enemies||[])fallOne(e,true)}
