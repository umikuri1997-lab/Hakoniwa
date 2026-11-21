# 月見台（tsukimidai、闇）：2×1。石の台に、月見だんごをのせた三方と、すすきのかわりの夜つゆ草の花びん。
# 設計図（じっさいに作れる組み方。単位はマス）
#   台：石をつんだ低い台（x 0.08〜1.92・y 0.34〜0.94・高さ0〜0.22）、上のふちに石の板（高さ0.22〜0.26）。
#   三方：古木の台（0.30角・高さ0.26〜0.38）を、台の左よりに。だんご：白い玉（半径0.045）を3だん（9・4・1こ）。
#   花びん：石の花びん（右よりに、半径0.08・高さ0.26〜0.50）に、夜つゆ草（細いくき5本、さきに光るつゆ）。
from blueprint import Part as P
from common import *
import math
ID='tsukimidai';BOTTOM=60;GRAD=True;SZ=(2,1)
VIEWS=[('tsukimidai',0)]
ST=(178,176,170);STD=(162,160,156);OLD=(150,132,120);DANGO=(250,248,238);GRASS=(132,178,164);DEW=(220,240,255)
def PARTS():
    b=notex(P('台','box',(0.08,0.34,0.0,1.92,0.94,0.22),ST,note='地面におく'));b.decal=lambda x,y,z:ST if (int(x/0.24)+int(z/0.11))%2 else STD;L=[b]
    L.append(notex(P('上の板','box',(0.05,0.31,0.22,1.95,0.97,0.26),ST,on=('台',))))
    L.append(P('三方','box',(0.50,0.50,0.26,0.80,0.80,0.38),OLD,on=('上の板',)))
    k=0
    for lv,(n,z) in enumerate(((3,0.425),(2,0.505),(1,0.585))):
        for i in range(n):
            for j in range(n):
                x=0.65+(i-(n-1)/2)*0.09;y=0.65+(j-(n-1)/2)*0.09;L.append(notex(P('だんご%d'%k,'ball',(x,y,z,0.045),DANGO,on=('三方',))));k+=1
    L.append(notex(P('花びん','lathe',(1.40,0.66,[(0.0,0.26),(0.07,0.26),(0.09,0.34),(0.06,0.46),(0.07,0.50),(0.0,0.50)]),ST,detail=20,on=('上の板',))))
    for q in range(5):
        a=math.radians(-60+q*30);e=(1.40+0.16*math.sin(a),0.66,0.50+0.30*math.cos(a)*0.9+0.06)
        L.append(notex(P('くき%d'%q,'beam',((1.40,0.66,0.48),e,0.008),GRASS,on=('花びん',))))
        d=notex(P('つゆ%d'%q,'ball',(*e,0.02),DEW,on=('くき%d'%q,)));d.glow=True;L.append(d)
    return L
TONE5=True
