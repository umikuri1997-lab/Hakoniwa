#!/usr/bin/env python3
"""洞窟の音（cavedrip・caveamb）：どちらも本物の録音を、切る・はじめとおわりをなめらかにする・大きさをそろえるだけ（音は作らない）。
- cavedrip：水のしずくが1つ落ちる音を6こ。OpenGameArt「Dripping water loop」atmosbasement.mp3_.flac
  （作者 Independent.nu、のせた人 qubodup、CC0、https://opengameart.org/content/dripping-water-loop ）の20秒の中から、
  ほかのしずくとかさならない6つ（DRIPS の秒）を、ひびきののこりごと切る。山を−3dBに。
- caveamb：洞窟の空気の音（ひくい風・遠くのしずく）。OpenGameArt「Loopable Dungeon Ambience」dungeon_ambient_1.ogg
  （作者 JaggedStone、CC0、https://opengameart.org/content/loopable-dungeon-ambience ）の43秒からの16秒。
  つなぎ目なくくりかえせる形（おわりを、はじめへ2秒でなめらかに）にし、ゲームの loopStart .06・loopEnd 長さ−.06 のために、
  前後に0.06秒ずつつづきをつける（water_amb.py と同じ）。平均の大きさ−26dB。
もとのファイルは tools/sound/src/cave/（どちらも3MBより小さいので、そのまま）。
使いかた：python3 tools/sound/cave_amb.py  → assets/g/<中身のsha1の先10字>.mp3 と SAMPLES の行"""
import os,hashlib,subprocess,json,numpy as np
SR=44100;D=os.path.dirname(os.path.abspath(__file__));OUT=os.path.join(D,'..','..','assets','g');SRC=os.path.join(D,'src','cave')
DRIPF=os.path.join(SRC,'atmosbasement.flac');AMBF=os.path.join(SRC,'dungeon_ambient_1.ogg')
DRIPS=[(2.704,.85),(5.562,.8),(8.461,.75),(9.568,.9),(15.629,.9),(17.570,.5)]  # しずくのはじまりの秒・長さ
A0,L,F,P=43,16,2,.06  # 空気の音：はじまりの秒・長さ・なめらかにつなぐ秒・前後のつづき
def load(f,af=None):
  c=['ffmpeg','-v','quiet','-i',f,'-ac','1','-ar',str(SR)]+(['-af',af] if af else [])+['-f','f32le','-']
  return np.frombuffer(subprocess.run(c,capture_output=True,check=True).stdout,np.float32).astype(np.float64)
rms=lambda x:np.sqrt((x**2).mean())
def mp3(x,br):
  b=subprocess.run(['ffmpeg','-v','quiet','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-codec:a','libmp3lame','-b:a',br,'-f','mp3','-'],input=x.astype(np.float32).tobytes(),capture_output=True,check=True).stdout
  n=hashlib.sha1(b).hexdigest()[:10]+'.mp3';open(os.path.join(OUT,n),'wb').write(b);return 'assets/g/'+n
# しずく
a=load(DRIPF,'highpass=f=80');drips=[]
for t,d in DRIPS:
  i=int((t-.02)*SR);w=a[i:i+int(.06*SR)];i+=int(np.flatnonzero(np.abs(w)>np.abs(w).max()*.1)[0])-int(.004*SR)  # しずくが当たる所の4ms前から
  x=a[i:i+int(d*SR)].copy();n=int(.003*SR);x[:n]*=np.linspace(0,1,n);n=int(d*.6*SR);x[-n:]*=np.linspace(1,0,n)**2
  drips.append(mp3(x/np.abs(x).max()*.708,'96k'))
# 空気の音
a=load(AMBF,'highpass=f=30');a=a[int(A0*SR):]
n,f=int(L*SR),int(F*SR);x=a[:n].copy();u=np.linspace(0,1,f)
x[:f]=a[n:n+f]*np.cos(u*np.pi/2)+a[:f]*np.sin(u*np.pi/2)
p=int(P*SR);x=np.concatenate([x[-p:],x,x[:p]]);x=x*(10**(-26/20)/rms(x))
assert np.abs(x).max()<1,np.abs(x).max()
amb=mp3(x,'96k')
print('Object.assign(SAMPLES,'+json.dumps({'cavedrip':drips,'caveamb':[amb]},separators=(',',':'))+');')
