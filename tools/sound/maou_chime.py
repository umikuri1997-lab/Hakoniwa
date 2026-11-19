#!/usr/bin/env python3
"""朝6時・夜12時の切りかえの音：魔王魂の曲（持ち主がえらんだ）の、はじめ10秒くらいを切った物。
  朝 dawn：maou_bgm_orchestra03.mp3　夜 midnight：maou_bgm_healing11b.mp3
  曲のファイルそのものは、魔王魂の決まり（素材の再配布をしない）のため、リポジトリに入れない。
  はじめの無音をけずる・10.5秒で切る・さいご2.5秒をゆっくり小さく・大きさを前の音と同じ -16 LUFS にそろえるだけ。
使いかた：python3 tools/sound/maou_chime.py <orchestra03.mp3> <healing11b.mp3>  → assets/g/<中身のsha1の先10字>.mp3 と SAMPLES の行"""
import sys, os, hashlib, subprocess, tempfile, json
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'g')
LEN, FADE, LUFS = 10.5, 2.5, -16
def cut(src):
  with tempfile.TemporaryDirectory() as td:
    w = os.path.join(td, 'a.wav'); m = os.path.join(td, 'b.mp3')
    subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-i', src, '-ar', '44100', '-af',
      f'silenceremove=start_periods=1:start_threshold=-60dB,atrim=0:{LEN},afade=t=in:d=0.01,afade=t=out:st={LEN-FADE}:d={FADE}', w], check=True)
    subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-i', w, '-af', f'loudnorm=I={LUFS}:TP=-1.5:LRA=11', '-ar', '44100', '-codec:a', 'libmp3lame', '-b:a', '128k', m], check=True)
    b = open(m, 'rb').read()
  n = hashlib.sha1(b).hexdigest()[:10] + '.mp3'
  open(os.path.join(OUT, n), 'wb').write(b)
  return 'assets/g/' + n
print('Object.assign(SAMPLES,' + json.dumps({'dawn': [cut(sys.argv[1])], 'midnight': [cut(sys.argv[2])]}, separators=(',', ':')) + ');')
