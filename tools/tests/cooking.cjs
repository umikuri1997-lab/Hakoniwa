/* 料理：材料を入れると、その組み合わせの料理ができる（cook.js・cook-table.js）。
   表：材料1・2しゅるいは、どれも調理台かたき火で作れる・家具で料理がかわる・とくべつな魚・表にない組み合わせはふしぎな料理。
   入れる：その料理の属性のせいれいだけが作る（ふしぎな料理はだれでも）・できたら、おぼえて「あたらしい料理！」。
   おまかせ：作ったことのある料理だけ。夜は材料をもどす。前のセーブ：17の料理をおぼえ、えらんであった料理は「入れる」に。画面・図鑑・アイコン。 */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;USERPAUSE=true;const out={};
    /* 表 */const base=['mugi','imo','tomato','berry','apple','egg','milk','fish','takenoko','kinoko','komugiko'];out.miss=[];
    for(let a=0;a<base.length;a++)for(let b=a;b<base.length;b++){const ins=[...new Set([base[a],base[b]])];if(!['cooktable','campfire'].some(s=>cookDish(ins,s)))out.miss.push(ins.join('+'))}
    out.n=COOKD.length;out.byStation=[cookDish(['apple'],'cooktable'),cookDish(['apple'],'campfire'),cookDish(['apple'],'oven')].map(k=>FOODS[k].name);
    out.unagi=FOODS[cookDish(['unagi'],'campfire')].name;out.unagiTomato=cookDish(['unagi','tomato'],'cooktable');out.fsg=recOf(cookKey(['berry','fish','kinoko'],'cooktable')).out;
    out.noIcon=COOKD.filter(D=>!foodIc(D.id)).map(D=>D.id);out.fsgIc=!!foodIc('fsg2');out.legacy=recOf('salad').key;
    out.bad=COOKD.filter(D=>D.f&&D.f.bad).length;out.numOK=COOKD.filter(D=>D.f).every(D=>{const f=D.f,ef=f.ef||{},t=[];if(ef.en)t.push('つかれ－'+ef.en);if(ef.fun)t.push(ef.fun<0?'たのしさ－'+(-ef.fun):'たのしさ+'+ef.fun);if(ef.wk)t.push((ef.wk[1]/60)+'時間、はたらく速さ+'+ef.wk[0]);if(ef.warm)t.push((ef.warm/90)+'時間、冬の寒さがとどかない');if(ef.cool)t.push((ef.cool/90)+'時間、夏の暑さがとどかない');return t.join('・')===f.fx});
    /* 村で動かす */
    function setup(el){S.ground.fill(0);S.hi.fill(0);S.obj.fill('');S.floor.fill('');S.dyn={};S.enemies=[];S.drops=[];S.seeds=[];S.t=1440*2+700;S.hold=0;resv.clear();BAN.clear();
      const box=50*W+50,st=50*W+56;S.obj[box]='crate';S.obj[st]='cooktable';S.box={};S.pile={};S.rsv={};S.fs={};syncFood();recount();boxSync();S.ovenSet={};
      const b0=S.res[0];S.res=[];for(let i=0;i<2;i++){const q=JSON.parse(JSON.stringify(b0));q.id=200+i;q.name='e'+i;q.elem=el;q.x=53.5+i;q.y=52.5;q.act=null;q.cing=null;q.cgot=null;q.carry=null;q.hunger=1500;q.fun=90;q.energy=100;q.hidden=false;q.vr=q.vr||{};q.vr.tr='';S.res.push(q)}recount();return st}
    const runN=n=>{const c0=S.cookN||0;for(let i=0;i<n&&(S.cookN||0)===c0;i++){stepWorld(.25);for(const q of S.res){q.hunger=1500;q.fun=90}}return (S.cookN||0)-c0};
    const sim=(el,ins,mode)=>{const st=setup(el);S.cookKn={};COOKNEW.length=0;for(const k of ins)S.fs[k]=3;syncFood();boxSync();S.ovenSet={[st]:typeof mode==='object'?mode:{m:'in',in:ins}};const n=runN(mode==='fsg'||el!=='wind'?6000:1500);return {n,kn:Object.values(S.cookKn||{}),nw:COOKNEW.map(g=>g.out),fs:Object.keys(S.fs).filter(k=>S.fs[k]>0&&FOODS[k].dish)}};
    out.juiceWater=sim('water',['apple']);out.juiceWind=sim('wind',['apple']);
    out.fsgWind=sim('wind',['berry','takenoko','kinoko'],'fsg');
    out.autoNone=sim('water',['apple'],{m:'auto'});
    {const st=setup('water');S.cookKn={'apple@cooktable':'applejuice'};S.fs.apple=3;syncFood();boxSync();S.ovenSet={[st]:{m:'auto'}};out.autoKnown=runN(6000);}
    {const st=setup('fire');S.obj[st]='campfire';recount();const k=cookKey(['fish','berry'],'campfire');S.cookKn={[k]:cookDish(['fish','berry'],'campfire')};out.badName=FOODS[S.cookKn[k]].name;S.fs.fish=2;S.fs.berry=2;syncFood();boxSync();S.ovenSet={[st]:{m:'auto'}};out.autoBad=cookPick(st,S.res[0])?1:0;out.fsgFun=FOODS.fsg2.ef.fun}
    /* 夜は材料をもどす */{const st=setup('water');S.fs.apple=1;syncFood();boxSync();const q=S.res[0];q.cing={rec:'apple@cooktable',ov:st,nd:{apple:1}};out.cingKey=q.cing.rec;const b=S.fs.apple;q.act=null;S.t=1440*3+23*60+30;S.hold=0;decide0(q);out.nightBack=S.fs.apple-b;out.nightCing=q.cing}
    /* 前のセーブ */{const st=setup('water');const j=st;S.ovenSet={[j]:'salad'};delete S.flags.cook2;delete S.cookKn;S.res[0].cing={rec:'applejuice',ov:j,nd:{apple:1}};const sv=JSON.parse(JSON.stringify(S));continueGame(sv);out.mig={set:JSON.stringify(S.ovenSet[j]),kn:Object.keys(S.cookKn||{}).length,cing:S.res[0].cing&&S.res[0].cing.rec}}
    /* 画面 */{const st=setup('water');S.cookKn={'apple@cooktable':'applejuice'};S.ovenSet={[st]:{m:'in',in:['apple','berry']}};openSheet('oven',st);out.sheet=document.querySelector('.sheet').textContent;closeSheet();
      openSheet('menu','zukan');ZKT=8;renderSheet();out.zk=document.querySelector('.sheet').textContent;closeSheet()}
    /* 食べたときの効果 */{const q=S.res[0];const D=COOKD.find(D=>D.f&&D.f.ef&&D.f.ef.en&&D.f.ef.fun);q.energy=10;q.fun=10;ACT.eat.end(q,{items:[D.id],pt:0,pw:0});out.eat=[q.energy-10,q.fun-10,D.f.ef.en,D.f.ef.fun]}
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.deepEqual(r.miss,[]);assert.ok(r.n>=130,r.n);assert.deepEqual(r.byStation,['りんごジュース','やきりんご','やきりんご']);
  assert.equal(r.unagi,'かば焼き');assert.ok(r.unagiTomato,'unagi+tomato falls back to fish+tomato');assert.equal(r.fsg,'fsg3');
  assert.deepEqual(r.noIcon,[]);assert.equal(r.fsgIc,true);assert.equal(r.legacy,'tomato@cooktable');assert.equal(r.numOK,true);
  assert.ok(r.juiceWater.n>=1);assert.deepEqual(r.juiceWater.kn,['applejuice']);assert.deepEqual(r.juiceWater.nw,['applejuice']);
  assert.equal(r.juiceWind.n,0);assert.ok(r.fsgWind.n>=1);assert.deepEqual(r.fsgWind.kn,['fsg3']);
  assert.equal(r.autoNone.n,0);assert.equal(r.bad,9);assert.equal(r.autoBad,0);assert.equal(r.badName,'むらさきのさかな');assert.equal(r.fsgFun,-10);assert.ok(r.autoKnown>=1);
  assert.equal(r.cingKey,'apple@cooktable');assert.equal(r.nightBack,1);assert.equal(r.nightCing,null);
  assert.equal(r.mig.set,'{"m":"in","in":["tomato"]}');assert.equal(r.mig.kn,17);assert.equal(r.mig.cing,'apple@cooktable');
  assert.ok(r.sheet.includes('おまかせ')&&r.sheet.includes('りんごジュース')&&r.sheet.includes('？？？'),r.sheet);assert.ok(r.zk.includes('りんごジュース'),r.zk);
  assert.deepEqual(r.eat.slice(0,2),r.eat.slice(2));
  assert.deepEqual(errors,[]);console.log('cooking ok');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
