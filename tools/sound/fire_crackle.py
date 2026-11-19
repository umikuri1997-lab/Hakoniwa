#!/usr/bin/env python3
"""焚き火のパチパチだけ（firecrk）：もらった焚き火の録音（SAMPLES.fire、12秒）から、パチッとはじける所だけを切りだし、
あいだの「サーッ」と燃えつづける音は無音にした12秒（くりかえしてもつながる）。焚き火・たいまつのそばの場所の音（feel.js）と、料理の音（cookfire）に使う。
はじける所：2kHzより上の音の大きさが、まわり0.4秒のなかの大きさの3.2倍をこえた所。その前4ms・あと60msを、すぐ立ちあがって、なめらかに消える形で切る。
使いかた：python3 tools/sound/fire_crackle.py  → assets/g/<中身のsha1の先10字>.mp3 と SAMPLES の行"""
import os,hashlib,subprocess,json,numpy as np
SR=44100;D=os.path.join(os.path.dirname(__file__),'..','..');SRC=os.path.join(D,'assets','g','e54c43d515.mp3')
rd=lambda af:np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',SRC,'-ac','1','-ar',str(SR),'-af',af,'-f','f32le','-'],capture_output=True,check=True).stdout,np.float32).copy()
a=rd('highpass=f=500');h=rd('highpass=f=2000')
sm=lambda x,n:np.convolve(x,np.ones(n)/n,'same')
e=np.sqrt(sm(h*h,int(.003*SR)));bg=np.sqrt(sm(h*h,int(.4*SR)))+1e-6
hit=e>bg*3.2;PRE,POST=int(.004*SR),int(.06*SR)
out=np.zeros_like(a);i=0;n=0
while i<len(a):
  if hit[i]:
    s=max(0,i-PRE);t=min(len(a),i+POST);seg=a[s:t].copy();L=len(seg);env=np.ones(L)
    k=i-s;env[:k]=np.linspace(0,1,k) if k else env[:k];env[k:]=np.exp(-np.linspace(0,5,L-k))
    out[s:t]+=seg*env;n+=1;i=t
  else:i+=1
X=int(.02*SR);out[:X]*=np.linspace(0,1,X);out[-X:]*=np.linspace(1,0,X)
out=out/np.abs(out).max()*.8
b=subprocess.run(['ffmpeg','-v','quiet','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-codec:a','libmp3lame','-b:a','128k','-f','mp3','-'],input=out.astype(np.float32).tobytes(),capture_output=True,check=True).stdout
nm=hashlib.sha1(b).hexdigest()[:10]+'.mp3';open(os.path.join(D,'assets','g',nm),'wb').write(b)
import sys;print('pops',n,file=sys.stderr)
print('Object.assign(SAMPLES,'+json.dumps({'firecrk':['assets/g/'+nm]},separators=(',',':'))+');')
