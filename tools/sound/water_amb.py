#!/usr/bin/env python3
"""池・温泉のそばの音（pond・onsen）：持ち主が、ききくらべのページでえらんだ形（池は N3、温泉は O1）。
- 池：凪いだ水面。川の岸の波の録音（OpenGameArt「Sea and River Wave Sounds」VistulaShort.mp3、CC0）の、しずかな所（73秒から）を、
  こもらせて（ローパス320Hz）、波の大きい・小さいをならし、遠くのカエルの声（OpenGameArt「Ribbit Frog Sounds」ribbit_01/02・「Frog Croaks」croak_01、CC0。
  小さい所のノイズをけし、はじまり・おわりをなめらかに）を、8〜14秒に1回。40秒。
- 温泉：凪いだお湯に、かすかに流れこむ音。こもらせた波（ローパス450Hz）に、小川の録音（OpenGameArt「Park Ambiences」park_ambience_river.wav、CC0）を
  うんと小さく、こもらせて（ローパス700Hz）まぜる。20秒。
どちらも、つなぎ目なくくりかえせる形（おわりを、はじめへ1.5秒でなめらかに）にし、ゲームの loopStart .06・loopEnd 長さ−.06 のために、前後に0.06秒ずつつづきをつける。
使いかた：python3 tools/sound/water_amb.py <VistulaShort.mp3> <park_ambience_river.wav> <ribbit_01.mp3> <ribbit_02.mp3> <croak_01.mp3>
  → assets/g/<中身のsha1の先10字>.mp3 と SAMPLES の行"""
import sys,os,hashlib,subprocess,json,numpy as np
SR=44100;OUT=os.path.join(os.path.dirname(__file__),'..','..','assets','g');F,P=1.5,.06
VIS,RIV=sys.argv[1],sys.argv[2];FROGF=sys.argv[3:6]
def load(f,ss=0,t=None,af=None):
  c=['ffmpeg','-v','quiet','-ss',str(ss)]+(['-t',str(t)] if t else [])+['-i',f,'-ac','1','-ar',str(SR)]+(['-af',af] if af else [])+['-f','f32le','-']
  return np.frombuffer(subprocess.run(c,capture_output=True,check=True).stdout,np.float32).astype(np.float64)
rms=lambda x:np.sqrt((x**2).mean())
def nagi(lp,k,L):
  a=load(VIS,72,L+F+2,f'highpass=f=60,lowpass=f={lp},lowpass=f={lp}')
  e=np.sqrt(np.convolve(a**2,np.ones(SR)/SR,'same'))+1e-6;a=a/(e**k)  # 波の大きい・小さいをならす
  a=a[SR:SR+int((L+F)*SR)];return a/rms(a)
def clean(a):
  e=np.sqrt(np.convolve(a**2,np.ones(441)/441,'same'));th=e.max()*10**(-30/20)
  g=np.clip((e-th)/(th*2),0,1);g=np.convolve(g,np.hanning(883)/np.hanning(883).sum(),'same');a=a*g
  nz=np.flatnonzero(g>.01);a=a[max(0,nz[0]-200):nz[-1]+200];f=int(.03*SR);a[:f]*=np.linspace(0,1,f);a[-f:]*=np.linspace(1,0,f)
  return a/np.abs(a).max()
def loop(a,L):
  n,f=int(L*SR),int(F*SR);x=a[:n].copy();u=np.linspace(0,1,f)
  x[:f]=a[n:n+f]*np.cos(u*np.pi/2)+a[:f]*np.sin(u*np.pi/2)
  p=int(P*SR);x=np.concatenate([x[-p:],x,x[:p]]);x=x*(10**(-34/20)/rms(x))
  assert np.abs(x).max()<1;return x
def mp3(k,x):
  b=subprocess.run(['ffmpeg','-v','quiet','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-codec:a','libmp3lame','-b:a','96k','-f','mp3','-'],input=x.astype(np.float32).tobytes(),capture_output=True,check=True).stdout
  n=hashlib.sha1(b).hexdigest()[:10]+'.mp3';open(os.path.join(OUT,n),'wb').write(b);return 'assets/g/'+n
# 池
L=40;w=nagi(320,.8,L)*.5;fr=[clean(load(f,af='highpass=f=200,lowpass=f=1400')) for f in FROGF]
rng=np.random.default_rng(6);t=F+rng.uniform(1,6)
while t<L-2:
  o=fr[rng.integers(3)];i=int(t*SR);w[i:i+len(o)]+=o*rms(w)/.5*1.4*rng.uniform(.7,1);t+=rng.uniform(8,14)  # カエル：水の音（半分にする前）の1.4倍
pond=mp3('pond',loop(w,L))
# 温泉
L=20;w=nagi(450,.6,L);r=load(RIV,100,L+F,'highpass=f=150,lowpass=f=700,lowpass=f=700');r=r/rms(r)
onsen=mp3('onsen',loop(w+r*.3,L))
print('Object.assign(SAMPLES,'+json.dumps({'pond':[pond],'onsen':[onsen]},separators=(',',':'))+');')
