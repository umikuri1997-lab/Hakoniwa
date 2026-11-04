'use strict';
const IS_STORY_REPLAY=typeof location!=='undefined'&&new URLSearchParams(location.search).has('storyReplay');
/* Web版：同じ端末・ブラウザに保存。書き込み失敗を利用者に伝える。 */
const KV=(()=>{
  const memory=Object.create(null);let available=false,lastSaved=0;
  if(IS_STORY_REPLAY)available=true;else try{localStorage.setItem('__hakoniwa_test','1');localStorage.removeItem('__hakoniwa_test');available=true}catch(e){}
  return {
    getItem(k){if(Object.hasOwn(memory,k))return memory[k];if(IS_STORY_REPLAY)return null;try{return localStorage.getItem(k)}catch(e){return null}},
    setItem(k,v){v=String(v);memory[k]=v;if(IS_STORY_REPLAY)return true;try{localStorage.setItem(k,v);available=true;if(/^hakoniwa-(w\d|free-v)/.test(k))lastSaved=Date.now();return true}catch(e){available=false;return false}},
    removeItem(k){delete memory[k];if(IS_STORY_REPLAY)return;try{localStorage.removeItem(k);return true}catch(e){available=false;return false}},
    push(){},onCloud(){},ready:()=>true,status:()=>({available,lastSaved})
  };
})();
const W=108,H=108,TS=32,CX=54,CY=54,OW=72,OFF=18;/* マップは108×108マス。まん中の72×72（OFF=18マス内がわ）が、前からの土地。コワイノ・種などは、この中から来る */
const SP=n=>'パワー'+n;
let VILL=new Uint8Array(0);/* 村（家・置いた物のまわり3マス）。夜ににげる・見まわる所。recount で作る */
const MIN_PER_SEC=2.5;         // 1倍速: 1秒 = ゲーム内2.5分
const FREE=6;/* フリーモードのステージ番号 */
const SAVE_KEYS=['hakoniwa-w1-v8','hakoniwa-w2-v1'];SAVE_KEYS[FREE]='hakoniwa-free-v1';/* ステージごとに別のセーブ */
let WD=0;/* いまのステージ */
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];let TESTM=(()=>{try{return KV.getItem('hk-test')==='1'}catch(_){return false}})();
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[(Math.random()*a.length)|0];
function hash(i){i=(i^61)^(i>>>16);i=i+(i<<3);i=i^(i>>>4);i=Math.imul(i,0x27d4eb2d);i=i^(i>>>15);return (i>>>0)/4294967296}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ---------- 属性 ---------- */
const ELEM={
  wood:{name:'木',col:'#5fbf4f',body:'#8fdc7a',can:'畑の収穫+1・畑の世話・花や木を植える・サラダを作る・木の家具づくり'},
  water:{name:'水',col:'#3f9ee8',body:'#7cc7ff',can:'作業の速さ1.3倍・スタミナ0.7倍・水やり・スープ・ジュースを作る・水の家具づくり'},
  fire:{name:'火',col:'#ff6a3d',body:'#ff9f5a',can:'「コワイノ」とたたかう・夜の見回り・ベイクドポテト・焼き魚を作る・火の家具づくり'},
  earth:{name:'土',col:'#b8863b',body:'#e6c07a',can:'作業の速さ0.75倍・スタミナ1.45倍・畑を耕す・柵を直す・パンを作る・土の家具づくり'},
  wind:{name:'風',col:'#3fc0a0',body:'#c9f2e6',can:'歩く速さ1.45倍・たのしさ60より下で遊びに行く・ふしぎな種を拾う・風の家具づくり'},
};
const ELEM_KEYS=Object.keys(ELEM);
/* 火山のそうび（js/gear.js）：鉱脈の表と、そうびがないときの効果。しくみの関数は gear.js がおきかえる（ほかのファイルだけを読むテストでも動くように） */
const VEINS={vcopper:'copper',viron:'iron',vobsid:'obsidian',vsilver:'silver',vgold:'gold'},VEIN_IDS=Object.keys(VEINS);/* 鉱脈：ほると鉱石 */
const GNONE={atk:0,rch:0,hit:1,iv:1,hun:0,mv:1,flee:1,rec:1,fun:1,work:1,cap:0,xp:1,ns:1,light:0,fear:0,rain:0,refl:0,tburn:0,fburn:0,nob:0,glow:0,burn:0,kb:0,slow:0,stun:0,steal:0,aoe:0,side:0,job:{},crop:0,stone:0,dish:0,wcan:0,prng:0,grow:1,pw:0};
function gearStat(){return GNONE}function gJob(){return 1}function gearStrike(){}function gearHurt(){}function gearEnemyTick(){return false}function gearGlowNear(){return false}function gearMorning(){}function gearIdea(){}function mineOre(){return false}function placeVeins(){}function gearLightAt(){return false}function gearLights(){}function gearDropAll(){}function gearOffer(){return false}function gearFind(){}function towerVolley(){return 0}function ammoTotal(){return (S.inv.arrow||0)+(S.inv.arrow2||0)}function gearGive(){}function gearCount(){return 0}
