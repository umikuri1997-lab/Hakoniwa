#!/usr/bin/env python3
"""せいれいが食べる・のむ音（持ち主が集めてくれた freesound の録音。tools/sound/src/eat/、出どころとライセンスは src/eat/CREDITS.txt）。
かむ1回ぶん（のむ音は、ひと口ぶん）ずつ短く切って、低い音と高い音をけずり、大きさをそろえるだけ（音を組みたてない）。
人の声が入らないように：音の大きい所（かむ・のむしゅんかん）のまわりだけを切り、声の高さでくりかえす強さが大きい（声のような）所はすてる（voicy）。
ゲームは、食べている物ごとに、どの音かをきめて（work-fx.js の EATSND）、食べる動きのかむコマで、とても小さく鳴らす。
使いかた：python3 tools/sound/eat_asmr.py  → assets/g/<中身のsha1の先10字>.mp3 と、js/audio.js にはる SAMPLES の行"""
import os, glob, hashlib, subprocess, json
import numpy as np
SR = 44100; D = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(D, 'src', 'eat'); OUT = os.path.join(D, '..', '..', 'assets', 'g')
# 名前: (元の録音の番号, 切る長さ 秒, 低い所を切る Hz, 高い所を切る Hz, のむ音か)
SET = {
  'ea_apple':  (['01'], .30, 150, 11000, 0),   # りんご：しゃりっ
  'ea_melon':  (['11'], .32, 150, 10000, 0),   # スイカ：じゅわっ（みずみずしいくだもの）
  'ea_pine':   (['12'], .30, 150, 10000, 0),   # パイナップル：（ベリーなど、やわらかいくだもの）
  'ea_veg':    (['04', '05', '06'], .26, 150, 11000, 0),   # にんじん・きゅうり・セロリ：ぽりっ（生のやさい）
  'ea_cracker':(['02'], .24, 200, 11000, 0),   # クラッカー：さくっ
  'ea_cookie': (['07', '17'], .26, 150, 10000, 0),   # クッキー・ジンジャーブレッド：さくさく（おかし）
  'ea_toast':  (['09', '18'], .28, 120, 10000, 0),   # トースト・硬めのパン：ざくっ
  'ea_egg':    (['19'], .30, 100, 8000, 0),    # パンと卵：もぐっ（やわらかい物）
  'ea_cereal': (['10'], .26, 150, 10000, 0),   # シリアル：かりかり（こむぎ）
  'ea_nut':    (['14'], .22, 200, 11000, 0),   # アーモンド・くるみ：こりっ（どんぐり）
  'ea_choco':  (['16'], .26, 120, 9000, 0),    # チョコレート：ぱきっ・もぐ（あまい物）
  'ea_pickle': (['13'], .26, 150, 10000, 0),   # ピクルス：ぱりっ（きのこ・つけもの）
  'ea_noodle': (['21'], .34, 100, 8000, 0),    # 照り焼きヌードル：もぐもぐ（料理）
  'ea_water':  (['22'], .50, 100, 7000, 1),    # 水をグラスで：ごくっ
  'ea_sip':    (['23'], .55, 100, 8000, 1),    # コーヒーをすする：ずずっ（スープ）
  'ea_tea':    (['24'], .50, 100, 8000, 1),    # お茶：こくっ（あたたかい のみもの）
  'ea_shake':  (['25'], .50, 100, 8000, 1),    # ミルクシェイクをストローで：ずずー
}
def load(f, hp, lp):
    return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'quiet', '-i', f, '-ac', '1', '-ar', str(SR), '-af', f'highpass=f={hp},lowpass=f={lp}', '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).copy()
def voicy(x):
    """声らしさ（0〜1）：80〜1000Hz にしぼって、0.1秒ずつ、声の高さ（80〜400Hz）でくりかえす強さ（自己相関）。いちばん強い所"""
    import subprocess as sp
    y = np.frombuffer(sp.run(['ffmpeg', '-v', 'quiet', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', 'highpass=f=80,lowpass=f=1000', '-f', 'f32le', '-'], input=x.astype(np.float32).tobytes(), capture_output=True).stdout, np.float32)
    m = 0.0; L = int(.1*SR); lo, hi = int(SR/400), int(SR/80)
    for i in range(0, len(y)-L, L//2):
        w = y[i:i+L]-y[i:i+L].mean(); r = np.correlate(w, w, 'full')[L-1:]
        if r[0] > 1e-6: m = max(m, float(r[lo:hi].max()/r[0]))
    return m
def chews(a, dur, drink, n=4):
    e = np.convolve(np.abs(a), np.ones(441)/441, 'same'); gap = int((.6 if drink else .3)*SR); out = []; used = np.zeros(len(a), bool)
    for i in np.argsort(-e[::220])*220:   # 大きい所から
        if len(out) >= n or e[i] < e.max()*.25: break
        s0 = max(0, i-int(.04*SR)); s1 = s0+int(dur*SR)
        if s1 > len(a) or used[max(0, i-gap):i+gap].any(): continue
        x = a[s0:s1].copy()
        if voicy(x) > (.85 if drink else .5): continue   # 声のような音（くりかえしの強い音）はすてる
        used[s0:s1] = True; out.append(x)
    return out
res = {}
for k, (ns, dur, hp, lp, drink) in SET.items():
    for nmb in ns:
        f = glob.glob(os.path.join(SRC, nmb+'_*.mp3'))[0]; a = load(f, hp, lp)
        for x in chews(a, dur, drink, 4 if len(ns) == 1 else 2):
            fo = int(.05*SR); x[-fo:] *= np.linspace(1, 0, fo); fi = int(.004*SR); x[:fi] *= np.linspace(0, 1, fi); x = x/np.abs(x).max()*.708
            b = subprocess.run(['ffmpeg', '-v', 'quiet', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-codec:a', 'libmp3lame', '-b:a', '96k', '-f', 'mp3', '-'], input=x.astype(np.float32).tobytes(), capture_output=True, check=True).stdout
            n = hashlib.sha1(b).hexdigest()[:10]+'.mp3'; open(os.path.join(OUT, n), 'wb').write(b); res.setdefault(k, []).append('assets/g/'+n)
    print(k, len(res.get(k, [])))
print('Object.assign(SAMPLES,'+json.dumps(res, separators=(',', ':'))+');')
