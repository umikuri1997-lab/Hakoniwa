/* あける前のどきどき（reveal.js）：ふしぎなふくろ・霧の宝箱などを、タップしてあける画面。
   タップするたびに、ふくろ（箱）がふくらんでゆれ、音が上がり、うしろの光が強くなる。さいごのタップで、ぱっとひらいて中身がとびだす。
   よい物ほど、タップの回数が多く、光が金色（字では出さない）。中身はさきにわたしてあるので、とちゅうでとじても、なくならない */
const RVCOL=[['#fffbe6','#f4ead0'],['#cfeaff','#8fc4ea'],['#ffe58a','#f6b84a']];/* tier 0・1・2 の光の色（まん中・外） */
function rvGlow(cv,lv,tier){/* うしろの光：ドットの丸を、まん中から外へ3だん */const g=cv.getContext('2d'),N=cv.width,c=N/2;g.clearRect(0,0,N,N);if(lv<=0)return;const C=RVCOL[tier|0],R=c*(.45+.55*lv);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const d=Math.hypot(x+.5-c,y+.5-c)/R;if(d>1)continue;g.fillStyle=d<.45?C[0]:C[1];g.globalAlpha=(d<.45?.95:d<.75?.6:.3)*Math.min(1,.35+lv*.65);g.fillRect(x,y,1,1)}
  g.globalAlpha=1;g.fillStyle=C[0];for(let k=0;k<Math.round(4+lv*8);k++){const a=k*2.39996,r=R*(.6+hash(k*13)*.5);g.fillRect(Math.round(c+Math.cos(a)*r),Math.round(c+Math.sin(a)*r),1,1)}}/* まわりのきらきら */
function rvKnock(f,dt,v){if(typeof jKnock==='function')jKnock(f,dt,v)}
function rvBurst(host,tier){/* ひらいたときに、ドットの粒がとびちる（DOM） */const C=RVCOL[tier|0].concat(['#8fd06a','#f3aec5']),b=host.getBoundingClientRect(),cx=b.width/2,cy=b.height/2;
  for(let i=0;i<22;i++){const e=document.createElement('i'),a=i/22*Math.PI*2,d=50+Math.random()*40,s=(i%3?3:4.5);e.style.cssText='position:absolute;left:'+cx+'px;top:'+cy+'px;width:'+s+'px;height:'+s+'px;background:'+C[i%C.length]+';pointer-events:none';host.appendChild(e);
    if(e.animate){const fr=[];for(let k=0;k<=8;k++){const u=k/8,q=1-Math.pow(1-u,2);fr.push({transform:'translate('+(Math.round(Math.cos(a)*d*q/1.5)*1.5)+'px,'+(Math.round((Math.sin(a)*d*q+u*u*30)/1.5)*1.5)+'px)',opacity:u<.7?1:1-(u-.7)/.3})}e.animate(fr,{duration:620,easing:'steps(8)',fill:'forwards'}).onfinish=()=>e.remove()}else setTimeout(()=>e.remove(),600)}}
function treasureReveal(o){/* o：{ico:絵, taps:回数, tier:0〜2, name:見出し, done:ひらいたあとの見出し, items:[{img,nm}], after:とじたあと } */
  const taps=Math.max(1,o.taps|0),tier=o.tier|0,red=typeof uiReduced==='function'&&uiReduced();let n=0,opened=false;
  const ov=el('<div style="position:fixed;inset:0;z-index:46;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.45);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:300px;width:100%;color:var(--ink);text-align:center"><b class="t" style="display:block;font-size:16px;margin:0 0 6px"></b><div class="st" style="position:relative;width:180px;height:150px;margin:0 auto;cursor:pointer;touch-action:manipulation"><canvas class="gl" width="60" height="50" style="position:absolute;inset:0;width:180px;height:150px;image-rendering:pixelated"></canvas><img class="bg" alt="" style="position:absolute;left:42px;top:27px;width:96px;height:96px;image-rendering:pixelated"></div><p class="note h" style="margin:4px 0 8px"></p><div class="it" style="display:none;flex-wrap:wrap;gap:8px;justify-content:center;margin:0 0 12px"></div><button class="btn pri x" style="display:none">OK</button></div></div>');
  const st=ov.querySelector('.st'),bag=ov.querySelector('.bg'),gl=ov.querySelector('.gl'),h=ov.querySelector('.h'),it=ov.querySelector('.it'),x=ov.querySelector('.x');
  ov.querySelector('.t').textContent=o.name||'';bag.src=o.ico||'';h.textContent='タップしてあけよう';rvGlow(gl,0,tier);
  const close=()=>{if(!ov.isConnected)return;ov.remove();if(o.after)o.after()};
  const open=()=>{opened=true;rvGlow(gl,1,tier);if(bag.animate&&!red)bag.animate([{transform:'scale(1)',opacity:1},{transform:'scale(1.3,1.3)',opacity:1},{transform:'scale(1.5)',opacity:0}],{duration:300,easing:'steps(4)',fill:'forwards'});else bag.style.opacity='0';rvBurst(st,tier);
    for(let i=0;i<3+tier*2;i++)rvKnock(523*Math.pow(2,[0,4,7,12,16,19,24][i]/12),i*.07,.55);if(tier>=2)try{sfx('quest')}catch(e){}
    ov.querySelector('.t').textContent=o.done||o.name||'';h.textContent='';it.style.display='flex';
    (o.items||[]).forEach((m,i)=>{const d=el('<div style="width:76px;display:flex;flex-direction:column;align-items:center;gap:2px;opacity:0"><img alt="" style="width:48px;height:48px;image-rendering:auto"><span class="note" style="font-size:12px;line-height:1.3"></span></div>');if(m.img)d.querySelector('img').src=m.img;else d.querySelector('img').remove();d.querySelector('span').textContent=m.nm;it.appendChild(d);
      const go=()=>{d.style.opacity='1';if(d.animate&&!red)d.animate([{transform:'translateY(18px)'},{transform:'translateY(-6px)'},{transform:'translateY(1.5px)'},{transform:'translateY(0)'}],{duration:240,easing:'steps(4)'})};setTimeout(go,180+i*160)});
    setTimeout(()=>{x.style.display='';},200+(o.items||[]).length*160)};
  st.onclick=e=>{e.stopPropagation();if(opened)return;n++;if(n>=taps){open();return}const lv=n/taps;rvGlow(gl,lv,tier);rvKnock(392*Math.pow(2,[0,2,4,7,9,12][Math.min(5,n-1)]/12),0,.6);/* タップするたびに音が上がる */
    if(bag.animate&&!red){const k=1+lv*.12;bag.animate([{transform:'translate(0,0) scale(1)'},{transform:'translate(-3px,1.5px) scale('+(k+.08)+','+(k-.1)+')'},{transform:'translate(3px,-3px) scale('+(k-.06)+','+(k+.08)+')'},{transform:'translate(-1.5px,0) scale('+k+')'}],{duration:220,easing:'steps(4)',fill:'forwards'})}
    if(lv>=.5)h.textContent=['もう少し…！','いまにもひらきそう！'][lv>=.8?1:0]};
  x.onclick=()=>{try{sfx('tap')}catch(e){}close()};ov.onclick=e=>{if(e.target===ov&&opened)close()};document.body.appendChild(ov);return ov}
