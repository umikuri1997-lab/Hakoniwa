# ほたるのかご（hotarukago、闇）：夜つゆ草であんだ、つりさげる虫かご。中で、ほたるのような光のつぶが光る。台は古木のぼう。
# 設計図（じっさいに作れる組み方。単位はマス）
#   ぼう：古木のぼう（半径0.03・高さ0〜0.92）と、さきから横へ出たうで（長さ0.22）。台：古木の輪切り（半径0.12・高さ0〜0.05）。
#   かご：うでのさきから、ひもでつるす。たまごの形のあみかご（半径0.12・高さ0.38〜0.66）、夜つゆ草の青みどり。たての骨8本と、よこの輪3つ。
#   光：かごの中に、光のつぶ（半径0.022）を5こ。黄みどりで光る（かげなし）。
from blueprint import Part as P
from common import *
import math
ID='hotarukago';BOTTOM=60;GRAD=True
VIEWS=[('hotarukago',0)]
CX,CY=0.40,0.60;OLD=(150,132,120);WEAVE=(132,178,164);GL=(236,250,160)
def PARTS():
    L=[P('台','cyl',(CX,CY,0.12,0.0,0.05),OLD,detail=20,note='地面におく'),P('ぼう','cyl',(CX,CY,0.03,0.05,0.92),OLD,detail=10,on=('台',))]
    L.append(P('うで','beam',((CX,CY,0.88),(CX+0.24,CY,0.88),0.018),OLD,on=('ぼう',)))
    KX=CX+0.22;L.append(notex(P('ひも','cyl',(KX,CY,0.006,0.66,0.88),WEAVE,detail=6,on=('うで',))))
    for k in range(8):
        a=math.radians(k*45);pts=[(KX+0.12*math.sin(math.pi*t)*math.cos(a),CY+0.12*math.sin(math.pi*t)*math.sin(a),0.38+0.28*t) for t in [i/8 for i in range(9)]]
        L.append(notex(P('骨%d'%k,'tube',(pts,0.008),WEAVE,on=('ひも',))))
    for z in(0.45,0.52,0.59):
        r=0.12*math.sin(math.pi*(z-0.38)/0.28);L.append(notex(P('輪','ring',(KX,CY,r-0.008,r+0.004,z-0.006,z+0.006),WEAVE,detail=24,on=('ひも',))))
    for k,(dx,dy,dz) in enumerate(((0,0,0.50),(0.05,0.02,0.56),(-0.05,-0.02,0.47),(0.02,0.04,0.60),(-0.03,0.03,0.54))):
        g=notex(P('光%d'%k,'ball',(KX+dx,CY+dy,dz,0.022),GL,on=('ひも',)));g.glow=True;L.append(g)
    return L
TONE5=True
