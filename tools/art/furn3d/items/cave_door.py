# 洞窟の石のとびら（cave:door）：道をふさぐ、1まいの大きな石の板。火のしるしが彫ってある。
# 設計図（単位はマス）：石の板（はば0.96・あつさ0.2・高さ1.05）を、道のまん中に立てる。上に、石のかさ木（はば1.0・あつさ0.26・高さ1.05〜1.2）。
#   前の面に、しるし（火）を2つ、彫って色を入れる。まん中に、たての合わせ目。
from blueprint import Part as P
from common import *
import math
ID='cave_door';GRAD=True;BOTTOM=62;PARALLEL=True
VIEWS=[('cave:door',0)]
ST=(150, 134, 120);MK=(255, 150, 74)
def PARTS():
    a=P('板','box',(0.02,0.52,0.0,0.98,0.72,1.05),ST,note='地面にたてる');a.tex=False
    def mk(x,y,z):
        if abs(x-0.5)<0.012:return tuple(int(c*0.72) for c in ST)
        for cx in(0.27,0.73):
            dx,dz=x-cx,z-0.56
            if abs(dx)+abs(dz)*0.55<0.085 and dz>-0.12:return MK
        return None
    a.decal=mk
    b=P('かさ木','box',(0.0,0.49,1.05,1.0,0.75,1.2),ST,on=('板',),note='板の上にのせる');b.tex=False
    return [a,b]
TONE5=True
