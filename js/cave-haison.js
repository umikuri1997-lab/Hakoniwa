'use strict';
/* 5階「地下の廃村」のしくみ（cave.js のつづき）。設定は STORY.md の「土の谷の大穴とバケモノ」
   ・家（地図の H 日干しれんがの壁・, 板のゆか）：大穴のふち道は、家でふさがれていて、家の中を通らないと坂へ行けない
   ・うらの窓（v）：家のうしろの、1だん高い路地から、家の中へとびおりて入る（もどれない。高さの決まりのまま）
   ・ゆかの穴（z）：ねずみがほった横穴が、家のゆかに出る（同じ高さ。行き来できる）
   ・戸（d）：家の中からタップすると、かんぬきをはずしてあく。そとからは、あかない。あいたら、その出かけのあいだ、あいたまま
   ・こわれた家具（f）・かれた畑（; のマス）は見た目だけ
   ・うえたちねずみ（cave-bake.js の bk_nezu）：3びきで1つのむれ。1ぴきが目をさますと、むれのみんなが目をさます
   たしかめは tools/tests/cave-haison.cjs */
const CVDOORT=2;/* 戸のかんぬきをはずす時間（コードの分） */
/* 戸のとなりの、家の中のマス */
const cvDoorIn=j=>DIRS.map(([dx,dy])=>[cvX(j)+dx,cvY(j)+dy]).filter(([x,y])=>x>=0&&y>=0&&x<CVW&&y<CVH&&CV.hf[cvJ(x,y)]).map(([x,y])=>cvJ(x,y));
/* 戸をタップ：家の中へ行けるなかまが、かんぬきをはずしにいく */
function cvDoorUse(j,o){const C=CV;if(o.done)return;const IN=new Set(cvDoorIn(j));let ba=null,bp=null;
  for(const a of C.party){const p=cvBfs(cvCell(a),q=>IN.has(q));if(p&&(!bp||p.length<bp.length)){bp=p;ba=a}}
  if(!ba){sfx('creak');return toast('内がわから、かんぬきがかかっている')}
  ba.job={k:'door',j,t:0};ba.jq=[];ba.path=bp;ba.mv=false;ba.chase=false;cvGo(bp.length?bp[bp.length-1]:cvCell(ba),ba);sfx('tap')}
/* 作業：戸（cvJobTick から。true なら、この作業をあつかった） */
function cvHsJob(a,J,o,cj,cdt,now){if(J.k!=='door')return false;const C=CV,end=()=>{a.job=null;return true};if(o.k!=='d'||o.done)return end();
  if(!(C.hf[cj]&&cvAdj(cj,J.j))){const IN=new Set(cvDoorIn(J.j)),p=cvBfs(cj,q=>IN.has(q));if(!p)return end();a.path=p;return true}
  cvFace(a,cvX(J.j)-cvX(cj),cvY(J.j)-cvY(cj));J.t+=cdt*rMul(a.r,'work');a.r.hunger-=CVHUN.work*cdt;if(J.t<CVDOORT)return true;
  o.done=true;o.openT=now;sfx('creak');cvSpark(cvX(J.j)+.5,cvY(J.j)+.5,'#d9c7a8',12);toast('かんぬきをはずした。戸があいた','good');for(const q of C.party)cvReveal(q.x,q.y-CVOY,cvSeeR());return end()}
/* うえたちねずみのむれ：地図の1か所に、3びき（入るとき） */
function cvPackInit(C){for(const e of C.en.slice()){const D=EN[e.type];if(!D.pack||e.pk)continue;e.pk=e.id;
  const used=new Set(C.en.map(q=>q.cj)),L=cvBfsRing(e.cj,12).filter(j=>!used.has(j)&&!C.ob.has(j));
  for(let i=1;i<D.pack&&L.length;i++){const j=L.shift();C.en.push({id:C.eid++,type:e.type,asleep:e.asleep,x:cvX(j)+.5,y:cvY(j)+.5+CVOY,hp:D.hp,max:D.hp,spawned:true,stun:0,atk:0,path:[],rp:0,dead:false,tg:null,cj:j,pk:e.pk})}}}
/* 1ぴきが目をさますと、むれのみんなが目をさます */
function cvPackWake(e,now){if(!e.pk)return;for(const q of CV.en)if(q!==e&&q.pk===e.pk&&q.asleep&&!q.dead){q.asleep=false;q.wakeT=now}}
/* ---------- 絵（仮のドット絵） ---------- */
/* 家のゆか・畑（地面にはる）：板のすきま・畑のうね */
function cvHsGround(x,y){const C=CV,j=cvJ(x,y),ox=x*TS,oy=(y+CVOY)*TS,h=n=>hash(((j*7+n*131+311)>>>0));
  if(C.hf[j]){for(let i=1;i<4;i++)P4('#4a3420',ox,oy+i*8,TS,1);for(let i=0;i<4;i++)P4('#4a3420',ox+((h(i)*28)|0),oy+i*8+1,1,7);if(h(9)<.25){P4('#3a2a1c',ox+8,oy+12,10,3);P4('#2a1e14',ox+10,oy+13,6,1)}/* われた板 */return}
  if(C.fd[j]){for(let i=0;i<4;i++){P4('#5a4630',ox,oy+4+i*8,TS,2);P4('#8a7250',ox,oy+6+i*8,TS,1)}/* うね */for(let i=0;i<3;i++){if(h(i)<.5)continue;const sx=ox+4+((h(i+3)*24)|0),sy=oy+6+i*8;P4('#8a7a58',sx,sy-5,1,5);P4('#a89468',sx-2,sy-6,2,1);P4('#a89468',sx+1,sy-4,2,1)}/* かれたくき */}}
