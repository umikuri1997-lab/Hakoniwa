#!/usr/bin/env python3
"""かみなりの音（thunder）：本物の録音（OpenGameArt「Rain + Long Thunder」rain-thunder.ogg、CC0）の、かみなりの所を切る。
長いゴロゴロ（20.3〜38秒）と、短い所（20.3〜27秒）の2つ。おわりを小さくして消す。切る・大きさをそろえるだけ。
使いかた：python3 tools/sound/thunder.py <rain-thunder.ogg>  → assets/g/<中身のsha1の先10字>.mp3 と SAMPLES の行"""
import sys,os,hashlib,subprocess,json,numpy as np
SR=44100;OUT=os.path.join(os.path.dirname(__file__),'..','..','assets','g')
a=np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',sys.argv[1],'-ac','1','-ar',str(SR),'-af','highpass=f=30','-f','f32le','-'],capture_output=True,check=True).stdout,np.float32).copy()
names=[]
for s,e,fo in[(20.3,38,6),(20.3,27,2.5)]:
  x=a[int(s*SR):int(e*SR)].copy();n=int(fo*SR);x[-n:]*=np.linspace(1,0,n)**2;x[:int(.05*SR)]*=np.linspace(0,1,int(.05*SR));x=x/np.abs(x).max()*.708
  b=subprocess.run(['ffmpeg','-v','quiet','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-codec:a','libmp3lame','-b:a','96k','-f','mp3','-'],input=x.astype(np.float32).tobytes(),capture_output=True,check=True).stdout
  nm=hashlib.sha1(b).hexdigest()[:10]+'.mp3';open(os.path.join(OUT,nm),'wb').write(b);names.append('assets/g/'+nm)
print('Object.assign(SAMPLES,'+json.dumps({'thunder':names},separators=(',',':'))+');')
