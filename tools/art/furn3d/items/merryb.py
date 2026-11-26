# こわれたメリーゴーラウンド（merryb）：クォータービューの3D（2×2マス）。merry と同じ組み方（tools/art/handoff3d/rides.py の carousel の broken=True）。
# 色がさめて（faded）、屋根のしまが2まいぬけ、旗はおれ、柵・馬・屋根の支えが1本ずつこわれている。動かない1まい（床の角度 0.6）。
from ride_common import *
ID='merryb';GRAD=True;TONE5=True;DITHER=0;STREAK=(.22,.13);MERGE=0;SZ=(2,2);FRAMES=1
VIEWS=[('merryb',0)]
CX,CY=1.0,1.0
CENTER=(CX,CY,1.2);PBOX=box(CX,CY,1.55,1.55,3.65)
def PARTS():return []
def EXTRA(sc):put(sc,RD.carousel,CX,CY,.6,True,faded=True)
