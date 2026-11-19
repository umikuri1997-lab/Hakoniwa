#!/usr/bin/env python3
"""本をとじる音（bkclose）：持ち主がくれた音（tools/sound/src/owner_bookclose.mp3、1.1秒のパタン）を、そのまま使う。
はじめの無音をけずる・大きさをそろえるだけ。思い出帳・図鑑・日記の表紙がとじるとき（book.js の bkSnd）。
使いかた：python3 tools/sound/owner_bookclose.py  → assets/g/<中身のsha1の先10字>.mp3 と SAMPLES の行"""
import os,hashlib,subprocess,json,numpy as np
SR=44100;D=os.path.join(os.path.dirname(__file__),'..','..');SRC=os.path.join(os.path.dirname(__file__),'src','owner_bookclose.mp3')
a=np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',SRC,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout,np.float32).copy()
e=np.abs(a);i=int(np.argmax(e>e.max()*.02));i=max(0,i-int(.005*SR));a=a[i:]
a=a/np.abs(a).max()*.8
b=subprocess.run(['ffmpeg','-v','quiet','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-codec:a','libmp3lame','-b:a','128k','-f','mp3','-'],input=a.astype(np.float32).tobytes(),capture_output=True,check=True).stdout
nm=hashlib.sha1(b).hexdigest()[:10]+'.mp3';open(os.path.join(D,'assets','g',nm),'wb').write(b)
print('Object.assign(SAMPLES,'+json.dumps({'bkclose':['assets/g/'+nm]},separators=(',',':'))+');')
