const assert=require('node:assert/strict');
/* 雪のつもり方・物の上の雪・池の氷・ふる雪（js/snow.js・js/season.js）：
   地面の雪は4段（1段めは地面の3%より少なく、かたまりになる。段ごとにふえるだけ）・水にはつもらない。物の上の雪は3段で、上の輪郭の行はのこす。
   池は冬の日がすすむほど岸からこおり（まん中はあと）、4日めの朝にひび。川はこおらない。こおった所では、つりをやめる。ふる雪は、きめた行でとまって、のこる。描いてもエラーが出ないこと */
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
await page.waitForFunction(()=>sacredEval('chaReady()'),{},{timeout:60000});
const out=JSON.parse(await run(`(()=>{const out={};USERPAUSE=true;
 let d=2;while(!(seasonOf(d)===3&&seasonOf(d-1)!==3))d++;const T=(dd,h)=>{S.t=1440*(dd-1)+h*60};T(d,12);
 /* 段 */out.stage=[0,.07,.3,.55,1].map(a=>{S.snowA=a;return[snowStage(),snowCapStage()]});
 /* 地面：ひらけた所の四角で、段ごとのわりあい */S.snowA=1;SNW.key=null;snowPrep();const B=snowBake(CX*TS-320,CY*TS-320,640,640),N=B.st.length,c=[0,0,0,0,0];for(let i=0;i<N;i++)c[B.st[i]]++;
 out.share=[c[1]/N,(c[1]+c[2])/N,(c[1]+c[2]+c[3])/N];let tch=0;for(let y=1;y<639;y++)for(let x=1;x<639;x++){const i=y*640+x;if(B.st[i]!==1)continue;if(B.st[i-1]===1||B.st[i+1]===1||B.st[i-640]===1||B.st[i+640]===1)tch++}out.touch=c[1]?tch/c[1]:0;
 const B2=snowBake(CX*TS-320,CY*TS-320,640,640);let same=true;for(let i=0;i<N;i++)if(B2.st[i]!==B.st[i]){same=false;break}out.same=same;
 /* 池：村のまん中から少しはなれた所に、5×5の池を作る */const px=CX+12,py=CY+10;for(let y=py;y<py+5;y++)for(let x=px;x<px+5;x++){const j=y*W+x;S.obj[j]=null;S.floor[j]=null;S.ground[j]=1}
 recount();SNI.hf=-1e9;const pj=(py+2)*W+px+2,ej=py*W+px;out.kind=waterKind(pj);out.water=snowTileOK(pj);
 const fz=(dd,h)=>{T(dd,h);SNI.hf=-1e9;return[iceFreeze(),iceW(ej),iceW(pj),iceCrack()]};out.f0=fz(d,5);out.fh=fz(d+1,6);out.f1=fz(d+2,7);out.fc=fz(d+3,9);
 out.spring=(()=>{let e=d+1;while(seasonOf(e)===3)e++;T(e,9);return[iceFreeze(),iceW(pj)]})();
 /* つり：こおった池のとなりのいすでは、つりをやめる */T(d+2,10);const r=S.res[0],st=(py+2)*W+px-1;S.obj[st]=null;S.ground[st]=0;recount();SNI.hf=-1e9;const a={stand:st,type:'fish'};out.fw=fishW(st);ACT.fish.tick(r,a,.1);out.lost=a.lost||0;
 /* 絵：氷の区画と、地面の雪の区画ができる */{let n=0;for(const q of IG.c.values()){if(!q.w)continue;for(let t=0;t<200;t++){RFN++;if(iceRegion(q,igWaterPat(),iceKey())){n++;break}const e=SNI.R.get(q.cy*64+q.cx);if(e&&!e.g&&!e.n)break}}out.iceR=n;
   S.snowA=1;for(let t=0;t<400;t++){RFN++;snowGround(dpr*cam.z)}out.snowR=[...SNW.R.values()].filter(e=>e.any).length}
 /* 物の上の雪 */const ch=CHIPS['tree']||CHIPS['tree#0'];const src=ch&&(ch.src||ch);const cap=src&&snowCapOf(src,'tree');
 if(cap){const n=cv=>{const g=cv.getContext('2d'),D=g.getImageData(0,0,cv.width,cv.height).data;let k=0;for(let i=3;i<D.length;i+=4)if(D[i])k++;return k};out.cap=cap.map(n);
   const im=chipImgs(src,'tree')[0],t=document.createElement('canvas');t.width=src.w;t.height=src.h;const g=t.getContext('2d');g.drawImage(im,0,0,src.w,src.h);const D=g.getImageData(0,0,src.w,src.h).data,C=cap[2].getContext('2d').getImageData(0,0,src.w,src.h).data;let top=0,cov=0;
   const Q=src.g===64?2:1;for(let x=0;x<src.w;x+=Q)for(let y=0;y<src.h;y+=Q)if(D[(y*src.w+x)*4+3]>140){top++;if(C[(y*src.w+x)*4+3])cov++;break}out.topCov=cov}
 /* ふる雪：きめた行でとまり、のこってから、上からまたふる */T(d,12);S.rain=true;const m=SEAP[0];seaLand(m);m.vz=false;m.y=m.ly-.0001;seasonStep(.1,1000);out.land=[m.y===m.ly,m.rt===1000+SEAREST];seasonStep(.1,1200);out.rest=m.y===m.ly;seasonStep(.1,1000+SEAREST+1);out.again=m.y<0;
 S.snowA=1;cam.z=homeZ();panTo&&0;dirty=true;window.__fe=null;const fe0=frameErr;frameErr=function(w,e){window.__fe=w+':'+(e&&e.message);return fe0(w,e)};USERPAUSE=true;T(d+3,9);
 return JSON.stringify(out)})()`));
