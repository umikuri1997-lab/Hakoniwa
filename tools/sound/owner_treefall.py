#!/usr/bin/env python3
"""木がたおれる音（treefall）：持ち主がくれた音（tools/sound/src/owner_treefall.mp3、3.2秒：ミシミシ → 2.55秒めにドン）を、そのまま使う。
はじめの無音をけずる・大きさをそろえるだけ。ドンの時刻は TFTHUD（audio.js）に書く。
使いかた：python3 tools/sound/owner_treefall.py  → assets/g/<中身のsha1の先10字>.mp3 と SAMPLES の行・ドンの時刻"""
import os,hashlib,subprocess,json,numpy as np
SR=44100;D=os.path.join(os.path.dirname(__file__),'..','..');SRC=os.path.join(os.path.dirname(__file__),'src','owner_treefall.mp3')
a=np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',SRC,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout,np.float32).copy()
e=np.abs(a);i=int(np.argmax(e>e.max()*.02));i=max(0,i-int(.005*SR));a=a[i:]
a=a/np.abs(a).max()*.8
w=int(.02*SR);env=np.array([np.sqrt((a[k:k+w]**2).mean()) for k in range(0,len(a)-w,w)]);lo=int(1.5*SR/w);th=lo+int(np.argmax(env[lo:]))
print('ドンの時刻 %.2f 秒'%(th*w/SR))
b=subprocess.run(['ffmpeg','-v','quiet','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-codec:a','libmp3lame','-b:a','128k','-f','mp3','-'],input=a.astype(np.float32).tobytes(),capture_output=True,check=True).stdout
nm=hashlib.sha1(b).hexdigest()[:10]+'.mp3';open(os.path.join(D,'assets','g',nm),'wb').write(b)
print('Object.assign(SAMPLES,'+json.dumps({'treefall':['assets/g/'+nm]},separators=(',',':'))+');')
