const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'../..');
const c=vm.createContext({console,ACT:{},dirty:false,document:{querySelector(){return {hidden:true}}},performance:{now:()=>0},setTimeout(){},localStorage:{getItem(){return null}}});
for(const f of ['core','data','story','world','village','quests','night','companion-story','story-ending'])vm.runInContext(fs.readFileSync(path.join(root,'js',f+'.js'),'utf8'),c,{filename:f});
const run=code=>vm.runInContext(code,c);
const old=JSON.parse(run('JSON.stringify(QUESTS1_V1.filter(id=>!COMPANION_QUESTS.has(id)))'));
for(let i=0;i<=old.length;i++){
  run(`S={world:0,flags:{},quest:${i},qStory:${i<old.length?i:'null'}};migrateCompanionStory(S)`);
  if(i<old.length){assert.equal(run('QUESTS1_V1[S.quest]'),old[i]);assert.equal(run('QUESTS1_V1[S.qStory]'),old[i]);}
  else assert.equal(run('S.quest'),run('QUESTS1_V1.length'));
  const mapped=run('S.quest');run('migrateCompanionStory(S)');assert.equal(run('S.quest'),mapped);
}
for(const state of [{world:1},{world:0,free:true}]){run(`S=${JSON.stringify({...state,flags:{},quest:8,qStory:7})};migrateCompanionStory(S)`);assert.equal(run('S.quest'),8);assert.equal(run('S.qStory'),7);}
console.log('Save migration: every original quest and pending completion, idempotence, other modes');
const prior=JSON.parse(run('JSON.stringify(companionQuestList({world:0,flags:{companionStory:1}}).map(q=>q.id))'));
for(let i=0;i<=prior.length;i++){
  run(`S={world:0,flags:{companionStory:1},quest:${i},qStory:${i<prior.length?i:'null'},qTalked:true};migrateCompanionStory(S)`);
  const expected=run(`COMPANION_REPLACEMENTS[${JSON.stringify(prior[i])||'null'}]||${JSON.stringify(prior[i])||'null'}`);
  if(i<prior.length){assert.equal(run('QUESTS1_V1[S.quest]'),expected);assert.equal(run('QUESTS1_V1[S.qStory]'),expected);}
  else assert.equal(run('S.quest'),run('QUESTS1_V1.length'));
}
for(const id of ['fireSupplies','fireLights','waterFields','waterFlowers','windRoad','windGather']){
  const i=prior.indexOf(id);run(`S={world:0,flags:{companionStory:1},quest:${i},qStory:null,qTalked:true};migrateCompanionStory(S)`);
  assert.equal(run('S.qTalked'),false,'replacement must explain its new goal');
}
console.log('PR 1064 saves: every index and pending report preserved; active replacements explain the new goal');
/* 小さな目標をまとめた目標（qmerge1）：古い番号を、名前でまとめた目標へ。2回読みこんでもずれない */
const V1=JSON.parse(run('JSON.stringify(QUESTS1_V1)')),GROUP=JSON.parse(run('JSON.stringify(QM_GROUP)'));
for(let i=0;i<=V1.length;i++)for(const talked of [false,true])for(const pending of [false,true]){
  if(pending&&i===0)continue;
  run(`S={world:0,flags:{fieldStoryV2:1},mat:{},inv:{},quest:${i},qStory:${pending?i-1:'null'},qTalked:${talked}};migrateQuestMerge(S)`);
  const id=V1[i],want=id==null?null:id==='lv5'?'tower':GROUP[id]||id;
  if(id==null)assert.equal(run('S.quest'),run('QUESTS1_V3().length'));
  else if(!pending||run('S.qStory')==null)assert.equal(run('QUESTS1_V3()[S.quest]'),want,'old '+id);
  if(pending){const sid=V1[i-1],lastOf=!V1.slice(i).some(v=>(GROUP[v]||v)===(GROUP[sid]||sid));
    if(lastOf){assert.equal(run('QUESTS1_V3()[S.qStory]'),GROUP[sid]||sid,'pending '+sid);assert(run('S.quest>S.qStory'));}
    else assert.equal(run('S.qStory'),null,'mid-group story '+sid);}
  if(id!=null&&!pending&&(GROUP[id]&&GROUP[id]!==id)){const owner=run(`QM_OWNER[${JSON.stringify(GROUP[id])}]`)||GROUP[id],members=V1.filter(v=>(GROUP[v]||v)===GROUP[id]);
    if(members.indexOf(id)>members.indexOf(owner))assert.equal(run('S.qTalked'),true,'heard merged talk '+id);}
  const snap=run('JSON.stringify([S.quest,S.qStory,S.qTalked,S.inv,S.mat])');run('migrateQuestMerge(S)');assert.equal(run('JSON.stringify([S.quest,S.qStory,S.qTalked,S.inv,S.mat])'),snap,'idempotent '+id);
}
/* はじめの目標（カミサマが旅立つまで）は、もとの1つずつのまま読みかえる */
for(const id of V1.slice(0,V1.indexOf('fire'))){run(`S={world:0,flags:{fieldStoryV2:1},mat:{},inv:{},quest:${V1.indexOf(id)},qStory:null,qTalked:true};migrateQuestMerge(S)`);
  assert.equal(run('QUESTS1_V3()[S.quest]'),id==='earthRoot'?'earthListen':id,'V1 early '+id);assert.equal(run('S.qTalked'),true);assert.equal(run('JSON.stringify(S.inv)'),'{}','no extra items '+id);assert.equal(run('!!S.flags.qsplit1'),true);}
