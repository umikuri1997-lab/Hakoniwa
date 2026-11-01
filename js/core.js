'use strict';
/* Web版：同じ端末・ブラウザに保存。書き込み失敗を利用者に伝える。 */
const KV=(()=>{
  const memory=Object.create(null);let available=false,lastSaved=0;
  try{localStorage.setItem('__hakoniwa_test','1');localStorage.removeItem('__hakoniwa_test');available=true}catch(e){}
  return {
    getItem(k){if(Object.hasOwn(memory,k))return memory[k];try{return localStorage.getItem(k)}catch(e){return null}},
    setItem(k,v){v=String(v);memory[k]=v;try{localStorage.setItem(k,v);available=true;if(/^hakoniwa-(w\d|free-v)/.test(k))lastSaved=Date.now();return true}catch(e){available=false;return false}},
    removeItem(k){delete memory[k];try{localStorage.removeItem(k);return true}catch(e){available=false;return false}},
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
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];let TESTM=(()=>{try{return localStorage.getItem('hk-test')==='1'}catch(_){return false}})();
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[(Math.random()*a.length)|0];
function hash(i){i=(i^61)^(i>>>16);i=i+(i<<3);i=i^(i>>>4);i=Math.imul(i,0x27d4eb2d);i=i^(i>>>15);return (i>>>0)/4294967296}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ---------- 属性 ---------- */
const ELEM={
  wood:{name:'木',col:'#5fbf4f',body:'#8fdc7a',can:'畑の収穫+1・畑の世話・花を植える・木の家具づくり'},
  water:{name:'水',col:'#3f9ee8',body:'#7cc7ff',can:'作業の速さ1.3倍・スタミナ0.7倍・水やり・つり・水の家具づくり'},
  fire:{name:'火',col:'#ff6a3d',body:'#ff9f5a',can:'「コワイノ」に立ち向かう・夜の見回り・料理・火の家具づくり'},
  earth:{name:'土',col:'#b8863b',body:'#e6c07a',can:'作業の速さ0.75倍・スタミナ1.45倍・畑を耕す・柵を直す・土の家具づくり'},
  wind:{name:'風',col:'#3fc0a0',body:'#c9f2e6',can:'歩く速さ1.45倍・たのしさ60より下で遊びに行く・風の家具づくり'},
};
const ELEM_KEYS=Object.keys(ELEM);
