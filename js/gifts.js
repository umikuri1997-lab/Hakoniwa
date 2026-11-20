/* ---------- おくりもの・たからもの（トモコレのように） ----------
   おくりもの（BL の kind:'gift'、もちものは S.inv）：ひろう（つり・コワイノの落とし物・ものひろいの日）・依頼ボードで作る・カミサマのお店（日がわり）。
   せいれいにあげると、なくなって、その子のたからもの（r.trs、GIFTMAX まで。いっぱいなら、いちばん古い物といれかわる）になる。
   好み（giftLike：2 だいすき1つ・1 すき GIFTLIKE%・0 ふつう。id と物で決まり、しまわない）。たのしさ+GIFTFUN（だいすきは+GIFTLOVE）。わかった好みは r.gk。
   素材（'m:'+素材）もあげられる：たのしさ+GIFTMAT だけ（たからもの・好みにはならない）。
   あげるのは1人に1日1回（r.care.gift）。ひまなとき、たからものを頭の上にかかげて、ながめる（trlook）。 */
const GIFTFUN=20,GIFTLOVE=40,GIFTLIKE=25,GIFTMAX=3,GIFTLOOKP=.08,GIFTLOOKCD=360;
const GIFTIDS=['gf_kirei','gf_garasu','gf_kai','gf_hane','gf_matsu','gf_oshibana','gf_kibori','gf_koma','gf_wara','gf_ehagaki','gf_biidama','gf_mangekyo','gf_hoshisuna'];
const GIFTFISH=['gf_kirei','gf_garasu','gf_kai'],GIFTDROP=['gf_kirei','gf_garasu','gf_hane','gf_matsu'],GIFTSHOP=GIFTIDS.filter(id=>BL[id].shop);
const GIFTFISHP=.03,GIFTDROPP=.02,GIFTMONOP=.25,GIFTSHOPN=1;/* つり3%・コワイノの落とし物2%・ものひろいの日の落とし物1つごとに25%・お店は1日に1しゅるい */
const GLNAME=['ふつう','すき','だいすき'],GIFTMAT=5;
const isGM=id=>typeof id==='string'&&id.slice(0,2)==='m:';/* 素材のおくりもの */
const presentName=id=>isGM(id)?MATN[id.slice(2)]||'':BL[id]?BL[id].name:'';
const giftHave=id=>isGM(id)?S.mat[id.slice(2)]||0:inv(id);
function giftMatIco(k){const MOBJ={shina:'weed0g',kasa:'weed0k',kuru:'weed1g',chiri:'weed1k',funba:'weedc'};return ICONS[k]||(MOBJ[k]&&BL[MOBJ[k]]?iconURL(MOBJ[k]):'')}
const giftAny=()=>GIFTIDS.some(id=>inv(id)>0)||Object.keys(MATN).some(k=>(S.mat[k]||0)>0);
function giftLike(r,id){if(!r||!BL[id])return 0;const n=GIFTIDS.length,love=Math.floor(hash(((r.id||0)*613+29)>>>0)*n);if(GIFTIDS[love]===id)return 2;return hash(((r.id||0)*389+strH(id))>>>0)*100<GIFTLIKE?1:0}
function giftKnown(r,v){const K=r.gk||{};return GIFTIDS.filter(id=>K[id]===v&&giftLike(r,id)===v)}
function giftKnownText(r,v){const L=giftKnown(r,v).map(id=>BL[id].name);return L.length?L.join('・'):'？？？'}
function giftTrText(r){const L=(r.trs||[]).filter(id=>BL[id]).map(id=>BL[id].name);return L.length?L.join('・'):'まだない'}
const giftToday=r=>!!(r.care&&r.care.gift===callDay());
/* あげる：なくなって、たからものになる */
function presentGive(r,id){if(!r||giftWhy(r))return false;if(isGM(id))return matGive(r,id.slice(2));if(!BL[id]||inv(id)<1)return false;S.inv[id]--;if(!S.inv[id])delete S.inv[id];(r.care||(r.care={})).gift=callDay();
  const v=giftLike(r,id),gain=v===2?GIFTLOVE:GIFTFUN;funAdd(r,gain,'care');const T=r.trs||(r.trs=[]);T.push(id);while(T.length>GIFTMAX)T.shift();
  const first=!(r.gk&&r.gk[id]!=null);(r.gk||(r.gk={}))[id]=v;dirty=true;
  r.gn=(r.gn||0)+1;if(typeof careNote==='function')careNote(r,'gift',id);/* あげた回数（節目の家具 gift-furn.js）・手紙に書く */
  if(first&&v)memo('🎁',r.name+'の、'+GLNAME[v]+'なおくりものがわかった');
  const L=giftTalk(r,id,v)||[v===2?'これ、だいすき！':v===1?'うれしい！ 大事にするね。':'ありがとう！'],after=()=>{if(typeof gfAfterGift==='function')gfAfterGift(r,v)};
  if(typeof gfPresentShow==='function')gfPresentShow(r,id,v);giftReply(r,L,after);/* 返事はすぐ出す（つつみをあける動きは、うしろでつづく。gift-furn.js）→ お返し */
  logEv(r.name+'に'+BL[id].name+'をあげた');return true}
