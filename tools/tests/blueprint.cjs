/* 家の設計図：置くと、木をかたづけてから、床 → 家具 → 壁・ドア・窓の順にせいれいが建てる。できたら家の名前・住み心地+10・くれたせいれいのベッド。とちゅうでこわすと設計図ごとやめる */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;
    const f=S.res[0];f.hunger=hMax(f);f.energy=100;f.fun=100;S.res=[f];endAct(f);f.act=null;S.t=1440*3+8*60;S.food=100;S.pt=500;
    const out={};const x0=(f.x|0)+3,y0=(f.y|0)+2;
    const clear=(x,y)=>{const j=y*W+x;S.obj[j]='';delete S.ref[j];delete S.dyn[j];S.floor[j]='';S.ground[j]=0;if(S.hi)S.hi[j]=0;if(S.fog)S.fog[j]=0};
    for(let y=y0-2;y<=y0+6;y++)for(let x=x0-2;x<=x0+7;x++)clear(x,y);
    for(let k=0;k<4;k++)S.obj[(y0+5)*W+x0+k]='crate';/* 箱を4つ（素材がいっぱいにならないように） */S.obj[(y0+1)*W+x0+2]='ntree';/* 置く所に木 */
    recount();S.mat.wood=(S.mat.wood||0)+120;S.mat.kasa=(S.mat.kasa||0)+10;S.mat.eda=(S.mat.eda||0)+10;S.mat.nuno=(S.mat.nuno||0)+5;boxSync();
    bpGive('small',f.id);out.inv=S.bpInv.length;
    out.sites0=S.obj.filter(o=>o==='site').length;
    askBp(0,x0,y0);out.askOk=pending&&pending.kind==='bp'&&pending.ok;confirmYes();out.bp=S.bp.length;out.pt=S.pt;
    const e=S.bp[0];
    const run=(n,cond)=>{for(let i=0;i<n;i++){S.food=100;f.hunger=hMax(f);f.energy=100;f.fun=100;if(hour()>=19||hour()<7)S.t=(Math.floor(S.t/1440)+1)*1440+7*60;stepWorld(.1);if(cond())return i}return -1};
    out.treeAt=run(20000,()=>S.obj[(y0+1)*W+x0+2]!=='ntree');
    out.floorFirst=e.ps.filter(p=>p.t==='floor').every(p=>p.s>=1)&&e.ps.filter(p=>p.t!=='floor').every(p=>p.s===0);
    yardTick();out.yards=S.obj.filter(o=>o==='matyard').length;out.yardIn=e.cells.includes(yardAt('b'+e.id));out.ySt=[];{let last=-1;run(120000,()=>{const st=yardStage('b'+e.id);if(st!==last){out.ySt.push(st);last=st}return st===3||!S.bp.length})}/* 材料置き場は設計図ごとに1つ、建てる所の外。運ぶと絵がかわる */
    out.doneAt=run(120000,()=>!S.bp.length);yardTick();out.yardsEnd=S.obj.filter(o=>o==='matyard').length;
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
  assert.equal(r.yards,1,'設計図の置き場は1つ');assert.equal(r.yardIn,false,'置き場は建てる所の外');assert.ok(r.ySt.includes(1)&&r.ySt.includes(2),'運ぶと置き場の絵がかわる: '+r.ySt);assert.equal(r.yardsEnd,0,'できたら置き場はかたづく');
  /* とちゅうでやめる */
  const c=JSON.parse(await run(`(()=>{const f=S.res[0];let x0=-1,y0=-1;for(const[ox,oy]of[[10,2],[-12,2],[3,-10],[3,9],[-12,-10]]){const X=(f.x|0)+ox,Y=(f.y|0)+oy;for(let y=Y;y<Y+5;y++)for(let x=X;x<X+5;x++){const j=y*W+x;if(S.obj[j]==='site'||(S.bp||[]).some(e=>e.cells.includes(j)))continue;S.obj[j]='';delete S.ref[j];delete S.dyn[j];S.floor[j]='';S.ground[j]=0;if(S.hi)S.hi[j]=0;if(S.fog)S.fog[j]=0}recount();if(bpCheck('mono',X,Y)[0]){x0=X;y0=Y;break}}
    S.mat.wood=(S.mat.wood||0)+80;S.mat.funba=(S.mat.funba||0)+10;boxSync();bpGive('mono',null);const i=S.bpInv.findIndex(q=>q.k==='mono');S.t=Math.floor(S.t/1440)*1440+1440+9*60;const pt0=S.pt,inv0=S.bpInv.filter(q=>q.k==='mono').length;askBp(i,x0,y0);const why=$('#confirmTxt').textContent;confirmYes();
    const e=S.bp.find(q=>q.k==='mono');if(!e)return JSON.stringify({why,bpCheck:bpCheck('mono',x0,y0),pt:S.pt});const site=e.ps.find(p=>p.s===1);const before=S.obj.filter(o=>o==='site').length;removeAt(site.j%W,(site.j/W)|0);
    const inv=S.bpInv.filter(q=>q.k==='mono').length-inv0+1,i2=S.bpInv.findIndex(q=>q.k==='mono');return JSON.stringify({had:before,left:S.obj.filter(o=>o==='site').length,bp:S.bp.length,inv,ptBack:S.pt===pt0,again:i2>=0&&bpCheck('mono',x0,y0)[0]})})()`));
  console.log(c);assert.ok(c.had>0);assert.equal(c.left,0,'all sites of the blueprint removed');assert.equal(c.bp,0);assert.equal(c.inv,1,'1つもできていなければ、設計図がもどる');assert.equal(c.ptBack,true,'パワーももどる');assert.equal(c.again,true,'置きなおせる');
  const q=JSON.parse(await run(`JSON.stringify({sub:!!SUBQ.find(q=>q.k==='bphome'&&q.bp)})`));assert.equal(q.sub,true);
  /* どの設計図も、空いたマスがぜんぶ外（家はドアの前）までつながり、どの家具・建物も、行けるマスのとなりにある（とじこめられる所がない） */
  const lay=JSON.parse(await run(`JSON.stringify(Object.keys(BPS).map(k=>{const b=BPS[k],R=b.rows,h=R.length,w=Math.max(...R.map(r=>r.length)),blk=new Set(),own=[];
    for(const[x,y,id,rot]of b.furn){const c=fp(id,x,y,rot||0);own.push([id,c]);for(const[a,d]of c){if(a>=w||d>=h)return [k,'out',id];blk.add(a+','+d)}}
    const fr=(x,y)=>x<0||y<0||x>=w||y>=h||(()=>{const c=R[y][x]||' ';return !'WOF'.includes(c)&&!blk.has(x+','+y)})();
    const seen=new Set(),Q=[];for(let y=-1;y<=h;y++)for(let x=-1;x<=w;x++)if(x<0||y<0||x>=w||y>=h){seen.add(x+','+y);Q.push([x,y])}
    while(Q.length){const[x,y]=Q.pop();for(const[a,c]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+a,Y=y+c;if(X<-1||Y<-1||X>w||Y>h)continue;const q=X+','+Y;if(fr(X,Y)&&!seen.has(q)){seen.add(q);Q.push([X,Y])}}}
    let bad=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(fr(x,y)&&!seen.has(x+','+y))bad.push(x+','+y);
    for(const[id,c]of own){if(BL[id].kind==='plant')continue;if(!c.some(([a,d])=>[[1,0],[-1,0],[0,1],[0,-1]].some(([p,q])=>seen.has((a+p)+','+(d+q)))))bad.push(id)}
    const cats=b.cat;return [k,cats,bad.join(' ')]}))`));
  console.log(JSON.stringify(lay));for(const[k,cat,bad]of lay){assert.ok(['house','garden','farm','play','guard'].includes(cat),k+' cat');assert.equal(bad,'',k+' closed-off cells / furniture')}
  const cnt=lay.reduce((m,[,c])=>(m[c]=(m[c]||0)+1,m),{});console.log(cnt);assert.equal(lay.length,52);/* ふつうの50こと、お話の2つ（story） */
  /* おそなえだけの家具は入れない・家でない物も建てられる（花・ふち・畑・柵・柵のドア・2×2の建物） */
  const off=JSON.parse(await run(`JSON.stringify(Object.keys(BPS).filter(k=>BPS[k].furn.some(f=>BL[f[2]].offerOnly&&STAGEONLY[f[2]]==null)))`));assert.deepEqual(off,[],'no offer-only furniture');
  /* おぼえていない物の入った設計図は、もらえない */
  const g=JSON.parse(await run(`(()=>{const sv=S.recipes;S.recipes={};const a=Object.keys(BPS).filter(bpCanGet);S.recipes=sv;return JSON.stringify({a,ok:a.every(k=>BPS[k].furn.every(f=>BL[f[2]].kind!=='furn'))})})()`));console.log('no recipes:',g.a);assert.ok(g.ok,'only furniture-free blueprints without recipes');
  /* 家でない設計図を、さいごまで建てる */
  const nh=JSON.parse(await run(`(()=>{const f=S.res[0];S.lv=15;S.feat.plant=true;S.flags.watchLearned=true;for(const id in BL){const b=BL[id];if(b.kind==='furn')S.recipes[id]=true;if(b.kind==='block')S.unlocked[id]=true;if(ATTRFL.has(id))S.unlocked[id]=true}for(const id of LVPICK)LP().got[id]=1;/* 村レベルでえらんでおぼえる物（lvpick.js）も、えらんだことにする */
    const out={can:Object.keys(BPS).filter(bpCanGet).length,miss:Object.keys(BPS).filter(k=>!bpCanGet(k)).map(k=>k+':'+bpPieces(k).filter(p=>!bpKnown(p[2],p[3])).map(p=>p[3]).join('/'))};const tests=['kadan','sakuhatake','toride','kouen'],X=(f.x|0)-14,Y=(f.y|0)+10;
    const clear=(x,y)=>{const j=y*W+x;S.obj[j]='';delete S.ref[j];delete S.dyn[j];S.floor[j]='';if(S.edge)delete S.edge[j];S.ground[j]=0;if(S.hi)S.hi[j]=0;if(S.fog)S.fog[j]=0};
    for(let y=Y-1;y<Y+8;y++)for(let x=X-1;x<X+34;x++)clear(x,y);recount();S.mat.wood=(S.mat.wood||0)+300;S.mat.stone=(S.mat.stone||0)+300;S.mat.shina=(S.mat.shina||0)+40;S.mat.funba=(S.mat.funba||0)+40;S.mat.eda=(S.mat.eda||0)+40;S.pt+=500;boxSync();
    let ox=X;const E=[];for(const k of tests){bpGive(k,f.id);const i=S.bpInv.findIndex(q=>q.k===k);const ck=bpCheck(k,ox,Y);out[k+'chk']=ck[1];askBp(i,ox,Y);confirmYes();E.push([k,S.bp.find(q=>q.k===k),ox]);ox+=bpSize(k).w+2}
    out.placed=S.bp.length;
    for(let i=0;i<300000&&S.bp.length;i++){S.food=100;for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=100}if(hour()>=19||hour()<7)S.t=(Math.floor(S.t/1440)+1)*1440+7*60;S.mat.wood=Math.max(S.mat.wood,200);S.mat.stone=Math.max(S.mat.stone,200);stepWorld(.1);if(S.dialog||!document.querySelector('#dialog').hidden){document.querySelector('#dialog').hidden=true}}
    out.left=S.bp.map(e=>e.k+':'+e.ps.filter(p=>p.s<2).map(p=>p.t+'/'+p.id+'/'+p.s).join(','));
    for(const[k,e,x]of E){if(!e)continue;const at=(dx,dy)=>(Y+dy)*W+x+dx;
      if(k==='kadan')out.kadan=e.ps.filter(p=>p.t==='edge').every(p=>S.edge&&S.edge[p.j]==='bedge')&&e.ps.filter(p=>p.t==='plant').every(p=>S.obj[p.j]===p.id)&&S.obj[at(2,2)]==='signpost';
      if(k==='sakuhatake')out.saku=e.ps.filter(p=>p.t==='fence').every(p=>S.obj[p.j]==='fence')&&S.obj[at(2,3)]==='gate'&&e.ps.filter(p=>p.t==='farm').every(p=>S.obj[p.j]==='plot'||S.obj[p.j]==='farm');
      if(k==='toride')out.toride=S.obj[at(2,1)]==='watch'&&S.obj[at(3,2)]==='part'&&S.ref[at(3,2)]===at(2,1);
      if(k==='kouen')out.kouen=S.obj[at(0,0)]==='swing'&&S.obj[at(1,0)]==='part'&&S.obj[at(3,0)]==='sandbox'&&S.obj[at(1,2)]==='bench'}
    out.done=S.bpDone;out.house=bpHouseN();const sd=S.subDone.bphome;S.subDone.bphome=false;out.lock=bpNext()===null&&!!bpNext('house',null,1);S.subDone.bphome=true;out.open=!!bpNext();S.subDone.bphome=sd;return JSON.stringify(out)})()`));
  console.log(nh);for(const k of['kamado','renga','wanoniwa','takemichi'])assert.ok(nh.miss.some(m=>m.startsWith(k+':')),k+' is volcano only');assert.ok(nh.miss.every(m=>['kamado','renga','wanoniwa','takemichi','funsui','idohatake','komugi','toriniwa','makiba','toride'].includes(m.split(':')[0])),'unexpected missing: '+nh.miss);assert.equal(nh.placed,4,JSON.stringify(nh));assert.deepEqual(nh.left,[]);
  assert.equal(nh.kadan,true);assert.equal(nh.saku,true);assert.equal(nh.toride,true);assert.equal(nh.kouen,true);assert.equal(nh.house,1,'only houses count as houses');assert.equal(nh.lock,true,'no blueprints before the bphome subquest');assert.equal(nh.open,true,'blueprints after the bphome subquest');
  /* 設計図の依頼（bpreq）とプレビュー */
  const rq=JSON.parse(await run(`(()=>{const out={};S.subDone.bphome=1;S.bpReq=null;const mr=Math.random;Math.random=()=>0.01;bpMorning();Math.random=mr;out.req=!!S.bpReq;const q=SUBQ.find(x=>x.k==='bpreq');out.at=q.at();out.t=q.t;out.rw=q.rw===BPS[S.bpReq.k].rw;
    q.onAccept();const i=S.bpInv.findIndex(z=>z.k===S.bpReq.k&&z.req);out.inv=i>=0;
    bpPop(i);const cv=document.querySelector('.pxcard canvas.pv');out.pv=!!cv&&cv.width>0&&cv.height>0;out.txt=document.querySelector('.pxcard .n').textContent;document.querySelector('.pxcard .x').click();out.closed=!document.querySelector('.pxcard canvas.pv');
    bpComplete({k:S.bpReq.k,g:null,req:1,ps:[]});out.ok=q.ok();S.subDone.bpreq=1;bpMorning();out.cleared=S.bpReq===null&&!S.subDone.bpreq;return JSON.stringify(out)})()`));
  console.log(rq);for(const k of['req','at','rw','inv','pv','closed','ok','cleared'])assert.equal(rq[k],true,'bpreq '+k);assert.ok(/むずかしさ/.test(rq.txt));
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