/* うらの窓（v）：こわれた窓のわくと、ガラスのかけら（立てて描く） */
function cvWinDraw(ox,oy,now){P4('#8a6a4a',ox+4,oy+2,24,3);P4('#8a6a4a',ox+4,oy+2,3,20);P4('#8a6a4a',ox+25,oy+2,3,20);P4('#a8865e',ox+4,oy+2,24,1);P4('#6a4e34',ox+15,oy+5,2,8);
  P4('#c8d8dc',ox+7,oy+5,4,3);P4('#c8d8dc',ox+21,oy+16,4,3);P4('#e8f0f0',ox+8,oy+5,1,1);P4('#b8a080',ox+6,oy+22,20,4);P4('#9a8264',ox+6,oy+25,20,1)}
/* ゆかの穴（z）：われた板と、ほった土（地面にはる） */
function cvHoleDraw(ox,oy){P4('#7a6040',ox+3,oy+6,26,20);P4('#1a120c',ox+6,oy+9,20,14);P4('#0c0806',ox+9,oy+12,14,8);P4('#a08a6a',ox+4,oy+22,8,3);P4('#a08a6a',ox+20,oy+5,7,3);P4('#6a4a2c',ox+2,oy+8,4,2);P4('#6a4a2c',ox+25,oy+19,5,2)}
/* 戸（d）：板の戸と、かんぬき。あいたら、戸が横へひらく */
function cvDoorDraw(o,ox,oy,now){if(o.done){P4('#5a3e24',ox+1,oy-6,6,34);P4('#7a5634',ox+2,oy-5,4,32);P4('#3a2a1a',ox+7,oy-6,24,2);return}
  P4('#4a3420',ox+2,oy-8,28,36);P4('#7a5634',ox+4,oy-6,24,33);for(let i=1;i<4;i++)P4('#5a4028',ox+4+i*6,oy-6,1,33);P4('#9a7044',ox+4,oy-6,24,1);P4('#5a5048',ox+2,oy+8,28,3);P4('#7a7068',ox+2,oy+8,28,1)}
/* こわれた家具（f）：たおれたたなと、われたつぼ（立てて描く） */
function cvFurnDraw(j,ox,oy){const h=n=>hash(((j*13+n*71+5)>>>0));if(h(1)<.5){P4('rgba(20,14,10,.3)',ox+3,oy+26,26,3);P4('#5a4028',ox+3,oy+16,26,10);P4('#7a5634',ox+4,oy+16,24,2);P4('#3a2a1a',ox+8,oy+19,6,5);P4('#3a2a1a',ox+18,oy+19,6,5);P4('#6a4a2c',ox+24,oy+10,3,8)}
  else{P4('rgba(20,14,10,.3)',ox+6,oy+26,20,3);P4('#9a6a44',ox+9,oy+12,12,14);P4('#b88456',ox+10,oy+12,4,12);P4('#7a5034',ox+11,oy+9,8,3);P4('#9a6a44',ox+21,oy+22,5,3);P4('#9a6a44',ox+4,oy+23,4,2)}}
/* 手がかり（K）：食卓のいす。どれもからっぽで、はしの1つだけ、木のにんぎょうがすわっている */
function cvChairDraw(ox,oy,end){P4('rgba(20,14,10,.3)',ox+4,oy+26,24,3);P4('#5a4028',ox+2,oy+4,28,4);P4('#7a5634',ox+2,oy+4,28,1);P4('#4a3420',ox+4,oy+8,2,12);P4('#4a3420',ox+26,oy+8,2,12);/* うしろの食卓 */
  P4('#6a4a2c',ox+10,oy+10,2,16);P4('#6a4a2c',ox+20,oy+10,2,16);P4('#8a6440',ox+10,oy+18,12,3);P4('#6a4a2c',ox+10,oy+10,12,2);P4('#5a4028',ox+11,oy+21,1,6);P4('#5a4028',ox+20,oy+21,1,6);/* いす */
  if(end){P4('#c8a070',ox+13,oy+11,6,7);P4('#d8b080',ox+14,oy+7,4,4);P4('#3a2a1a',ox+14,oy+8,1,1);P4('#3a2a1a',ox+16,oy+8,1,1);P4('#b88a5a',ox+12,oy+12,1,4);P4('#b88a5a',ox+19,oy+12,1,4);P4('#e8c898',ox+14,oy+7,2,1)}}
