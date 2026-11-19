/* ---------- 雨とあらしの見た目（weather-fx.js）。見た目と音だけで、数字・せいれいの行動はかえない。セーブしない ----------
   雨つぶ（wxRainDraw）：奥・まん中・手前の3つの層。奥ほど短く・うすく・おそく、手前ほど長く・こく・速い。どれも2点のドットの段々（WXP）。
   雨の強さ（wxRainK）：村の時計で、強くなったり弱くなったりする（10分ごとの数を、なめらかにつなぐ）。
   突風（wxGust）：あらしの日だけ。実時間で、ときどき風が強くなり、雨がよこへたおれ、木が風下へかたむき（swayK）、葉と小枝がとぶ（wxLeaves）。
   かみなり（wxBolt）：あらしの日だけ。ときどき画面が白く光り、空にドットの稲妻、少しおくれてゴロゴロ（SAMPLES.thunder）。うごきをへらす設定では、光をうすく。
   雨のもやは hd2d.js（hdPost）、ぬれた地面・屋根のつやは feel.js（feelRow・feelRoofWet）。 */
const WXP=2;/* 雨つぶのドットの大きさ（画面の点） */
const WXL=[/* 層：数・ドットの数・こさ・落ちる速さ・カメラについてくるわりあい */
  {n:150,len:2,a:.32,v:.55,par:.15,c:'196,214,240'},
  {n:100,len:4,a:.5,v:1,par:.4,c:'212,228,252'},
  {n:44,len:7,a:.72,v:1.7,par:.8,c:'232,242,255'}];
const WXSTORM=1.7;/* あらしの日の雨の数 */
const WXBOLTGAP=[7000,22000];/* かみなりの間（ミリ秒、このあいだのどこか） */
const WXLEAFMAX=36;/* とぶ葉・小枝の数の上 */
let WXB=null,WXNEXT=0,WXLAST=0;const WXLF=[];
function wxNoise(t){const i=Math.floor(t),f=t-i,u=f*f*(3-2*f);return hash(i*131+7)*(1-u)+hash((i+1)*131+7)*u}
function wxRainK(){/* 雨の強さ .5〜1 */if(!S||!S.rain)return 0;const t=(dayNo()*24+hour())*6;return .5+.5*wxNoise(t)}
function wxGust(now){/* 突風 0〜1（あらしの日だけ） */if(!S||!(typeof stormNow==='function'&&stormNow()))return 0;const n=wxNoise(now/5200)*.7+wxNoise(now/1700+40)*.3;return Math.max(0,Math.min(1,(n-.5)/.3))}
function wxRainDraw(now){if(!S||!S.rain||(typeof snowNow==='function'&&snowNow()))return;const st=typeof stormNow==='function'&&stormNow(),k=wxRainK()*(st?WXSTORM:1),g=wxGust(now);
  const sx=st?.8+g*1.1:.4;/* 1つぶん（2ドット）さがるあいだに、よこへずれるドットの数 */const P=WXP,cx=cam.x*cam.z,cy=cam.y*cam.z;
  for(let l=0;l<WXL.length;l++){const L=WXL[l],n=Math.round(L.n*k),step=P*2;ctx.fillStyle='rgba('+L.c+','+L.a+')';const fall=now*.42*L.v,H0=VH+L.len*step+40,W0=VW+H0*sx*.5+40,dr=sx/2;
    for(let i=0;i<n;i++){const sd=l*997+i,ph=hash(sd*3+1)*H0,yy=(fall*(.85+hash(sd*5+2)*.3)+ph-cy*L.par)%H0,y0=(yy<0?yy+H0:yy)-L.len*step,xx=(hash(sd*7+3)*W0-cx*L.par-y0*dr)%W0,x0=(xx<0?xx+W0:xx)-20;
      const X=Math.round(x0/P)*P,Y=Math.round(y0/P)*P;for(let s=0;s<L.len;s++)ctx.fillRect(X-Math.round(s*sx)*P,Y+s*step,P,step)}}
  if(st){wxLeaves(now,g);wxBolt(now)}}
