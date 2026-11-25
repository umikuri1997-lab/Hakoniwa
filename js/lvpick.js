/* ---------- レシピをえらんでひらく ----------
   村レベルが上がるたびに、えらべる物（LVPICK）の中から3つを出し、1つえらんでおぼえる。えらばなかった物は、つぎのレベルでまた出る。
   お話でつかう物・家の材料（壁・床・道・柵・ドア・階段・ハシゴ・橋）は、いままでどおり、えらばずにおぼえる（LVPICK に入れない）。フリーモードは、えらばずにぜんぶおぼえる。
   S.lvPick：{got:{id:1}, n:まだえらんでいない回数}。 */
const LVPICK=new Set(['tskama','tsubo','tspillar','gekkolamp','hotarukago','shitone','tsukimidai','terraceseat','madobachi','canallamp','araiba','shimahammock','fusenya','kagoisu','kazakadan','kazelamp','curtain1','signw','signs','lurestatue','mato','picnic','taiko','chadogu','hokora']);
const LVPICKN=3;/* 出す数 */
const LP=()=>S.lvPick||(S.lvPick={got:{},n:0});
const lvPickOn=()=>!!S&&!S.free;
function lvPickWait(id){/* えらぶまで、おぼえない物か */return lvPickOn()&&LVPICK.has(id)&&!LP().got[id]}
function lvPickPool(){/* いまえらべる物：村レベルにとどいていて、まだえらんでいない物（このステージで使える物だけ） */return [...LVPICK].filter(id=>BL[id]&&(BL[id].lv||1)<=(S.lv||1)&&!LP().got[id]&&stageItemOK(id)&&!(BL[id].w>WT()))}
function lvPickLearn(id){LP().got[id]=1;const b=BL[id];if(b.kind==='furn'){S.recipes||(S.recipes={});S.recipes[id]=true}else S.flags['lv_'+id]=1;renderPalette()}
function lvPickMig(){/* 前のセーブ：もう村レベルがとどいている物は、おぼえていることにする */if(S.flags.lvPick1)return;S.flags.lvPick1=1;for(const id of LVPICK)if(BL[id]&&(BL[id].lv||1)<=(S.lv||1))LP().got[id]=1}
let LVPOP=null;
function lvPickTick(){if(!lvPickOn()||LVPOP||!S.lvPick||!(S.lvPick.n>0))return;if(sheet||IS_STORY_REPLAY||typeof MEMRUN!=='undefined'&&MEMRUN)return;{const lu=document.getElementById('lvup'),dg=document.getElementById('dialog');if(lu&&!lu.hidden||dg&&!dg.hidden)return}if(typeof GIFT_ACTIVE!=='undefined'&&GIFT_ACTIVE)return;
  const P=lvPickPool();if(!P.length){S.lvPick.n=0;return}const C=P.sort((a,b)=>hash((S.lv||1)*31+a.length*7+a.charCodeAt(0))-hash((S.lv||1)*31+b.length*7+b.charCodeAt(0))).slice(0,LVPICKN);lvPickPop(C)}
function lvPickPop(C){/* 3つから1つえらぶ（えらぶまで、とじない） */
  const o=el('<div style="position:fixed;inset:0;z-index:46;display:flex;align-items:center;justify-content:center;background:rgba(40,30,15,.35);padding:12px 24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:360px;width:100%;max-height:100%;box-sizing:border-box;display:flex;flex-direction:column;color:var(--ink)"><b style="display:block;font-size:15px;margin-bottom:8px">おぼえるレシピをえらぶ</b><div class="rows ks" style="min-height:0;overflow-y:auto"></div></div></div>');
  LVPOP=o;const R=o.querySelector('.ks');
  for(const id of C){const r=rowEl(BL[id].name,BL[id].desc||'',iconURL(id)),b=el('<button class="btn pri">おぼえる</button>');b.onclick=()=>{sfx('good');lvPickLearn(id);S.lvPick.n=Math.max(0,S.lvPick.n-1);o.remove();LVPOP=null;toast(BL[id].name+'のレシピをおぼえた','good');memo('paper','「'+BL[id].name+'」のレシピをえらんでおぼえた')};r.appendChild(b);R.appendChild(r)}
  document.body.appendChild(o)}
