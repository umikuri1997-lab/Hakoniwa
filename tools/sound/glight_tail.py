#!/usr/bin/env python3
"""まもりの光の音（glight）：持ち主がくれた音（tools/sound/src/glight.mp3、0.5秒ほど）に、こだまをかさねて余韻を長くする（持ち主がえらんだ）。
新しい音は作らない：もらった音そのものを、少しずつおくらせ・小さく・やわらかく（高い音をへらす）して、何回かかさねるだけ。はじめの音の時刻はかえない（GLHIT のまま）。
使いかた：python3 tools/sound/glight_tail.py  → assets/g/<中身のsha1の先10字>.mp3 と SAMPLES の行"""
import os,hashlib,subprocess,json,numpy as np
SR=44100;D=os.path.dirname(__file__);OUT=os.path.join(D,'..','..','assets','g')
ECHO=[(.12,.42,7000),(.25,.30,5000),(.40,.21,3800),(.58,.14,3000),(.80,.09,2400),(1.05,.055,2000)]  # おくれ（秒）・大きさ・高い音をへらす所（Hz）
def dec(af=''):return np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',os.path.join(D,'src','glight.mp3'),'-ac','2','-ar',str(SR)]+(['-af',af] if af else [])+['-f','f32le','-'],capture_output=True,check=True).stdout,np.float32).reshape(-1,2).copy()
a=dec();N=len(a)+int((ECHO[-1][0]+.1)*SR);y=np.zeros((N,2),np.float32);y[:len(a)]+=a
for k,(t,g,lp) in enumerate(ECHO):
  e=dec('lowpass=f=%d'%lp)*g;i=int(t*SR);
  if k%2:e=e[:,::-1]  # 左右をいれかえて、ひろがりを出す
  y[i:i+len(e)]+=e
fo=int(.25*SR);y[-fo:]*=np.linspace(1,0,fo)[:,None]
y*=np.abs(a).max()/np.abs(y).max()  # いちばん大きい所は、もとの音と同じ
b=subprocess.run(['ffmpeg','-v','quiet','-f','f32le','-ar',str(SR),'-ac','2','-i','-','-codec:a','libmp3lame','-b:a','128k','-f','mp3','-'],input=y.astype(np.float32).tobytes(),capture_output=True,check=True).stdout
n=hashlib.sha1(b).hexdigest()[:10]+'.mp3';open(os.path.join(OUT,n),'wb').write(b)
print('Object.assign(SAMPLES,'+json.dumps({'glight':['assets/g/'+n]},separators=(',',':'))+');',len(y)/SR)
