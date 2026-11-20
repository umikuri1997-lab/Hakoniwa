# 洞窟の石のとびら（cave:door）：道をふさぐ、上のまるい大きな石の板。岩のわくにはまっている。風のしるしが彫ってある。
# 設計図（単位はマス）：石の板（はば0.76・あつさ0.16・高さ0.95、上はアーチ）を、道のまん中に立てる。まわりは、だ円の岩をつんだわく（cave_common.rockframe）。
#   前の面に、しるし（風）を2つ、彫って色を入れる。まん中に、たての合わせ目。直角を出さない（持ち主のきまり）。
from blueprint import Part as P
from common import *
from cave_common import rockframe,arch,ROCK
import math
ID='cave_doorw';TONE5=True;DITHER=0;BOTTOM=62;PARALLEL=True
VIEWS=[('cave:doorw',0)]
ST=(128,158,142);MK=(226,246,236)
def mark(x,z):
    for cx in(0.36,0.64):
        dx,dz=x-cx,z-0.5
        if (abs(math.hypot(dx,dz)-0.07)<0.017 and math.atan2(dz,dx)>-1.2) or (abs(dz+0.015)<0.016 and -0.02<dx<0.07):return MK
    return None
def PARTS():
    a=P('板','prism',(arch(0.12,0.88,0.95),0.56,0.70),ST,note='地面にたてる');a.tex=False
    a.decal=lambda x,y,z:tuple(int(c*0.72) for c in ST) if abs(x-0.5)<0.01 else mark(x,z)
    return [a]+rockframe((118,140,128))
