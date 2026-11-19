#!/usr/bin/env python3
"""持ち主がくれたハシゴの音・ちょうの羽音を、切る・大きさをそろえるだけで assets/g に書き出す（音は作らない）。
元：tools/sound/src/owner_creak.mp3（木材のきしみ 13秒、きしみが何回か）・owner_chou.mp3（ちょうの羽音 4.1秒、つづいた羽音）。
  creak：きしみのかたまり（-45dB より小さい間が0.1秒より長い所で分ける）ごとに、はじめから0.36秒まで（ハシゴは手をかけるたび π/8 秒ごとに鳴るので、つぎの音とかさならない長さ）。
         おわり0.1秒はなめらかに小さく。いちばん大きい所 -3.4dB（前のハシゴの音と同じ）→ SAMPLES.ladder
  chou ：0.4秒ずつ、音のいちばん大きい所をまん中に3こ（かさならない所）。いちばん大きい所 -3.4dB（前の cv_chou と同じ）→ SAMPLES.cv_chou
使いかた：python3 tools/sound/owner_ladder_chou.py   さいごに js/audio.js にはる SAMPLES の行を出す。"""
import os, hashlib, subprocess, tempfile, json, numpy as np
D = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(D, 'src'); OUT = os.path.join(D, '..', '..', 'assets', 'g')
SR = 44100
def load(n):
  with tempfile.TemporaryDirectory() as td:
    subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-i', os.path.join(SRC, n), '-ac', '1', '-ar', str(SR), '-f', 'f32le', td + '/a.raw'], check=True)
    return np.fromfile(td + '/a.raw', np.float32).astype(np.float64)
def db(v): return 10 ** (v / 20)
def fade(x, fi, fo):
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
x = load('owner_creak.mp3'); idx = np.nonzero(np.abs(x) > db(-45))[0]
cuts = np.nonzero(np.diff(idx) > int(.1 * SR))[0]
starts = [idx[0]] + [idx[c + 1] for c in cuts]
res['ladder'] = []
for s in starts:
  seg = x[max(0, s - int(.005 * SR)): s + int(.36 * SR)]
  if np.abs(seg).max() < db(-30): continue   # 小さすぎるかたまり（のこり音）はすてる
  res['ladder'].append(save(peak(fade(seg, .003, .1), -3.4)))
y = load('owner_chou.mp3'); L = int(.4 * SR); env = np.convolve(np.abs(y), np.ones(L) / L, 'same')
used = np.zeros(len(y), bool); res['cv_chou'] = []
for _ in range(3):
  e = np.where(used, -1, env); c = int(e.argmax()); a = max(0, c - L // 2); b = min(len(y), a + L)
  used[max(0, a - L // 2): b + L // 2] = True
  res['cv_chou'].append(save(peak(fade(y[a:b], .01, .1), -3.4)))
print('Object.assign(SAMPLES,' + json.dumps(res, separators=(',', ':')) + ');')
