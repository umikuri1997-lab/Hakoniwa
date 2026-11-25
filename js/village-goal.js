'use strict';
/* 村の大きな目標：オオカゲをはじめて追いはらったつぎの朝から、3つの名所（大きな庭・広場・守りの塔）の中から、カミサマの問いで1つえらぶ。
   えらんだ目標は、目標の欄にいつも進みぐあいを出す。たっせいすると、パワー VGLPT・みんなのたのしさ+VGLFUN・道しるべ1つ。たっせいしたら、つぎの朝に、のこりからまたえらぶ。S.vgoal={pick,done:[]}。草原だけ。 */
const VGLPT=300,VGLFUN=30,VGLPLAY=4,VGLBENCH=3,VGLWATCH=3,VGLSPIKE=6,VGLFLOWER=30;
const vglPlayN=()=>Object.keys(BL).reduce((a,id)=>a+(BL[id].play&&BL[id].kind==='furn'?cnt(id):0),0),vglBenchN=()=>cnt('bench')+cnt('takebench'),vglPlantN=()=>Object.keys(BL).reduce((a,id)=>a+(BL[id].kind==='plant'?cnt(id):0),0);
const VGLS=[
  {k:'niwa',name:'大きな庭',how:'花や木を'+VGLFLOWER+'こ植える',max:VGLFLOWER,cur:()=>Math.min(VGLFLOWER,vglPlantN())},
  {k:'hiroba',name:'広場',how:'遊び家具を'+VGLPLAY+'つ・ベンチを'+VGLBENCH+'つ置く',max:VGLPLAY+VGLBENCH,cur:()=>Math.min(VGLPLAY,vglPlayN())+Math.min(VGLBENCH,vglBenchN())},
  {k:'tou',name:'守りの塔',how:'見張り台を'+VGLWATCH+'つ・とげの罠を'+VGLSPIKE+'つ置く',max:VGLWATCH+VGLSPIKE,cur:()=>Math.min(VGLWATCH,cnt('watch'))+Math.min(VGLSPIKE,cnt('spike'))}];
let VGLASK=null;/* 問いを出しているゲーム（セーブしない） */
function vglState(){return S.vgoal||(S.vgoal={pick:null,done:[]})}
function vglOn(){return !!S&&WD===KUSA&&!S.free&&!IS_STORY_REPLAY&&S.bossKills>0}
function vgoalNote(){/* 目標の欄：えらんだ名所の進みぐあい */if(!vglOn())return '';const V=vglState(),g=VGLS.find(x=>x.k===V.pick);return g?g.name+' '+g.cur()+'/'+g.max:''}
function vgoalMorning(){if(!vglOn())return;const V=vglState();if(V.pick||VGLASK===S)return;const rest=VGLS.filter(g=>!V.done.includes(g.k));if(!rest.length)return;VGLASK=S;const S0=S;
  const go=()=>{if(S!==S0)return;if(sheet!=null||!$('#dialog').hidden||isNight()){later(go,300);return}
    const opts=rest.map(g=>({t:g.name+'：'+g.how,v:g.k,lines:[[GOD,'#nod|よし、「'+g.name+'」じゃな。'+g.how+'のじゃぞ。できたら、村の名所になるでのう。']]}));
    dialog([['@choice',{key:'vgoal'+V.done.length,who:GOD,q:'#think|村に、大きな目標をひとつ作ってみんか。どの名所にするかのう。',pick:v=>{V.pick=v;VGLASK=null;dirty=true;renderQuest()},opts}]])};
  later(go,2500)}/* 朝の日記のあとに出す */
function vgoalTick(){if(!vglOn())return;const V=vglState(),g=VGLS.find(x=>x.k===V.pick);if(!g)return;const now=performance.now();if(now-(V.ck||0)<1000)return;V.ck=now;if(g.cur()<g.max)return;
  V.done.push(g.k);V.pick=null;S.pt+=VGLPT;S.totalPt+=VGLPT;for(const r of S.res)if(!r.hidden)funAdd(r,VGLFUN,'vgoal');giveItem('signpost',1);sfx('chime');
  toast('村の名所「'+g.name+'」ができた！ パワー+'+VGLPT+'・みんなのたのしさ+'+VGLFUN+'・道しるべを1つもらった','good');memo('target','村の名所「'+g.name+'」ができた');dirty=true;renderQuest()}
