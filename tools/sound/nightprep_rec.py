#!/usr/bin/env python3
"""「今夜のそなえ」のポップアップが出るときの音（ボタンの「ポチ」の0.08秒あとに鳴らす。持ち主が聞きくらべの8つの候補からえらんだ）。音は作らない（録音を切って、大きさをそろえるだけ）。
- nppage：紙をめくる「ぱさっ」（0.08秒から0.9秒ぶん。おわり0.3秒で消える）
もとの録音（CC0。freesound のページで CC0 をたしかめた。おとすのは freesound の試聴の mp3）：
- Page Turn / davidbain  https://freesound.org/people/davidbain/sounds/136778/
やること：モノ・60Hzより下をけずる → 切る（出だし4ms）→ おわりを消えるように → 約 -20 LUFS（ピークは -1.5 dBFS まで）。
使いかた：python3 tools/sound/nightprep_rec.py   さいごに js/audio.js にはる SAMPLES の行を出す。"""
import os, re, sys, json, hashlib, subprocess, tempfile, urllib.request
D = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(D, '..', '..', 'assets', 'g')
URL = {'page': 'https://cdn.freesound.org/previews/136/136778_2207512-hq.mp3'}
RECIPE = {'nppage': ('page', .08, .9, .3)}  # 名前：(録音, はじめ, 長さ, おわりの消える秒)
def run(a):
  r = subprocess.run(a, capture_output=True, text=True)
  if r.returncode: print(r.stderr[-1500:]); sys.exit(1)
  return r.stderr
res = {}
with tempfile.TemporaryDirectory() as td:
  for k, u in URL.items(): urllib.request.urlretrieve(u, os.path.join(td, k + '.mp3'))
  for name, (f, ss, du, fo) in RECIPE.items():
    w = os.path.join(td, name + '.wav')
    run(['ffmpeg', '-v', 'error', '-y', '-ss', str(ss), '-t', str(du), '-i', os.path.join(td, f + '.mp3'),
         '-af', 'highpass=f=60,afade=t=in:d=0.004,afade=t=out:st=%f:d=%f' % (du - fo, fo), '-ac', '1', '-ar', '44100', w])
    e = run(['ffmpeg', '-hide_banner', '-i', w, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', e)[-1]); pk = float(re.findall(r'Peak:\s+(-?[\d.inf]+) dBFS', e)[-1])
    g = min(-20 - I, -1.5 - pk)
    m = os.path.join(td, name + '.mp3')  # ファイルに書く（パイプに書くと長さがかわる）
    run(['ffmpeg', '-v', 'error', '-y', '-i', w, '-af', 'volume=%fdB' % g, '-codec:a', 'libmp3lame', '-b:a', '96k', m])
    b = open(m, 'rb').read(); fn = hashlib.sha1(b).hexdigest()[:10] + '.mp3'
    open(os.path.join(OUT, fn), 'wb').write(b); res[name] = ['assets/g/' + fn]
    print(name, '%.1f LUFS → %.1f' % (I, I + g))
print('Object.assign(SAMPLES,' + json.dumps(res, separators=(',', ':')) + ');')
