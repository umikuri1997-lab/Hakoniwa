#!/usr/bin/env python3
"""小さな生き物をタップしたときの鳴き声（本物の録音）を作る。
元の音：OpenGameArt の音（みつばちの bee.wav だけ CC-BY 3.0、ほかは CC0）
  birdchirping071414.wav（庭で録った小鳥） https://opengameart.org/content/bird-chirping-sounds
  birds-isaiah658.ogg（外で録った小鳥）    https://opengameart.org/content/ambient-bird-sounds
  cricketsounds090613.wav（庭で録ったコオロギ） https://opengameart.org/content/cricket-sounds
  ribbit_01〜03.mp3・croak_01_0.mp3   https://opengameart.org/content/ribbit-frog-sounds ・ /frog-croaks
  mouse-2.wav                        https://opengameart.org/content/mouse-imitation
  montage-sfx-20130922@153659.ogg    https://opengameart.org/content/squeaky-rat
  RabbitEating.wav                   https://opengameart.org/content/rabbit-eating
  felischaus_hedgehogexamples.zip    https://opengameart.org/content/hedgehog-examples
  dig_underground_1.mp3              https://opengameart.org/content/digging-underground
  insect.zip（insect0〜5.ogg）        https://opengameart.org/content/insect-sounds
  grasshopper.zip                    https://opengameart.org/content/grasshopper
  im.mp3                             https://opengameart.org/content/8-wet-squish-slurp-impacts
  80-CC0-creature-SFX_0.zip（人の声で作った生き物の声） https://opengameart.org/content/80-cc0-creature-sfx
  cat flap ears.wav（猫が耳をぱたぱたさせる音。CC0）  https://opengameart.org/content/cat-flapping-ears-sound
  wings_flap_large.zip（大きな羽ばたき。CC0）       https://opengameart.org/content/large-wings-flap
  bee.zip（bee.wav。IMadeIt「Single Bee Sound」CC-BY 3.0。設定の画面に作者名をのせる） https://opengameart.org/content/single-bee-sound
使いかた：python3 tools/sound/critter_voice.py <上の物をおとして、zipをひらいたフォルダ> [名前,名前...]
やること：切る（はじめ・長さ）→ 高さをずらす → 低い所・高い所をけずる → 出だし・終わりをなめらかに
 → 大きさをそろえる（いちばん大きい所 -3dB）→ assets/g/<中身のsha1の先10字>.mp3。さいごに SAMPLES の行を出す。"""
