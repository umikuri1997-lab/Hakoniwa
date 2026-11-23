const assert=require('node:assert/strict');
/* 屋根の雪とつや（iqRoofBuild・iqRoofColDraw、js/iso-conn.js）：クォータービューの屋根の坂に、雪のかたまり（少しつもった）・坂ぜんたいの雪（つもりきった）・あらしの日のぬれた点を描く。ふらない日は描かない */
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
const out=JSON.parse(await run(`(()=>{USERPAUSE=true;const f=S.res[0],X=(f.x|0)+6,Y=(f.y|0)+3;
  for(let y=Y-1;y<Y+7;y++)for(let x=X-1;x<X+7;x++){const j=y*W+x;S.obj[j]='';delete S.ref[j];delete S.dyn[j];S.floor[j]='';S.ground[j]=0;if(S.hi)S.hi[j]=0;if(S.fog)S.fog[j]=0}
  for(let y=Y;y<Y+5;y++)for(let x=X;x<X+5;x++){const j=y*W+x;if(y===Y||y===Y+4||x===X||x===X+4)S.obj[j]='hwall';else S.floor[j]='floor'}S.obj[(Y+4)*W+X+2]='door';recount();
  const h=HOUSES.find(q=>q.inside.has((Y+2)*W+X+2));const C0={...FEELC};cam.z=2;cam.x=(X+2.5)*TS-VW/cam.z/2;cam.y=(Y+2.5)*TS-VH/cam.z/2;
  const cnt=()=>{let dots=0;const r0=ctx.fillRect;ctx.fillRect=function(...a){if(ctx.fillStyle==='#eef6ff')dots++;return r0.apply(this,a)};
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);iqRoofDraw(ctx,h,1);ctx.restore();ctx.fillRect=r0;
    const d=ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height).data;let white=0,roof=0;for(let q=0;q<d.length;q+=4){if(!d[q+3])continue;roof++;if(Math.min(d[q],d[q+1],d[q+2])>150)white++}
    return{w:Math.round(white/Math.max(1,roof)*1000)/1000,dots}};
  const r={};FEELC={...C0,snow:0,wet:false};r.none=cnt();FEELC={...C0,snow:.2,wet:false};r.some=cnt();FEELC={...C0,snow:.9,wet:false};r.full=cnt();FEELC={...C0,snow:0,wet:true};r.wet=cnt();FEELC=C0;return JSON.stringify(r)})()`));
  assert.deepEqual(out.none,{w:0,dots:0},'nothing on a clear day');
  assert.ok(out.some.w>0.03&&out.some.w<0.6&&out.some.dots===0,'a little snow: lumps only '+JSON.stringify(out.some));
  assert.ok(out.full.w>0.6,'deep snow: the whole slope turns white '+JSON.stringify(out.full));
  assert.ok(out.wet.dots>0&&out.wet.w===0,'storm: wet glints on the roof '+JSON.stringify(out.wet));
  console.log('Roof snow and gloss:',JSON.stringify(out));
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
