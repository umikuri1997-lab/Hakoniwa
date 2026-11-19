#!/usr/bin/env python3
"""焚き火のパチパチ（firecrk）：持ち主がくれた焚き火の音（tools/sound/src/owner_fire.mp3、7.4秒）を、そのまま使う。
くりかえしてもつながるよう、おわりの0.15秒を、はじめにまぜて重ねる（切る・大きさをそろえるだけ）。焚き火・たいまつのそばの場所の音（feel.js）と、料理の音（cookfire）。
使いかた：python3 tools/sound/owner_fire.py  → assets/g/<中身のsha1の先10字>.mp3 と SAMPLES の行"""
import os,hashlib,subprocess,json,numpy as np
SR=44100;D=os.path.join(os.path.dirname(__file__),'..','..');SRC=os.path.join(os.path.dirname(__file__),'src','owner_fire.mp3')
a=np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',SRC,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout,np.float32).copy()
X=int(.15*SR);u=np.linspace(0,1,X);head=a[:X]*u+a[-X:]*(1-u);a=np.concatenate([head,a[X:-X]])
a=a/np.abs(a).max()*.8
b=subprocess.run(['ffmpeg','-v','quiet','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-codec:a','libmp3lame','-b:a','128k','-f','mp3','-'],input=a.astype(np.float32).tobytes(),capture_output=True,check=True).stdout
nm=hashlib.sha1(b).hexdigest()[:10]+'.mp3';open(os.path.join(D,'assets','g',nm),'wb').write(b)
print('Object.assign(SAMPLES,'+json.dumps({'firecrk':['assets/g/'+nm]},separators=(',',':'))+');')
