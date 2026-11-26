# こわれたコーヒーカップ（cupb）：クォータービューの3D（3×3マス）。cup と同じ組み方（tools/art/handoff3d/rides.py の cups の broken=True）。
# 色がさめて、柵・アーチの柱が1本ずつこわれ、カップ1つがかたむき取っ手がない。動かない1まい（床の角度 0.6）。
from ride_common import *
ID='cupb';GRAD=True;TONE5=True;DITHER=0;STREAK=(.22,.13);MERGE=0;SZ=(3,3);FRAMES=1
VIEWS=[('cupb',0)]
CX,CY=1.5,1.5
CENTER=(CX,CY,1.2);PBOX=box(CX,CY,1.55,1.55,3.2)
def PARTS():return []
def EXTRA(sc):put(sc,RD.cups,CX,CY,.6,True,faded=True)
