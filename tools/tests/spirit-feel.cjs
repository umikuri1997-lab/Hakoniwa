/* せいれいの動きの手ざわり：箱の前の行列（boxQueueWait）・すわる家具に、となりのマスから乗る・おりる（SEATMV）・畑のとなりに立つ（farmStand）・
   食べる物ごとの食べ方（eatKind）・つりの結果のよろこぶ／がっかり／ふしぎ（spReact）・床で寝る動き・もやもや（funLow）・動きの絵があること */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
const reset=`setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.food=0;S.t=1440*2+600;for(let y=CY-20;y<CY+20;y++)for(let x=CX-20;x<CX+20;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.ref[j];delete S.dyn[j];}`;
/* 行列：せまい通路の箱。先の子が作業しているあいだ、あとの2人はならんで待ち、べつの用事の子はすれちがって通れる */
const q=await run(`(()=>{${reset}S.res=[mkRes(S,POKO,'wood',CX+.5,CY+1.5),mkRes(S,'ノドカ','earth',CX+.5,CY+3.5),mkRes(S,'アオ','water',CX+.5,CY+4.5),mkRes(S,'フウ','wind',CX+.5,CY-4.5)];
 for(let y=CY-8;y<=CY+5;y++){S.obj[y*W+CX-1]='fence';S.obj[y*W+CX+1]='fence'}S.obj[(CY-6)*W+CX]='crate';S.obj[(CY-7)*W+CX]='fence';recount();
 const [a,b,c,d]=S.res;for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=100;endAct(r)}for(const r of [a,b,c])r.carry={mugi:2};
 const st=r=>{const G=bfs(r.x|0,r.y|0),k=nearest(G,j=>putAdj(j,['mugi'])>=0,200);startAct(r,G,'store',k,{});r.act.whyW=0;return k};const k=st(a);st(b);st(c);startAct(d,bfs(d.x|0,d.y|0),'step',(CY+8)*W+CX,{});
 let maxQ=0,minGap=9,passed=false;for(let i=0;i<300;i++){S.t+=.1;for(const r of S.res)updRes(r,.1);sepRes(.1);const qs=[b,c].filter(r=>QUEUE.has(r));maxQ=Math.max(maxQ,qs.length);if(qs.length===2)minGap=Math.min(minGap,Math.abs(b.y-c.y));if(d.y>CY+4)passed=true}
 return {maxQ,minGap,passed}})()`);
assert.equal(q.maxQ,2,'2人がならんで待つ '+JSON.stringify(q));assert.ok(q.minGap>.5,'ならぶ子は、かさならない '+JSON.stringify(q));assert.ok(q.passed,'べつの用事の子は、行列とすれちがえる');
/* すわる家具・畑 */
const s=await run(`(()=>{${reset}S.res=[mkRes(S,POKO,'wood',CX+.5,CY+.5)];const o={};const bj=(CY-3)*W+CX;S.obj[bj]='bench';S.obj[bj+1]='part';S.ref[bj+1]=bj;recount();
 const r=S.res[0];r.hunger=hMax(r);r.energy=20;endAct(r);r.x=CX+.5;r.y=CY+2.5;startAct(r,bfs(r.x|0,r.y|0),'rest',bj,{key:'o'+bj,obj:bj,seat:bj,dur:3});
 for(let i=0;i<300&&!(r.act&&r.act.stage==='do');i++){S.t+=.1;updRes(r,.1)}const m=SEATMV.get(r);o.in=m&&m.k==='in'&&Math.round(m.y/TS-.5)===CY-2;o.seated=(r.y|0)===CY-3;
 SEATLAST.set(r,{x:0,y:0,t:performance.now()});endAct(r);startAct(r,bfs(r.x|0,r.y|0),'step',(CY+3)*W+CX,{});S.t+=.1;updRes(r,.1);o.out=SEATMV.get(r)?.k==='out'&&(r.y|0)!==CY-3;
 const fj=(CY+5)*W+CX+5;S.obj[fj]='farm';S.dyn[fj]={g:10,wet:0,sown:true,crop:'mugi'};recount();endAct(r);r.x=CX+.5;r.y=CY+.5;r.wcan=3;r.elem='water';tryJob(r,bfs(r.x|0,r.y|0),'water');const sd=r.act.stand;o.farm=r.act.obj===fj&&sd!==fj&&Math.abs(sd%W-fj%W)+Math.abs((sd/W|0)-(fj/W|0))===1;
 o.eat=[['milk'],['bread'],['apple'],['kinoko'],['soup']].map(eatKind);o.snd=[...Object.keys(FOODS),...COOKD.map(D=>D.id)].map(k=>eatSnd([k])).filter(k=>!SAMPLES[k]);o.snd1=[['apple'],['bread'],['milkshake'],['soup']].map(eatSnd);
 o.motions=['draw','eat_drink','eat_bread','eat_fruit','eat_meal','petted','anipat','sleepcurl'].filter(k=>!SPM[k]);o.drawPh=SPM.draw&&SPM.draw.r;
 r.fun=20;o.low=[funLow(r),(r.elem='wind',r.fun=50,funLow(r)),(r.fun=70,funLow(r))];
 const n=performance.now();spReact(r,'sad',1000);o.sad=[spReactNow(r,n+10),spAnimFix(r,n+10,false,true,'')];spReact(r,'think',1000);o.think=r.bubble;
 return o})()`);
assert.deepEqual(s,{in:true,seated:true,out:true,farm:true,eat:['drink','bread','fruit','meal','drink'],snd:[],snd1:['ea_apple','ea_toast','ea_shake','ea_sip'],motions:[],drawPh:'ph',low:[true,true,false],sad:['sad','talksad'],think:'❓'},JSON.stringify(s));
assert.deepEqual(errors,[]);console.log('spirit feel ok',JSON.stringify(q));await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
