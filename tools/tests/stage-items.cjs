// ステージだけの物（竹の物・丸太の塀など）が、ほかのステージで、おそなえ・つり・落とし物から出ないこと
const fs=require('fs'),vm=require('vm'),assert=require('assert');const root=require('path').resolve(__dirname,'../..')+'/';
const c=vm.createContext({console,localStorage:{getItem(){return null},setItem(){},removeItem(){}},document:{querySelector(){return {hidden:true}}},ACT:{},setTimeout(){},performance:{now:()=>0}});
for(const f of ['core','data','story','world','quests','level','night'])vm.runInContext(fs.readFileSync(root+'js/'+f+'.js','utf8'),c,{filename:f});
const pick=(f,start)=>fs.readFileSync(root+'js/'+f,'utf8').split('\n').find(l=>l.startsWith(start));
vm.runInContext(pick('build.js','const WIND_STAGE_TOYS'),c);vm.runInContext(pick('village.js','const QB='),c);
const act=fs.readFileSync(root+'js/spirit-act.js','utf8');
vm.runInContext(act.match(/function stageItemOK[\s\S]*?\n/)[0],c);{const L=act.split('\n'),i=L.findIndex(l=>l.startsWith('function fishLoot'));vm.runInContext(L.slice(i,i+4).join('\n'),c)}
{const L=act.split('\n'),i=L.findIndex(l=>l.startsWith('  offer:{'));let k=i+1;while(!/^  [a-z]+:\{/.test(L[k]))k++;vm.runInContext('ACT2={'+L.slice(i,k).join('\n').trim().replace(/,\s*$/,'')+'}',c)}
const run=s=>vm.runInContext(s,c);
// 実際の offer.end と fishLoot を、乱数を0にして何回も回し、出た家具をあつめる
run(`sfxAt=()=>{};omo=()=>{};gearFind=()=>{};memo=()=>{};var GOT=[];giveItem=(id)=>GOT.push(id);toast=()=>{};addSpiritXp=()=>{};queueItemGift=()=>{};gearOffer=()=>false;offerFor=()=>null;OBOX=1;cnt=()=>0;inv=()=>0;var LIVE={};`);
const BAMBOO=['takebench','takeakari','shishiodoshi','bamboofence','ladder_bamboo'];
for(const WD of [0,1,2,3,4]){run(`WD=${WD};S={t:0,res:[],flags:{},recipes:{},unlocked:{},inv:{},free:false};GOT=[]`);
  for(const el of ['wood','fire','water','earth','wind'])for(let i=0;i<400;i++){run(`(()=>{const R=Math.random;let k=0;const seq=[.99,.0,${i}/400,.0,${i}/400];Math.random=()=>seq[k++%seq.length];try{ACT2.offer.end({name:'x',elem:'${el}'},{})}finally{Math.random=R}})()`)}
  for(let i=0;i<400;i++)run(`(()=>{const R=Math.random;let k=0;const seq=[.001,${i}/400];Math.random=()=>seq[k++%seq.length];try{fishLoot({x:0,y:0,elem:'water',name:'x'})}catch(e){}finally{Math.random=R}})()`);
  const got=[...new Set(run('GOT'))];
  for(const id of got){const so=run(`STAGEONLY['${id}']`);assert(so==null||so===WD,`WD=${WD}: stage-only ${id} leaked`);assert(!BAMBOO.includes(id)||WD===1,`WD=${WD}: bamboo item ${id} leaked`);assert((run(`BL['${id}'].w`)||0)<=WD,`WD=${WD}: later-stage ${id}`);if(['slide','seesaw'].includes(id))assert.equal(WD,4)}
  assert(got.length>0,'pools are not empty');console.log(`WD=${WD}: offering/fishing furniture ok (${got.length} kinds)`)}
// 落とし物の表に、ステージだけの物を入れない
for(const t of Object.keys(run('DROPF')))assert(run(`STAGEONLY['${run('DROPF')[t]}']`)==null);console.log('Enemy drops: no stage-only furniture');
// レシピでおぼえる家具（コワイノのレシピ・クエスト・思いつき）は、おぼえるまで、おそなえ・つりで出ない
for(const WD of [0,1]){run(`WD=${WD};S={t:0,res:[],flags:{},recipes:{},unlocked:{},inv:{},free:false};GOT=[]`);
  for(const el of ['wood','fire','water','earth','wind'])for(let i=0;i<400;i++)run(`(()=>{const R=Math.random;let k=0;const seq=[.99,.0,${i}/400,.0,${i}/400];Math.random=()=>seq[k++%seq.length];try{ACT2.offer.end({name:'x',elem:'${el}'},{})}finally{Math.random=R}})()`);
  for(let i=0;i<400;i++)run(`(()=>{const R=Math.random;let k=0;const seq=[.001,${i}/400];Math.random=()=>seq[k++%seq.length];try{fishLoot({x:0,y:0,elem:'water',name:'x'})}catch(e){}finally{Math.random=R}})()`);
  const got=new Set(run('GOT'));for(const id of ['yorubed','hoshirug','composter','joro','pouf','toro','taru','kabebukuro','makidana','swing','bench','bed'])assert(!got.has(id),`WD=${WD}: recipe furniture ${id} before learning`);
  run(`S.recipes={yorubed:true,composter:true}`);assert(!run('recipeGated("yorubed")')&&!run('recipeGated("composter")')&&run('recipeGated("hoshirug")'))}
console.log('Offering/fishing: recipe furniture only after learning');
// 毎日のおそなえ：火山の石の塀は、草原では、交換でもらっていても出ない
{const L=act.split('\n');vm.runInContext(fs.readFileSync(root+'js/spirit-work.js','utf8').split('\n').filter(l=>l.startsWith('const OFFER=')||l.startsWith('function offerFor(')).join('\n'),c);
  run(`cnt=()=>0`);
  for(const WD of [0,1]){run(`WD=${WD};S={t:0,res:[],flags:{},recipes:{},unlocked:{wall:true,path:true,stone:true,brick:true},feat:{},inv:{},free:false}`);let wall=0;
    for(let i=0;i<300;i++){const g=run(`(()=>{const R=Math.random;let k=0;Math.random=()=>((${i}*7+k++*13)%100)/100;try{return offerFor({xp:1e9,elem:${i%2?"'earth'":"'fire'"}})}finally{Math.random=R}})()`);if(g&&g[0]==='wall')wall++}
    if(WD===0)assert.equal(wall,0,'grassland daily offering gave stone wall');else assert(wall>0,'volcano daily offering keeps stone wall')}
  console.log('Daily offering: stone wall only in the volcano')}
// かどまつ：カミサマのかざりの交換は火山だけ
{const src=fs.readFileSync(root+'js/ui.js','utf8'),m=src.match(/const DECO=(\[[\s\S]*?\]\.filter\([^;]*?\))\/\*/);assert(m,'DECO list');for(const WD of [0,1,2,3,4]){run('WD='+WD);const ids=run(m[1]).map(x=>x[0]);assert.equal(ids.includes('kadomatsu'),WD===1,'kadomatsu WD='+WD)}console.log('Kadomatsu: volcano trade only')}
