#!/usr/bin/env python3
"""持ち主がくれた4つの音を、切る・大きさをそろえるだけで assets/g に書き出す（音は作らない）。
元：tools/sound/src/owner_bow.mp3（弓をひきしぼる 1.0秒）・owner_water.mp3（水やり 20.6秒）・owner_till.mp3（畑づくり 6.4秒、くわが土にささる音が8回）・owner_kira.mp3（キラッ 2.0秒）。
やること：モノにする → 前後の無音を切る → 出だし・終わりをなめらかに（ごく短く）→ 大きさをそろえる。
  bow  ：いちばん大きい所 -3.4dB（いまの bowdraw と同じ）→ SAMPLES.bowdraw
  kira ：いちばん大きい所 -3.4dB → SAMPLES.starkira
  till ：音のかたまり（-40dB より小さい間で分ける）ごとに1回ぶんずつ切る（8こ）。いちばん大きい所 -3.4dB（いまの tsoil と同じ）→ SAMPLES.tillhit
  water：前後0.3秒を切り、いちばん大きい所 -1dB（平均は -31dB くらい。いまの trickle の -22.7dB との差は、js/audio.js の pourl の大きさでそろえる） → SAMPLES.pourw（js/audio.js の pourl が、重ねてつづける）
使いかた：python3 tools/sound/owner_sfx4.py   さいごに js/audio.js にはる SAMPLES の行を出す。"""
import os, hashlib, subprocess, tempfile, json, numpy as np
D = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(D, 'src'); OUT = os.path.join(D, '..', '..', 'assets', 'g')
SR = 44100
def load(n):
  with tempfile.TemporaryDirectory() as td:
    subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-i', os.path.join(SRC, n), '-ac', '1', '-ar', str(SR), '-f', 'f32le', td + '/a.raw'], check=True)
    return np.fromfile(td + '/a.raw', np.float32).astype(np.float64)
def db(v): return 10 ** (v / 20)
def trim(x, th=-45, pad=.01):
  a = np.abs(x); i = np.nonzero(a > db(th))[0]
  return x[max(0, i[0] - int(pad * SR)): i[-1] + int(pad * SR) + 1]
def fade(x, fi=.004, fo=.02):
  x = x.copy(); n = int(fi * SR); m = int(fo * SR)
  x[:n] *= np.linspace(0, 1, n); x[-m:] *= np.linspace(1, 0, m); return x
def peak(x, d): return x * (db(d) / np.abs(x).max())
def save(x, br=96):
  with tempfile.TemporaryDirectory() as td:
    x.astype(np.float32).tofile(td + '/b.raw')
    subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', td + '/b.raw', '-codec:a', 'libmp3lame', '-b:a', '%dk' % br, td + '/b.mp3'], check=True)
    b = open(td + '/b.mp3', 'rb').read()
  name = hashlib.sha1(b).hexdigest()[:10] + '.mp3'; open(os.path.join(OUT, name), 'wb').write(b); return 'assets/g/' + name
res = {}
res['bowdraw'] = [save(peak(fade(trim(load('owner_bow.mp3'))), -3.4))]
res['starkira'] = [save(peak(fade(trim(load('owner_kira.mp3')), .004, .05), -3.4))]
x = load('owner_till.mp3'); a = np.abs(x) > db(-40)
# 小さい間（0.12秒より長い）で分けて、音のかたまりごとに切る
idx = np.nonzero(a)[0]; cuts = np.nonzero(np.diff(idx) > int(.12 * SR))[0]
starts = [idx[0]] + [idx[c + 1] for c in cuts]; ends = [idx[c] for c in cuts] + [idx[-1]]
res['tillhit'] = []
for s, e in zip(starts, ends):
  seg = x[max(0, s - int(.01 * SR)): e + int(.04 * SR)]
  if len(seg) < .08 * SR: continue
  res['tillhit'].append(save(peak(fade(seg, .003, .03), -3.4)))
w = load('owner_water.mp3'); w = w[int(.3 * SR): -int(.3 * SR)]
w = peak(w, -1)   # 一瞬だけ大きい所があるので、平均でそろえると音われする。いちばん大きい所 -1dB（いまの水の音との大きさの差は、鳴らす大きさ POURV でそろえる）
print('pourw 平均', round(20 * np.log10(np.sqrt((w ** 2).mean())), 1), 'dB（いまの trickle は -22.7dB）')
res['pourw'] = [save(w, 80)]
print('Object.assign(SAMPLES,' + json.dumps(res, separators=(',', ':')) + ');')
