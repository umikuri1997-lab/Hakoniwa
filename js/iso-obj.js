'use strict';
/* ---------- クォータービューの、家具・建物・自然の物の絵（PR5） ----------
   3Dから写した絵（iso3d.py）がとどいたら、いまのチップと同じ名前のまま入れかえ、チップに iso:1 の印をつける（tools/chips.py の replace）。
   iso の絵の ax・ay は、置いたマス（大きさ w×h）のまん中の地面の点から、絵の左上までのずれ（g64 のドット）。描くときは画面の向き（icScreen と同じ）で、
   その点に、段の高さだけ上げてそのまま描く（のばさない・反転しない。向きは向きごとに写す）。絵がまだの物は、いままでの絵を立てて描く（iso.js の standTf）。 */
/* 画面の向き（ゲームの点）にする。drawChip の中で、save のあとによぶ */
function isoScreenTf(c,P){const k=dpr*cam.z,O=isoOff(k);c.setTransform(k,0,0,k,O[0],O[1]);const L=ISOLOC;if(P&&L){c.translate(P.x,P.y);if(L.rot)c.rotate(L.rot);if(L.sx!=null)c.scale(L.sx,L.sy);c.translate(-P.x,-P.y)}}
/* いままでの描き方の、物の足もとをもとにした、ゆれ・のびちぢみ（御神木がゆれる・育つ）。クォータービューの絵は画面の向きで描きなおすので、足もとの点（P）のまわりにかけなおす */
let ISOLOC=null;
function isoLocal(L,f){const o=ISOLOC;ISOLOC=L?{...(o||{}),...L}:o;try{return f()}finally{ISOLOC=o}}
/* iso の絵を描く画面の点（ゲームの点）。i：物のマス。描けないとき（アイコン・洞窟）は null で、いままでの描き方 */
function isoChipAt(c,i,x,y,id){if(ICON||c!==ctx)return null;let A;
  if(id&&S&&(id.startsWith('story:')||id==='tower'&&WD===KUSA)&&(i!=null&&i>=0||S.sacredRoot!=null)){const j=i!=null&&i>=0?anc(i):S.sacredRoot,n=typeof sacredSpan==='function'?sacredSpan():4,lv=Math.max(0,hiAt(j)),wx=(j%W+n/2)*TS,wy=((j/W|0)+n/2)*TS;return{x:isoX(wx,wy),y:isoY(wx,wy)-lv*IQL}}/* 御神木の切り株〜御神木：切り株（i。なければ S.sacredRoot）の n×n のまん中（幹のまん中）から */
  if(id==='matyard'&&i!=null&&i>=0){const lv=Math.max(0,hiAt(i)),wx=(i%W+.5)*TS,wy=((i/W|0)+.5)*TS;return{x:isoX(wx,wy),y:isoY(wx,wy)-lv*IQL}}/* 材料置き場：そのマス（作業台の置き場は、作業台の part のマス）のまん中から */
  if((i==null||i<0)&&typeof caveOn==='function'&&caveOn()&&y>=H*TS){const wx=x+TS/2,wy=y+TS/2;return{x:isoX(wx,wy),y:isoY(wx,wy)-cvqLvAt(wx,wy)*IQL}}/* 洞窟の物（cvChip）：x,y はマスの左上（すべる岩などは、とちゅうの場所）。段は洞窟の段 */
  if(i!=null&&i>=0)A=objFootJ(i);else{const tx=Math.floor((x+.5)/TS),ty=Math.floor((y+.5)/TS);A={x:tx,y:ty,w:1,h:1};A.lv=0}/* 置く前の絵など、マスのないとき：x,y のマス */
  const a=i!=null&&i>=0?anc(i):-1,lv=a>=0?Math.max(0,hiAt(a)):0,wx=(A.x+A.w/2)*TS,wy=(A.y+A.h/2)*TS;
  return{x:isoX(wx,wy),y:isoY(wx,wy)-lv*IQL}}