for(const state of [{world:1},{world:0,free:true}]){run(`S=${JSON.stringify({...state,flags:{},quest:8,qStory:7})};migrateQuestMerge(S)`);assert.equal(run('S.quest'),8);assert.equal(run('S.qStory'),7);}
/* まとめた目標（qmerge1）から、1つずつの目標（qsplit1）へ。名前で読みかえ、2回読みこんでもずれない */
const V2=JSON.parse(run('JSON.stringify(questsV2())')),SPLIT=JSON.parse(run('JSON.stringify(QS_SPLIT)'));
assert.deepEqual(V2.slice(0,9),['statue','kurashi','ie','mamori','kikyo','earthListen','hatake','trade','fire']);
for(let i=0;i<=V2.length;i++)for(const talked of [false,true])for(const pending of [false,true]){
  if(pending&&i===0)continue;
  run(`S={world:0,flags:{qmerge1:1},mat:{},inv:{},quest:${i},qStory:${pending?i-1:'null'},qTalked:${talked}};migrateQuestSplit(S)`);
  const id=V2[i];
  if(id==null)assert.equal(run('S.quest'),run('QUESTS1_V3().length'));else assert.equal(run('QUESTS1_V3()[S.quest]'),(SPLIT[id]||[id])[0],'v2 '+id);
  assert.equal(run('S.flags.qsplitPend||null'),id&&SPLIT[id]&&talked?id:null);
  if(pending){const sid=V2[i-1],m=SPLIT[sid];assert.equal(run('QUESTS1_V3()[S.qStory]'),m?m[m.length-1]:sid);assert(run('S.quest>S.qStory'));}
  assert.equal(run('S.qTalked'),talked);assert.equal(run('JSON.stringify([S.inv,S.mat])'),'[{},{}]');
  const snap=run('JSON.stringify(S)');run('migrateQuestSplit(S)');assert.equal(run('JSON.stringify(S)'),snap,'idempotent v2 '+id);
}
for(const state of [{world:1},{world:0,free:true}]){run(`S=${JSON.stringify({...state,flags:{qmerge1:1},quest:8,qStory:7})};migrateQuestSplit(S)`);assert.equal(run('S.quest'),8);assert.equal(run('S.qStory'),7);}
assert.deepEqual(JSON.parse(run('JSON.stringify(QUESTS1.slice(0,QUESTS1.findIndex(q=>q.id==="fire")).map(q=>q.id))')),V1.slice(0,V1.indexOf('fire')).filter(id=>!['earthRoot','trade','oracle'].includes(id)),'early quests are one at a time, in the old order (the stump investigations are one goal)');
assert(run('QUESTS1.slice(0,QUESTS1.findIndex(q=>q.id==="fire")).every(q=>!q.steps)'));
console.log('Split goals: every merged index, heard talk, pending thanks, idempotence, other modes');
/* 切り株の下で・傷つけないようにを分けていたころ（qsplit1）から、1つの依頼へ（earthMerge1）。名前で読みかえ、2回読みこんでもずれない */
{const V3=JSON.parse(run(`JSON.stringify(QUESTS1_V3().flatMap(id=>id==='earthListen'?['earthListen','earthRoot']:[id]))`)),want=id=>id==='earthRoot'?'earthListen':id;
for(let i=0;i<=V3.length;i++)for(const talked of [false,true])for(const pending of [false,true]){
  if(pending&&i===0)continue;
  run(`S={world:0,flags:{qmerge1:1,qsplit1:1},mat:{},inv:{},fieldStories:{earthListen:{step:1}},quest:${i},qStory:${pending?i-1:'null'},qTalked:${talked}};migrateEarthMerge(S)`);
  const id=V3[i],sid=pending?V3[i-1]:null;
  if(sid==='earthListen'){assert.equal(run('QUESTS1_V3()[S.quest]'),'earthListen','earthListen thanks folded into the goal');assert.equal(run('S.qStory'),null);assert.equal(run('S.qTalked'),true);}
  else{if(id==null)assert.equal(run('S.quest'),run('QUESTS1_V3().length'));else assert.equal(run('QUESTS1_V3()[S.quest]'),want(id),'v3 '+id);
    if(pending)assert.equal(run('QUESTS1_V3()[S.qStory]'),want(sid));else assert.equal(run('S.qStory'),null);
    assert.equal(run('S.qTalked'),id==='earthRoot'?true:talked);}
  assert.equal(run('JSON.stringify([S.inv,S.mat,S.fieldStories])'),'[{},{},{"earthListen":{"step":1}}]','no rewards, investigation progress kept');
  const snap=run('JSON.stringify(S)');run('migrateEarthMerge(S)');assert.equal(run('JSON.stringify(S)'),snap,'idempotent v3 '+id);
}
assert(/earthMerge1:1/.test(require('fs').readFileSync(__dirname+'/../../js/world.js','utf8')),'new games start merged');}
console.log('Stump goal merge: every split index, heard talk, pending thanks, idempotence, new games already merged');
console.log('Merged goals: every old index, pending thanks, heard talk, missing talk items, idempotence, other modes');
for(const [qid,parts] of [['earthListen',['earthListen','earthRoot']],['fireRoot',['fireRoot','fireTrace']],['waterFilm',['waterFilm','waterLeaf']],['windEcho',['windEcho','windVoices']]]){
  run(`S={food:9999,mat:{wood:9999,stone:9999},flags:{},fieldStories:{}}`);
  assert.deepEqual(JSON.parse(run(`JSON.stringify(QUESTS1.find(q=>q.id==='${qid}').fieldParts)`)),parts);
  assert.equal(run(`QUESTS1.find(q=>q.id==='${qid}').check()`),false);
  for(const [k,id] of parts.entries()){
    run(`S.fieldStories['${id}']={step:FIELD_STORIES['${id}'].length-1}`);
    assert.equal(run(`QUESTS1.find(q=>q.id==='${qid}').check()`),false);
    run(`S.fieldStories['${id}'].step++`);
    assert.equal(run(`QUESTS1.find(q=>q.id==='${qid}').check()`),k===parts.length-1,'every investigation of the goal is needed');
    const state=run('JSON.stringify(S)');run(`S=JSON.parse(${JSON.stringify(state)})`);
    assert.equal(run(`fieldStoryDone('${id}')`),true);
  }
}
console.log('Four investigation goals (eight investigations) require their own progress; stock cannot complete them; save round-trip preserves progress');

