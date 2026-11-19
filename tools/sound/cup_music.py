#!/usr/bin/env python3
"""大会の曲（持ち主がえらぶ）。動く大会 cupmove・のんびりした大会 cupcalm・表彰台 cupaward（audio.js の cupMusicTick）。
  いま入っている曲：cupmove＝MusMus「BGM-141」（BGM:MusMus）・cupcalm＝魔王魂「fantasy05」・fest（火山のおまつりの日）＝魔王魂「ethnic09」。クレジットは設定の音のクレジット CREDIT_TXT。
  もとの mp3 は、作った人の決まり（素材の再配布をしない）のため、tools/sound/src には入れない。
  はじめとおわりの無音をけずる・大きさを -18 LUFS にそろえるだけ（曲の中身はかえない。くりかえして鳴らす）。
使いかた：python3 tools/sound/cup_music.py <cupmove|cupcalm|cupaward|fest> <曲.mp3>  → assets/g/<中身のsha1の先10字>.mp3 と SAMPLES の行"""
import sys, os, hashlib, subprocess, tempfile, json
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'g')
LUFS = -18
def cut(src):
  with tempfile.TemporaryDirectory() as td:
    w = os.path.join(td, 'a.wav'); m = os.path.join(td, 'b.mp3')
    subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-i', src, '-ar', '44100', '-af',
      'silenceremove=start_periods=1:start_threshold=-60dB,areverse,silenceremove=start_periods=1:start_threshold=-60dB,areverse', w], check=True)
    subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-i', w, '-af', f'loudnorm=I={LUFS}:TP=-1.5:LRA=11', '-ar', '44100', '-codec:a', 'libmp3lame', '-b:a', '128k', m], check=True)
    b = open(m, 'rb').read()
  n = hashlib.sha1(b).hexdigest()[:10] + '.mp3'
  open(os.path.join(OUT, n), 'wb').write(b)
  return 'assets/g/' + n
k = sys.argv[1]; assert k in ('cupmove', 'cupcalm', 'cupaward', 'fest')
print('Object.assign(SAMPLES,' + json.dumps({k: [cut(sys.argv[2])]}, separators=(',', ':')) + ');')
