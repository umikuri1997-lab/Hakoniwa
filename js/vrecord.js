/* ---------- 村の記録 ----------
   村でしたことを数える（S.vrec：しゅるい→数。ステージごと）。せいれいの仕事のおわり（vrecNote）・コワイノを追いはらった（defeat）・宝・ゆめ。
   数が節目（VRSTEP）をこえたら、記念のごほうび（パワー、VRPT）と思い出帳のメモ。思い出帳の「村の記録」で、ぜんぶの数と、つぎの節目を見る。 */
const VRK=[['chop','木を切った','回'],['mine','石をほった','回'],['weed','草をむしった','回'],['plant','植えた','回'],['water','水をやった','回'],['harvest','しゅうかくした','回'],['cook','料理をした','回'],['build','建てた','回'],['craft','家具を作った','回'],['repair','直した','回'],['fish','つりをした','回'],['play','遊んだ','回'],['chat','おしゃべりした','回'],['kill','「コワイノ」を追いはらった','回'],['treasure','宝をほりあてた','回'],['dream','ゆめを見た','回']];
const VRSTEP=[10,50,100,300,1000],VRPT=[5,10,20,40,80];/* 節目と、そのときのパワー */
const VRN=Object.fromEntries(VRK.map(k=>[k[0],k]));
function vrecAdd(k,n){if(!S||IS_STORY_REPLAY||typeof MEMRUN!=='undefined'&&MEMRUN||!VRN[k])return;const R=S.vrec||(S.vrec={}),a=R[k]||0,b=a+(n||1);R[k]=b;
  for(let i=0;i<VRSTEP.length;i++)if(a<VRSTEP[i]&&b>=VRSTEP[i]){const K=VRN[k];memo('book','村の記録：'+K[1]+' '+VRSTEP[i]+K[2]);toast('村の記録：'+K[1]+' '+VRSTEP[i]+K[2],'good');rewardPower(VRPT[i])}}
function vrecNote(r,a){/* せいれいの仕事のおわり（spirit-work.js） */if(!a)return;const t=a.type==='tag'?'chat':a.type;if(VRN[t]&&t!=='kill'&&t!=='treasure'&&t!=='dream')vrecAdd(t)}
