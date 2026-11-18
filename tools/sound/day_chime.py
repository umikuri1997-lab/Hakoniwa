#!/usr/bin/env python3
"""朝6時・夜12時に鳴らす短い音（ARK の日の出・日の入りのように。持ち主がききくらべのページでえらんだ、作った音）。
  dawn：やわらかい和音がふくらむ（ドミソ→ファラド→ドミソ）に、上へのぼる小さなベル（4.2秒）
  midnight：ひくい短調の和音がゆっくり（ラドミラ）に、遠い鐘を3回（4.5秒）
使いかた：python3 tools/sound/day_chime.py  → assets/g/<中身のsha1の先10字>.mp3 と、js/audio.js にはる SAMPLES の行を出す。"""
import os,hashlib,subprocess,json,numpy as np
SR=44100;OUT=os.path.join(os.path.dirname(__file__),'..','..','assets','g')
def env(n,a,d):t=np.arange(n)/SR;return np.minimum(1,t/a)*np.exp(-t/d)
def tone(f,dur,a,d,h):
  t=np.arange(int(dur*SR))/SR;return sum(w*np.sin(2*np.pi*f*(k+1)*t) for k,w in enumerate(h))*env(len(t),a,d)
def put(o,at,s,g=1):i=int(at*SR);m=min(len(s),len(o)-i);o[i:i+m]+=s[:m]*g
def dawn():
  o=np.zeros(int(4.2*SR))
  for at,ch in ((0,(261.6,329.6,392,523.3)),(1.2,(349.2,440,523.3,698.5)),(2.4,(261.6,329.6,392,659.3))):
    for f in ch:put(o,at,tone(f,1.8,.45,.9,(1,.15,.05)),.25)
  for at,f in ((.3,1046.5),(.7,1318.5),(1.1,1568),(2.5,2093)):put(o,at,tone(f,1.2,.003,.4,(1,.1)),.3)
  return o
def midnight():
  o=np.zeros(int(4.5*SR))
  for f in (110,130.8,164.8,220):put(o,0,tone(f,4,.8,1.6,(1,.25,.1)),.3)
  for at in (.2,1.7,3.2):put(o,at,tone(196,1.6,.004,.7,(1,.6,.35,.2)),.35)
  return o
res={}
for k,f in (('dawn',dawn),('midnight',midnight)):
  a=f();fo=int(.3*SR);a[-fo:]*=np.linspace(1,0,fo);a=a/np.abs(a).max()*.708
  b=subprocess.run(['ffmpeg','-v','quiet','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-codec:a','libmp3lame','-b:a','96k','-f','mp3','-'],input=a.astype(np.float32).tobytes(),capture_output=True,check=True).stdout
  n=hashlib.sha1(b).hexdigest()[:10]+'.mp3';open(os.path.join(OUT,n),'wb').write(b);res[k]=['assets/g/'+n]
print('Object.assign(SAMPLES,'+json.dumps(res,separators=(',',':'))+');')
