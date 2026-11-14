const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:1400,height:1000}});
for(const [f,o] of [['tree.glb','tree_real.png'],['skel.glb','skel_real.png']]){await p.goto('http://localhost:8766/index.html?f='+f);await p.waitForFunction('window.DONE',null,{timeout:120000});await p.screenshot({path:o})}
await b.close()})();
