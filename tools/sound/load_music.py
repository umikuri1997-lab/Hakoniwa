#!/usr/bin/env python3
"""マップの読みこみ中の曲（ldmusic）：OpenGameArt「JRPG Piano」（joth、CC0、https://opengameart.org/content/jrpg-piano）の
JRPG Piano.mp3（24.9秒のループ）を、つなぎ目なくくりかえせる形にする（持ち主がえらんだ）。
はじめの無音（0.02秒）と、おわりの無音を切り、大きさをそろえる。
ゲームは loopStart .06・loopEnd 長さ−.06 でくりかえすので、前後に、つづきの音を0.06秒ずつつける。
使いかた：python3 tools/sound/load_music.py <JRPG Piano.mp3>  → assets/g/<中身のsha1の先10字>.mp3 と SAMPLES の行"""
import sys,os,hashlib,subprocess,json,numpy as np
SR=44100;OUT=os.path.join(os.path.dirname(__file__),'..','..','assets','g');P=.06
a=np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',sys.argv[1],'-ac','2','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout,np.float32).astype(np.float64).reshape(-1,2)
e=np.abs(a).max(1);nz=np.where(e>1e-3)[0];x=a[nz[0]:nz[-1]+1]  # はじめとおわりの無音を切る
x=x*(10**(-20/20)/np.sqrt((x**2).mean()))  # 大きさ：RMS −20dB
p=int(P*SR);x=np.concatenate([x[-p:],x,x[:p]])
b=subprocess.run(['ffmpeg','-v','quiet','-f','f32le','-ar',str(SR),'-ac','2','-i','-','-codec:a','libmp3lame','-b:a','128k','-f','mp3','-'],input=np.clip(x,-1,1).astype(np.float32).tobytes(),capture_output=True,check=True).stdout
n=hashlib.sha1(b).hexdigest()[:10]+'.mp3';open(os.path.join(OUT,n),'wb').write(b)
print('Object.assign(SAMPLES,'+json.dumps({'ldmusic':['assets/g/'+n]},separators=(',',':'))+');')
