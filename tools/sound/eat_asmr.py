#!/usr/bin/env python3
"""せいれいが食べる・のむ音（持ち主が集めてくれた freesound の録音。tools/sound/src/eat/、出どころとライセンスは src/eat/CREDITS.txt）。
ひと口ぶんの「しゃくっ」だけを短く切って（もぐもぐ・つば・すする音はすてる）、低い音と高い音をけずり、大きさをそろえるだけ（音を組みたてない）。
人の声が入らないように：音の大きい所（かむ・のむしゅんかん）のまわりだけを切り、声の高さでくりかえす強さが大きい（声のような）所はすてる（voicy）。
ゲームは、食べている物ごとに、どの音かをきめて（work-fx.js の EATSND）、食べる動きのかむコマで、とても小さく鳴らす。
使いかた：python3 tools/sound/eat_asmr.py  → assets/g/<中身のsha1の先10字>.mp3 と、js/audio.js にはる SAMPLES の行"""
import os, glob, hashlib, subprocess, json
import numpy as np
SR = 44100; D = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(D, 'src', 'eat'); OUT = os.path.join(D, '..', '..', 'assets', 'g')
# 名前: (元の録音の番号, 切る長さ 秒, 低い所を切る Hz, 高い所を切る Hz, のむ音か)
# 前の切り方は「きもい」と言われた（かむ音の長いつづき・つばの音・すする音・ストロー）。いまは：
#   ・ひと口ぶんの「しゃくっ」「さくっ」だけを短く（0.14〜0.2秒、おわりは早く消す）。もぐもぐ・くちゃくちゃ（音のおわりが長くのこる所）はすてる（crisp）
#   ・高い所（つばの小さなプチプチ）を 5000Hz より上でけずり、低い所（口の中のこもった音）も 250Hz より下でけずる
#   ・やわらかい物（たまご・料理・いも）は、こもった1回の「もぐ」（2800Hz まで）。すする音・ストローの音は使わない
#   ・のみものは、こもった「こくっ」1回（2500Hz まで）
SET = {
  'ea_apple':  (['01', '11'], .18, 300, 5000, 0),   # りんご・スイカ：しゃくっ（くだもの）
  'ea_veg':    (['04', '05', '06'], .16, 300, 5000, 0),   # にんじん・きゅうり・セロリ：ぽりっ（生のやさい）
  'ea_cracker':(['02'], .14, 300, 5000, 0),   # クラッカー：さくっ
  'ea_cookie': (['07', '17'], .16, 300, 5000, 0),   # クッキー・ジンジャーブレッド：さくっ（おかし）
  'ea_toast':  (['09', '18'], .18, 250, 4500, 0),   # トースト・硬めのパン：ざくっ
  'ea_cereal': (['10'], .14, 300, 5000, 0),   # シリアル：かりっ（こむぎ）
  'ea_nut':    (['14'], .14, 300, 5000, 0),   # アーモンド・くるみ：こりっ（どんぐり）
  'ea_pickle': (['13'], .16, 300, 5000, 0),   # ピクルス：ぱりっ（きのこ・つけもの）
  'ea_soft':   (['19', '18'], .16, 200, 2800, 0),   # パンと卵・硬めのパン：こもった「もぐ」（たまご・いも・魚・料理）
  'ea_water':  (['22'], .26, 150, 2500, 1),    # 水をグラスで：こくっ（のみもの）
  'ea_tea':    (['24'], .26, 150, 2500, 1),    # お茶：こくっ（あたたかい のみもの・スープ）
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
def crisp(x):
    """ひと口の音らしさ：はじめ 1/3 に大きさが集まっていて（おわりがすぐ消える）、とがっている（いちばん大きい所／平均）。大きいほどよい"""
    e = x**2; n = len(e); head = e[:n//3].sum()/max(1e-9, e.sum()); crest = np.abs(x).max()/max(1e-9, np.sqrt(e.mean()))
    return head*crest
def chews(a, dur, drink, n=3, info=None):
    e = np.convolve(np.abs(a), np.ones(441)/441, 'same'); gap = int(.3*SR); cand = []; used = np.zeros(len(a), bool)
    for i in np.argsort(-e[::220])*220:   # 大きい所から、ひと口のはじまりの候補
        if len(cand) >= n*5 or e[i] < e.max()*.08: break
        s0 = max(0, i-int(.015*SR)); s1 = s0+int(dur*SR)
        if s1 > len(a) or used[max(0, i-gap):i+gap].any(): continue
        x = a[s0:s1].copy(); used[s0:s1] = True
        if voicy(x) > (.85 if drink else .5): continue   # 声のような音はすてる
        cand.append((crisp(x), s0, x))
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
            fo = int(dur*.6*SR); x[-fo:] *= np.linspace(1, 0, fo)**2; fi = int(.003*SR); x[:fi] *= np.linspace(0, 1, fi); x = x/np.abs(x).max()*.6
            b = subprocess.run(['ffmpeg', '-v', 'quiet', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-codec:a', 'libmp3lame', '-b:a', '96k', '-f', 'mp3', '-'], input=x.astype(np.float32).tobytes(), capture_output=True, check=True).stdout
            nm = hashlib.sha1(b).hexdigest()[:10]+'.mp3'; open(os.path.join(OUT, nm), 'wb').write(b); res.setdefault(k, []).append('assets/g/'+nm)
            REP.setdefault(k, []).append({'src': os.path.basename(f), 'at': t0, 'len': dur, 'hp': hp, 'lp': lp, 'file': 'assets/g/'+nm})
    print(k, len(res.get(k, [])))
if os.environ.get('EATREP'): json.dump(REP, open(os.environ['EATREP'], 'w'), ensure_ascii=False, indent=1)   # どの録音の何秒めを切ったか（たしかめのページ用）
print('Object.assign(SAMPLES,'+json.dumps(res, separators=(',', ':'))+');')
