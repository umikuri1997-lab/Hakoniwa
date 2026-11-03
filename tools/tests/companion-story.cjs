const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'../..');
const c=vm.createContext({console,ACT:{},dirty:false,document:{querySelector(){return {hidden:true}}},performance:{now:()=>0},setTimeout(){},localStorage:{getItem(){return null}}});
for(const f of ['core','data','story','world','village','quests','night','companion-story','story-ending'])vm.runInContext(fs.readFileSync(path.join(root,'js',f+'.js'),'utf8'),c,{filename:f});
const run=code=>vm.runInContext(code,c);
const old=JSON.parse(run('JSON.stringify(QUESTS1.filter(q=>!COMPANION_QUESTS.has(q.id)).map(q=>q.id))'));
for(let i=0;i<=old.length;i++){
  run(`S={world:0,flags:{},quest:${i},qStory:${i<old.length?i:'null'}};migrateCompanionStory(S)`);
  if(i<old.length){assert.equal(run('QUESTS1[S.quest].id'),old[i]);assert.equal(run('QUESTS1[S.qStory].id'),old[i]);}
  else assert.equal(run('S.quest'),run('QUESTS1.length'));
  const mapped=run('S.quest');run('migrateCompanionStory(S)');assert.equal(run('S.quest'),mapped);
}
for(const state of [{world:1},{world:0,free:true}]){run(`S=${JSON.stringify({...state,flags:{},quest:8,qStory:7})};migrateCompanionStory(S)`);assert.equal(run('S.quest'),8);assert.equal(run('S.qStory'),7);}
console.log('Save migration: every original quest and pending completion, idempotence, other modes');
const prior=JSON.parse(run('JSON.stringify(companionQuestList({world:0,flags:{companionStory:1}}).map(q=>q.id))'));
for(let i=0;i<=prior.length;i++){
  run(`S={world:0,flags:{companionStory:1},quest:${i},qStory:${i<prior.length?i:'null'},qTalked:true};migrateCompanionStory(S)`);
  const expected=run(`COMPANION_REPLACEMENTS[${JSON.stringify(prior[i])||'null'}]||${JSON.stringify(prior[i])||'null'}`);
  if(i<prior.length){assert.equal(run('QUESTS1[S.quest].id'),expected);assert.equal(run('QUESTS1[S.qStory].id'),expected);}
  else assert.equal(run('S.quest'),run('QUESTS1.length'));
}
for(const id of ['fireSupplies','fireLights','waterFields','waterFlowers','windRoad','windGather']){
  const i=prior.indexOf(id);run(`S={world:0,flags:{companionStory:1},quest:${i},qStory:null,qTalked:true};migrateCompanionStory(S)`);
  assert.equal(run('S.qTalked'),false,'replacement must explain its new goal');
}
console.log('PR 1064 saves: every index and pending report preserved; active replacements explain the new goal');
for(const id of ['earthListen','earthRoot','fireRoot','fireTrace','waterFilm','waterLeaf','windEcho','windVoices']){
  run(`S={food:9999,mat:{wood:9999,stone:9999},flags:{},fieldStories:{}}`);
  assert.equal(run(`QUESTS1.find(q=>q.id==='${id}').check()`),false);
  run(`S.fieldStories['${id}']={step:FIELD_STORIES['${id}'].length-1}`);
  assert.equal(run(`QUESTS1.find(q=>q.id==='${id}').check()`),false);
  run(`S.fieldStories['${id}'].step++`);
  assert.equal(run(`QUESTS1.find(q=>q.id==='${id}').check()`),true);
  const state=run('JSON.stringify(S)');run(`S=JSON.parse(${JSON.stringify(state)})`);
  assert.equal(run(`fieldStoryDone('${id}')`),true);
}
console.log('Eight goals require their own investigation progress; stock cannot complete them; save round-trip preserves progress');

run(`setWorld(0);S={world:0,flags:{},res:[{elem:'wood'}],quest:0,qTalked:false,qStory:null};`);
for(const [el,id]of [['earth','summon'],['fire','fire'],['water','water'],['wind','wind']]){
  run(`S.quest=QUESTS1.findIndex(q=>q.id==='${id}');S.qTalked=false`);assert.equal(run(`!!storySummonOK('${el}')`),false);
  run('S.qTalked=true');assert.equal(run(`!!storySummonOK('${el}')`),true);
  run('S.qStory=S.quest-1');assert.equal(run(`!!storySummonOK('${el}')`),false);
  run('S.qStory=null;S.quest--;');assert.equal(run(`!!storySummonOK('${el}')`),false);
  run(`S.res.push({elem:'${el}'})`);assert.equal(run(`!!storySummonOK('${el}')`),true);
  run('S.res.pop()');
}
for(const [from,to]of [['summon','fire'],['fire','water'],['water','wind']]){
  const gap=run(`QUESTS1.slice(QUESTS1.findIndex(q=>q.id==='${from}')+1,QUESTS1.findIndex(q=>q.id==='${to}')).filter(q=>!q.skip).length`);assert(gap>=2,from+' to '+to);
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
