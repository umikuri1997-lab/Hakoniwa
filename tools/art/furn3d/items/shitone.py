# 夜のしとね（shitone、闇）：夜つゆ草をつめた、ひくい寝床のしきもの。紺の布に、月と星のもよう。まくらつき。
# 設計図（じっさいに作れる組み方。単位はマス）
#   しきもの：やわらかい布の形（x 0.10〜0.90・y 0.28〜0.94・高さ0〜0.10）、紺。もよう：うすい黄色の星（小さな四角）と、三日月。
#   まくら：うすい青のまくら（x 0.24〜0.76・y 0.30〜0.46・高さ0.10〜0.18、やわらかい形）。
from blueprint import Part as P
from common import *
import math
ID='shitone';BOTTOM=60;GRAD=True
VIEWS=[('shitone',0)]
NAVY=(92,100,150);STAR=(246,232,160);PIL=(196,210,236)
def deco(x,y,z):
    for sx,sy in((0.30,0.62),(0.62,0.70),(0.48,0.84),(0.76,0.56),(0.22,0.86)):
        if abs(x-sx)<0.025 and abs(y-sy)<0.025:return STAR
    if 0.05<math.hypot(x-0.70,y-0.82)<0.08 and math.hypot(x-0.73,y-0.80)>0.06:return STAR
    return NAVY
def PARTS():
    s=notex(P('しきもの','loft',soft(0.10,0.28,0.90,0.94,0.0,0.10,rc=0.08,re=0.04),NAVY,note='床におく'));s.soft=True;s.decal=deco;L=[s]
    p=notex(P('まくら','loft',soft(0.24,0.30,0.76,0.46,0.10,0.18,rc=0.06,re=0.035),PIL,on=('しきもの',)));p.soft=True;L.append(p)
    return L
TONE5=True
