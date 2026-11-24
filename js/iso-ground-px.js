'use strict';
/* 地面の区画のドットごとの計算（iso-ground.js の igPrep がそろえた物 P から、色 O と、しるし K を作る）。
   ゲームの画面（iso-ground.js の igBuild）と、マップの読みこみ中のワーカー（iso-ground-worker.js）の両方が使う。P のほかの物（S・ほかのファイルの名前）は使わない */
function igPixels(P){const{w,ht,X,Yt,IGM,W,H,TS,IQA,IQB,IQW,IQH,sx0,sy0,sw,B,U,GV,WV,gw,gx0,gy0,TG,TW,GT,WT,ST,SM,SPR,SG,WBAND,WBANDA,WBANK,WBSH,WBANKC,WBSHA,IGSKYH,SKYFACE}=P;
  const N=w*ht,O=new Uint8ClampedArray(N*4),K=new Uint8Array(N);/* K：1 水面・2 水の線・3 浅瀬・4 雲の海・0 そのほか */
  const AU=new Float64Array(w);for(let u=0;u<w;u++)AU[u]=(X+u+.5)/IQA;/* 列ごとの割り算は1回だけ */
  const WTS=W*TS,HTS=H*TS,GD=GT.d,GTW=GT.w,GTH=GT.h,WTD=WT.d,WTW=WT.w,WTH=WT.h,WB0=WBAND[0];/* ドットごとに見る物は、先に手もとへ */
  let ax=w,ay=ht,bx=-1,by=-1,wa=w,wb=ht,wc=-1,wd=-1,ka=w,kb=ht,kc=-1,kd=-1;/* できた絵を、色のある所・水面・雲の海の所だけに切りつめるはんい */
  for(let v=0;v<ht;v++){const iy=Yt+v,bv=(iy+.5)/IQB;for(let u=0;u<w;u++){const ix=X+u,au=AU[u],wx=(au+bv)/2,wy=(bv-au)/2;if(wx<0||wy<0||wx>=WTS||wy>=HTS)continue;if(v>=IGM){if(u<ax)ax=u;if(u>bx)bx=u;if(v<ay)ay=v;by=v}/* 色のある所のはんい（上の行 IGM はのぞく） */
    const p=v*w+u,o=p*4,fx=wx|0,fy=wy|0,tx=(fx/TS)|0,ty=(fy/TS)|0,vx=(wx/TS+.5)|0,vy=(wy/TS+.5)|0,lu=ix-((vx-vy)*IQW/2-IQW/2),lv=iy-(vx+vy-1)*IQH/2,li=lv*IQW+lu;
    const ca=vx-1-gx0,cb=vy-1-gy0,c1=cb*gw+ca,c2=c1+1,c3=c1+gw,c4=c3+1,mg=GV[c1]|GV[c2]<<1|GV[c3]<<2|GV[c4]<<3,mw=WV[c1]|WV[c2]<<1|WV[c3]<<2|WV[c4]<<3;
    const si=((fy-sy0)*sw+(fx-sx0))*4;let r=B[si],g=B[si+1],b=B[si+2];
    const kg=mg?TG[mg][li]:0;if(kg===1||kg===2){const ti=((fy%GTH)*GTW+fx%GTW)*4;r=GD[ti];g=GD[ti+1];b=GD[ti+2];if(kg===2){r=r*.89;g=g*.92;b=b*.89}}/* 草の葉のかげの色（道のふちの葉と同じくらい） */
    const kw=mw?TW[mw][li]:0,j=ty*W+tx,sky=SM&&SM[j]===1;
    if(kw===1||kw===2){if(sky){const ti=((fy%ST.h)*ST.w+fx%ST.w)*4;r=ST.d[ti];g=ST.d[ti+1];b=ST.d[ti+2];K[p]=4}else{const ti=((fy%WTH)*WTW+fx%WTW)*4;r=WTD[ti];g=WTD[ti+1];b=WTD[ti+2];K[p]=1;
      if(SPR&&SPR[j]){r=r+(232-r)*.6;g=g+(238-g)*.6;b=b+(232-b)*.6;K[p]=3}/* よみがえった温泉：乳白色の湯 */
      if(SG[j]===2){r=r+(226-r)*.45;g=g+(214-g)*.45;b=b+(170-b)*.45;K[p]=3}/* 浅瀬：水の底の砂がすける */
      if(kw===2){r=WB0[0];g=WB0[1];b=WB0[2];K[p]=2}}}
    else if(kw>10&&(kg===1||kg===2)){const c=WBAND[kw-10],a=WBANDA[kw-10]/255;r=r+(c[0]-r)*a;g=g+(c[1]-g)*a;b=b+(c[2]-b)*a}/* 草地の岸：水からの帯 */
    const ua=U?U[si+3]:0;if(ua){const a=ua/255;r=r+(U[si]-r)*a;g=g+(U[si+1]-g)*a;b=b+(U[si+2]-b)*a}
    O[o]=r;O[o+1]=g;O[o+2]=b;O[o+3]=255}}
  for(let v=IGM;v<ht;v++)for(let u=0;u<w;u++){const p=v*w+u;if(K[p]!==1&&K[p]!==2&&K[p]!==3)continue;let k=0;for(let q2=1;q2<=WBANK+WBSH;q2++){const kk=K[p-q2*w];if(!kk&&O[(p-q2*w)*4+3]){k=q2;break}if(kk===4)break}if(!k){if(K[p]===1){if(u<wa)wa=u;if(u>wc)wc=u;if(v<wb)wb=v;wd=v}continue}/* 水は岸より一段ひくい：画面で水のすぐ上が陸なら、岸の断面 */
    const o=p*4;if(k<=WBANK){const c=WBANKC[k-1];O[o]=c[0];O[o+1]=c[1];O[o+2]=c[2]}else{const a=WBSHA[k-WBANK-1]/255;O[o]=O[o]+(24-O[o])*a;O[o+1]=O[o+1]+(52-O[o+1])*a;O[o+2]=O[o+2]+(70-O[o+2])*a}K[p]=5}
  if(SM)for(let v=IGM;v<ht;v++)for(let u=0;u<w;u++){const p=v*w+u;if(K[p]!==4)continue;let k=0;for(let q2=1;q2<=IGSKYH;q2++){const kk=K[p-q2*w];if(!kk&&O[(p-q2*w)*4+3]){k=q2;break}if(kk&&kk!==4&&kk!==5)break}if(!k){if(u<ka)ka=u;if(u>kc)kc=u;if(v<kb)kb=v;kd=v;continue}/* 雲の海：画面で、すぐ上が島の陸なら、島のがけ（上から：土のかげ・岩・岩のかげ・うら。いままでの SKYFACE） */
    const c=SKYFACE[k<=3?0:k<=IGSKYH-6?1:k<=IGSKYH-3?2:3],o=p*4;O[o]=c[0];O[o+1]=c[1];O[o+2]=c[2];K[p]=5}
  return {O,K,w,ax,ay,bx,by,wa,wb,wc,wd,ka,kb,kc,kd}}
