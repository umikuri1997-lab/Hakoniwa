#!/usr/bin/env python3
"""持ち主がくれた「もやもや」の音（tools/sound/src/owner_moya.mp3：「もやん」が尻上がりに何回もつづく声）を、
尻上がりにしないで、ゆっくりの「もやん」にする（持ち主のたのみ）。音は作らない：もらった録音の高さと速さだけをかえる。
やること：声のかたまり（1つずつ尻上がりの「も」「やん」）を大きさのへこみで分け、2つずつで「もやん」1回ぶんにする→ その中の高さ（f0）を10ミリ秒ごとにはかる →
  ffmpeg の rubberband で、高さを「も」は平ら・「やん」は少し上から下がる形（TGT）になるよう、時間ごとに高さをかえる・速さを TEMPO にする →
  出だし・終わりをなめらかに → 大きさをそろえる → SAMPLES.moya（1回ぶんずつ）。
使いかた：python3 tools/sound/owner_moya.py   さいごに js/audio.js にはる SAMPLES の行を出す。"""
import os, hashlib, subprocess, tempfile, json, numpy as np
D = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(D, 'src', 'owner_moya.mp3'); OUT = os.path.join(D, '..', '..', 'assets', 'g')
SR = 44100
TEMPO = .62          # ゆっくり（1より小さいほど、ゆっくり）
TGT = (150, 160, 132)  # 「も」の高さ・「やん」のはじめ → おわりの高さ（Hz）。尻上がりにしないで、さいごは下がる
UNITS = 3            # はじめの3回ぶん（さいごのほうの大きく上がる所・こだまは使わない）
def load():
  return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'quiet', '-i', SRC, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).astype(np.float64)
def rms(x, w): return np.sqrt(np.convolve(x * x, np.ones(w) / w, 'same'))
def f0(f):
  ac = np.correlate(f, f, 'full')[len(f) - 1:]; lo, hi = int(SR / 600), int(SR / 80); k = lo + int(np.argmax(ac[lo:hi]))
  return SR / k if ac[k] > .3 * ac[0] else 0
def units(x):
  e = rms(x, int(.03 * SR)); step = int(.01 * SR); ev = e[::step]
  # 大きさのへこみ（まわり0.08秒でいちばん小さく、いちばん大きい所より8dB以上小さい）で分ける
  top = ev.max(); cut = [0]
  for i in range(8, len(ev) - 8):
    if ev[i] == ev[i - 8:i + 9].min() and ev[i] < top * 10 ** (-8 / 20): cut.append(i * step)
  cut.append(len(x)); return [(a, b) for a, b in zip(cut, cut[1:]) if b - a > .12 * SR]
def bend(seg, mid):
  step = .01; n = int(.046 * SR); T = []; P = []
  for i in range(0, len(seg) - n, int(step * SR)):
    p = f0(seg[i:i + n]); T.append(i / SR); P.append(p)
  P = np.array(P); ok = P > 0
  P = np.interp(np.arange(len(P)), np.nonzero(ok)[0], P[ok]) if ok.any() else np.full(len(P), TGT[0])
  sm = lambda q: np.convolve(np.pad(q, 2, mode='edge'), np.ones(5) / 5, 'valid') if len(q) else q
  c = int(np.searchsorted(np.array(T), mid)); P = np.concatenate([sm(P[:c]), sm(P[c:])])  # 「も」と「やん」のさかいをまたいで、ならさない
  T = np.array(T); k = np.clip((T - mid) / max(.01, T[-1] - mid), 0, 1); tg = np.where(T < mid, TGT[0], TGT[1] + (TGT[2] - TGT[1]) * k)
  cmd = ';'.join('%.3f [enter] rubberband pitch %.4f' % (t, tg[i] / P[i]) for i, t in enumerate(T))
  with tempfile.TemporaryDirectory() as td:
    seg.astype(np.float32).tofile(td + '/a.raw'); open(td + '/c.txt', 'w').write(cmd)
    subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', td + '/a.raw',
      '-af', 'asendcmd=f=%s/c.txt,rubberband=tempo=%s:pitch=%.4f:pitchq=quality:formant=preserved' % (td, TEMPO, tg[0] / P[0]), '-f', 'f32le', td + '/b.raw'], check=True)
    return np.fromfile(td + '/b.raw', np.float32).astype(np.float64)
def fade(x, fi=.02, fo=.12):
  x = x.copy(); n = int(fi * SR); m = int(fo * SR); x[:n] *= np.linspace(0, 1, n); x[-m:] *= np.linspace(1, 0, m); return x
def trim(x, th=-45):
  i = np.nonzero(np.abs(x) > 10 ** (th / 20))[0]; return x[i[0]:i[-1] + 1]
def save(x, br=96):
  with tempfile.TemporaryDirectory() as td:
    x.astype(np.float32).tofile(td + '/b.raw')
    subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', td + '/b.raw', '-codec:a', 'libmp3lame', '-b:a', '%dk' % br, td + '/b.mp3'], check=True)
    b = open(td + '/b.mp3', 'rb').read()
  name = hashlib.sha1(b).hexdigest()[:10] + '.mp3'; open(os.path.join(OUT, name), 'wb').write(b); return 'assets/g/' + name
if __name__ == '__main__':
  x = load(); u = units(x); U = [(u[2 * i][0], u[2 * i][1], u[2 * i + 1][1]) for i in range(UNITS)]; res = []
  for a, mid, b in U:
    y = trim(bend(x[a:b], (mid - a) / SR)); y = fade(y); y = y * (10 ** (-3.4 / 20) / np.abs(y).max()); res.append(save(y))
    print('%.2f-%.2f秒 → %.2f秒' % (a / SR, b / SR, len(y) / SR))
  print('Object.assign(SAMPLES,' + json.dumps({'moya': res}) + ');')
