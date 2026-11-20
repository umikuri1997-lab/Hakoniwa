# 洞窟の石のとびら（cave:doorw）：道をふさぐ、1まいの大きな石の板。風のしるしが彫ってある。
# 設計図（単位はマス）：石の板（はば0.96・あつさ0.2・高さ1.05）を、道のまん中に立てる。上に、石のかさ木（はば1.0・あつさ0.26・高さ1.05〜1.2）。
#   前の面に、しるし（風）を2つ、彫って色を入れる。まん中に、たての合わせ目。
from blueprint import Part as P
from common import *
import math
ID='cave_doorw';GRAD=True;BOTTOM=62;PARALLEL=True
VIEWS=[('cave:doorw',0)]
ST=(128, 158, 142);MK=(226, 246, 236)
def PARTS():
    a=P('板','box',(0.02,0.52,0.0,0.98,0.72,1.05),ST,note='地面にたてる');a.tex=False
    def mk(x,y,z):
        if abs(x-0.5)<0.012:return tuple(int(c*0.72) for c in ST)
        for cx in(0.27,0.73):
            dx,dz=x-cx,z-0.56
            if (abs(math.hypot(dx,dz)-0.085)<0.02 and math.atan2(dz,dx)>-1.2) or (abs(dz+0.02)<0.018 and -0.02<dx<0.085):return MK
        return None
    a.decal=mk
    b=P('かさ木','box',(0.0,0.49,1.05,1.0,0.75,1.2),ST,on=('板',),note='板の上にのせる');b.tex=False
    return [a,b]
TONE5=True
