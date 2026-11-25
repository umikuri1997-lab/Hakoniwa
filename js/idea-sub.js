/* ひらめきのサブクエスト：条件をみたしても、すぐにはレシピをおぼえない。せいれいがおねがいのふきだしを出し、話を聞いて受けたら、ひらめく（会話のさいごに「あたらしいかたち」）。それを1つ作ったら（建てたら）たっせい。
   条件：そうび（gearIdea）・はじめてのかさかさ草（matIdea）・はじめての竹（bambooIdea）・はじめてつった空き缶（ブリキのじょうろ）・はじめてタップした野良の生き物（その小屋）。
   S.ideaQ[k]={who,an}：出ているひらめき（who＝話すせいれいの名前・an＝野良の生き物の種類）。順番の決まったサブクエスト（1つずつ・メインのお話のあいだは出さない） */
const IDEASUB={};/* k → {ids, kind} */
function ideaPend(id){const Q=S&&S.ideaQ;if(!Q)return false;for(const k in Q){const d=IDEASUB[k];if(d&&d.ids.includes(id))return true}return false}
function ideaOffer(k,who,an){if(!S||IS_STORY_REPLAY||typeof MEMRUN!=='undefined'&&MEMRUN||!IDEASUB[k])return false;const Q=S.ideaQ||(S.ideaQ={});if(Q[k]||(S.subDone||{})[k])return false;Q[k]={who:who||null,an:an||null};sfx('seed');if(typeof checkSub==='function')checkSub();return true}
function ideaWho(k){/* 話すせいれい：きっかけの子 → 作る属性の子 → だれか */const d=IDEASUB[k],e=(S&&S.ideaQ||{})[k]||{},here=n=>!!n&&S.res.some(r=>r.name===n&&!r.hidden);if(here(e.who))return e.who;const m=BL[d.ids[0]]&&BL[d.ids[0]].maker;if(m){const n=keyName(m);if(here(n))return n;const r=S.res.find(r=>r.elem===m&&!r.hidden);if(r)return r.name}const r=S.res.find(r=>!r.hidden);return r?r.name:null}
function ideaMade(ids){const K=(S.kb||{}).done||{};return ids.some(id=>!!(K['f:'+id]||K['b:'+id]))}
function ideaSubAdd(k,ids,L,X){const nm=ids.map(id=>BL[id].name).join('・'),build=ids.every(id=>BL[id].kind==='build');IDEASUB[k]={ids};
  const q={k,ideas:ids,tone:1,rw:5,t:(build?nm+'を建てよう':nm+'を作ろう'),how:build?'「おく」で'+nm+'を建ててもらう':ids.length>1?'依頼ボードで'+nm+'のどれかをはって、1つ作ってもらう':'依頼ボードで'+nm+'をはって、作ってもらう',
    L,X:[['K','#joy|'+(ids.length>1?'竹の家具':nm)+'が、できたね！'],...X,['K','#joy|守り神さま、ありがとう！']],at:()=>!!(S.ideaQ||{})[k],ok:()=>ideaMade(ids),n:1,now:()=>ideaMade(ids)?1:0};
  Object.defineProperty(q,'who',{get(){return S?ideaWho(k):null}});
  Object.defineProperty(q,'g',{get(){const n=S&&ideaWho(k),r=n&&S.res.find(r=>r.name===n);return r?r.elem:'wood'}});
  SUBQ.push(q)}
for(const id of GEAR_IDS){const b=BL[id];if(b.g.sp||!b.mat)continue;ideaSubAdd('idea_g_'+id,[id],[['K','#think|ねえ、守り神さま。あつめた物をながめてたら、ひらめいたんだよ。'],['K','これで、'+b.name+'が作れそうな気がするんだ。']],[['K','これで、もっと村を守れるね。']])}
ideaSubAdd('idea_pouf',['pouf'],[['K','かさかさ草って、さわると、ふかふかなんだよ。'],['K','#think|これをつめたら、すわれるクッションができそうだね。']],[['K','ふかふかで、ずっとすわっていたくなるね。']]);
ideaSubAdd('idea_take',['takebench','takeakari','shishiodoshi'],[['K','竹って、まっすぐで、かるくて、じょうぶなんだよ。'],['K','#think|これで、ベンチやあかりが作れそうだね。']],[['K','竹のいいにおいがするね。']]);
ideaSubAdd('idea_joro',['joro'],[['K','#surprise|つりをしてたら、空き缶がかかったんだよ。'],['K','#think|これに水を入れたら、畑の水やりに使えそうだね。']],[['K','これで、畑の水やりが、らくになるね。']]);
for(const id of [...new Set(Object.values(ANI).map(a=>a.hut))]){const k='idea_'+id;ideaSubAdd(k,[id],[],[['K','これで、野良の生き物も、村に来てもらえるね。']]);
  const q=SUBQ[SUBQ.length-1];Object.defineProperty(q,'L',{get(){const a=S&&(S.ideaQ||{})[k],an=a&&a.an&&ANI[a.an]?ANI[a.an].name:'生き物';return [['K','村の外に、野良の'+an+'がいたんだよ。'],['K','#think|すむ所があったら、村に来てくれるかな。']]}})}
