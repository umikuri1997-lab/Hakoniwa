#!/usr/bin/env python3
"""コワイノに当たった音（ぽんっ）と、コワイノを倒した音（さらさら…と消える）を作る。
元の音：
  src/foehit_hit10.flac：OpenGameArt qubodup「37 Hits/Punches」の hit10（CC0）
  src/foeko_ref.mp3：効果音ラボの音（持ち主がくれたお手本。波が4回くる音）
やること：
  ぽんっ：hit10 を1.4倍の高さにして、高い所をけずり、0.15秒で切る。
  さらさら：お手本の3つめの波を切りとり、山のすぐあとから、引いていく音と同じ音のまざり方の「しゃー」（位相がばらばら。
    同じ所をくりかえしてのばすと、金属っぽい電子音になる）へゆっくりうつして余韻をのばす。
    お手本の高い所のこまかいつぶ（2〜8ms）を、だんだんまばらにかさねて「さらさら」。0.2秒で出てきて、ゆっくり消える。低い所をけずって軽く。
使いかた：python3 tools/sound/foe_hit_ko.py  → assets/g/<中身のsha1の先10字>.mp3 と、js/audio.js にはる SAMPLES の名前を出す。"""
import os, subprocess, hashlib, numpy as np
D = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(D, '..', '..', 'assets', 'g'); SR = 44100
def dec(p, sr=SR):
    return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'quiet', '-i', p, '-ac', '1', '-ar', str(int(sr)), '-f', 'f32le', '-'], capture_output=True).stdout, np.float32).copy()
def enc(x):  # mp3 はファイルに書く（パイプに書くと、はじめの情報が入らず、読みこむと長さがかわる）
    p = os.path.join(OUT, '.foe_tmp.mp3')
    subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-b:a', '160k', p], input=x.astype(np.float32).tobytes())
    b = open(p, 'rb').read(); os.remove(p); return b
def lp1(x, fc):  # 1次の低い所だけ通す
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); s = 0
    for i, v in enumerate(x): s = (1 - a) * v + a * s; y[i] = s
    return y
def hp1(x, fc): return x - lp1(x, fc)
def put(name, b):
    h = hashlib.sha1(b).hexdigest()[:10]; open(os.path.join(OUT, h + '.mp3'), 'wb').write(b); print(name, 'assets/g/%s.mp3' % h); return h
# ---- ぽんっ ----
x = dec(os.path.join(D, 'src', 'foehit_hit10.flac'), SR / 1.4); x /= np.abs(x).max(); i = np.argmax(np.abs(x) > .03); x = x[max(0, i - 60):]
x = lp1(x, 3000)[:int(.15 * SR)].copy(); f = int(.05 * SR); x[-f:] *= np.linspace(1, 0, f) ** 1.5
x = hp1(x, 70); x = x / np.abs(x).max() * .8; x[:88] *= np.linspace(0, 1, 88)
hit = put('foehit', enc(x))
# ---- さらさら ----
a = dec(os.path.join(D, 'src', 'foeko_ref.mp3')); h = 441
r = np.array([np.sqrt((a[i:i + h] ** 2).mean()) for i in range(0, len(a), h)])
pk = [21, 100, 174, 253]; cuts = [0] + [p + int(np.argmin(r[p:q])) for p, q in zip(pk, pk[1:])] + [len(r) - 1]   # 波と波のあいだ
s = cuts[2] * h; w = a[s:min(cuts[3] * h, s + int(.85 * SR))].copy(); w = w / np.abs(w).max() * .5; f = int(.03 * SR); w[-f:] *= np.linspace(1, 0, f)
tmp = enc(w)
p0 = os.path.join(OUT, '.foeko_w3.mp3'); open(p0, 'wb').write(tmp); w = dec(p0); os.remove(p0); w /= np.abs(w).max()   # 試したときと同じく、一度 mp3 にしてから使う
rng = np.random.default_rng(33)
e = np.convolve(np.abs(w), np.ones(2205) / 2205, 'same'); pk = int(np.argmax(e))
def tail_noise(n, ref):
    R = np.abs(np.fft.rfft(ref * np.hanning(len(ref)), n)); R = np.convolve(R, np.ones(30) / 30, 'same')
    X = R * np.exp(2j * np.pi * rng.random(len(R))); y = np.fft.irfft(X, n); return y / np.abs(y).max()
def sara(n, dens, amp, p=1.4):
    hi = w[pk - int(.1 * SR):pk + int(.25 * SR)]; y = np.zeros(n)
    X = np.fft.rfft(hi); fq = np.fft.rfftfreq(len(hi), 1 / SR); X *= 1 / (1 + (5000 / np.maximum(fq, 1)) ** 4); hi = np.fft.irfft(X, len(hi))
    for _ in range(int(dens * n / SR)):
        gl = int(rng.uniform(.002, .008) * SR); t = rng.random() ** 1.2; s0 = int(t * (n - gl)); q = rng.integers(0, len(hi) - gl)
        y[s0:s0 + gl] += hi[q:q + gl] * np.hanning(gl) * (1 - t) ** p * rng.uniform(.3, 1)
    return y / np.abs(y).max() * amp
tau, dens, amp, dur, fi, hc, fo0 = .6, 2400, .65, 2.1, .2, 2500, .3
st = pk + int(.03 * SR); head = w[:st]; n = int(dur * SR) - st
lev = np.sqrt((w[st:st + 2205] ** 2).mean()) / np.sqrt((w[pk - 1100:pk + 1100] ** 2).mean()) * np.abs(w[pk - 1100:pk + 1100]).max()
tt = np.arange(n) / SR
t = tail_noise(n, w[st:st + int(.25 * SR)]) * lev * np.exp(-tt / tau) * np.linspace(1, 0, n) ** .5
org = np.zeros(n); o = w[st:st + n]; org[:len(o)] = o
xf = int(.12 * SR); mw = np.concatenate([np.linspace(0, 1, xf), np.ones(n - xf)]); t = org * (1 - mw) + t * mw
x = np.concatenate([head, t]); sr_ = sara(len(x), dens, amp); sr_[:pk] *= np.linspace(0, 1, pk)
x = x + sr_; N = len(x); tm = np.arange(N) / SR
fin = np.minimum(tm / fi, 1) ** 2; fo = np.ones(N); a0 = int(N * fo0); fo[a0:] = np.cos(np.linspace(0, np.pi / 2, N - a0)) ** 2
x = x * fin * fo
X = np.fft.rfft(x); fq = np.fft.rfftfreq(N, 1 / SR); X *= 1 / np.sqrt(1 + (hc / np.maximum(fq, 1)) ** 4); x = np.fft.irfft(X, N)
x = x / np.abs(x).max() * .5
ko = put('foeko', enc(x))
print('SAMPLES: "foehit":["assets/g/%s.mp3"], "foeko":["assets/g/%s.mp3"]' % (hit, ko))
