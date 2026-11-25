#!/usr/bin/env python3
"""うけとった・たっせい・はじめて置いた の音（持ち主がサンプルページの4つの候補からえらんだ）。音は作らない（録音を切って、ならべて、大きさをそろえるだけ）。
- rwget（うけとった）：おもちゃの鉄琴の ソ→ド（0.13秒あと）。「ちん・ちーん」
- rwquest（たっせい）：おもちゃの鉄琴の ド・ミ・ソ・ド（0.1秒ずつ）
- rwfirst（はじめて置いた）：チャイムの「きらーん」（1.25秒から2.6秒ぶん）
もとの録音（どれも CC0。freesound のページで CC0 をたしかめる。おとすのは freesound の試聴の mp3）：
- Toy Glockenspiel / mooncubedesign  https://freesound.org/people/mooncubedesign/sounds/420501/  （ド6〜ド7の8つの音が4秒ずつ）
- GLEAM-GLOW-SFX-CHIME.wav / newagesoup  https://freesound.org/people/newagesoup/sounds/351408/
やること：モノ・60Hzより下をけずる → 切る（出だし4ms・おわり40%をなめらかに）→ ならべる → おわりを消えるように → 約 -20 LUFS（ピークは -1.5 dBFS まで）。
使いかた：python3 tools/sound/reward_rec.py   さいごに js/audio.js にはる SAMPLES の行を出す。"""
import os, re, sys, json, hashlib, subprocess, tempfile, urllib.request
D = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(D, '..', '..', 'assets', 'g')
URL = {'glock': 'https://cdn.freesound.org/previews/420/420501_5426702-hq.mp3',
       'gleam': 'https://cdn.freesound.org/previews/351/351408_4067257-hq.mp3'}
def run(a):
  r = subprocess.run(a, capture_output=True, text=True)
  if r.returncode: print(r.stderr[-1500:]); sys.exit(1)
  return r.stderr
def gl(k, dl, du=1.6): return ('glock', 4 * k, du, dl)  # k：ド6から k ばんめの音（0=ド6, 2=ミ6, 4=ソ6, 7=ド7）
RECIPE = {
  'rwget': ([gl(4, 0, 1.4), gl(7, .13, 1.8)], 1.9, .4),
  'rwquest': ([gl(0, 0, 1.0), gl(2, .1, 1.0), gl(4, .2, 1.0), gl(7, .3, 1.8)], 2.1, .4),
  'rwfirst': ([('gleam', 1.25, 2.6, 0)], 2.6, .6),
}
res = {}
with tempfile.TemporaryDirectory() as td:
  for k, u in URL.items():
    urllib.request.urlretrieve(u, os.path.join(td, k + '.mp3'))
  for name, (parts, total, fout) in RECIPE.items():
    a = ['ffmpeg', '-v', 'error', '-y']; fc = []
    for i, (f, ss, du, dl) in enumerate(parts):
      a += ['-ss', str(ss), '-t', str(du), '-i', os.path.join(td, f + '.mp3')]
      fc.append('[%d:a]aresample=44100,aformat=channel_layouts=mono,highpass=f=60,afade=t=in:d=0.004,afade=t=out:st=%f:d=%f,adelay=%d[p%d]' % (i, du * .6, du * .4, int(dl * 1000), i))
    n = len(parts)
    fc.append(''.join('[p%d]' % i for i in range(n)) + 'amix=inputs=%d:normalize=0:duration=longest,apad,atrim=0:%f,afade=t=out:st=%f:d=%f[m]' % (n, total, total - fout, fout))
    w = os.path.join(td, name + '.wav')
    run(a + ['-filter_complex', ';'.join(fc), '-map', '[m]', '-ar', '44100', '-ac', '1', w])
    e = run(['ffmpeg', '-v', 'info', '-i', w, '-af', 'apad=pad_dur=3,ebur128=peak=true', '-f', 'null', '-'])
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', e)[-1]); pk = float(re.findall(r'Peak:\s+(-?[\d.inf]+) dBFS', e)[-1])
    g = min(-20 - I, -1.5 - pk)
    m = os.path.join(td, name + '.mp3')  # ファイルに書く（パイプに書くと長さがかわる）
    run(['ffmpeg', '-v', 'error', '-y', '-i', w, '-af', 'volume=%fdB' % g, '-codec:a', 'libmp3lame', '-b:a', '96k', m])
    b = open(m, 'rb').read(); fn = hashlib.sha1(b).hexdigest()[:10] + '.mp3'
    open(os.path.join(OUT, fn), 'wb').write(b); res[name] = ['assets/g/' + fn]
    print(name, '%.1f LUFS → %.1f' % (I, I + g))
print('Object.assign(SAMPLES,' + json.dumps(res, separators=(',', ':')) + ');')
