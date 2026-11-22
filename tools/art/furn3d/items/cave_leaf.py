# 足場の葉（cave:leaf）：われ目の上に、木のせいれいが置く、大きな葉。
# 設計図（単位はマス）：うすい円ばん（半径0.47・あつさ0.04）を、われ目のふちの高さに。上の面に、葉のすじ（まん中のすじと、えだのすじ）。
from blueprint import Part as P
from common import *
import math
ID='cave_leaf';TONE5=True;DITHER=0;BOTTOM=60;PARALLEL=True
VIEWS=[('cave:leaf',0)]
LEAF=(112,180,88);VEIN=(170,220,130);EDGE=(84,146,70)
def PARTS():
    p=P('葉','cyl',(0.5,0.5,0.47,0.0,0.04),LEAF,detail=28,note='われ目のふちにかける');p.tex=False
    def v(x,y,z):
        dx,dy=x-0.5,y-0.5
        if math.hypot(dx,dy)>0.42:return EDGE
        if abs(dx)<0.018:return VEIN
        for k in(-0.24,-0.06,0.12,0.28):
            if abs((dy-k)+abs(dx)*0.7)<0.014 and abs(dx)<0.34:return VEIN
        return None
    p.decal=v
    return [p]