/* ---------- とぶ葉・小枝 ---------- */
const WXLC=[['#8fc46a','#6fa54e'],['#a8d27a','#7fb25a'],['#e3a65a','#c27c3c'],['#e3a65a','#c27c3c']];/* 季節の葉の色（春・夏・秋・冬） */
function wxLeaves(now,g){const dt=Math.min(50,now-(WXLAST||now));WXLAST=now;
  if(g>.15&&WXLF.length<WXLEAFMAX&&Math.random()<g*dt/90){const tw=Math.random()<.25;WXLF.push({x:VW+10,y:Math.random()*VH*.85,vx:-(.35+Math.random()*.35)*(1+g),vy:.02+Math.random()*.06,ph:Math.random()*6,tw,t0:now})}
  const P=3,C=WXLC[(typeof seasonNow==='function'?seasonNow():0)|0]||WXLC[0];
  for(let i=WXLF.length-1;i>=0;i--){const f=WXLF[i];f.x+=f.vx*dt*(.6+g*.8);f.y+=(f.vy+Math.sin(now/180+f.ph)*.08)*dt;if(f.x<-20||f.y>VH+20){WXLF.splice(i,1);continue}
    const X=Math.round(f.x/P)*P,Y=Math.round(f.y/P)*P,fr=((now/120+f.ph)|0)%2;
    if(f.tw){ctx.fillStyle='#9b7650';if(fr)ctx.fillRect(X,Y,P*4,P);else{ctx.fillRect(X,Y,P,P);ctx.fillRect(X+P,Y+P,P,P);ctx.fillRect(X+P*2,Y+P*2,P,P)}}/* 小枝：よこ・ななめ */
    else{ctx.fillStyle=C[0];if(fr){ctx.fillRect(X,Y,P*3,P);ctx.fillStyle=C[1];ctx.fillRect(X+P,Y+P,P,P)}else{ctx.fillRect(X,Y,P,P*2);ctx.fillStyle=C[1];ctx.fillRect(X+P,Y+P,P,P)}}}}/* 葉：ひらひら2コマ */
/* ---------- かみなり ---------- */
function wxBoltPath(){/* 空の上から、ジグザグに下りる稲妻（ドットの点の列）と、枝 */const P=3,pts=[],x0=VW*(.15+Math.random()*.7),yEnd=VH*(.3+Math.random()*.2);let x=x0,y=0;
  while(y<yEnd){pts.push([Math.round(x/P)*P,Math.round(y/P)*P]);y+=P;if(Math.random()<.35)x+=(Math.random()<.5?-1:1)*P}
  const br=[];for(let b=0;b<2;b++){const s=pts[(pts.length*(.3+Math.random()*.4))|0];if(!s)continue;let bx=s[0],by=s[1];const d=Math.random()<.5?-1:1,L=[];for(let k=0;k<14+((Math.random()*10)|0);k++){L.push([bx,by]);by+=P;if(Math.random()<.55)bx+=d*P}br.push(L)}return{pts,br}}
function wxBolt(now){if(!WXNEXT||WXNEXT<now-60000){WXNEXT=now+WXBOLTGAP[0]+Math.random()*(WXBOLTGAP[1]-WXBOLTGAP[0])}
  if(now>=WXNEXT&&!(typeof paused!=='undefined'&&paused)&&!document.hidden){WXNEXT=now+WXBOLTGAP[0]+Math.random()*(WXBOLTGAP[1]-WXBOLTGAP[0]);WXB={t0:now,...wxBoltPath()};const dl=.25+Math.random()*1.2;try{if(typeof AC!=='undefined'&&AC&&SND.sfx&&AC.state==='running')playS('thunder',.5,dl)}catch(e){}}
  if(!WXB)return;const u=now-WXB.t0;if(u>900){WXB=null;return}
  const red=typeof uiReduced==='function'&&uiReduced(),fl=u<70?.5:u<130?.08:u<200?.34:Math.max(0,.34*(1-(u-200)/700));/* ぱっ・ぱっと2回光って、ゆっくり消える */
  if(fl>0){ctx.fillStyle='rgba(235,242,255,'+(fl*(red?.25:1))+')';ctx.fillRect(0,0,VW,VH)}
  if(u<260&&!(u>70&&u<130)){const P=3;ctx.fillStyle='rgba(200,215,255,.55)';for(const[x,y]of WXB.pts)ctx.fillRect(x-P,y,P*3,P);ctx.fillStyle='#ffffff';for(const[x,y]of WXB.pts)ctx.fillRect(x,y,P,P);ctx.fillStyle='rgba(240,246,255,.85)';for(const L of WXB.br)for(const[x,y]of L)ctx.fillRect(x,y,P,P)}}/* 稲妻は、光っているあいだだけ（まん中は白・まわりはうすい青） */
