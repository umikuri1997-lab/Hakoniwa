# こわれた観覧車（wheelb）：クォータービューの3D（3×2マス）。wheel と同じ組み方（tools/art/handoff3d/rides.py の wheel の broken=True）。
# 色がさめて、輪の一部とスポークが欠け、室2つがこわれている。動かない1まい（輪の角度 0.6）。
from ride_common import *
ID='wheelb';GRAD=True;TONE5=True;DITHER=0;STREAK=(.22,.13);MERGE=0;SZ=(3,2);FRAMES=1
VIEWS=[('wheelb',0)]
CX,CY=1.5,1.0
CENTER=(CX,CY,1.2);PBOX=box(CX,CY,1.7,1.7,4.3)
def PARTS():return []
def EXTRA(sc):put(sc,RD.wheel,CX,CY,.6,True,faded=True)
