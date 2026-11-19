#!/usr/bin/env python3
"""せいれいが食べる・のむ音（持ち主が集めてくれた freesound の録音。tools/sound/src/eat/、出どころとライセンスは src/eat/CREDITS.txt）。
ひと口ぶん（かじる音と、そのあとの少し）を切って（つば・すする音はすてる）、低い音と高い音をけずり、大きさをそろえるだけ（音を組みたてない）。
人の声が入らないように：音の大きい所（かむ・のむしゅんかん）のまわりだけを切り、声の高さでくりかえす強さが大きい（声のような）所はすてる（voicy）。
ゲームは、食べている物ごとに、どの音かをきめて（work-fx.js の EATSND）、食べる動きのかむコマで、とても小さく鳴らす。
使いかた：python3 tools/sound/eat_asmr.py  → assets/g/<中身のsha1の先10字>.mp3 と、js/audio.js にはる SAMPLES の行"""
import os, glob, hashlib, subprocess, json
import numpy as np
SR = 44100; D = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(D, 'src', 'eat'); OUT = os.path.join(D, '..', '..', 'assets', 'g')
# 名前: (元の録音の番号, 切る長さ 秒, 低い所を切る Hz, 高い所を切る Hz, のむ音か)
# 前の切り方は「きもい」と言われた（かむ音の長いつづき・つばの音・すする音・ストロー）。
# そのあと、0.14〜0.26秒で、いちばんとがった音だけを切ったら「ただの爆発音」と言われた（はじまりが急で、音のまん中がない）。いまは：
#   ・ひと口ぶん（かじる音と、そのあとの少し）を 0.4〜0.55秒。はじまりは 12ms でそっと入れ、うしろの 4わりで消す
#   ・いちばん大きい所（マイクに当たった「ボン」）はさけ、大きさがまん中くらいの所から、とがりすぎていない所をえらぶ（calm）
#   ・大きさは、いちばん大きい所ではなく、平均の大きさでそろえる（RMS）
#   ・高い所（つばの小さなプチプチ）は 6000Hz より上でけずり、低い所（口の中のこもった音）も 200Hz より下でけずる
#   ・やわらかい物（たまご・料理・いも）は、こもった「もぐ」（3200Hz まで）。すする音・ストローの音は使わない
#   ・のみものは、こもった「こくっ」（2800Hz まで）
SET = {
  'ea_apple':  (['01', '11'], .42, 200, 6000, 0),   # りんご・スイカ：しゃくっ（くだもの）
  'ea_veg':    (['04', '05', '06'], .4, 200, 6000, 0),   # にんじん・きゅうり・セロリ：ぽりっ（生のやさい）
  'ea_cracker':(['02'], .4, 200, 6000, 0),   # クラッカー：さくっ
  'ea_cookie': (['07', '17'], .4, 200, 6000, 0),   # クッキー・ジンジャーブレッド：さくっ（おかし）
  'ea_toast':  (['09', '18'], .42, 200, 5500, 0),   # トースト・硬めのパン：ざくっ
  'ea_cereal': (['10'], .4, 200, 6000, 0),   # シリアル：かりっ（こむぎ）
  'ea_nut':    (['14'], .4, 200, 6000, 0),   # アーモンド・くるみ：こりっ（どんぐり）
  'ea_pickle': (['13'], .4, 200, 6000, 0),   # ピクルス：ぱりっ（きのこ・つけもの）
  'ea_soft':   (['19', '18'], .45, 150, 3200, 0),   # パンと卵・硬めのパン：こもった「もぐ」（たまご・いも・魚・料理）
  'ea_water':  (['22'], .55, 120, 2800, 1),    # 水をグラスで：こくっ（のみもの）
  'ea_tea':    (['24'], .55, 120, 2800, 1),    # お茶：こくっ（あたたかい のみもの・スープ）
}
def load(f, hp, lp):
    return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'quiet', '-i', f, '-ac', '1', '-ar', str(SR), '-af', f'highpass=f={hp},lowpass=f={lp},lowpass=f={lp}', '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).copy()
