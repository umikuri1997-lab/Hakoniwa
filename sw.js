'use strict';
/* サービスワーカー：プログラムと絵と音を、スマホに保存（Cache Storage）して、2回めからネットを待たない。
   - 名前に中身の番号がある物（assets/ の中・?v=〇〇 つきの .js。公開のとき tools/jsver.cjs が番号をつける）は、中身がかわらないので、保存した物をそのまま使う（ネットにたしかめない）。かわったら名前がかわり、新しく読む。
   - index.html（ゲームのページ。紹介ページ about.html はさわらない）は、ネットを先に見て、つながらないときだけ保存した物。
   - ?v=dev（開発中）・とちゅうから読む音（Range）・ほかのサイトは、さわらない。
   - 保存は SWMAX こまで。こえたら、古く入れた物からけす。 */
const SWC='hakoniwa-v1',SWMAX=1500;
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==SWC)await caches.delete(k);await self.clients.claim()})()));
const swFixed=u=>u.origin===self.location.origin&&(/\/assets\//.test(u.pathname)||/\.js$/.test(u.pathname)&&/[?&]v=[0-9a-f]{8}(&|$)/.test(u.search));
const swPage=(u,r)=>r.mode==='navigate'&&u.origin===self.location.origin&&/(\/|\/index\.html)$/.test(u.pathname);/* ゲームのページだけ（紹介ページ about.html をゲームとして保存しない） */
async function swPut(c,req,res){try{await c.put(req,res);const K=await c.keys();for(let i=0;i<K.length-SWMAX;i++)await c.delete(K[i])}catch(e){}}
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||r.headers.has('range'))return;const u=new URL(r.url);
  if(swFixed(u))e.respondWith((async()=>{const c=await caches.open(SWC),hit=await c.match(r);if(hit)return hit;const res=await fetch(r);if(res.status===200&&res.type==='basic')e.waitUntil(swPut(c,r,res.clone()));return res})());
  else if(swPage(u,r))e.respondWith((async()=>{const c=await caches.open(SWC);try{const res=await fetch(r);if(res.status===200)e.waitUntil(swPut(c,'./',res.clone()));return res}catch(err){const hit=await c.match('./');if(hit)return hit;throw err}})())});
self.addEventListener('message',e=>{const L=e.data&&e.data.keep;if(!Array.isArray(L))return;e.waitUntil((async()=>{const c=await caches.open(SWC);for(const s of L.slice(0,SWMAX)){try{const u=new URL(s);if(!swFixed(u)||await c.match(s))continue;const res=await fetch(s);if(res.status===200&&res.type==='basic')await c.put(s,res)}catch(err){}}})())});/* ページが読んだ物の一覧（draw-ground.js の ldPreSave）：まだ保存していない物を保存する（多くはブラウザの保存から来るので、ネットはほとんど使わない） */