/* 返事の会話（gift-talk.js の GIFTTALK：物・属性・好みごと。素材は3とおりから）。火の一人称 @I は、おれ・あたし・あたい */
function giftTalk(r,id,v,mn){const T=typeof GIFTTALK!=='undefined'&&GIFTTALK[id];if(!T)return null;const el=r.elem==='earth'||r.elem==='wood'||r.elem==='water'||r.elem==='fire'||r.elem==='wind'?r.elem:'earth',A=T[el];if(!A||!A.length)return null;
  const L=id==='mat'?A[Math.random()*A.length|0]:A[v]||A[0],pr=r.elem==='fire'?(elemKey(r)==='fireB'?'おれ':r.name===HOMURA?'あたい':'あたし'):'';
  return L.map(t=>t.split('@I').join(pr).split('@M').join(mn||''))}
function giftReply(r,L,after){if(!L||!L.length){if(after)after();return}if(!$('#dialog').hidden||r.hidden){toast(r.name+'「'+String(L[0]).replace(LOOKRX,'')+'」','good');if(after)after();return}/* 会話が出ているとき・村にいないときは、ひとことだけ */
  dialog(L.map(t=>[r.name,t]),after||null,'とじる')}
/* 素材をあげる：たのしさ+GIFTMAT（たからものにはしない）。S.mat をへらすと、boxSync が箱からへらす */
function matGive(r,k){if(!MATN[k]||(S.mat[k]||0)<1)return false;S.mat[k]--;(r.care||(r.care={})).gift=callDay();funAdd(r,GIFTMAT,'care');dirty=true;
  r.gn=(r.gn||0)+1;const L=giftTalk(r,'mat',null,MATN[k])||['ありがとう、使わせてもらうね。'],after=()=>{if(typeof gfAfterGift==='function')gfAfterGift(r,-1)};
  if(typeof gfPresentShow==='function')gfPresentShow(r,'m:'+k,-1);giftReply(r,L,after);
  logEv(r.name+'に'+MATN[k]+'をあげた');return true}
function giftWhy(r){/* あげられないわけ（なければ ''）。お世話のタブ・もちもののどちらも同じ */if(r.act&&r.act.type==='sleep'&&r.act.stage==='do')return 'ねているので、おこさない';if(r.hidden)return 'いまは、そばにいない';return giftToday(r)?'きょうは、もうあげた':''}
/* もちものから：だれにあげるか */
function giftWho(id){const o=el('<div style="position:fixed;inset:0;z-index:46;display:flex;align-items:center;justify-content:center;background:rgba(40,30,15,.35);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:340px;width:100%;color:var(--ink);max-height:80vh;overflow:auto"><b class="t" style="font-size:16px;display:block;margin-bottom:8px"></b><div class="rows"></div><div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn x">とじる</button></div></div></div>');
  const close=()=>o.remove();o.querySelector('.x').onclick=()=>{sfx('tap');close()};o.onclick=e=>{if(e.target===o)close()};o.querySelector('.t').textContent=presentName(id)+'を、だれにあげる？';const g=o.querySelector('.rows');
  for(const r of S.res){const kn=!isGM(id)&&r.gk&&r.gk[id]!=null?GLNAME[r.gk[id]]:'',row=rowEl(r.name,ELEM[r.elem].name+'のせいれい'+(kn?'・'+kn:'')),b=el('<button class="btn pri">あげる</button>');row.appendChild(b);lackOn(b,giftWhy(r));
    b.onclick=()=>{if(giftWhy(r)||giftHave(id)<1)return;presentGive(r,id);close();if(sheet)renderSheet()};g.appendChild(row)}
  document.body.appendChild(o)}
