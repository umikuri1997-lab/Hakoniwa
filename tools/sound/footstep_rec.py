#!/usr/bin/env python3
"""せいれいの足音（footTick・footMat）：持ち主がくれた、歩いている録音（tools/sound/src/foot/*.mp3。出どころは持ち主の録音）から、1歩ずつ切る。
  wet.mp3 雨の日（ぬれた地面）→ fwet・stone.mp3 石 → fstone・grass.mp3 草 → fgrass・soil.mp3 土・道 → fsoil・snow.mp3 雪 → fsnow・wood_child.mp3 木の床・橋 → fwood（Yuval「footsteps child parquet」freesound 207638、CC0。持ち主が聞きくらべてえらんだ。前は持ち主の録音 wood.mp3）
やること（音は作らない。切る・大きさをそろえるだけ）：
  1. 録音の中の1歩ずつの場所を見つける（足がついて大きくなる所。歩く間かくは 0.5〜0.7 秒）。
  2. 1歩ごとに、足がつく所（2ms ごとの大きさが、その歩の山の ONSET になった所）の 5ms 前から LEN 秒を切り、出だし 2ms・おわり（あとの 40%）をなめらかに。
  3. 声・ほかの音の入った所はすてる：歩く間かくからはずれた音・声のような高さのある音が 0.12 秒よりつづく所（70〜1000Hz の自己相関の山が VOICE より上）・
     まえの音がのこっている所（切りはじめから山まで RISE dB より大きくならない）・小さすぎる歩（まん中の大きさより LOW dB 下）。
  4. のこった歩から、大きさのそろった N こ（まん中の大きさに近い順）をえらぶ。
  5. 大きさをそろえる：はじめ 0.15 秒の RMS を、前の足音（TGT）と同じに（いちばん大きい所は -1dB まで）。
使いかた：python3 tools/sound/footstep_rec.py [名前,名前...] [--list]
  --list：見つけた歩の表だけ出す（すてたわけつき）。さいごに js/audio.js にはる SAMPLES の行を出す。"""
import sys, os, hashlib, subprocess, json, numpy as np
SR = 44100
D = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(D, 'src', 'foot'); OUT = os.path.join(D, '..', '..', 'assets', 'g')
# 名前: (録音, 低い所を切る Hz, 高い所を切る Hz, 歩を見つける帯 Hz, LEN 秒, N こ)
SET = {
  'fwet':   ('wet.mp3',   120, 12000, (1000, 12000), .26, 6),
  'fstone': ('stone.mp3', 120, 10000, (150, 4000), .20, 7),
  'fgrass': ('grass.mp3', 200, 12000, (1000, 10000), .26, 7),
  'fsoil':  ('soil.mp3',  120, 12000, (300, 6000), .24, 8),
  'fsnow':  ('snow.mp3',  150, 12000, (200, 3000), .28, 7),
  'fwood':  ('wood_child.mp3',  100, 9000,  (150, 4000), .20, 7),
}
VOICE, RISE, LOW, ONSET = .6, 6, 8, .2
# 大きさ：前の足音（Kenney の録音、ui_asmr.py）の、はじめ 0.15 秒の RMS（dB）。ぬれた地面は、前の草・土のまん中
TGT = {'fwet': -22.2, 'fstone': -22.2, 'fgrass': -22.7, 'fsoil': -21.6, 'fsnow': -18.9, 'fwood': -19.5}
args = [a for a in sys.argv[1:] if not a.startswith('--')]
ONLY = args[0].split(',') if args else None
LIST = '--list' in sys.argv

def load(f, hp, lp):
  return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'quiet', '-i', f, '-ac', '1', '-ar', str(SR), '-af', f'highpass=f={hp},lowpass=f={lp}', '-f', 'f32le', '-'],
                                      capture_output=True, check=True).stdout, np.float32).copy()
def db(x): return 20 * np.log10(x + 1e-9)
def voice_map(f):
  """声のような所：70〜1000Hz で、高さ（85〜400Hz）のある音が 0.12 秒より長くつづく所（30ms ごと）。足音・床のひびきは、とぎれとぎれ"""
  a = load(f, 70, 1000); N, hop = int(.06 * SR), int(.03 * SR); v = []
  for st in range(0, len(a) - N, hop):
    s = a[st:st + N] - a[st:st + N].mean(); s = s * np.hanning(N); c = np.correlate(s, s, 'full')[N - 1:]
    if c[0] <= 1e-8: v.append(False); continue
    c = c / c[0]; lo, hi = int(SR / 400), int(SR / 85); k = lo + int(np.argmax(c[lo:hi]))
    v.append(bool(c[k] > VOICE and lo < k < hi - 1))                  # 山が帯のはしにあるのは、高さではない
  v = np.array(v); out = np.zeros(len(v), bool)
  for i in range(len(v) - 3):
    if v[i:i + 4].all(): out[i:i + 4] = True
  return out, hop