def voicy(x):
    """声らしさ（0〜1）：80〜1000Hz にしぼって、0.1秒ずつ、声の高さ（80〜400Hz）でくりかえす強さ（自己相関）。いちばん強い所"""
    y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'quiet', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', 'highpass=f=80,lowpass=f=1000', '-f', 'f32le', '-'], input=x.astype(np.float32).tobytes(), capture_output=True).stdout, np.float32)
    m = 0.0; L = int(.1*SR); lo, hi = int(SR/400), int(SR/80)
    for i in range(0, len(y)-L, L//2):
        w = y[i:i+L]-y[i:i+L].mean(); r = np.correlate(w, w, 'full')[L-1:]
        if r[0] > 1e-6: m = max(m, float(r[lo:hi].max()/r[0]))
    return m
def calm(x):
    """とがりすぎていないか：いちばん大きい所／平均（crest）が小さいほどよい。音のない所ばかりの物はさける"""
    e = x**2; crest = np.abs(x).max()/max(1e-9, np.sqrt(e.mean()))
    return -crest
def chews(a, dur, drink, n=3, info=None):
    e = np.convolve(np.abs(a), np.ones(882)/882, 'same'); gap = int(dur*SR); cand = []; used = np.zeros(len(a), bool); mx = e.max()
    for i in np.argsort(-e[::220])*220:   # 大きい所から、ひと口のはじまりの候補（マイクに当たった、いちばん大きい所はさける）
        if len(cand) >= n*6 or e[i] < mx*.06: break
        if e[i] > mx*.6: continue
        s0 = max(0, i-int(.04*SR)); s1 = s0+int(dur*SR)
        if s1 > len(a) or used[max(0, i-gap):i+gap].any(): continue
        x = a[s0:s1].copy(); used[s0:s1] = True
        if voicy(x) > (.85 if drink else .5): continue   # 声のような音はすてる
        cand.append((calm(x), s0, x))
    cand.sort(key=lambda c: -c[0]); out = []
    for sc, s0, x in cand[:n]:
        out.append(x)
        if info is not None: info.append((round(s0/SR, 2), round(sc, 2)))
    return out
res = {}; REP = {}
for k, (ns, dur, hp, lp, drink) in SET.items():
    for nmb in ns:
        f = glob.glob(os.path.join(SRC, nmb+'_*.mp3'))[0]; a = load(f, hp, lp); info = []
        for x, (t0, sc) in zip(chews(a, dur, drink, 3 if len(ns) == 1 else 2, info), info):
            fo = int(dur*.4*SR); x[-fo:] *= np.linspace(1, 0, fo)**2; fi = int(.012*SR); x[:fi] *= np.linspace(0, 1, fi); x = x*(.1/max(1e-9, np.sqrt((x**2).mean()))); x = x*min(1, .5/np.abs(x).max())   # 平均の大きさでそろえ、いちばん大きい所は .5 まで
            b = subprocess.run(['ffmpeg', '-v', 'quiet', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-codec:a', 'libmp3lame', '-b:a', '96k', '-f', 'mp3', '-'], input=x.astype(np.float32).tobytes(), capture_output=True, check=True).stdout
            nm = hashlib.sha1(b).hexdigest()[:10]+'.mp3'; open(os.path.join(OUT, nm), 'wb').write(b); res.setdefault(k, []).append('assets/g/'+nm)
            REP.setdefault(k, []).append({'src': os.path.basename(f), 'at': t0, 'len': dur, 'hp': hp, 'lp': lp, 'file': 'assets/g/'+nm})
    print(k, len(res.get(k, [])))
if os.environ.get('EATREP'): json.dump(REP, open(os.environ['EATREP'], 'w'), ensure_ascii=False, indent=1)   # どの録音の何秒めを切ったか（たしかめのページ用）
print('Object.assign(SAMPLES,'+json.dumps(res, separators=(',', ':'))+');')
