#!/usr/bin/env python3
"""UIの手ざわりの音と、料理・もの作りの手もとの音（ASMRのような、近くで小さく鳴る本物の音）を作る。
元の音：Kenney の音のセット（どれも CC0。https://kenney.nl/assets/ の rpg-audio・impact-sounds・ui-audio）。
  OpenGameArt の CC0 も使う（そのフォルダに入れる）：本 oga-book/（StarNinjas「10 Book Page Flips」の book_flip.*.ogg と Voltiment555「Book Flip Sounds」の BookFlip*.wav）・紙 oga-paper/（Luckius「Various Paper Sound Effects」の paper_sound_-_4.mp3 を p4.mp3）・水 oga-water/（40-cc0-water-splash-slime-sfx）・かれ葉 oga-rustle/（20-rustles-dry-leaves）・スコップ oga-shovel/（shovel-sound）。
  6つめに opts（peak：大きい所から切る・sk：切りはじめをずらす秒・att：鳴りはじめのフェード秒）。録音ごとにかえるときは、録音の数のリスト。
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
  'page':   (['rpg-audio/*/bookFlip1.ogg', 'rpg-audio/*/bookFlip2.ogg', 'rpg-audio/*/bookFlip3.ogg'], 200, 9000, .55, 1),  # 思い出帳のページをめくる：ぺらっ（さいごまで）
  'knockw': (['impact-sounds/*/impactGeneric_light_00%d.ogg' % i for i in range(5)], 120, 6000, .14, 1),  # 行が置かれる・木札：ことっ
  'notch':  (['ui-audio/*/switch12.ogg', 'ui-audio/*/switch13.ogg', 'ui-audio/*/switch14.ogg'], 600, 6500, .06, 1),  # ±：かちっ
  # ---- 本と巻物（思い出帳・図鑑・ひでんのしょ。book.js・scroll.js） ----
  'mpage':  (['oga-book/book_flip.1.ogg', 'oga-book/book_flip.4.ogg', 'oga-book/book_flip.6.ogg', 'oga-book/book_flip.8.ogg', 'oga-book/BookFlip2.wav', 'rpg-audio/*/bookFlip1.ogg'], 180, 9000, .6, 1, {'peak': 1, 'sk': -.06, 'att': .01}),  # 本のページをめくる：ぺらっ（めくるたびにべつの録音）
  'pflick': (['oga-book/book_flip.4.ogg', 'oga-book/book_flip.8.ogg', 'rpg-audio/*/bookFlip3.ogg', 'oga-book/BookFlip2.wav'], 300, 9000, .2, 1, {'peak': 1, 'sk': -.02, 'att': .004}),  # ぱらぱら：1まいぶんの短い音
  'bkopen': (['rpg-audio/*/bookOpen.ogg', 'rpg-audio/*/bookPlace2.ogg'], 120, 8000, .4, 1),  # 表紙をひらく
  'bkclose':(['rpg-audio/*/bookClose.ogg', 'rpg-audio/*/bookPlace1.ogg'], 100, 7000, .4, 1),  # 表紙をとじる：ぱたん
  'pslide': (['oga-paper/p4.mp3'], 250, 8000, 2.6, 1),  # 紙をなでる・巻物がほどける：つづけて鳴らす（こすれる音）
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
  'tcloth': (['impact-sounds/*/footstep_carpet_00%d.ogg' % i for i in (0, 1, 3)], 80, 2000, .20, 1, {'att': .015}),  # 布：じゅうたんを歩く音の高い所をけずった、やわらかい音
  'tgrass': (['oga-rustle/rustle0%d.flac' % i for i in range(1, 6)], 300, 10000, .28, 1, {'peak': 1}),  # 植物：かれ葉をさわる音（OpenGameArt qubodup「20 Rustles of dry leaves」）
  'tsoil':  (['oga-shovel/shovel.ogg', 'oga-shovel/shovel.ogg'], 100, 7000, .30, 1, [{'peak': 1}, {'peak': 1, 'sk': .08}]),  # 畑・地面：スコップで土をすくう音（OpenGameArt「Shovel Sound」。2つめは少しあとから切る）
  'twater': (['oga-water/splash_%s.ogg' % i for i in ('09', '10', '14', '02')], 150, 9000, .32, 1),  # 水：ちゃぽっ（OpenGameArt「40 CC0 water / splash / slime SFX」の短い水音。oga-water/ に入れる）
  'tsacred': (['impact-sounds/*/impactWood_heavy_00%d.ogg' % i for i in range(4)], 80, 5000, .30, 1),  # 御神木・切り株：太い木をたたく音
  'tbell':  (['impact-sounds/*/impactBell_heavy_00%d.ogg' % i for i in range(3)], 500, 9000, .45, 1),  # 神殿・御神木：ころん（鐘を小さく短く）
  'tfoe':   (['impact-sounds/*/impactSoft_medium_00%d.ogg' % i for i in range(5)], 120, 5000, .16, 1),  # コワイノ：ぽふっ
  'tweb':   (['rpg-audio/*/cloth%d.ogg' % i for i in (1, 3)], 1500, 10000, .16, 1),  # クモの巣：さらっ（布を高い所だけ）
  'tani':   (['impact-sounds/*/impactSoft_medium_00%d.ogg' % i for i in (1, 3)], 250, 7000, .12, 1),  # 生き物：ぽよっ（高く鳴らす）
  'tplace': (['impact-sounds/*/impactPlank_medium_00%d.ogg' % i for i in range(4)], 120, 6000, .18, 1),  # 置く場所：とんっ
  # ---- はしご・弓・きのこ・はたおり（見張り台・畑・もの作りの手もとの音） ----
  'tpuni':  (['impact-sounds/*/impactSoft_heavy_00%d.ogg' % i for i in range(5)], 100, 3500, .20, 1),  # きのこをタップ：ぷにっ（やわらかい物をおす。高く鳴らす）
  'loomk':  (['impact-sounds/*/impactWood_heavy_00%d.ogg' % i for i in range(3)], 150, 3500, .16, 1),  # はたおり機のおさをうつ：ごとん
  'shutl':  (['rpg-audio/*/drawKnife%d.ogg' % i for i in range(1, 4)], 500, 7000, .30, 1),  # はたおり機のひ（シャトル）がすべる：すーっ
  # ---- せいれいの足音（footTick）：じゅうたん・ラグだけ。草・土・木・石・雪・ぬれた地面は、持ち主の録音（footstep_rec.py） ----
  'fcloth': (['impact-sounds/*/footstep_carpet_00%d.ogg' % i for i in range(5)], 100, 3000, .14, 1),  # じゅうたん・ラグ：ぽす
}
def run(a): subprocess.run(a, check=True, capture_output=True)
def clipnp(f, hp, lp, dur, o):
  # 大きい所（peak）から切る・鳴りはじめをゆっくり（att）。聞きくらべの候補のページと同じ切り方
  import numpy as np
  raw = subprocess.run(['ffmpeg', '-v', 'quiet', '-i', f, '-ac', '1', '-ar', '44100', '-af', f'highpass=f={hp},lowpass=f={lp}', '-f', 'f32le', '-'], capture_output=True).stdout
  a = np.frombuffer(raw, np.float32).copy()
  env = np.convolve(np.abs(a), np.ones(441) / 441, 'same')
  i = int(np.argmax(env > env.max() * (.5 if o.get('peak') else .03)))
  i = max(0, i - int(.012 * 44100) + int(o.get('sk', 0) * 44100)); x = a[i:i + int(dur * 44100)]
  fi = int(o.get('att', .002) * 44100); fo = min(len(x), int(.05 * 44100))
  x[:fi] *= np.linspace(0, 1, fi) ** 2; x[-fo:] *= np.linspace(1, 0, fo)
  x = x / (np.abs(x).max() + 1e-9) * 0.708
  return subprocess.run(['ffmpeg', '-v', 'quiet', '-f', 'f32le', '-ar', '44100', '-ac', '1', '-i', '-', '-codec:a', 'libmp3lame', '-b:a', '128k', '-f', 'mp3', '-'], input=x.tobytes(), capture_output=True).stdout
res = {}
for k, v in SET.items():
  pats, hp, lp, mx, rt = v[:5]; opt = v[5] if len(v) > 5 else None
  if ONLY and k not in ONLY: continue
  res[k] = []
  for n, pat in enumerate(pats):
    fs = glob.glob(os.path.join(SRC, pat))
    if not fs: sys.exit('みつからない: ' + pat)
    if opt is not None:
      b = clipnp(fs[0], hp, lp, mx, opt[n] if isinstance(opt, list) else opt)
      name = hashlib.sha1(b).hexdigest()[:10] + '.mp3'
      open(os.path.join(OUT, name), 'wb').write(b); res[k].append('assets/g/' + name); continue
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
