'use strict';
/* ---------- 限定の家具と、プレゼントをあける場面 ----------
   限定の家具（BL の gf）：'ret' プレゼントのお返し・'let' 手紙のお礼・'bond' その子にプレゼントを GFBONDN 回あげた節目。属性ごとに1つずつ（BL の el）。
   もらう家具は、まだもらっていない物（S.flags.gfGot）から、くれる子の属性の物を先に（gfPick）。ぜんぶもらったら、お返し・節目はなし、手紙はいままでの素材。
   お返し：だいすきの物をあげたら、かならず。すきの物なら GFRETP%。
   プレゼントをあげると（presentGive → gfPresentShow）：つつみを両手でかかえて、がさごそ → ぽんっとひらく → 中身ごとの動き（GFMOT）→ 好みでよろこびの大きさ（だいすき：紙ふぶき・ジャンプ・まわりの子もはくしゅ）。返事の会話は、動きを待たずにすぐ出す（gifts.js）。会話をとじたら、お返し・節目のつつみ（treasureReveal）。
   動きと絵は実時間（sacredSetPose）。村の時間は止めない。 */
const GFURN={ret:['g_w_kinoko','g_w_acorn','g_e_planter','g_e_lantern','g_f_hanger','g_f_lamp','g_k_fan','g_k_egg','g_s_jelly','g_s_vanity'],let:['g_w_clover','g_w_shelf','g_e_bath','g_e_arch','g_f_table','g_f_screen','g_k_screen','g_k_chest','g_s_table','g_s_tank'],bond:['g_w_stump','g_e_geode','g_f_sofa','g_k_bed','g_s_sofa']};/* 属性ごとに、お返し2・手紙2・節目1（持ち主がきめた） */
const GFRETP=20,GFBONDN=10;
const GFOPENMS=1400,GFSHOWMS=3200,GFJOYMS=1600;/* つつみをあける・中身の動き・よろこぶ（ミリ秒） */
const GFMOT={gf_kirei:'gf_lift',gf_garasu:'gf_lift',gf_kai:'gf_ear',gf_hane:'gf_wave',gf_matsu:'gf_sniff',gf_oshibana:'gf_sniff',gf_kibori:'gf_hug',gf_wara:'gf_hug',gf_koma:'gf_spin',gf_ehagaki:'gf_read',gf_biidama:'gf_peek',gf_mangekyo:'gf_peek',gf_hoshisuna:'gf_shake'};/* 素材は lnod（うなずいて、しまう） */
const gfGot=id=>!!(S.flags.gfGot&&S.flags.gfGot[id]);
function gfPick(cat,el){/* まだもらっていない限定の家具を1つ（とっておく：もらったことにする） */const L=(GFURN[cat]||[]).filter(id=>BL[id]&&!gfGot(id));if(!L.length)return null;const id=L.find(q=>BL[q].el===el)||pick(L);(S.flags.gfGot||(S.flags.gfGot={}))[id]=1;return id}
/* 前のセーブ：前の限定の家具15こは、同じ属性・同じもらい方の新しい家具にかえる（持ち主がきめた）。置いてある物は同じマスに置きなおし、置けなければ、もちものへ（S.flags.gf25、1回だけ） */
const GFOLD={g_ishitsumi:'g_e_planter',g_kabin:'g_e_bath',g_ishibench:'g_e_geode',g_donguri:'g_w_acorn',g_oshibana:'g_w_shelf',g_happasofa:'g_w_stump',g_shizuku:'g_s_jelly',g_kaifun:'g_s_tank',g_suisou:'g_s_sofa',g_hidamari:'g_f_hanger',g_post:'g_f_screen',g_danro:'g_f_sofa',g_kazaguruma:'g_k_fan',g_penzukue:'g_k_chest',g_hammock:'g_k_bed'};
function gfMigrate(){if(!S||S.flags.gf25)return;S.flags.gf25=1;const M=GFOLD;
  for(let j=0;j<S.obj.length;j++){const o=S.obj[j],n=M[o];if(!n)continue;
    for(const k in S.ref)if(S.ref[k]==j){S.obj[k]='';delete S.ref[k]}S.obj[j]='';delete S.dyn[j];delete S.hp[j];if(S.rot)delete S.rot[j];for(const k of['useOwn','bedOwn'])if(S[k])delete S[k][j];
    const x=j%W,y=(j/W)|0,pr=PLROTS[n];PLROTS[n]=0;let ok=false;try{ok=canPlace(n,x,y,true)}catch(e){}finally{if(pr==null)delete PLROTS[n];else PLROTS[n]=pr}
    if(ok){S.obj[j]=n;setParts(n,j,'part')}else S.inv[n]=(S.inv[n]||0)+1}
  for(const o in M){if(S.inv&&S.inv[o]){S.inv[M[o]]=(S.inv[M[o]]||0)+S.inv[o];delete S.inv[o]}if(S.flags.gfGot&&S.flags.gfGot[o]){delete S.flags.gfGot[o];S.flags.gfGot[M[o]]=1}for(const r of S.res||[])if(r.citem&&r.citem[o]){r.citem[M[o]]=(r.citem[M[o]]||0)+r.citem[o];delete r.citem[o]}}
  for(const q of S.gfShow||[])if(M[q.id])q.id=M[q.id];
  for(const L of [S.letters,S.letterQ])for(const l of L||[])if(l&&l.g&&typeof l.g.k==='string'&&l.g.k.startsWith('furn:')&&M[l.g.k.slice(5)])l.g.k='furn:'+M[l.g.k.slice(5)];
  if(S.broken)for(const b of S.broken)if(M[b.id])b.id=M[b.id];if(Array.isArray(S.got))S.got=S.got.map(id=>M[id]||id)}
