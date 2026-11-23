const assert=require('node:assert/strict');
/* 屋根の雪とつや（feelRoof、js/feel.js）：クォータービューの屋根の坂に、雪のかたまり（少しつもった）・坂ぜんたいの雪（つもりきった）・あらしの日のぬれた点を描く。ふらない日は描かない */
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
const out=JSON.parse(await run(`(()=>{USERPAUSE=true;const f=S.res[0],X=(f.x|0)+6,Y=(f.y|0)+3;
  for(let y=Y-1;y<Y+7;y++)for(let x=X-1;x<X+7;x++){const j=y*W+x;S.obj[j]='';delete S.ref[j];delete S.dyn[j];S.floor[j]='';S.ground[j]=0;if(S.hi)S.hi[j]=0;if(S.fog)S.fog[j]=0}
  for(let y=Y;y<Y+5;y++)for(let x=X;x<X+5;x++){const j=y*W+x;if(y===Y||y===Y+4||x===X||x===X+4)S.obj[j]='hwall';else S.floor[j]='floor'}S.obj[(Y+4)*W+X+2]='door';recount();
  const h=HOUSES.find(q=>q.inside.has((Y+2)*W+X+2)),I=iqRoofCols(h);const C0={...FEELC};
  const cnt=()=>{const cols={},o0=iqPoly,r0=ctx.fillRect;let dots=0;iqPoly=(c,P,col)=>{cols[col]=(cols[col]||0)+1;return o0(c,P,col)};ctx.fillRect=function(...a){if(ctx.fillStyle==='#eef6ff')dots++;return r0.apply(this,a)};
    ctx.save();for(const x of I.top.keys())iqRoofCol(ctx,h,I,x,1);ctx.restore();iqPoly=o0;ctx.fillRect=r0;return{blob:cols['#ffffff']||0,full:cols['#f3f8ff']||0,dots}};
  const r={};FEELC={...C0,snow:0,wet:false};r.none=cnt();FEELC={...C0,snow:.2,wet:false};r.some=cnt();FEELC={...C0,snow:.9,wet:false};r.full=cnt();FEELC={...C0,snow:0,wet:true};r.wet=cnt();FEELC=C0;return JSON.stringify(r)})()`));
  assert.deepEqual(out.none,{blob:0,full:0,dots:0},'nothing on a clear day');
  assert.ok(out.some.blob>0&&out.some.full===0,'a little snow: lumps only '+JSON.stringify(out.some));
  assert.ok(out.full.full>0&&out.full.blob>0,'deep snow: the whole slope turns white '+JSON.stringify(out.full));
  assert.ok(out.wet.dots>0&&out.wet.blob===0,'storm: wet glints on the roof '+JSON.stringify(out.wet));
  console.log('Roof snow and gloss:',JSON.stringify(out));
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
