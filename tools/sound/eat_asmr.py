#!/usr/bin/env python3
"""せいれいが食べる・のむ音（持ち主が集めてくれた freesound の録音。tools/sound/src/eat/、出どころとライセンスは src/eat/CREDITS.txt）。
持ち主が、候補のページで聞いて「つかう」にした、ひと口ぶんを切る（音を組みたてない。切る・音のはばをけずる・大きさをそろえるだけ）。
ゲームは、食べている物ごとに、どの音かをきめて（work-fx.js の EATSND）、食べる動きのかむコマで、とても小さく鳴らす。
前の切り方は、いちばん大きい所（本当にかじった所）をさけて、静かな所をえらび、それを大きくしていたので、吐息ばかりになった（「きもい」）。
いまは、かじった瞬間（音が急に大きくなり、高い音がとがっている所）の15ms前から切り、大きさはいちばん大きい所で .5 にそろえる（静かな所を大きくしない）。
  ・かじる音：0.38秒、120〜9000Hz
  ・のみもの：0.5秒、120〜3000Hz
  ・もぐ（やわらかい物）：0.4秒、150〜2200Hz（高い音をけずらないと「カリっ」と聞こえる）
使いかた：python3 tools/sound/eat_asmr.py  → assets/g/<中身のsha1の先10字>.mp3 と、js/audio.js にはる SAMPLES の行"""
import os, glob, hashlib, subprocess, json
import numpy as np
SR = 44100; D = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(D, 'src', 'eat'); OUT = os.path.join(D, '..', '..', 'assets', 'g')
# 音のしゅるい: (長さ 秒, 低い所を切る Hz, 高い所を切る Hz, 高い所を2回切るか, はじまりのフェード 秒, うしろのフェードのわりあい)
KIND = {'crunch': (.38, 120, 9000, 0, .006, .45), 'drink': (.5, 120, 3000, 0, .006, .45), 'soft': (.4, 150, 2200, 1, .01, .5)}
KOF = {'ea_water': 'drink', 'ea_tea': 'drink', 'ea_soft': 'soft'}
# 持ち主がえらんだ物：(名前, 元の録音の番号, 切りはじめのサンプル)。うしろは、えらんだときのファイル名
PICK = [
  ('ea_apple', '01', 25341),   # 0867936294
  ('ea_apple', '11', 465888),   # 2f79151ffa
  ('ea_veg', '06', 590058),   # 155b1d8bef
  ('ea_veg', '06', 841573),   # f5e6a75f15
  ('ea_veg', '06', 792627),   # 2d02cdc755
  ('ea_veg', '05', 551815),   # 0c00c20764
  ('ea_cracker', '02', 223678),   # 0c566490ac
  ('ea_cracker', '02', 628295),   # 0055bcbe08
  ('ea_cracker', '02', 257900),   # 56f37dcbc5
  ('ea_cookie', '07', 498720),   # 9e41accff4
  ('ea_cookie', '07', 608900),   # 73d54dbf23
  ('ea_cookie', '17', 870849),   # cb12b64856
  ('ea_toast', '09', 644504),   # cd1dce9c00
  ('ea_toast', '18', 703106),   # a89a50853d
  ('ea_toast', '18', 9483),   # 821b1c344b
  ('ea_toast', '18', 211646),   # de9917efce
  ('ea_toast', '18', 739763),   # 69b146b2bd
  ('ea_cereal', '10', 29143),   # e4ddd16cb6
  ('ea_cereal', '10', 384441),   # c8c7163d6b
  ('ea_cereal', '10', 541142),   # 4839d2b692
  ('ea_cereal', '10', 366416),   # ad081aa964
  ('ea_nut', '14', 671149),   # 29d65ac120
  ('ea_nut', '14', 779113),   # 7647bdc663
  ('ea_nut', '14', 70748),   # cabe3dceba
  ('ea_nut', '14', 592173),   # 3d1ccaddb9
  ('ea_water', '22', 395152),   # 3db5d12b0d
  ('ea_water', '22', 165091),   # f289fc1b05
  ('ea_tea', '24', 1049382),   # f952417de8
  ('ea_tea', '24', 859787),   # 6dbe724227
  ('ea_soft', '12', 425113),   # e1ee8da194
  ('ea_soft', '12', 507670),   # 04fc7784c9
]
def load(f, hp, lp, two):
    af = f'highpass=f={hp},lowpass=f={lp}' + (f',lowpass=f={lp}' if two else '')
    return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'quiet', '-i', f, '-ac', '1', '-ar', str(SR), '-af', af, '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).copy()
res = {}
for k, nmb, s0 in PICK:
    L, hp, lp, two, fin, fout = KIND[KOF.get(k, 'crunch')]
    f = glob.glob(os.path.join(SRC, nmb+'_*.mp3'))[0]; x = load(f, hp, lp, two)[s0:s0+int(L*SR)].copy()
    fi = int(fin*SR); x[:fi] *= np.linspace(0, 1, fi); fo = int(L*fout*SR); x[-fo:] *= np.linspace(1, 0, fo)**2; x *= .5/max(1e-9, np.abs(x).max())
    b = subprocess.run(['ffmpeg', '-v', 'quiet', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-codec:a', 'libmp3lame', '-b:a', '96k', '-f', 'mp3', '-'], input=x.astype(np.float32).tobytes(), capture_output=True, check=True).stdout
    nm = hashlib.sha1(b).hexdigest()[:10]+'.mp3'; open(os.path.join(OUT, nm), 'wb').write(b); res.setdefault(k, []).append('assets/g/'+nm)
print('Object.assign(SAMPLES,'+json.dumps(res, separators=(',', ':'))+');')