run(`setWorld(0);S={world:0,flags:{},res:[{elem:'wood'}],quest:0,qTalked:false,qStory:null};`);
for(const [el,id]of [['earth','summon'],['fire','fire'],['water','water'],['wind','wind']]){
  run(`S.quest=questIndexOf('${id}');S.qTalked=false`);assert.equal(run(`!!storySummonOK('${el}')`),false);
  run('S.qTalked=true');assert.equal(run(`!!storySummonOK('${el}')`),true);
  run('S.qStory=S.quest-1');assert.equal(run(`!!storySummonOK('${el}')`),false);
  run('S.qStory=null;S.quest--;');assert.equal(run(`!!storySummonOK('${el}')`),false);
  run(`S.res.push({elem:'${el}'})`);assert.equal(run(`!!storySummonOK('${el}')`),true);
  run('S.res.pop()');
}
for(const [from,to]of [['summon','fire'],['fire','water'],['water','wind']]){
  /* あいだの目標の数：あいだのメインの目標と、むかえる目標の中で、むかえるより前にある小さな目標 */
  const gap=run(`(()=>{const a=questIndexOf('${from}'),b=questIndexOf('${to}'),q=QUESTS1[b];return QUESTS1.slice(a+1,b).filter(q=>!q.skip).length+(q.steps?q.steps.findIndex(s=>s.id==='${to}'):0)})()`);assert(gap>=2,from+' to '+to);
}
console.log('First attribute summons: story gate, pending dialogue, repeat residents; at least two main quests between introductions');
// Exercise the real morning spawner on an empty, fully usable map for two days.
const acts=fs.readFileSync(path.join(root,'js/spirit-act.js'),'utf8');
const morning=acts.slice(acts.indexOf('const AREAW='),acts.indexOf('function takenokoMorning'));
const d=vm.createContext({console});
vm.runInContext(`const W=108,H=108;let WD=0,day=1;const RFC=new Set(),RUGC=new Set(),REV=new Set(),WEEDS=new Set(['weed0g','weed0k','weedc','kinoko']);const pick=a=>a[Math.floor(Math.random()*a.length)],dayNo=()=>day;let S={ground:Array(W*H).fill(0),obj:Array(W*H).fill(''),floor:Array(W*H).fill(''),drops:[]};`,d);
vm.runInContext(morning,d);
for(const green of [false,true]){
  vm.runInContext(`S.obj.fill('');REV.clear();${green?'for(let j=0;j<W*H;j++)REV.add(j);':''}day=1;weedMorning();day=2;weedMorning();`,d);
  const count=id=>vm.runInContext(`S.obj.filter(o=>o==='${id}').length`,d);
  assert.equal(count(green?'weed0g':'weed0k'),48);assert.equal(count('weedc'),green?48:0);
}
console.log('Morning growth: exactly half over two days, normal and restored land');
// All four available gathering jobs must compete on the same decision.
const work=fs.readFileSync(path.join(root,'js/spirit-work.js'),'utf8');
const choose=work.slice(work.indexOf('function goWork('),work.indexOf('/* 依頼ボードの作業場所'));
const job=vm.createContext({console});
vm.runInContext(`const S={mat:{wood:0,stone:0},food:100,drops:[]},SPEC={wind:['seed']},FARMJ=[],JOBCAT=[['build','repair'],['craft'],['harvest'],['cook','chop','mine','drop','weed']],ORACLE={};const foodLow=()=>0,foodCap=()=>100,wreqList=()=>[];let chosen='';var tryJob=function(r,G,k){if(['chop','mine','weed','drop'].includes(k)){chosen=k;return true}return false}`,job);
vm.runInContext(choose,job);
const counts=JSON.parse(vm.runInContext(`(()=>{const counts={chop:0,mine:0,weed:0,drop:0};for(let i=0;i<12000;i++){goWork({elem:'wind'},null,true);counts[chosen]++}return JSON.stringify(counts)})()`,job));
assert.equal(counts.weed,12000,JSON.stringify(counts));/* 近くの雑草は、木・石より先 */
vm.runInContext(`tryJob=(r,G,k)=>{if(['chop','mine','drop'].includes(k)){chosen=k;return true}return false}`,job);
const rest=JSON.parse(vm.runInContext(`(()=>{const counts={chop:0,mine:0,drop:0};for(let i=0;i<12000;i++){goWork({elem:'wind'},null,true);counts[chosen]++}return JSON.stringify(counts)})()`,job));
for(const n of Object.values(rest))assert(n>3400&&n<4600,JSON.stringify(rest));
console.log('Nearby weeds first; other gathering jobs share priority:',rest);
// A finished animation alone must not count as having read the scene.
run(`let VILLAGE_SESSION=1;let completion;fieldStoryCurrent=()=>({id:'earthRoot'});fieldStorySpotOK=()=>true;fieldStoryFocus=()=>{};renderQuest=()=>{};checkQuest=()=>{};dialog=(lines,after)=>{completion=after};S={flags:{},res:[{name:MINA},{name:POKO}],fieldSites:{root:7},fieldStories:{earthRoot:{step:0}}};globalThis.action={fieldId:'earthRoot',phase:0,obj:7,t:10};ACT.fieldstory.end({},action)`);
assert.equal(run('S.fieldStories.earthRoot.step'),0);
run('completion()');assert.equal(run('S.fieldStories.earthRoot.step'),1);
run('completion()');assert.equal(run('S.fieldStories.earthRoot.step'),1);
run(`S={flags:{},res:[{name:MINA},{name:POKO}],fieldSites:{root:7},fieldStories:{earthRoot:{step:0}}};ACT.fieldstory.end({},action);globalThis.origin=S;S={fieldStories:{earthRoot:{step:0}}};completion()`);
assert.equal(run('S.fieldStories.earthRoot.step'),0);assert.equal(run('origin.fieldStories.earthRoot.step'),0);
console.log('Investigation scenes: finish reading before progress; duplicate and wrong-village callbacks cannot advance');
