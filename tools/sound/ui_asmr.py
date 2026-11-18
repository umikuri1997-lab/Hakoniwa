#!/usr/bin/env python3
"""UIの手ざわりの音と、料理・もの作りの手もとの音（ASMRのような、近くで小さく鳴る本物の音）を作る。
元の音：Kenney の音のセット（どれも CC0。https://kenney.nl/assets/ の rpg-audio・impact-sounds・ui-audio）。
使いかた：python3 tools/sound/ui_asmr.py <Kenneyのzipをひらいたフォルダ> [名前,名前...]
  そのフォルダの中に rpg-audio/ impact-sounds/ ui-audio/ がある形。
やること：音の前後の無音を切る → 出だし2ms・終わりをなめらかに → 低いゴロゴロ・耳にささる高い音をけずる
 → 大きさをそろえる（いちばん大きい所 -3dB）→ assets/g/<中身のsha1の先10字>.mp3。
さいごに js/audio.js にはる SAMPLES の行を出す。"""
import sys, os, glob, hashlib, subprocess, tempfile, json
SRC = sys.argv[1]
ONLY = sys.argv[2].split(',') if len(sys.argv) > 2 else None   # 名前をしぼって作る（例：tonton,plate）
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'g')
# 名前: (元のファイルのならび, 低い所を切る Hz, 高い所を切る Hz, 長さの上限 秒, 高さのずらし（1=そのまま）)
SET = {
  'stamp':  (['rpg-audio/*/bookPlace1.ogg', 'rpg-audio/*/bookPlace2.ogg', 'rpg-audio/*/bookPlace3.ogg'], 90, 2600, .30, 1),  # ハンコ：ぽむっ（紙ごしにこもる）
  'dust':   (['impact-sounds/*/footstep_grass_00%d.ogg' % i for i in range(4)], 1500, 9000, .09, 1),  # 木くず：さらさら（小さなつぶ）
  'creak':  (['rpg-audio/*/creak3.ogg', 'rpg-audio/*/creak1.ogg'], 400, 7000, .40, 1),  # なわのきしみ：きゅ…
  'bend':   (['rpg-audio/*/creak2.ogg'], 150, 5000, .55, 1),  # 板がしなる：ぎぃ
  'tab':    (['rpg-audio/*/bookFlip3.ogg', 'rpg-audio/*/bookFlip2.ogg'], 300, 9000, .26, 1),  # タブ：ぱたっ（めくる）
  'knockw': (['impact-sounds/*/impactGeneric_light_00%d.ogg' % i for i in range(5)], 120, 6000, .14, 1),  # 行が置かれる・木札：ことっ
  'notch':  (['ui-audio/*/switch12.ogg', 'ui-audio/*/switch13.ogg', 'ui-audio/*/switch14.ogg'], 600, 6500, .06, 1),  # ±：かちっ
  # ---- 料理・もの作り（マップの音。sfxAt で鳴らす） ----
  'tonton': (['impact-sounds/*/impactWood_light_00%d.ogg' % i for i in range(4)], 250, 7000, .10, 1),  # 包丁でまな板：とん
  'potclk': (['rpg-audio/*/metalPot1.ogg', 'rpg-audio/*/metalPot2.ogg', 'rpg-audio/*/metalPot3.ogg'], 300, 6000, .22, 1),  # おたまがなべにあたる：かちゃ
  'tink':   (['impact-sounds/*/impactGlass_light_00%d.ogg' % i for i in range(3)], 500, 9000, .12, 1),  # あわだて器がボウルにあたる：ちん
  'plate':  (['impact-sounds/*/impactPlate_light_00%d.ogg' % i for i in range(3)], 300, 8000, .22, 1),  # お皿：ことっ
  'lid':    (['rpg-audio/*/doorOpen_1.ogg', 'rpg-audio/*/doorOpen_2.ogg'], 200, 6000, .45, 1),  # 木箱のふたが開く：ぎぃ
  'cloth':  (['rpg-audio/*/cloth1.ogg', 'rpg-audio/*/cloth2.ogg', 'rpg-audio/*/cloth3.ogg', 'rpg-audio/*/cloth4.ogg'], 300, 8000, .30, 1),  # ぬので、みがく：しゅっ
  # ---- 「みる」でタップした物（材質ごと。tapSnd・tapMatOf） ----
  'twood':  (['impact-sounds/*/impactWood_light_00%d.ogg' % i for i in range(5)], 200, 7000, .16, 1),  # 木：こつっ
  'tstone': (['impact-sounds/*/footstep_concrete_00%d.ogg' % i for i in range(5)], 200, 8000, .16, 1),  # 石：こつ（石の床）
  'tcan':   (['impact-sounds/*/impactMetal_light_00%d.ogg' % i for i in range(5)], 400, 9000, .20, 1),  # 金物：かちっ
  'tcloth': (['rpg-audio/*/cloth%d.ogg' % i for i in (1, 2, 3, 4)], 250, 7000, .22, 1),  # 布：ふさっ
  'tgrass': (['impact-sounds/*/footstep_grass_00%d.ogg' % i for i in range(5)], 600, 9000, .18, 1),  # 植物：かさっ
  'tsoil':  (['rpg-audio/*/footstep0%d.ogg' % i for i in range(5)], 150, 6000, .18, 1),  # 畑・地面：ざくっ（土の足音）
  'twater': (['game/splash.mp3'], 400, 8000, .28, 1),  # 水：ちゃぽっ（ゲームの水しぶきを短く）
  'tbell':  (['impact-sounds/*/impactBell_heavy_00%d.ogg' % i for i in range(3)], 500, 9000, .45, 1),  # 神殿・御神木：ころん（鐘を小さく短く）
  'tfoe':   (['impact-sounds/*/impactSoft_medium_00%d.ogg' % i for i in range(5)], 120, 5000, .16, 1),  # コワイノ：ぽふっ
  'tweb':   (['rpg-audio/*/cloth%d.ogg' % i for i in (1, 3)], 1500, 10000, .16, 1),  # クモの巣：さらっ（布を高い所だけ）
  'tani':   (['impact-sounds/*/impactSoft_medium_00%d.ogg' % i for i in (1, 3)], 250, 7000, .12, 1),  # 生き物：ぽよっ（高く鳴らす）
  'tplace': (['impact-sounds/*/impactPlank_medium_00%d.ogg' % i for i in range(4)], 120, 6000, .18, 1),  # 置く場所：とんっ
}
def run(a): subprocess.run(a, check=True, capture_output=True)
res = {}
for k, (pats, hp, lp, mx, rt) in SET.items():
  if ONLY and k not in ONLY: continue
  res[k] = []
  for pat in pats:
    fs = glob.glob(os.path.join(SRC, pat))
    if not fs: sys.exit('みつからない: ' + pat)
    with tempfile.TemporaryDirectory() as td:
      w = os.path.join(td, 'a.wav')
      af = ('silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-55dB,areverse,'
            f'highpass=f={hp},lowpass=f={lp},atrim=0:{mx},afade=t=in:d=0.002,afade=t=out:st={max(0,mx-.04)}:d=0.04,'
            'aresample=44100')
      run(['ffmpeg', '-v', 'quiet', '-y', '-i', fs[0], '-ac', '1', '-af', af, w])
      # 大きさをそろえる（いちばん大きい所を -3dB）
      v = subprocess.run(['ffmpeg', '-i', w, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
      pk = float(v.split('max_volume:')[1].split('dB')[0])
      m = os.path.join(td, 'b.mp3')
      run(['ffmpeg', '-v', 'quiet', '-y', '-i', w, '-af', f'volume={-3-pk}dB', '-codec:a', 'libmp3lame', '-b:a', '128k', '-ac', '1', m])
      b = open(m, 'rb').read()
    name = hashlib.sha1(b).hexdigest()[:10] + '.mp3'
    open(os.path.join(OUT, name), 'wb').write(b)
    res[k].append('assets/g/' + name)
print('Object.assign(SAMPLES,' + json.dumps(res, separators=(',', ':')) + ');')
