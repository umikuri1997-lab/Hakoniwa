/* 家の設計図：置くと、木をかたづけてから、床 → 家具 → 壁・ドア・窓の順にせいれいが建てる。できたら家の名前・住み心地+10・くれたせいれいのベッド。とちゅうでこわすと設計図ごとやめる */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;
    const f=S.res[0];f.hunger=hMax(f);f.energy=100;f.fun=100;S.res=[f];endAct(f);f.act=null;S.t=1440*3+8*60;S.food=100;S.pt=500;
    const out={};const x0=(f.x|0)+3,y0=(f.y|0)+2;
    const clear=(x,y)=>{const j=y*W+x;S.obj[j]='';delete S.ref[j];delete S.dyn[j];S.floor[j]='';S.ground[j]=0;if(S.hi)S.hi[j]=0;if(S.fog)S.fog[j]=0};
    for(let y=y0-2;y<=y0+6;y++)for(let x=x0-2;x<=x0+7;x++)clear(x,y);
    for(let k=0;k<4;k++)S.obj[(y0+5)*W+x0+k]='crate';/* 箱を4つ（素材がいっぱいにならないように） */S.obj[(y0+1)*W+x0+2]='ntree';/* 置く所に木 */
    recount();S.mat.wood=(S.mat.wood||0)+120;S.mat.kasa=(S.mat.kasa||0)+10;S.mat.nuno=(S.mat.nuno||0)+5;boxSync();
    bpGive('small',f.id);out.inv=S.bpInv.length;
    out.sites0=S.obj.filter(o=>o==='site').length;
    askBp(0,x0,y0);out.askOk=pending&&pending.kind==='bp'&&pending.ok;confirmYes();out.bp=S.bp.length;out.pt=S.pt;
    const e=S.bp[0];
    const run=(n,cond)=>{for(let i=0;i<n;i++){S.food=100;f.hunger=hMax(f);f.energy=100;f.fun=100;if(hour()>=19||hour()<7)S.t=(Math.floor(S.t/1440)+1)*1440+7*60;stepWorld(.1);if(cond())return i}return -1};
    out.treeAt=run(20000,()=>S.obj[(y0+1)*W+x0+2]!=='ntree');
    out.floorFirst=e.ps.filter(p=>p.t==='floor').every(p=>p.s>=1)&&e.ps.filter(p=>p.t!=='floor').every(p=>p.s===0);
    out.doneAt=run(120000,()=>!S.bp.length);
    const fl=e.ps.filter(p=>p.t==='floor');out.floors=fl.every(p=>S.floor[p.j]==='floor');
    out.walls=e.ps.filter(p=>p.t==='wall'||p.t==='win').every(p=>S.obj[p.j]==='hwall');out.door=e.ps.filter(p=>p.t==='door').every(p=>S.obj[p.j]==='door');
    out.win=e.ps.filter(p=>p.t==='win').every(p=>S.win&&S.win[p.j]===1);
    const bed=e.ps.find(p=>p.id==='bed');out.bed=S.obj[bed.j]==='bed';out.bedOwn=(S.bedOwn||{})[bed.j]===f.id;
    const h=HOUSES.find(q=>q.inside.has(fl[0].j));out.house=!!h;out.name=h?bpHouseName(h):null;
    if(h){const c1=houseComfort(h).v;const save=S.hname;S.hname={};const c0=houseComfort(h).v;S.hname=save;out.comfDiff=c1-c0}
    out.done=S.bpDone;out.ps=e.ps.map(p=>p.t+':'+p.s+':'+S.obj[p.j]+':'+(S.dyn[p.j]?Math.round(S.dyn[p.j].p)+'/'+S.dyn[p.j].need+JSON.stringify(S.dyn[p.j].got):'')).join(' ');out.act=f.act&&f.act.type;out.hour=hour();out.wood=S.mat.wood;
    /* とちゅうでこわすと、設計図ごとやめる */
    bpGive('mono',null);const x1=x0,y1=y0-? 0:0;return JSON.stringify(out)})()`.replace("const x1=x0,y1=y0-? 0:0;","")));
  console.log(r);
  assert.equal(r.inv,1);assert.equal(r.askOk,true);assert.equal(r.bp,1);assert.equal(r.pt,480,'power charged');
  assert.ok(r.treeAt>=0,'tree cleared first');assert.ok(r.doneAt>=0,'house finished');
  assert.equal(r.floors,true);assert.equal(r.walls,true);assert.equal(r.door,true);assert.equal(r.win,true);assert.equal(r.bed,true);assert.equal(r.bedOwn,true,'giver uses the bed');
  assert.equal(r.house,true,'it is a house');assert.equal(r.name,'ちいさなおうち');assert.ok(r.comfDiff>=9&&r.comfDiff<=11,'comfort +10: '+r.comfDiff);assert.equal(r.done,1);
  /* とちゅうでやめる */
  const c=JSON.parse(await run(`(()=>{const f=S.res[0];let x0=-1,y0=-1;for(const[ox,oy]of[[10,2],[-12,2],[3,-10],[3,9],[-12,-10]]){const X=(f.x|0)+ox,Y=(f.y|0)+oy;for(let y=Y;y<Y+5;y++)for(let x=X;x<X+5;x++){const j=y*W+x;if(S.obj[j]==='site'||(S.bp||[]).some(e=>e.cells.includes(j)))continue;S.obj[j]='';delete S.ref[j];delete S.dyn[j];S.floor[j]='';S.ground[j]=0;if(S.hi)S.hi[j]=0;if(S.fog)S.fog[j]=0}recount();if(bpCheck('mono',X,Y)[0]){x0=X;y0=Y;break}}
    S.mat.wood=(S.mat.wood||0)+80;S.mat.funba=(S.mat.funba||0)+10;boxSync();bpGive('mono',null);const i=S.bpInv.findIndex(q=>q.k==='mono');S.t=Math.floor(S.t/1440)*1440+1440+9*60;askBp(i,x0,y0);const why=$('#confirmTxt').textContent;confirmYes();
    const e=S.bp.find(q=>q.k==='mono');if(!e)return JSON.stringify({why,bpCheck:bpCheck('mono',x0,y0),pt:S.pt});const site=e.ps.find(p=>p.s===1);const before=S.obj.filter(o=>o==='site').length;removeAt(site.j%W,(site.j/W)|0);
    return JSON.stringify({had:before,left:S.obj.filter(o=>o==='site').length,bp:S.bp.length})})()`));
  console.log(c);assert.ok(c.had>0);assert.equal(c.left,0,'all sites of the blueprint removed');assert.equal(c.bp,0);
  const q=JSON.parse(await run(`JSON.stringify({sub:!!SUBQ.find(q=>q.k==='bphome'&&q.bp)})`));assert.equal(q.sub,true);
  /* どの設計図も、家の中の空いたマスがぜんぶドアの前までつながっている（とじこめられる所がない） */
  const lay=JSON.parse(await run(`JSON.stringify(Object.keys(BPS).map(k=>{const b=BPS[k],R=b.rows,fu=new Set(b.furn.map(f=>f[0]+','+f[1]));let door=null;R.forEach((row,y)=>{for(let x=0;x<row.length;x++)if(row[x]==='D')door=[x,y]});
    const fr=(x,y)=>R[y]&&R[y][x]==='.'&&!fu.has(x+','+y);const st=[door[0],door[1]-1];const seen=new Set([st+'']),Q=[st];while(Q.length){const[x,y]=Q.pop();for(const[a,c]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=[x+a,y+c];if(fr(...k)&&!seen.has(k+'')){seen.add(k+'');Q.push(k)}}}
    let free=0;R.forEach((row,y)=>{for(let x=0;x<row.length;x++)if(fr(x,y))free++});return [k,fr(...st),seen.size===free]}))`));
  console.log(lay);for(const[k,front,all]of lay){assert.equal(front,true,k+' door front free');assert.equal(all,true,k+' no closed-off cells')}
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
