#!/usr/bin/env python3
"""のばした声（vowel）：会話の声（SAMPLES.voice、assets/g/fc5ad15d4b.mp3）の、母音が同じ高さでつづく所（0.13〜0.19秒、約580Hz）を、
声の1周期ずつ切って、行ったり来たりしながら重ねてならべ（PSOLA）、高さのかわらない2秒の「あー」にした音。
体そうの曲・鼻歌で、1つの音の中が粒でゆれないように、1つの音を、この音1本で鳴らす（audio.js の vNote）。切ってならべるだけで、高さ・音色は録音のまま。
使いかた：python3 tools/sound/voice_vowel.py  → assets/g/<中身のsha1の先10字>.mp3 と SAMPLES の行"""
import os,hashlib,subprocess,json,sys,numpy as np
SR=44100;D=os.path.join(os.path.dirname(__file__),'..','..');SRC=os.path.join(D,'assets','g','fc5ad15d4b.mp3')
a=np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',SRC,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout,np.float32).astype(np.float64)
s0,s1=int(.13*SR),int(.19*SR);seg=a[s0:s1]
c=np.correlate(seg,seg,'full')[len(seg)-1:];lo,hi=SR//700,SR//450;P=lo+int(np.argmax(c[lo:hi]))
# 周期の印：いちばん大きい山から P ごと（山にそろえなおす）
m=[s0+int(np.argmax(a[s0:s0+P]))]
while m[-1]+P*2<s1:
  g=m[-1]+P;m.append(g-P//6+int(np.argmax(a[g-P//6:g+P//6])))
N=int(2.0*SR/P);out=np.zeros(N*P+2*P);win=np.hanning(2*P)
seq=list(range(1,len(m)-1));seq=seq+seq[-2:0:-1]
for k in range(N):
  i=m[seq[k%len(seq)]];out[k*P:k*P+2*P]+=a[i-P:i+P]*win
out=out[P:N*P];X=int(.01*SR);out[:X]*=np.linspace(0,1,X);out[-X:]*=np.linspace(1,0,X)
out=out/np.abs(out).max()*.7
b=subprocess.run(['ffmpeg','-v','quiet','-f','f64le','-ar',str(SR),'-ac','1','-i','-','-codec:a','libmp3lame','-b:a','128k','-f','mp3','-'],input=out.tobytes(),capture_output=True,check=True).stdout
nm=hashlib.sha1(b).hexdigest()[:10]+'.mp3';open(os.path.join(D,'assets','g',nm),'wb').write(b)
print('pitch',round(SR/P),'marks',len(m),file=sys.stderr)
print('Object.assign(SAMPLES,'+json.dumps({'vowel':['assets/g/'+nm]},separators=(',',':'))+');')
