#!/usr/bin/env python3
"""木のスツール（stool）のチップを、ドットで描きなおす（スキル pixel-redraw。大きさ 42×48・置き方はそのまま）。
絵は、丸い物のお手本 tools/art/examples/round_stool.py と同じ（丸い座面＋脚2本、食卓と同じ8色）。
直した所：色を782色 → 8色・半透明 588 → 0・輪郭を外がわ1ドットに・座面をなめらかなだ円に・ななめの脚をまっすぐに。
  python3 tools/art/stool/stool_art.py <出力.png>   # 絵だけ書き出す
  python3 tools/art/stool/stool_art.py              # チップに入れて、アトラスと chips.js を作りなおす"""
import sys, os
A = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, A); sys.path.insert(0, os.path.join(A, 'examples'))
from round_stool import draw

if __name__ == '__main__':
    p = draw()
    if len(sys.argv) > 1: p.save(sys.argv[1])
    else: p.put('stool')