/* お世話のタブから：なにをあげるか */
function giftWhat(r,done){const o=el('<div style="position:fixed;inset:0;z-index:46;display:flex;align-items:center;justify-content:center;background:rgba(40,30,15,.35);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:340px;width:100%;color:var(--ink);max-height:80vh;overflow:auto"><b class="t" style="font-size:16px;display:block;margin-bottom:8px"></b><div class="rows"></div><div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn x">とじる</button></div></div></div>');
  const close=()=>o.remove();o.querySelector('.x').onclick=()=>{sfx('tap');close()};o.onclick=e=>{if(e.target===o)close()};o.querySelector('.t').textContent=r.name+'に、なにをあげる？';const g=o.querySelector('.rows'),L=GIFTIDS.filter(id=>inv(id)>0),M=Object.keys(MATN).filter(k=>(S.mat[k]||0)>0);
  if(!L.length&&!M.length)g.appendChild(nodata('box','あげられる物は、まだないよ'));
  for(const id of L){const kn=r.gk&&r.gk[id]!=null?GLNAME[r.gk[id]]:'',row=rowEl(BL[id].name+'　×'+inv(id),kn,giftIco(id)),b=el('<button class="btn pri">あげる</button>');row.appendChild(b);
    b.onclick=()=>{if(giftToday(r)||inv(id)<1)return;presentGive(r,id);close();if(done)done()};g.appendChild(row)}
  for(const k of M){const row=rowEl(MATN[k]+'　×'+S.mat[k],'',giftMatIco(k)),b=el('<button class="btn pri">あげる</button>');row.appendChild(b);
    b.onclick=()=>{if(giftToday(r)||(S.mat[k]||0)<1)return;presentGive(r,'m:'+k);close();if(done)done()};g.appendChild(row)}/* 素材 */
  document.body.appendChild(o)}
