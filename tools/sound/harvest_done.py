#!/usr/bin/env python3
"""しゅうかくしおわった音（harvdone）：かれ葉がこすれる本物の録音（OpenGameArt qubodup「20 Rustles of dry leaves」CC0 の、まとめた録音 montageAudio-20120408@143301.mp3）の、3つめの音のかたまりを0.35秒。
とっているあいだのガサゴソ（bush）のあとに鳴らす（持ち主が、ききくらべのページでえらんだ）。
使いかた：python3 tools/sound/harvest_done.py <montageAudio の mp3>  → assets/g/<中身のsha1の先10字>.mp3 と SAMPLES の行"""
import sys,os,hashlib,subprocess,json,numpy as np
SR=44100;OUT=os.path.join(os.path.dirname(__file__),'..','..','assets','g')
a=np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',sys.argv[1],'-ac','1','-ar','44100','-af','highpass=f=300,lowpass=f=10000','-f','f32le','-'],capture_output=True,check=True).stdout,np.float32).copy()
e=np.convolve(np.abs(a),np.ones(2205)/2205,'same');on=e>e.max()*.08;st=np.flatnonzero(on[1:]&~on[:-1]);x=a[st[2]:]
e=np.convolve(np.abs(x),np.ones(220)/220,'same');i=max(0,int(np.argmax(e>e.max()*.05))-int(.01*SR));x=x[i:i+int(.35*SR)].copy()
fo=int(.04*SR);x[-fo:]*=np.linspace(1,0,fo);x[:88]*=np.linspace(0,1,88);x=x/np.abs(x).max()*.708
b=subprocess.run(['ffmpeg','-v','quiet','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-codec:a','libmp3lame','-b:a','128k','-f','mp3','-'],input=x.astype(np.float32).tobytes(),capture_output=True,check=True).stdout
n=hashlib.sha1(b).hexdigest()[:10]+'.mp3';open(os.path.join(OUT,n),'wb').write(b)
print('Object.assign(SAMPLES,'+json.dumps({'harvdone':['assets/g/'+n]},separators=(',',':'))+');')
