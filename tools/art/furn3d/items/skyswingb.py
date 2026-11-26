# こわれた空中ブランコ（skyswingb）：クォータービューの3D（3×3マス）。skyswing と同じ組み方（tools/art/handoff3d/rides.py の swing の broken=True）。
# 色がさめて、屋根が少しかたむき、座席2つがちぎれ、柵・腕が1本こわれている。動かない1まい（床の角度 0.6）。
from ride_common import *
ID='skyswingb';GRAD=True;TONE5=True;DITHER=0;STREAK=(.22,.13);MERGE=0;SZ=(3,3);FRAMES=1
VIEWS=[('skyswingb',0)]
CX,CY=1.5,1.5
CENTER=(CX,CY,1.2);PBOX=box(CX,CY,1.65,1.65,4.25)
def PARTS():return []
def EXTRA(sc):put(sc,RD.swing,CX,CY,.6,True,faded=True)
