#!/usr/bin/env python3
"""せいれいの動きに合わせて鳴らす本物の録音（どれも OpenGameArt の CC0）：水くみ（dscoop・dlift）。鼻歌は、いまは会話の声をゲームで切ってつなげる（audio.js の humPhrase）ので使っていない。食べる・のむ音は eat_asmr.py。切る・低い音と高い音をけずる・大きさをそろえるだけ。
元の音（<フォルダ> の中に、この名前で入れる）：
  water/  … 「40 CC0 water / splash / slime SFX」（rubberduck）の water-splash-slime-sfx.zip をひらいた物
  drink/  … 「Liquid Bottle Drink Set」（qubodup）の qubodup-bottle-and-drink-sounds.7z をひらいた物
  crunch/ … 「7 Eating Crunches」（StarNinjas）の crunch_-_tito.zip をひらいた物
  apple_bite_0.ogg … 「Apple Bite」（AntumDeluge）
  crunch_7.ogg〜crunch_10.ogg … 「Crunch sounds (burnt toast)」（cogitollc）
  ghostly_humming.ogg … 「Ghostly Humming」（AuraVoice。人の鼻歌の録音）→ 前の鼻歌（hum）。いまは使っていない
使いかた：python3 tools/sound/spirit_act.py <フォルダ>  → assets/g/<中身のsha1の先10字>.mp3 と、js/audio.js にはる SAMPLES の行"""
import sys, os, glob, hashlib, subprocess, json
import numpy as np
SRC = sys.argv[1]; SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'g')
# 名前: (元のファイル, 低い所を切る Hz, 高い所を切る Hz, 長さの上限 秒)
SET = {
  'dscoop': (['water/splash_14.ogg', 'water/splash_06.ogg'], 150, 9000, .45),        # 水くみ：バケツが水に入る「ちゃぷん」
  'dlift':  (['water/splash_10.ogg', 'water/splash_15.ogg'], 300, 9000, .40),        # 水くみ：水からひき上げる「ざばっ」
}
def clip(f, hp, lp, dur):
    a = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'quiet', '-i', f, '-ac', '1', '-ar', str(SR), '-af', f'highpass=f={hp},lowpass=f={lp}', '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).copy()
    e = np.convolve(np.abs(a), np.ones(220)/220, 'same'); i = max(0, int(np.argmax(e > e.max()*.06))-int(.005*SR))   # 鳴りはじめの少し前から
    x = a[i:i+int(dur*SR)].copy(); fo = min(len(x)//3, int(.06*SR)); x[-fo:] *= np.linspace(1, 0, fo); x[:88] *= np.linspace(0, 1, 88)
    return x/np.abs(x).max()*.708   # いちばん大きい所 -3dB
out = {}
for k, (fs, hp, lp, dur) in SET.items():
    for pat in fs:
        f = glob.glob(os.path.join(SRC, pat))[0]; x = clip(f, hp, lp, dur)
        b = subprocess.run(['ffmpeg', '-v', 'quiet', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-codec:a', 'libmp3lame', '-b:a', '128k', '-f', 'mp3', '-'], input=x.astype(np.float32).tobytes(), capture_output=True, check=True).stdout
        n = hashlib.sha1(b).hexdigest()[:10]+'.mp3'; open(os.path.join(OUT, n), 'wb').write(b); out.setdefault(k, []).append('assets/g/'+n)
a = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'quiet', '-i', os.path.join(SRC, 'ghostly_humming.ogg'), '-ac', '1', '-ar', str(SR), '-af', 'highpass=f=120,lowpass=f=5000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).copy()
hop = SR//10; rms = np.array([np.sqrt((a[i:i+hop]**2).mean()) for i in range(0, len(a)-hop, hop)]); L = 18; used = []
sc = np.array([rms[i:i+L].min() for i in range(len(rms)-L)])   # 1.8秒のあいだ、ずっと声がある（いちばん小さい所が大きい）
for i in np.argsort(-sc):
    if len(used) == 3: break
    if any(abs(i-u) < L for u in used): continue
    used.append(int(i))
for i in sorted(used):
    x = a[i*hop:i*hop+L*hop].copy(); fo = int(.25*SR); x[:fo] *= np.linspace(0, 1, fo); x[-fo:] *= np.linspace(1, 0, fo); x = x/np.abs(x).max()*.708
    b = subprocess.run(['ffmpeg', '-v', 'quiet', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-codec:a', 'libmp3lame', '-b:a', '96k', '-f', 'mp3', '-'], input=x.astype(np.float32).tobytes(), capture_output=True, check=True).stdout
    n = hashlib.sha1(b).hexdigest()[:10]+'.mp3'; open(os.path.join(OUT, n), 'wb').write(b); out.setdefault('hum', []).append('assets/g/'+n)
print('Object.assign(SAMPLES,'+json.dumps(out, separators=(',', ':'))+');')