def steps(name):
  f, hp, lp, (b0, b1), ln, n = SET[name]
  a = load(os.path.join(SRC, f), hp, lp); b = load(os.path.join(SRC, f), b0, b1); vm, vh = voice_map(os.path.join(SRC, f))
  e = np.convolve(np.abs(b), np.ones(441) / 441, 'same')[::441]   # 10ms ごとの大きさ
  ed = np.maximum(db(e), db(e.max()) - 70); sm = np.convolve(ed, np.ones(5) / 5, 'same')
  # 1歩：大きさの山（まわり 0.45 秒でいちばん大きい所）
  pk = [i for i in range(len(sm)) if sm[i] == sm[max(0, i - 22):i + 23].max() and sm[i] > np.median(sm) + 3]
  mid = float(np.median([sm[i] for i in pk])) if pk else 0
  R = []
  for i in pk:
    lo = max(0, i - 30); m = lo + int(np.argmin(sm[lo:i + 1]))       # 山のまえのいちばん小さい所
    w = np.convolve(np.abs(b[m * 441:(i + 3) * 441]), np.ones(88) / 88, 'same')   # 2ms ごとの大きさ（ふつうの数）
    k = m * 441 + int(np.argmax(w > w.max() * ONSET))                   # 足がつく所：山の ONSET の大きさになった所
    st = max(0, k - int(.005 * SR)); s = a[st:st + int(ln * SR)].copy()
    why = ''
    if len(s) < int(ln * SR): why = 'おわり'
    elif st < .05 * SR: why = 'はじめ'
    elif sm[i] < mid - LOW: why = '小さい'
    elif sm[i] - sm[m] < RISE: why = 'まえの音'
    elif vm[st // vh:(st + len(s)) // vh + 1].any(): why = '声'
    R.append(dict(t=st / SR, pk=float(sm[i]), rise=float(sm[i] - sm[m]), s=s, why=why))
  # 歩く間かく（まえの歩から 0.35〜0.9 秒）からはずれた音もすてる
  for p, q in zip(R, R[1:]):
    if not q['why'] and q['t'] - p['t'] < .35: q['why'] = '間かく'
  return R

res = {}
for k in SET:
  if ONLY and k not in ONLY: continue
  R = steps(k); ok = [r for r in R if not r['why']]
  med = np.median([r['pk'] for r in ok]); ok.sort(key=lambda r: abs(r['pk'] - med)); use = sorted(ok[:SET[k][5]], key=lambda r: r['t'])
  print(f'# {k}: 見つけた歩 {len(R)}・つかう {len(use)}', file=sys.stderr)
  for r in R: print(f"   {r['t']:6.2f}s 山{r['pk']:6.1f} 立ち上がり{r['rise']:5.1f} {'つかう' if r in use else (r['why'] or 'のこり')}", file=sys.stderr)
  if LIST: continue
  res[k] = []
  for r in use:
    x = r['s']; fi = int(.002 * SR); fo = int(len(x) * .4)
    x[:fi] *= np.linspace(0, 1, fi); x[-fo:] *= np.linspace(1, 0, fo) ** 2
    g = 10 ** (TGT[k] / 20) / (np.sqrt((x[:int(.15 * SR)] ** 2).mean()) + 1e-9)   # はじめ 0.15 秒の大きさを、前の足音にそろえる
    x = x * min(g, .891 / (np.abs(x).max() + 1e-9))                        # いちばん大きい所は -1dB まで
    tmp = os.path.join(OUT, '_foot_tmp.mp3')   # パイプに書くと長さがかわるので、ファイルに書く
    subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-codec:a', 'libmp3lame', '-b:a', '128k', tmp],
                   input=x.astype(np.float32).tobytes(), check=True)
    bts = open(tmp, 'rb').read(); os.remove(tmp)
    nm = hashlib.sha1(bts).hexdigest()[:10] + '.mp3'; open(os.path.join(OUT, nm), 'wb').write(bts); res[k].append('assets/g/' + nm)
if not LIST: print('Object.assign(SAMPLES,' + json.dumps(res, separators=(',', ':')) + ');')
