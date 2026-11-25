#!/usr/bin/env python3
"""つりの音（うきが落ちる・魚がつつく・うきがしずむ・にげられた）。音は作らない（本物の録音を切って、大きさをそろえるだけ）。
候補（CAND）を作って聞きくらべのページにのせ、持ち主がえらんだ物を PICK に書いて、ゲームの音にする。
もとの録音（どれも CC0。freesound のページで CC0 をたしかめた。おとすのは freesound の試聴の mp3）：
- small splash / ssierra1202  https://freesound.org/people/ssierra1202/sounds/391948/
- small splash on water / ssierra1202  https://freesound.org/people/ssierra1202/sounds/391966/
- Splash / swordofkings128  https://freesound.org/people/swordofkings128/sounds/398032/
- water drop 1.aif / beskhu  https://freesound.org/people/beskhu/sounds/273870/
- water drop 3.aif / beskhu  https://freesound.org/people/beskhu/sounds/273868/
- Water drop / Splash / bxyorna  https://freesound.org/people/bxyorna/sounds/410335/
- Fish Splashing Pond.wav / kylecutsfilms  https://freesound.org/people/kylecutsfilms/sounds/443380/
- Water Drop Sound.wav / metaepitome  https://freesound.org/people/metaepitome/sounds/165206/
- Rock In Water Splash-Plop 3.aif / jc144940  https://freesound.org/people/jc144940/sounds/178732/
- Single Water Drop / paespedro  https://freesound.org/people/paespedro/sounds/174718/
- Water Drip 01.wav / erkanozan  https://freesound.org/people/erkanozan/sounds/51754/
- cartoon pop or drip / AlaskaRobotics  https://freesound.org/people/AlaskaRobotics/sounds/221091/
やること：モノ・60Hzより下をけずる → 切る（出だし4ms・おわり40%をなめらかに）→ 速さ（高さ）→ 約 -20 LUFS（ピークは -1.5 dBFS まで）。
使いかた：python3 tools/sound/fish_rec.py cand <フォルダ>  → 候補の mp3 をフォルダに
          python3 tools/sound/fish_rec.py                → PICK の音を assets/g に作り、js/audio.js にはる SAMPLES の行を出す"""
import os, sys, hashlib, subprocess, tempfile, urllib.request
D = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(D, '..', '..', 'assets', 'g')
SRC = {'391948': '391948_6450069', '391966': '391966_6450069', '398032': '398032_7586736', '273870': '273870_1031833',
       '273868': '273868_1031833', '410335': '410335_7963426', '443380': '443380_4089273', '165206': '165206_1053041',
       '178732': '178732_2596329', '174718': '174718_1850811', '51754': '51754_616218', '221091': '221091_1282865'}
# 名前: [(もと, はじめ秒, 長さ秒, 速さ), …]（A・B・C）
CAND = {'fishplop': [('178732', 0.0, 0.45, 1.0), ('174718', 0.0, 0.45, 1.0), ('174718', 0.0, 0.47, 0.8)],   # うきが水に落ちる「ぽちゃん」（1回めの 391948・273870・410335 は持ち主が「だめ」）
        'fishnib':  [('51754', 0.0, 0.29, 1.0), ('221091', 0.0, 0.14, 1.0), ('174718', 0.0, 0.22, 1.4)],    # 魚がつつく「ちょん」（1回めの 165206・273870・273868 は「だめ」）
        'fishbig':  [('398032', 0.0, 0.70, 1.0), ('391966', 0.15, 0.75, 1.0), ('410335', 0.0, 1.00, 0.85)],  # うきがしずむ「ずぼっ」
        'fishesc':  [('443380', 0.55, 0.85, 1.0), ('443380', 1.50, 0.80, 1.0), ('398032', 0.10, 0.90, 1.15)]}  # にげられた「バシャッ」
PICK = {'fishbig': 0, 'fishesc': 2, 'fishplop': 1, 'fishnib': 1}   # 持ち主がえらんだ物：名前 → 0・1・2
def run(a):
  r = subprocess.run(a, capture_output=True, text=True)
  if r.returncode: print(r.stderr[-1500:]); sys.exit(1)
def src(k, tmp):
  p = os.path.join(tmp, k+'.mp3')
  if not os.path.exists(p):
    u = SRC[k]; urllib.request.urlretrieve('https://cdn.freesound.org/previews/%s/%s-hq.mp3' % (int(k)//1000, u), p)
  return p
def make(c, out, tmp):
  k, s, d, sp = c; fo = d*0.4
  af = 'highpass=f=60,afade=t=in:d=0.004,afade=t=out:st=%.3f:d=%.3f' % (d-fo, fo)
  if sp != 1.0: af += ',asetrate=44100*%.3f,aresample=44100' % sp
  af += ',loudnorm=I=-20:TP=-1.5:LRA=7'
  run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(s), '-t', str(d), '-i', src(k, tmp), '-ac', '1', '-ar', '44100', '-af', af, '-b:a', '96k', out])
if __name__ == '__main__':
  tmp = tempfile.mkdtemp()
  if len(sys.argv) > 2 and sys.argv[1] == 'cand':
    os.makedirs(sys.argv[2], exist_ok=True)
    for n, L in CAND.items():
      if n in PICK: continue
      for i, c in enumerate(L): make(c, os.path.join(sys.argv[2], '%s_%s.mp3' % (n, 'ABC'[i])), tmp)
    sys.exit()
  for n, i in PICK.items():
    p = os.path.join(tmp, n+'.mp3'); make(CAND[n][i], p, tmp); b = open(p, 'rb').read(); h = hashlib.sha1(b).hexdigest()[:10]
    open(os.path.join(OUT, h+'.mp3'), 'wb').write(b); print('"%s":["assets/g/%s.mp3"],' % (n, h))