function gfGive(id){if(!BL[id])return;(S.flags.gfGot||(S.flags.gfGot={}))[id]=1;giveItem(id,1);dirty=true}
/* ---- つつみの絵（16×16のドット。紙は属性の色、ひもは金色） ---- */
const GFWRAPC={earth:['#d9a66b','#b98450','#ecc79a'],wood:['#8fc96a','#6aa44c','#b4e09a'],water:['#7fbfe6','#5a9cc8','#aedcf6'],fire:['#ec8a7a','#c8665a','#f6b4a8'],wind:['#b9a8e6','#9483c8','#d8ccf6']};
const GFWRAPPX=['................','.....yy..yy.....','....yYy..yYy....','.....yyyyyy.....','..oooooyyooooo..','..ohhhhyyhhhho..','..ommmmyymmmmo..','..oyyyyyyyyyyo..','..oyyyyyyyyyyo..','..ommmmyymmmmo..','..ommmmyymmmmo..','..ommmmyymmmmo..','..odddmyymdddo..','..oooooooooooo..','................','................'];
const GFWRAPURL={};
function wrapIco(el){el=GFWRAPC[el]?el:'wood';if(GFWRAPURL[el])return GFWRAPURL[el];const c=document.createElement('canvas'),K=6;c.width=c.height=16*K;const g=c.getContext('2d'),P=GFWRAPC[el],C={o:'#8a6a4a',h:P[2],m:P[0],d:P[1],y:'#f2cc5a',Y:'#fff1b0'};
  GFWRAPPX.forEach((row,y)=>{for(let x=0;x<16;x++){const k=row[x];if(C[k]){g.fillStyle=C[k];g.fillRect(x*K,y*K,K,K)}}});GFWRAPURL[el]=c.toDataURL();c.width=c.height=0;return GFWRAPURL[el]}
