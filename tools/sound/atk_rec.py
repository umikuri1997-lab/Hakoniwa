#!/usr/bin/env python3
"""せいれいの属性の攻撃の音（atk_earth・atk_wood・atk_wind・atk_water。持ち主が「攻撃とハンコの音」のページでえらんだ e1・w3・k1・s3）。
出どころ（どれも CC0）：e1 OpenGameArt「Moving Boulder」themightyglider（boulder_drop_0）・w3「20 Rustles of dry leaves」qubodup（rustle10）・
  k1「Swishes Sound Pack」artisticdude（swish-9）・s3「40 CC0 water / splash / slime SFX」rubberduck（splash_12）。
おとした物はリポジトリに入れない。使いかた：python3 tools/sound/atk_rec.py <おとしたフォルダ> → <フォルダ>/cut/<記号>.mp3（assets/g へは、中身の sha1 の先10字の名前でうつす）"""
import sys,os,subprocess,numpy as np
A=sys.argv[1]; OUT=os.path.join(A,'cut'); os.makedirs(OUT,exist_ok=True)
C=[ # 記号, ファイル, hp, lp, 長さ, opts
 ('e1','oga_boulder/boulder_drop_0.ogg',40,8000,.60,{}),
 ('w3','oga_rustle/rustle/rustle10.flac',250,10000,.40,{}),
 ('k1','oga_swishes/swishes/swish-9.wav',200,10000,.20,{}),
 ('s3','oga_water40/splash_12.ogg',150,10000,.30,{}),
]
for k,f,hp,lp,dur,o in C:
  raw=subprocess.run(['ffmpeg','-v','quiet','-i',os.path.join(A,f),'-ac','1','-ar','44100','-af',f'highpass=f={hp},lowpass=f={lp}','-f','f32le','-'],capture_output=True).stdout
  a=np.frombuffer(raw,np.float32).copy()
  env=np.convolve(np.abs(a),np.ones(441)/441,'same')
  i=int(np.argmax(env>env.max()*(.5 if o.get('peak') else .03)))
  i=max(0,i-int(.012*44100)+int(o.get('sk',0)*44100)); x=a[i:i+int(dur*44100)]
  fi=int(o.get('att',.002)*44100); fo=min(len(x),int(min(.08,dur*.3)*44100))
  x[:fi]*=np.linspace(0,1,fi)**2; x[-fo:]*=np.linspace(1,0,fo)
  x=x/(np.abs(x).max()+1e-9)*0.708
  b=subprocess.run(['ffmpeg','-v','quiet','-f','f32le','-ar','44100','-ac','1','-i','-','-codec:a','libmp3lame','-b:a','128k','-f','mp3','-'],input=x.tobytes(),capture_output=True).stdout
  open(os.path.join(OUT,k+'.mp3'),'wb').write(b); print(k,len(x)/44100,len(b))
