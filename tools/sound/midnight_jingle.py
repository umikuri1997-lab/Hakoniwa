#!/usr/bin/env python3
"""夜12時に鳴らす音（midnight）：OpenGameArt の短いジングル「Short Jingle」（PositiveChoice.ogg、CC0）を、切って大きさをそろえた物。
  https://opengameart.org/content/short-jingle
  作った音ではなく、できている音を使う（切る・さいごをなめらかに・いちばん大きい所を -3.4dB にそろえる）。
使いかた：python3 tools/sound/midnight_jingle.py <PositiveChoice.ogg>  → assets/g/<中身のsha1の先10字>.mp3 と SAMPLES の行"""
import sys, os, hashlib, subprocess, tempfile, json
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'g')
with tempfile.TemporaryDirectory() as td:
  w = os.path.join(td, 'a.wav'); m = os.path.join(td, 'b.mp3')
  subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-i', sys.argv[1], '-ac', '1', '-ar', '44100', '-af', 'silenceremove=start_periods=1:start_threshold=-60dB,afade=t=in:d=0.01,afade=t=out:st=3.2:d=0.7', w], check=True)
  v = subprocess.run(['ffmpeg', '-i', w, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
  pk = float(v.split('max_volume:')[1].split('dB')[0])
  subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-i', w, '-af', f'volume={-3.4-pk}dB', '-codec:a', 'libmp3lame', '-b:a', '128k', '-ac', '1', m], check=True)
  b = open(m, 'rb').read()
n = hashlib.sha1(b).hexdigest()[:10] + '.mp3'
open(os.path.join(OUT, n), 'wb').write(b)
print('Object.assign(SAMPLES,' + json.dumps({'midnight': ['assets/g/' + n]}, separators=(',', ':')) + ');')