for(const el in GFWRAPC){const k='gfwrap_'+el,im=new Image();im.onload=()=>{im.ok=1;dirty=true};im.src=wrapIco(el);ICI[k]=im}/* 手に持つ絵（emoImg の 'ic:'） */
/* ---- プレゼントをあける場面 ---- */
function gfPresentShow(r,id,v,done){/* id：おくりもの（素材は 'm:'+素材）。v：好み（0〜2、素材は -1）。done：さいごに（返事の会話など） */
  const now=performance.now(),mat=isGM(id),mot=mat?'lnod':GFMOT[id]||'gf_hug',ico=mat?'ic:'+id.slice(2):'ic:'+id;
  if(r.hidden||typeof sacredSetPose!=='function'||typeof inBattle==='function'&&inBattle(r)){if(done)done();return}
  RHOLD.set(r,now+GFOPENMS+GFSHOWMS+GFJOYMS+400);r.bubble='';
  {const sx=(r.x*TS-cam.x)*cam.z,sy=(r.y*TS-cam.y)*cam.z;if(sx<VW*.2||sx>VW*.8||sy<VH*.25||sy>VH*.75)panTo(r.x*TS,r.y*TS)}/* 見えないときは、その子へよる */
  sacredSetPose(r,{anim:'gf_open',gfood:'ic:gfwrap_'+(GFWRAPC[r.elem]?r.elem:'wood'),side:false,back:false,keep:1,duration:GFOPENMS});
  for(let i=0;i<3;i++)villageTimeout(()=>{if(!S.res.includes(r))return;try{sfxAt('tcloth',r.x,r.y)}catch(e){}},200+i*380);/* がさごそ */
  villageTimeout(()=>{if(!S.res.includes(r))return;/* ぽんっ：ひらく */try{playU('tink',.3);playU('tink',.22,1.5,.1)}catch(e){}fxSpr('hearts',r.x*TS,(r.y-.9)*TS);if(typeof juiceGlowAt==='function'&&v>=1)juiceGlowAt(r.x,r.y-.4,v===2?2:1);JUMP.set(r,performance.now());
    sacredSetPose(r,{anim:mot,gfood:ico,side:false,back:false,keep:1,mood:v===0||mat?'smile':'joy',duration:GFSHOWMS})},GFOPENMS);
  villageTimeout(()=>{if(!S.res.includes(r))return;const t=performance.now();/* よろこぶ（好みで大きさがかわる） */
    if(v===2){JUMP.set(r,t);JOYU.set(r,t+GFJOYMS+1200);r.bubble='💕';sfx('good');if(typeof juiceCheer==='function')juiceCheer('gift');fxSpr('hearts',r.x*TS,(r.y-.7)*TS);
      for(const q of S.res)if(q!==r&&!q.hidden&&Math.hypot(q.x-r.x,q.y-r.y)<6&&!(q.act&&q.act.type==='sleep')){JOYU.set(q,t+2200);q.bubble='👏'}}/* まわりの子も、はくしゅ */
    else if(v===1){JUMP.set(r,t);JOYU.set(r,t+GFJOYMS);r.bubble='😊';sfx('good');fxSpr('hearts',r.x*TS,(r.y-.7)*TS)}
    else{JOYU.set(r,t+GFJOYMS);r.bubble='😊';sfx('tap')}},GFOPENMS+GFSHOWMS);
  villageTimeout(()=>{if(done)done()},GFOPENMS+GFSHOWMS+GFJOYMS)}
/* ---- お返し・節目のつつみ ---- */
function gfAfterGift(r,v){/* 返事の会話のあと：お返し（だいすき・すき GFRETP%）と、GFBONDN 回めの節目。家具は先にもちものへ入れ、見せる順番だけ S.gfShow にのこす（とちゅうで読みこみなおしても、なくならない。見せおわるまで、つぎに開いたときに見せなおす gfShowTick） */const Q=[];
  if(!r.gbond&&(r.gn||0)>=GFBONDN){const id=gfPick('bond',r.elem);r.gbond=1;if(id)Q.push({id,cat:'bond'})}
  if(v===2||v===1&&Math.random()*100<GFRETP){const id=gfPick('ret',r.elem);if(id)Q.push({id,cat:'ret'})}
  if(!Q.length)return;const L=S.gfShow||(S.gfShow=[]);
  for(const q of Q){giveItem(q.id,1);logEv(r.name+'から'+BL[q.id].name+'をもらった');memo('gift',r.name+'から'+BL[q.id].name+'をもらった');L.push({id:q.id,cat:q.cat,rid:r.id,nm:r.name,el:r.elem})}
  dirty=true;gfShowNext()}
let GFSHOW=null;/* いま見せている S（村を切りかえたら、見せなおす） */
function gfShowNext(){const L=S.gfShow;if(!L||!L.length){delete S.gfShow;GFSHOW=null;return}GFSHOW=S;const st=S,q=L[0];
  const r=S.res.find(x=>x.id===q.rid),nm=r?r.name:q.nm,bd=q.cat==='bond',fin=()=>{if(S!==st)return;const i=L.indexOf(q);if(i>=0)L.splice(i,1);dirty=true;gfShowNext()};
  if(!BL[q.id]){fin();return}
  const Lw=bd?['いつも、ありがとう。','守り神さまのために、これを作ったんだ。']:['これ、お返しだよ。','よかったら、村にかざってね。'];
  const go=()=>{if(S!==st)return;if(typeof treasureReveal!=='function'){toast(BL[q.id].name+'をもらった','good');fin();return}
    treasureReveal({ico:wrapIco(q.el),taps:bd?5:3,tier:2,name:nm+(bd?'からの、とくべつなつつみ':'からのお返し'),done:nm+'が作ってくれた！',items:[{img:iconURL(q.id),nm:BL[q.id].name}],beam:1,confetti:1,stamp:'うけとった',after:fin})};
  if(r&&!r.hidden&&$('#dialog').hidden)dialog(Lw.map(t=>[nm,chatTone(t,r)]),go,'うけとる');else go()}
function gfShowTick(){/* 読みこんだあと：見せおわっていない、お返し・節目のつつみ */if(GFSHOW===S||!S||!S.gfShow||!S.gfShow.length||GIFT_ACTIVE)return;gfShowNext()}
