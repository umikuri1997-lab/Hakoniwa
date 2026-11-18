/* 通れる家具（すわる・ねる・遊ぶ家具とお墓 SEATF）は、使うときだけ上に乗る：道さがしはまわり道をえらび（SEATCOST）、ほかに道がなければ通る。
   使わない行動の行き先が家具の上なら、となりの空いたマスにかえる（seatStand）。使う行動（ねる）は、そのまま家具の上へ */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.hold=0;USERPAUSE=true;S.enemyOn=false;
    const a=S.res[0];S.res=[a];endAct(a);a.act=null;a.nap=false;
    const ok=j=>!S.obj[j]&&!S.ground[j]&&!S.floor[j]&&!hiAt(j)&&walk(j)&&!(S.fog&&S.fog[j]);let p=-1;
    for(let y=CY-20;y<CY+20&&p<0;y++)for(let x=CX-20;x<CX+20;x++){let g=true;for(let b=-2;b<=2&&g;b++)for(let c=-1;c<=7;c++)if(!ok((y+b)*W+x+c)){g=false;break}if(g){p=y*W+x;break}}
    /* 横の通路：上下を柵でふさぎ、まん中にいす。すぐ上の行は、ひらいたまわり道 */
    for(let c=-1;c<=7;c++){S.obj[p+W+c]='fence'}S.obj[p+3]='chair';recount();
    a.x=p%W+.5;a.y=((p/W)|0)+.5;const G=roadSearch(a.x|0,a.y|0),path=pathTo(G,p+6);
    const via=path.includes(p+3);
    /* 上のまわり道もふさぐと、いすの上を通る */
    for(let c=-1;c<=7;c++)S.obj[p-W+c]='fence';recount();const G2=roadSearch(a.x|0,a.y|0),p2=pathTo(G2,p+6);
    /* 使わない行動で、いすのマスへ */
    startAct(a,G2,'idle',p+3,{dur:5});const st=a.act.stand;
    /* 使う行動（いすで休む）は、いすの上 */
    endAct(a);a.act=null;startAct(a,G2,'rest',p+3,{key:'o'+(p+3),obj:p+3,seat:p+3,dur:5});const st2=a.act.stand;
    return JSON.stringify({p,via,via2:p2.includes(p+3),reach2:G2.dist[p+6]>=0,st,st2,seat:seatJ(p+3)})})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.seat,true);
  assert.equal(r.via,false,'まわり道があれば、いすの上を通らない');
  assert.equal(r.reach2,true);assert.equal(r.via2,true,'ほかに道がなければ通る');
  assert.notEqual(r.st,r.p+3,'使わない行動は、いすの上に立たない');
  assert.equal(r.st2,r.p+3,'使う行動は、いすの上へ');
  assert.deepEqual(errors,[]);await browser.close();console.log('ok')})().catch(e=>{console.error(e);process.exit(1)});
