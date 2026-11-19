/* 木がたおれる（juice.js の treeFall）：さいごの一回で木がなくなると、たおれる木（TFALL）が出て、ミシミシ → ドンで地面につき、そのあと消える。
   日記の文が書く物に合う（diary.js の dyFit）・小屋の雑談は小屋があるときだけ（spotHintOK の has）・加工の物を頭につむ（carryIcons）もここで */
const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await boot();
const o=await run(`(()=>{const o={};let j=-1;for(let k=W*30;k<W*H-W*30;k++)if(!S.obj[k]&&walk(k)&&!S.obj[k+1]&&walk(k+1)){j=k;break}
 S.obj[j]='tree';S.dyn[j]={g:100};recount();const r=S.res[0];r.x=j%W+1.5;r.y=((j/W)|0)+.5;S.hp['n'+j]=9;useNat(j,r);
 o.gone=!S.obj[j];o.n=TFALL.length;const f=TFALL[0];o.dir=f&&f.dir;o.wob=Math.abs(tfAng(f,.5))<.06;o.fall=Math.abs(tfAng(f,TFTHUD-.01))>1.2;o.lie=Math.abs(tfAng(f,TFTHUD+.5))>1.3;
 f.t0=performance.now()-(TFTHUD+.05)*1000;render(performance.now());o.thud=f.thud;f.t0=performance.now()-(TFTHUD+TFLIE+TFOUT+.2)*1000;render(performance.now());o.end=TFALL.length;
 o.fit=[dyFit(['@Nができたよ！','ぼく、そっと、なでてみたんだ。'],'pbuilt','campfire'),dyFit(['@Nができたよ！','ぼく、そっと、なでてみたんだ。'],'pbuilt','bench'),dyFit(['どんな味なのかな'],'cook','milkshake'),dyFit(['土を、ぽんぽん'],'plant','lotus'),dyFit(['どっしり'],'build','fence'),dyIdOf('pbuilt','たき火')];
 S.ani=[];for(const k in counts)if(k==='coop'||k==='barn')counts[k]=0;counts.mizuoke=1;const mk=CHATS.findIndex(c=>c.hint==='makiba');o.hut=CHATS[mk].ok();
 r.ppk={j:0,m:{shina:2,'f:mugi':1}};o.carry=carryIcons(r).length;r.ppk=null;
 return o})()`);
assert.deepEqual(o,{gone:true,n:1,dir:-1,wob:true,fall:true,lie:true,thud:1,end:0,fit:[false,true,false,false,false,'campfire'],hut:false,carry:3});
assert.deepEqual(errors,[]);console.log('treefall ok');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
