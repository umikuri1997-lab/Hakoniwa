'use strict';
/* ---------- クォータービューの、家具・建物・自然の物の絵（PR5） ----------
   3Dから写した絵（iso3d.py）がとどいたら、いまのチップと同じ名前のまま入れかえ、チップに iso:1 の印をつける（tools/chips.py の replace）。
   iso の絵の ax・ay は、置いたマス（大きさ w×h）のまん中の地面の点から、絵の左上までのずれ（g64 のドット）。描くときは画面の向き（icScreen と同じ）で、
   その点に、段の高さだけ上げてそのまま描く（のばさない・反転しない。向きは向きごとに写す）。絵がまだの物は、いままでの絵を立てて描く（iso.js の standTf）。 */
/* 画面の向き（ゲームの点）にする。drawChip の中で、save のあとによぶ */
function isoScreenTf(c){const k=dpr*cam.z,O=isoOff(k);c.setTransform(k,0,0,k,O[0],O[1])}
/* iso の絵を描く画面の点（ゲームの点）。i：物のマス。描けないとき（アイコン・洞窟）は null で、いままでの描き方 */
function isoChipAt(c,i,x,y){if(ICON||!isoOn()||c!==ctx)return null;let A;
  if(i!=null&&i>=0)A=objFootJ(i);else{const tx=Math.floor((x+.5)/TS),ty=Math.floor((y+.5)/TS);A={x:tx,y:ty,w:1,h:1};A.lv=0}/* 置く前の絵など、マスのないとき：x,y のマス */
  const a=i!=null&&i>=0?anc(i):-1,lv=a>=0?Math.max(0,hiAt(a)):0,wx=(A.x+A.w/2)*TS,wy=(A.y+A.h/2)*TS;
  return{x:isoX(wx,wy),y:isoY(wx,wy)-lv*IQL}}
