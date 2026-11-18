#!/usr/bin/env python3
"""箱にしまう・箱から取るあいだ、つなげて鳴らすゴソゴソの音を作る（持ち主がくれた音 tools/sound/src/gosogoso.mp3 から）。
やること：前後の無音を切る → 低いゴロゴロ・高い音をけずる → おわりの XF 秒を、はじめにまぜて、つなぎ目のない1まわり（L）にする
 → 大きさをそろえる（いちばん大きい所 -3dB）→ L を3つならべて mp3 に（mp3 のはじめ・おわりのすきまをさけ、まん中の L をくりかえす）。
さいごに、js/audio.js の SAMPLES にはる行と、1まわりの長さ（秒、work-fx.js の BOXLOOPL）を出す。
使いかた：python3 tools/sound/gosogoso_loop.py"""
import os, hashlib, subprocess, tempfile, json, numpy as np
D = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(D, 'src', 'gosogoso.mp3'); OUT = os.path.join(D, '..', '..', 'assets', 'g')
SR, XF = 44100, .15
with tempfile.TemporaryDirectory() as td:
  w = td + '/a.raw'
  af = 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,highpass=f=150,lowpass=f=9000'
  subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-i', SRC, '-ac', '1', '-ar', str(SR), '-af', af, '-f', 'f32le', w], check=True)
  x = np.fromfile(w, np.float32).astype(np.float64)
n = int(XF * SR); L = x[:len(x) - n].copy()
a = np.linspace(0, 1, n)
L[:n] = x[:n] * np.sqrt(a) + x[len(x) - n:] * np.sqrt(1 - a)   # おわりを、はじめにまぜる（音の大きさがへこまない形）
L *= 10 ** (-3 / 20) / np.abs(L).max()
y = np.tile(L, 3).astype(np.float32)
with tempfile.TemporaryDirectory() as td:
  y.tofile(td + '/b.raw')
  subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', td + '/b.raw', '-codec:a', 'libmp3lame', '-b:a', '128k', td + '/b.mp3'], check=True)
  b = open(td + '/b.mp3', 'rb').read()
name = hashlib.sha1(b).hexdigest()[:10] + '.mp3'
open(os.path.join(OUT, name), 'wb').write(b)
print('Object.assign(SAMPLES,' + json.dumps({'goso': ['assets/g/' + name]}) + ');')
print('BOXLOOPL=%.4f' % (len(L) / SR))
