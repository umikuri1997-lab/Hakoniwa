#!/usr/bin/env python3
"""川・池のそばの音（stream）：本物の小川の録音（OpenGameArt「Park Ambiences」の park_ambience_river.wav、CC0）の、
鳥・カエルの声が入っていない所（342.5秒から20秒）を、つなぎ目なくくりかえせる形にする。
前は、ざーっというノイズからその場で作っていて、とてもうるさかった（feel.js の feelBuf）。
ゲームは loopStart .06・loopEnd 長さ−.06 でくりかえすので、前後に、つづきの音を0.06秒ずつつける。
使いかた：python3 tools/sound/stream_loop.py <park_ambience_river.wav>  → assets/g/<中身のsha1の先10字>.mp3 と SAMPLES の行"""
import sys,os,hashlib,subprocess,json,numpy as np
SR=44100;OUT=os.path.join(os.path.dirname(__file__),'..','..','assets','g')
T0,L,F,P=342.5,20.0,1.5,.06
a=np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-ss',str(T0),'-t',str(L+F+1),'-i',sys.argv[1],'-ac','1','-ar',str(SR),'-af','highpass=f=90,lowpass=f=9000','-f','f32le','-'],capture_output=True,check=True).stdout,np.float32).astype(np.float64)
n,f=int(L*SR),int(F*SR);x=a[:n].copy();u=np.linspace(0,1,f)
x[:f]=a[n:n+f]*np.cos(u*np.pi/2)+a[:f]*np.sin(u*np.pi/2)  # おわりのつづきから、はじめへ、なめらかにかわる
p=int(P*SR);x=np.concatenate([x[-p:],x,x[:p]])
x=x*(10**(-34/20)/np.sqrt((x**2).mean()))  # 大きさ：鳥の声の録音（-34.6dB）とそろえる
b=subprocess.run(['ffmpeg','-v','quiet','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-codec:a','libmp3lame','-b:a','96k','-f','mp3','-'],input=x.astype(np.float32).tobytes(),capture_output=True,check=True).stdout
n=hashlib.sha1(b).hexdigest()[:10]+'.mp3';open(os.path.join(OUT,n),'wb').write(b)
print('Object.assign(SAMPLES,'+json.dumps({'stream':['assets/g/'+n]},separators=(',',':'))+');')
