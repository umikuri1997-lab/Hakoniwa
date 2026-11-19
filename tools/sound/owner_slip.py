#!/usr/bin/env python3
"""すべる音：持ち主がくれた効果音ラボの音（tools/sound/src/owner_slip.mp3、6.3秒。0.25秒くらいの「シャッ」が19回ならぶ）から、
5.52秒と5.78秒の2回ぶんを切り出して、つづけた1つの音にする（持ち主がえらんだ「2回つづけて」）。音は作らない（切る・大きさをそろえるだけ）。
やること：モノにする → 1回めは 5.508秒から0.24秒、2回めは 5.768秒から つぎの音の前（6.025秒）まで → 2回めのうしろの -50dB より小さい所を切る
 → 出だし3ms・終わり30msをなめらかに → それぞれ、いちばん大きい所 -3.4dB → つなぐ。
使いかた：python3 tools/sound/owner_slip.py   さいごに js/audio.js にはる SAMPLES の行を出す。"""
import os, hashlib, subprocess, tempfile, json, numpy as np
D = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(D, 'src', 'owner_slip.mp3'); OUT = os.path.join(D, '..', '..', 'assets', 'g')
SR = 44100
def db(v): return 10 ** (v / 20)
with tempfile.TemporaryDirectory() as td:
  subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-i', SRC, '-ac', '1', '-ar', str(SR), '-f', 'f32le', td + '/a.raw'], check=True)
  x = np.fromfile(td + '/a.raw', np.float32).astype(np.float64)
def cut(s, e, tail=False):
  y = x[int(s * SR): int(e * SR)].copy()
  if tail:
    a = np.nonzero(np.abs(y) > db(-50))[0]; y = y[: a[-1] + int(.01 * SR)]
  n = int(.003 * SR); m = int(.03 * SR)
  y[:n] *= np.linspace(0, 1, n); y[-m:] *= np.linspace(1, 0, m)
  return y * (db(-3.4) / np.abs(y).max())
y = np.concatenate([cut(5.508, 5.748), cut(5.768, 6.025, True)])
with tempfile.TemporaryDirectory() as td:
  y.astype(np.float32).tofile(td + '/b.raw')
  subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', td + '/b.raw', '-codec:a', 'libmp3lame', '-b:a', '96k', td + '/b.mp3'], check=True)
  b = open(td + '/b.mp3', 'rb').read()
name = hashlib.sha1(b).hexdigest()[:10] + '.mp3'; open(os.path.join(OUT, name), 'wb').write(b)
print('長さ', round(len(y) / SR, 3), '秒')
print('Object.assign(SAMPLES,' + json.dumps({'slip': ['assets/g/' + name]}, separators=(',', ':')) + ');')