await page.waitForTimeout(600);const fe=await run(`window.__fe`);
console.log(JSON.stringify(out));
assert.deepEqual(out.stage,[[0,0],[1,1],[2,1],[3,2],[4,3]],'stages');
assert.ok(out.share[0]>0&&out.share[0]<.03,'stage 1 is under 3% of open ground '+out.share);
assert.ok(out.share[0]<out.share[1]&&out.share[1]<out.share[2]&&out.share[1]<.2,'stages only grow '+out.share);
assert.ok(out.touch>.5,'stage 1 makes clusters '+out.touch);assert.ok(out.same,'bake is the same every time');
assert.equal(out.kind,'pond');assert.equal(out.water,false,'no ground snow on water');
assert.deepEqual(out.f0,[0,false,false,0],'before the first winter morning: no ice');
assert.ok(out.fh[0]>.4&&out.fh[0]<.6&&out.fh[1]&&!out.fh[2],'half way: the shore is ice, the middle is open '+out.fh);
assert.ok(out.f1[0]===1&&out.f1[1]&&out.f1[2]&&out.f1[3]===0,'day 3: all ice, no cracks yet '+out.f1);
assert.ok(out.fc[3]>0,'day 4 morning: cracks '+out.fc);assert.deepEqual(out.spring,[0,false],'spring: melted');
assert.ok(out.fw>=0&&out.lost===1,'no fishing on ice '+out.fw+' '+out.lost);
assert.ok(out.cap&&out.cap[0]>0&&out.cap[0]<out.cap[1]&&out.cap[1]<out.cap[2],'caps grow in 3 stages '+out.cap);assert.equal(out.topCov,0,'the top outline stays');
assert.ok(out.iceR>0,'ice is drawn on the pond '+out.iceR);assert.ok(out.snowR>0,'ground snow is drawn '+out.snowR);assert.deepEqual(out.land,[true,true]);assert.ok(out.rest&&out.again,'flakes rest, then fall again');
assert.equal(fe,null,'frame error: '+fe);assert.deepEqual(errors,[]);
console.log('Snow and ice: stages, clusters, caps, pond ice, no fishing on ice, landing flakes. Browser errors: none');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
