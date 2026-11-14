const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:1400,height:1000}});
for(const k of ['tree','deadtree','berry','rock','boulder']){await p.goto('http://localhost:8766/index.html?f='+k+'.glb&plain=1&el=22');await p.waitForFunction('window.DONE',null,{timeout:300000});await p.screenshot({path:'sh_'+k+'.png'})}
await b.close()})();
