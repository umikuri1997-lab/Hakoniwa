/* ---------- おくりもの・たからもの（トモコレのように） ----------
   おくりもの（BL の kind:'gift'、もちものは S.inv）：ひろう（つり・コワイノの落とし物・ものひろいの日）・依頼ボードで作る・カミサマのお店（日がわり）。
   せいれいにあげると、なくなって、その子のたからもの（r.trs、GIFTMAX まで。いっぱいなら、いちばん古い物といれかわる）になる。
   好み（giftLike：2 だいすき1つ・1 すき GIFTLIKE%・0 ふつう。id と物で決まり、しまわない）。たのしさ+GIFTFUN（だいすきは+GIFTLOVE）。わかった好みは r.gk。
   あげるのは1人に1日1回（r.care.gift）。ひまなとき、たからものを頭の上にかかげて、ながめる（trlook）。 */
const GIFTFUN=20,GIFTLOVE=40,GIFTLIKE=25,GIFTMAX=3,GIFTLOOKP=.08,GIFTLOOKCD=360;
const GIFTIDS=['gf_kirei','gf_garasu','gf_kai','gf_hane','gf_matsu','gf_oshibana','gf_kibori','gf_koma','gf_wara','gf_ehagaki','gf_biidama','gf_mangekyo','gf_hoshisuna'];
const GIFTFISH=['gf_kirei','gf_garasu','gf_kai'],GIFTDROP=['gf_kirei','gf_garasu','gf_hane','gf_matsu'],GIFTSHOP=GIFTIDS.filter(id=>BL[id].shop);
const GIFTFISHP=.03,GIFTDROPP=.02,GIFTMONOP=.25,GIFTSHOPN=2;/* つり3%・コワイノの落とし物2%・ものひろいの日の落とし物1つごとに25%・お店は1日に2しゅるい */
const GLNAME=['ふつう','すき','だいすき'];
function giftLike(r,id){if(!r||!BL[id])return 0;const n=GIFTIDS.length,love=Math.floor(hash(((r.id||0)*613+29)>>>0)*n);if(GIFTIDS[love]===id)return 2;return hash(((r.id||0)*389+strH(id))>>>0)*100<GIFTLIKE?1:0}
function giftKnown(r,v){const K=r.gk||{};return GIFTIDS.filter(id=>K[id]===v&&giftLike(r,id)===v)}
function giftKnownText(r,v){const L=giftKnown(r,v).map(id=>BL[id].name);return L.length?L.join('・'):'？？？'}
function giftTrText(r){const L=(r.trs||[]).filter(id=>BL[id]).map(id=>BL[id].name);return L.length?L.join('・'):'まだない'}
const giftToday=r=>!!(r.care&&r.care.gift===callDay());
/* あげる：なくなって、たからものになる */
function presentGive(r,id){if(!r||!BL[id]||inv(id)<1||giftToday(r))return false;S.inv[id]--;if(!S.inv[id])delete S.inv[id];(r.care||(r.care={})).gift=callDay();
  const v=giftLike(r,id),gain=v===2?GIFTLOVE:GIFTFUN;r.fun=Math.min(100,r.fun+gain);const T=r.trs||(r.trs=[]);T.push(id);while(T.length>GIFTMAX)T.shift();
  const first=!(r.gk&&r.gk[id]!=null);(r.gk||(r.gk={}))[id]=v;dirty=true;
  if(!r.hidden){const now=performance.now();JOYU.set(r,now+(v?3000:1800));if(!(typeof inBattle==='function'&&inBattle(r))){RHOLD.set(r,now+(v?3000:1800));if(v)JUMP.set(r,now)}fxSpr('hearts',r.x*TS,(r.y-.7)*TS);r.bubble=v===2?'💕':'😊';
    addFloat(r.x,r.y-1.6,chatTone(v===2?'わあ……！ これ、だいすき！':v?'うれしい！ ありがとう！':'ありがとう。だいじにするね。',r,0),v===2?'#ffd6e6':'#fff3d6');sfx(v?'good':'tap')}
  if(first&&v)toast(r.name+'の、'+GLNAME[v]+'なおくりものがわかった','good');
  logEv(r.name+'に'+BL[id].name+'をあげた');return true}
/* もちものから：だれにあげるか */
function giftWho(id){const o=el('<div style="position:fixed;inset:0;z-index:46;display:flex;align-items:center;justify-content:center;background:rgba(40,30,15,.35);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:340px;width:100%;color:var(--ink);max-height:80vh;overflow:auto"><b class="t" style="font-size:16px;display:block;margin-bottom:8px"></b><div class="rows"></div><div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn x">とじる</button></div></div></div>');
  const close=()=>o.remove();o.querySelector('.x').onclick=()=>{sfx('tap');close()};o.onclick=e=>{if(e.target===o)close()};o.querySelector('.t').textContent=BL[id].name+'を、だれにあげる？';const g=o.querySelector('.rows');
  for(const r of S.res){const kn=r.gk&&r.gk[id]!=null?GLNAME[r.gk[id]]:'',row=rowEl(r.name,ELEM[r.elem].name+'のせいれい'+(kn?'・'+kn:'')),b=el('<button class="btn pri">あげる</button>');row.appendChild(b);lackOn(b,giftToday(r)?'きょうは、もうあげた':'');
    b.onclick=()=>{if(giftToday(r)||inv(id)<1)return;presentGive(r,id);close();if(sheet)renderSheet()};g.appendChild(row)}
  document.body.appendChild(o)}
/* お世話のタブから：なにをあげるか */
function giftWhat(r,done){const o=el('<div style="position:fixed;inset:0;z-index:46;display:flex;align-items:center;justify-content:center;background:rgba(40,30,15,.35);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:340px;width:100%;color:var(--ink);max-height:80vh;overflow:auto"><b class="t" style="font-size:16px;display:block;margin-bottom:8px"></b><div class="rows"></div><div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn x">とじる</button></div></div></div>');
  const close=()=>o.remove();o.querySelector('.x').onclick=()=>{sfx('tap');close()};o.onclick=e=>{if(e.target===o)close()};o.querySelector('.t').textContent=r.name+'に、なにをあげる？';const g=o.querySelector('.rows'),L=GIFTIDS.filter(id=>inv(id)>0);
  if(!L.length)g.appendChild(nodata('box','おくりものは、まだないよ'));
  for(const id of L){const kn=r.gk&&r.gk[id]!=null?GLNAME[r.gk[id]]:'',row=rowEl(BL[id].name+'　×'+inv(id),kn,giftIco(id)),b=el('<button class="btn pri">あげる</button>');row.appendChild(b);
    b.onclick=()=>{if(giftToday(r)||inv(id)<1)return;presentGive(r,id);close();if(done)done()};g.appendChild(row)}
  document.body.appendChild(o)}
/* カミサマのお店：日がわりで GIFTSHOPN しゅるい。1日にそれぞれ1こまで（S.gshop：{d,b}） */
function giftShopToday(){const d=callDay(),L=GIFTSHOP.slice().sort((a,b)=>hash((d*911+strH(a))>>>0)-hash((d*911+strH(b))>>>0));return L.slice(0,GIFTSHOPN)}
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
