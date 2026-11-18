/* できごとの間（リムワールドのストーリーテラーを手本に）：
   朝（morning、あらしをきめる stormMorning より先）に、きのうのきびしさを点で数える（paceScore）：
   こわされた物1つで1点（ゆうべの S.ns.broke）・おなかが500より少なくなった子1人で1点（S.pcH、paceTick）・あらし2点・夜の変化（霧・群れ・1しゅるいの夜）2点・オオカゲ3点。
   PACEHARD 点いじょうなら、きょうとあしたの夜は、夜の変化を出さず、あらしもきめない（S.paceCalm＝おだやかにする、さいごの日）。
   0点が PACEQUIET 日つづいたら、その日だけ、霧の夜 PACEKIRI・あらし PACESTORM（S.paceSpice）。
   数字をかえるのは、夜の変化（nightVarPick）とあらし（stormMorning）の決まり方だけ。たしかめは tools/tests/pace.cjs。 */
const PACEHARD=5,PACECALM=2,PACEQUIET=3,PACEKIRI=.25,PACESTORM=.1,PACEHUN=500;
function paceCalmNow(d){return S.paceCalm!=null&&d<=S.paceCalm}
function paceSpiceNow(){return S.paceSpice===dayNo()}
function paceTick(){/* 1秒に1回：おなかが500より少なくなった子をおぼえる（朝6時から朝6時まで） */if(!S||IS_STORY_REPLAY)return;const d=callDay();let H=S.pcH;
  for(const r of S.res){if(r.hidden||r.coffin||r.hunger>=PACEHUN)continue;if(!H||H.d!==d)H=S.pcH={d,ids:[]};if(!H.ids.includes(r.id))H.ids.push(r.id)}}
function paceScore(){const d=dayNo(),cd=callDay();let p=0;const ns=S.ns&&!S.ns.pc?S.ns:null;
  if(ns){p+=ns.broke||0;if(ns.boss)p+=3}
  if(S.pcH&&S.pcH.d===cd-1)p+=S.pcH.ids.length;
  if(S.storm===d-1)p+=2;
  if(S.nightVar&&S.nightVar.d===d-1&&S.nightVar.k)p+=2;
  return p}
function paceMorning(){if(!S||IS_STORY_REPLAY)return;const d=dayNo();if(S.paceD===d)return;S.paceD=d;const p=paceScore();if(S.ns)S.ns.pc=1;S.paceLast=p;
  if(p>=PACEHARD){S.paceCalm=d+PACECALM-1;S.paceQ=0;return}
  S.paceQ=p===0?(S.paceQ||0)+1:0;if(S.paceQ>=PACEQUIET){S.paceQ=0;S.paceSpice=d}}
