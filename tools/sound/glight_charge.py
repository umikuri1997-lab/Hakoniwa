#!/usr/bin/env python3
"""ぴったりにためたまもりの光の音（glightc）：いまの光の音（glight、glight_tail.py の物）に、本物の録音の低いひびきをかさねる（持ち主が聞きくらべてえらんだ A）。
かさねる録音：Quaker540「Supernatural Explosion」（freesound 256960、CC0）→ tools/sound/src/glight_boom.mp3。
新しい音は作らない：2つの録音を、いちばん大きい所をそろえてかさね、おわりを小さくし、大きさをそろえるだけ（いまの光の音より 2 LU 大きく）。
使いかた：pip install pyloudnorm; python3 tools/sound/glight_charge.py  → assets/g/<中身のsha1の先10字>.mp3 と SAMPLES の行"""
import os,hashlib,subprocess,json,numpy as np,pyloudnorm as pyln
SR=44100;D=os.path.dirname(__file__);OUT=os.path.join(D,'..','..','assets','g')
BASE=os.path.join(OUT,'449e80d89c.mp3');BOOM=os.path.join(D,'src','glight_boom.mp3');GAIN=.9;UP=2
def dec(f):return np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',f,'-ac','2','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout,np.float32).reshape(-1,2).copy()
M=pyln.Meter(SR,block_size=.4)
def stmax(y):n=int(.4*SR);return max(M.integrated_loudness(y[i:i+n]) for i in range(0,max(1,len(y)-n),int(.1*SR)))  # 400ミリ秒ごとの大きさの、いちばん大きい所
g=dec(BASE);l=dec(BOOM);l/=np.abs(l).max()
off=np.argmax(np.abs(g).max(1))-np.argmax(np.abs(l).max(1))  # いちばん大きい所をそろえる
if off<0:l=l[-off:];off=0
y=np.zeros((max(len(g),off+len(l)),2),np.float32);y[:len(g)]+=g;y[off:off+len(l)]+=l*GAIN
fo=int(.3*SR);y[-fo:]*=np.linspace(1,0,fo)[:,None]
y*=10**((stmax(g)+UP-stmax(y))/20)
if np.abs(y).max()>.89:y*=.89/np.abs(y).max()
p=os.path.join(OUT,'_tmp.mp3');subprocess.run(['ffmpeg','-v','quiet','-y','-f','f32le','-ar',str(SR),'-ac','2','-i','-','-codec:a','libmp3lame','-b:a','128k',p],input=y.astype(np.float32).tobytes(),check=True)  # ファイルに書く（パイプに書くと長さがかわる）
b=open(p,'rb').read();os.remove(p);n=hashlib.sha1(b).hexdigest()[:10]+'.mp3';open(os.path.join(OUT,n),'wb').write(b)
print('Object.assign(SAMPLES,'+json.dumps({'glightc':['assets/g/'+n]},separators=(',',':'))+');',round(len(y)/SR,2))
