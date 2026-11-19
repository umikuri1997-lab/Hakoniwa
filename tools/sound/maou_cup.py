#!/usr/bin/env python3
"""大会の曲：魔王魂の曲（持ち主がえらんだ）。動く大会 cupmove・のんびりした大会 cupcalm・表彰台 cupaward（audio.js の cupMusicTick）。
  曲のファイルそのもの（もとの mp3）は、魔王魂の決まり（素材の再配布をしない）のため、tools/sound/src には入れない（朝・夜の音 maou_chime.py と同じ）。
  はじめとおわりの無音をけずる・大きさを -18 LUFS にそろえるだけ（くりかえして鳴らす）。
使いかた：python3 tools/sound/maou_cup.py <動く大会.mp3> <のんびり.mp3> <表彰台.mp3>  → assets/g/<中身のsha1の先10字>.mp3 と SAMPLES の行"""
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
K = ['cupmove', 'cupcalm', 'cupaward']
print('Object.assign(SAMPLES,' + json.dumps({k: [cut(p)] for k, p in zip(K, sys.argv[1:4])}, separators=(',', ':')) + ');')
