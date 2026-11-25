#!/usr/bin/env python3
"""うけとった・たっせい・はじめて置いた・作業台と料理の「できた」 の音（持ち主がサンプルページの4つの候補からえらんだ）。音は作らない（録音を切って、ならべて、大きさをそろえるだけ）。
- rwget（うけとった）：おもちゃの鉄琴の ソ→ド（0.13秒あと）。「ちん・ちーん」。0.95秒で切る
- rwlevel（村レベルアップ・たっせい・あたらしいレシピ など、sfx('level') と sfx('quest')）：qubodup の「Level Up」まるごとを、高さはそのままで1.5倍の速さに（1.7秒→約1.13秒。持ち主が10の候補からえらび、あとで1.5倍にした。前のたっせいの「ドミソド」はやめた）
- rwfirst（スポットができた場面）：チャイムの「きらーん」（1.25秒から2.6秒ぶん）
- wdone（作業台・料理の「できた」）：あわがはじける「ぽん」（0.04秒から0.3秒ぶん。持ち主が9つの候補からえらんだ）
- gfopen（プレゼントのつつみがひらく）：つつみ紙が「かさっ」（1.03秒から0.6秒ぶん。持ち主が9つの候補からえらんだ）
もとの録音（どれも CC0。freesound のページで CC0 をたしかめる。おとすのは freesound の試聴の mp3）：
- Toy Glockenspiel / mooncubedesign  https://freesound.org/people/mooncubedesign/sounds/420501/  （ド6〜ド7の8つの音が4秒ずつ）
- GLEAM-GLOW-SFX-CHIME.wav / newagesoup  https://freesound.org/people/newagesoup/sounds/351408/
- Level Up / qubodup  https://freesound.org/people/qubodup/sounds/442943/
- The Best Bubble Pop Sound For Game and UI / el_boss  https://freesound.org/people/el_boss/sounds/669918/
- Wrapping Paper Rustle / Eipeiknip  https://freesound.org/people/Eipeiknip/sounds/344433/
やること：モノ・60Hzより下をけずる → 切る（出だし4ms・おわり40%をなめらかに）→ ならべる → おわりを消えるように → 約 -20 LUFS（ピークは -1.5 dBFS まで）。
使いかた：python3 tools/sound/reward_rec.py [名前…]（名前をつけると、その音だけ作る）   さいごに js/audio.js にはる SAMPLES の行を出す。"""
import os, re, sys, json, hashlib, subprocess, tempfile, urllib.request
D = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(D, '..', '..', 'assets', 'g')
URL = {'glock': 'https://cdn.freesound.org/previews/420/420501_5426702-hq.mp3',
       'gleam': 'https://cdn.freesound.org/previews/351/351408_4067257-hq.mp3',
       'pop': 'https://cdn.freesound.org/previews/669/669918_9129912-hq.mp3',
       'lvup': 'https://cdn.freesound.org/previews/442/442943_71257-hq.mp3',
       'wrap': 'https://cdn.freesound.org/previews/344/344433_3278936-hq.mp3'}
def run(a):
  r = subprocess.run(a, capture_output=True, text=True)
  if r.returncode: print(r.stderr[-1500:]); sys.exit(1)
  return r.stderr
def gl(k, dl, du=1.6): return ('glock', 4 * k, du, dl)  # k：ド6から k ばんめの音（0=ド6, 2=ミ6, 4=ソ6, 7=ド7）
RECIPE = {
  'rwget': ([gl(4, 0, 1.4), gl(7, .13, 1.8)], .95, .35),  # 持ち主がたのんで、半分の長さに（0.6秒から消えていく）
  'rwlevel': ([('lvup', 0, 1.7, 0)], 1.7, .4, 1.5),
  'rwfirst': ([('gleam', 1.25, 2.6, 0)], 2.6, .6),
  'wdone': ([('pop', .04, .3, 0)], .3, .1),
  'gfopen': ([('wrap', 1.03, .6, 0)], .6, .2),
}
res = {}
with tempfile.TemporaryDirectory() as td:
  for k, u in URL.items():
    urllib.request.urlretrieve(u, os.path.join(td, k + '.mp3'))
  for name, (parts, total, fout, *sp) in RECIPE.items():
    sp = sp[0] if sp else 1  # sp：速さ（高さはそのまま。atempo）
    if sys.argv[1:] and name not in sys.argv[1:]: continue
    a = ['ffmpeg', '-v', 'error', '-y']; fc = []
    for i, (f, ss, du, dl) in enumerate(parts):
      a += ['-ss', str(ss), '-t', str(du), '-i', os.path.join(td, f + '.mp3')]
      fc.append('[%d:a]aresample=44100,aformat=channel_layouts=mono,highpass=f=60,afade=t=in:d=0.004,afade=t=out:st=%f:d=%f,adelay=%d[p%d]' % (i, du * .6, du * .4, int(dl * 1000), i))
    n = len(parts)
    fc.append(''.join('[p%d]' % i for i in range(n)) + 'amix=inputs=%d:normalize=0:duration=longest,apad,atrim=0:%f,afade=t=out:st=%f:d=%f' % (n, total, total - fout, fout) + (',atempo=%f' % sp if sp != 1 else '') + '[m]')
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