/* カミサマのお店：日がわりで GIFTSHOPN しゅるい。1日にそれぞれ1こまで（S.gshop：{d,b}） */
function giftShopToday(){
  const day=callDay(),i=(day%GIFTSHOP.length+GIFTSHOP.length)%GIFTSHOP.length;
  return GIFTSHOP.slice(i,i+GIFTSHOPN);
}
function giftShopBought(id){const G=S.gshop;return !!(G&&G.d===callDay()&&G.b&&G.b[id])}
function giftShopBuy(id){const p=BL[id].shop;if(S.pt<p||giftShopBought(id))return false;S.pt-=p;const d=callDay();if(!S.gshop||S.gshop.d!==d)S.gshop={d,b:{}};S.gshop.b[id]=1;giveItem(id,1);sfx('power');toast(BL[id].name+'をもらった','good');return true}
/* ひまなとき、たからものを頭の上にかかげて、ながめる */
function goTreasure(r,G){if(!r.trs||!r.trs.length||(r.trlT||0)>S.t||Math.random()>=GIFTLOOKP)return false;r.trlT=S.t+GIFTLOOKCD;startAct(r,G,'trlook',-1,{g:pick(r.trs),dur:18});return true}
ACT.trlook={start(r,a){if(!BL[a.g])return false;r.bubble=''},tick(r,a){if(a.t>8&&!r.bubble)r.bubble='💕'},done:(r,a)=>a.t>=a.dur,end(r){r.bubble=''}};
ACT_LBL.trlook='たからものをながめている';
/* ---- 絵（もらうまでの仮のドット絵。o ふち・h 明るい・m もと・d かげ・w 茶色） ---- */
const GIFTPIX={
 gf_kirei:['................','................','................','.....oooooo.....','...oohhhmmmoo...','..ohhhmmmmmmdo..','..ohhmmmmmmmdo..','.ohmmmmmmmmmmdo.','.ommmmmmmmmmddo.','.ommmmmmmmmdddo.','..odmmmmmmdddo..','..oddddddddddo..','...oooooooooo...','................','................','................'],
 gf_garasu:['................','................','.....oooooo.....','....ohhmmmmo....','...ohhhmmmmmo...','..ohhmmmmmmmdo..','..ohmmmmmmmmdo..','..ommmmmmmmmdo..','..ommmmmmmmddo..','..ommmmmmmmddo..','...odmmmmmddo...','....oddddddo....','.....oooooo.....','................','................','................'],
 gf_kai:['................','................','.......oo.......','......ohmo......','....oohmmdoo....','...ohmhmdmdmo...','..ohmhmmdmmdmo..','..ohmhmmdmmdmo..','.ohmmhmmdmmdmdo.','.ommmhmmdmmdmdo.','..oddmmmdmmddo..','...oooddddooo...','.....oddddo.....','......oooo......','................','................'],
 gf_hane:['................','............oo..','...........ohmo.','..........ohmmo.','.........ohmmdo.','........ohmmdo..','.......ohmmdo...','......ohmmdo....','.....ohmmdo.....','....ohmmdo......','...ohmmdo.......','...omddo........','..owoo..........','.ow.............','.o..............','................'],
 gf_matsu:['................','.......ww.......','......owwo......','.....ohhmmo.....','....ohmdmmdo....','....omhmdmmo....','...ohmdmmdmdo...','...omhmdmmdmo...','...ohmdmmdmdo...','...omhmdmmdmo...','....omdmmdmo....','....odmdmmdo....','.....odddo......','......ooo.......','................','................'],
 gf_oshibana:['................','..oooooooooooo..','..ohhhhhhhhhmo..','..ohhhhmmhhhmo..','..ohhhmddmhhmo..','..ohhmmhhmmhmo..','..ohhhmddmhhmo..','..ohhhhmmhhhmo..','..ohhhhhwhhhmo..','..ohhhhhwhhhmo..','..ohhhhwhhhhmo..','..ohhhhhhhhhmo..','..ommmmmmmmmmo..','..oooooooooooo..','................','................'],
 gf_kibori:['................','................','.........ooo....','........ohhmo...','.......ohhmmoo..','..oo...ohmmmooo.','.ohmo..ommmmo...','..ommooommmmo...','...ommmhhmmmdo..','...ohhhmmmmmdo..','....ommmmmmddo..','.....oddddddo...','......oowwoo....','......owwwwo....','......oooooo....','................'],
 gf_koma:['................','.......oo.......','.......ow.......','......owwo......','....oohhmmoo....','...ohhhmmmmmo...','..ohhmmmmmmmdo..','..ommmmmmmmmdo..','...odmmmmmmdo...','....oddmmddo....','......oddo......','.......oo.......','.......o........','................','................','................'],
 gf_wara:['................','......oooo......','.....ohhmmo.....','.....ohmmdo.....','......oddo......','...oooohmoooo...','..ohhmmmmmmmdo..','...oooommmooo...','......ommmo.....','......ommmo.....','.....ohmmmdo....','.....omo.odo....','.....omo.odo....','.....oo...oo....','................','................'],
 gf_ehagaki:['................','................','.oooooooooooooo.','.ohhhhhhhhhhhmo.','.ohmmmmmmhwwhmo.','.ohmmhmmmhwwhmo.','.ohmhhhmmhhhhmo.','.ohmmmmmmhwwhmo.','.ohddmmddhhhhmo.','.ohddddddhwwhmo.','.ohhhhhhhhhhhmo.','.ommmmmmmmmmmmo.','.oooooooooooooo.','................','................','................'],
 gf_biidama:['................','................','................','.....oooooo.....','....ohhmmmmo....','...ohhmmmmmdo...','...ohmmwwmmdo...','...ommwwwwmdo...','...ommmwwmmdo...','...ommmmmmddo...','....odmmmddo....','.....oooooo.....','................','................','................','................'],
 gf_mangekyo:['................','................','.............oo.','...........oohmo','.........oohmmdo','.......oohmmmdo.','.....oohmmmmdo..','...oohmmmmmdo...','..ohhmmmmmdo....','.ohhwmmmmdo.....','.ohwwmmmdo......','.omwmmddo.......','..oddddo........','...oooo.........','................','................'],
 gf_hoshisuna:['................','......oooo......','......owwo......','......owwo......','.....ohhmmo.....','....ohhmmmmo....','...ohhmmmmmmo...','...ohmmmmmmdo...','...ohmmwmmmdo...','...ommwwwmmdo...','...ommmwmmmdo...','...ommmmmmddo...','...oddddddddo...','....oooooooo....','................','................']};
const GIFTCOL={gf_kirei:'#b8c4d0',gf_garasu:'#a8dceb',gf_kai:'#f0c2c4',gf_hane:'#eef0f2',gf_matsu:'#b98c5c',gf_oshibana:'#f4ead2',gf_kibori:'#d6a878',gf_koma:'#e08a72',gf_wara:'#e6cf8a',gf_ehagaki:'#bfe0c4',gf_biidama:'#9fdcb0',gf_mangekyo:'#c4a8e0',gf_hoshisuna:'#b6d8f0'};
const giftIco=id=>ICONS[id]||pixURL('gf:'+id,GIFTPIX[id],GIFTCOL[id]);
for(const id of GIFTIDS){if(ICONS[id])continue;ICONS[id]=pixURL('gf:'+id,GIFTPIX[id],GIFTCOL[id]);const im=new Image();im.onload=()=>{im.ok=1;dirty=true};im.src=ICONS[id];ICI[id]=im}