import sys, os, glob, hashlib, subprocess, tempfile, json
SRC = sys.argv[1]
ONLY = sys.argv[2].split(',') if len(sys.argv) > 2 else None
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'g')
# 名前: [(元のファイル, はじめ 秒, 長さ 秒, 高さ（1=そのまま）, 低い所を切る Hz, 高い所を切る Hz), ...]
SET = {
  'cv_bird':  [('birdchirping071414.wav', .80, .42, 1, 1200, 12000), ('birdchirping071414.wav', 2.05, .45, 1, 1200, 12000),
               ('birds-isaiah658.ogg', 11.40, .40, 1, 1200, 12000), ('birds-isaiah658.ogg', 14.90, .42, 1, 1200, 12000)],  # 小鳥：ちゅん・ぴぴっ（本物の小鳥の録音）
  'cv_risu':  [('montage-sfx-*.ogg', .50, .22, 1.35, 500, 11000), ('montage-sfx-*.ogg', 1.20, .27, 1.35, 500, 11000)],  # りす：ねずみの声を高くした、きゅきゅっ
  'cv_nezumi':[('mouse-2.wav', 0, .28, 1, 500, 11000), ('mouse-2.wav', .40, .28, 1, 500, 11000)],  # ねずみ：ちゅっ
  'cv_usagi': [('**/cute_05.ogg', 0, .51, 1.4, 400, 9000, 'v')],  # うさぎ：ぷぅ（小さな声を高く。持ち主がえらんだ）
  'cv_hari':  [('**/cute_07.ogg', 0, .29, 1.7, 400, 9000, 'v')],  # はりねずみ：きゅっ（持ち主がえらんだ）
  'cv_mogura':[('**/cute_04.ogg', 0, .51, 1.5, 300, 8000, 'v')],  # もぐら：むぅ（持ち主がえらんだ）
  'cv_frog':  [('ribbit_02.mp3', 0, .45, 1, 150, 8000), ('ribbit_03.mp3', .15, .45, 1, 150, 8000)],  # かえる：けろっ
  'cv_bee':   [('bee/bee.wav', 1.55, .55, 1, 120, 9000), ('bee/bee.wav', .30, .50, 1, 120, 9000)],  # みつばち：ぶーん（本物のハチの羽音、CC-BY 3.0）
  'cv_bug':   [('insect/insect1.ogg', 0, .20, .8, 800, 11000), ('insect/insect4.ogg', 0, .20, .8, 800, 11000)],  # ちょう・てんとうむし：ぱたっ（虫の羽の音）
  'cv_chou':  [('catflap.wav', 0, .4, 1.3, 1200, 11000), ('wings/wings_flap_large.ogg', .05, .6, 1.8, 800, 10000)],  # ちょう：ひらひら（耳をぱたぱたする音と、羽ばたきを高く。どちらも CC0）
  'cv_tonbo': [('grasshopper/grasshopper.ogg', 1.25, .30, .7, 400, 10000)],  # とんぼ：はたはた
  'cv_hotaru':[('cricketsounds090613.wav', 7.98, .45, 1, 1500, 11000), ('cricketsounds090613.wav', 8.73, .40, 1, 1500, 11000), ('cricketsounds090613.wav', 19.20, .45, 1, 1500, 11000)],  # ほたる：りりっ（夜の虫の声。本物のコオロギの録音）
  'cv_snail': [('**/burble_02.ogg', 0, .50, 1.5, 150, 1200, 's')],  # かたつむり：ぽこぽこ（あわの音を、うんとこもらせ、出だしをゆっくり。持ち主がえらんだ）
}
def run(a): subprocess.run(a, check=True, capture_output=True)
res = {}
for k, L in SET.items():
  if ONLY and k not in ONLY: continue
  res[k] = []
  for pat, st, ln, rt, hp, lp, *md in L:
    md = md[0] if md else ''
    fs = glob.glob(os.path.join(SRC, pat), recursive=True)
    if not fs: sys.exit('みつからない: ' + pat)
    with tempfile.TemporaryDirectory() as td:
      w = os.path.join(td, 'a.wav')
      if md:  # 前の無音を切り、出だし（v 0.006秒・s 0.07秒）と終わり（v 0.06秒・s 0.12秒）をなめらかに
        fi, fo = (.07, .12) if md == 's' else (.006, .06)
        af = (f'aresample=44100,atrim={st}:{st+ln},asetpts=PTS-STARTPTS,silenceremove=start_periods=1:start_threshold=-60dB,asetrate={44100*rt},aresample=44100,'
              f'highpass=f={hp},lowpass=f={lp},afade=t=in:d={fi},areverse,afade=t=in:d={fo},areverse')
      else:
        af = (f'aresample=44100,atrim={st}:{st+ln},asetpts=PTS-STARTPTS,asetrate={44100*rt},aresample=44100,'
              f'highpass=f={hp},lowpass=f={lp},afade=t=in:d=0.004,afade=t=out:st={max(0,ln/rt-.06)}:d=0.06')
      run(['ffmpeg', '-v', 'quiet', '-y', '-i', fs[0], '-ac', '1', '-af', af, w])
      v = subprocess.run(['ffmpeg', '-i', w, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
      pk = float(v.split('max_volume:')[1].split('dB')[0])
      m = os.path.join(td, 'b.mp3')
      run(['ffmpeg', '-v', 'quiet', '-y', '-i', w, '-af', f'volume={-3-pk}dB', '-codec:a', 'libmp3lame', '-b:a', '96k', '-ac', '1', m])
      b = open(m, 'rb').read()
    name = hashlib.sha1(b).hexdigest()[:10] + '.mp3'
    open(os.path.join(OUT, name), 'wb').write(b)
    res[k].append('assets/g/' + name)
print('Object.assign(SAMPLES,' + json.dumps(res, separators=(',', ':')) + ');')
