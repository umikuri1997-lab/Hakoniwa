# 風見のランプ（kazelamp、風）：アカシアの柱に、つりさげたランプ。てっぺんに、風の羽の矢の風見。
# 設計図（じっさいに作れる組み方。単位はマス）
#   台：石の台（半径0.13・高さ0〜0.06）。柱：アカシアの丸い柱（半径0.04・高さ0.06〜1.12）。
#   うで：柱の高さ0.92から右へ、アカシアのうで（0.03角、長さ0.24）。さきから、くさり（太さ0.01）でランプをつるす。
#   ランプ：空き缶でつくった、まるい屋根と台（鉄の色）、あいだのガラス（光る。高さ0.56〜0.74、半径0.08）、中に火。
#   風見：柱のさきに、横の棒（長さ0.40）。はしに、風の羽（白から水色）の矢羽と、三角の矢じり。
from blueprint import Part as P
from common import *
import math
ID='kazelamp';BOTTOM=60;GRAD=True
VIEWS=[('kazelamp',0)]
CX,CY=0.42,0.60;ACAC=(222,170,108);IRON=(150,150,160);STONE=(200,194,186);GLASS=(255,190,96);GLC=(255,232,150);WHITE=(250,250,246);SKY=(176,212,236)
def MT(p):p.metal=True;return p
def PARTS():
    L=[P('台','cyl',(CX,CY,0.13,0.0,0.06),STONE,detail=20,note='地面におく'),P('柱','cyl',(CX,CY,0.04,0.06,1.12),ACAC,detail=14,on=('台',),note='台の穴にさす')]
    L.append(P('うで','beam',((CX,CY,0.92),(CX+0.26,CY,0.92),0.015),ACAC,on=('柱',),note='柱をつらぬく'))
    LX=CX+0.24
    L.append(MT(P('くさり','cyl',(LX,CY,0.01,0.80,0.92),IRON,detail=6,on=('うで',))))
    L.append(MT(P('ランプの屋根','lathe',(LX,CY,[(0.0,0.74),(0.10,0.74),(0.06,0.79),(0.0,0.81)]),IRON,detail=24,on=('くさり',))))
    g=P('ガラス','cyl',(LX,CY,0.075,0.58,0.74),GLASS,detail=24,on=('ランプの屋根',));g.glow=True;g.tex=False
    g.decal=lambda x,y,z:GLC if abs(z-0.65)<0.04 else (255,212,128) if abs(z-0.65)<0.07 else GLASS;L.append(g)
    L.append(MT(P('ランプの台','lathe',(LX,CY,[(0.0,0.55),(0.09,0.55),(0.09,0.58),(0.0,0.58)]),IRON,detail=24,on=('ガラス',))))
    L.append(flame('火',LX,CY+0.06,0.59,0.10,0.035,('ランプの台',),'ガラスの中'))
    L.append(P('風見のぼう','beam',((CX-0.20,CY,1.12),(CX+0.20,CY,1.12),0.012),ACAC,on=('柱',),note='柱のさき'))
    L.append(MT(P('矢じり','prism',([(CX+0.20,1.08),(CX+0.29,1.12),(CX+0.20,1.16)],CY-0.01,CY+0.01),IRON,on=('風見のぼう',))))
    f=notex(P('矢羽','prism',([(CX-0.20,1.12),(CX-0.12,1.12),(CX-0.18,1.22),(CX-0.30,1.21)],CY-0.008,CY+0.008),WHITE,on=('風見のぼう',),note='風の羽'))
    f.decal=lambda x,y,z:SKY if z>1.17 else WHITE;L.append(f)
    return L
TONE5=True
