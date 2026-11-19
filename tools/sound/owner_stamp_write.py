#!/usr/bin/env python3
"""持ち主がくれた音：ハンコ（owner_stamp.mp3、0.76秒のさいごの「ぽんっ」の所だけ）と、書く音（owner_write.mp3、10秒。日記を書くあいだ、くりかえして鳴らす）。
切る・大きさをそろえる・はじめとおわりを少し小さくするだけ（音は作らない）。
使いかた：python3 tools/sound/owner_stamp_write.py  → assets/g/<中身のsha1の先10字>.mp3 と SAMPLES の行"""
import sys, os, hashlib, subprocess, tempfile, json
D = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(D, '..', '..', 'assets', 'g')
def cut(src, ss, t, fo, lufs):
  with tempfile.TemporaryDirectory() as td:
    m = os.path.join(td, 'a.mp3')
    subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-ss', str(ss), '-t', str(t), '-i', src, '-af',
      f'afade=t=in:d=0.004,afade=t=out:st={t-fo}:d={fo},loudnorm=I={lufs}:TP=-2', '-ar', '44100', '-b:a', '128k', m], check=True)
    b = open(m, 'rb').read()
  n = hashlib.sha1(b).hexdigest()[:10] + '.mp3'; open(os.path.join(OUT, n), 'wb').write(b); return 'assets/g/' + n
print('Object.assign(SAMPLES,' + json.dumps({'ostamp': [cut(os.path.join(D, 'src', 'owner_stamp.mp3'), .45, .31, .08, -18)],
  'owrite': [cut(os.path.join(D, 'src', 'owner_write.mp3'), 0, 10.2, .3, -24)]}, separators=(',', ':')) + ');')
