/* たしかめ用：せいれいの場面（ベッド・いす・床で寝る）を、ゲームの画面で大きく写す。
   node tools/art/spirit3d/sceneshot.cjs <出す .png> <bed|chair|eat|floor> [家具の id]
   bed：ベッド4つ（向き0・1 を2つずつ）に眠る／chair：いす4つ（向き0〜3）にすわる／eat：いすにすわって食べる／floor：床で寝る4人 */
(async()=>{const [out,mode='bed',id0]=process.argv.slice(2),id=id0||(mode==='bed'?'bed':'chair');
  const {browser,page,run,errors}=await require('../../sim/boot.cjs')({viewport:{width:900,height:700}});
  console.log(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.hold=0;const els=['wood','wind','water','fire'],mode='${mode}',id='${id}',r0=S.res[0];
    let j0=-1;for(let d=2;d<30&&j0<0;d++)for(const[ox,oy]of[[d,0],[-d,0],[0,d],[0,-d],[d,d],[-d,-d],[-d,d],[d,-d]]){const x=(r0.x|0)+ox,y=(r0.y|0)+oy;let ok=true;for(let b=-1;b<5&&ok;b++)for(let a=-1;a<5&&ok;a++){const q=(y+b)*W+x+a;if(S.ground[q]!==0||S.obj[q])ok=false}if(ok){j0=y*W+x;break}}
    window.__bj=[];S.rot=S.rot||{};for(let k=0;k<4;k++){const j=j0+(k>1?2*W:0)+(k%2)*2;if(mode!=='floor'){S.obj[j]=id;const n=ROTS[id]||1,rt=n===4?k:n===2?k%2:0;if(rt)S.rot[j]=rt}window.__bj.push(j)}
    while(S.res.length<4){const q=JSON.parse(JSON.stringify(r0));q.id=100+S.res.length;q.name='t'+q.id;S.res.push(q)}
    S.res.forEach((r,k)=>{r.elem=els[k];r.hidden=false;const j=window.__bj[k];r.path=[];r.nap=false;
      if(mode==='bed'){r.x=j%W+.5+(k%2?1.2:0);r.y=(j/W|0)+.5+(k%2?0:1.2);r.act={type:'sleep',stage:'do',obj:j,t:0}}
      else if(mode==='floor'){r.x=j%W+.5;r.y=(j/W|0)+.5;r.act={type:'sleep',stage:'do',ground:true,t:0}}
      else{r.x=j%W+.5;r.y=(j/W|0)+.5;r.act=mode==='eat'?{type:'eat',stage:'do',t:0,items:['bread'],e:'🍞'}:{type:'rest',stage:'do',obj:j,t:0}}});
    recount();USERPAUSE=true;document.querySelectorAll('.hud,.dock,.quest,#qrow,.qrow,#skill,#toast,#tutHand').forEach(e=>e.style.visibility='hidden');S.t=Math.floor(S.t/1440)*1440+12*60;rebuildStatic(true);
    return JSON.stringify(S.res.slice(0,4).map(r=>[r.elem,r.act.type,mode==='floor'?'':rotAt(window.__bj[S.res.indexOf(r)])]))})()`));
  const cam=`(()=>{const j=window.__bj[0];cam.z=3;camAt((j%W+1.5)*TS,((j/W|0)+1.5)*TS,450,350);dirty=true})()`;
  await run(cam);await page.waitForTimeout(3000);await run(cam);await page.waitForTimeout(1500);
  await run(`(()=>{const e=[...document.querySelectorAll('div')].find(d=>/読みこみの時間/.test(d.textContent)&&d.children.length<3);if(e)e.style.display='none'})()`);
  await page.waitForTimeout(300);await page.screenshot({path:out,clip:{x:150,y:100,width:600,height:460}});
  console.log('errors',errors.slice(0,4));await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
