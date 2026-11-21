# 月光石のランプ（gekkolamp、闇）：石をけずった柱のさきに、うすく光る月光石の玉。
# 設計図（じっさいに作れる組み方。単位はマス）
#   台：石の台（半径0.14・高さ0〜0.06）。柱：石をけずった柱（半径0.05〜0.07、高さ0.06〜0.70、まん中が少しほそい）。
#   うけ皿：石のうけ皿（半径0.11・高さ0.70〜0.76）。玉：月光石（半径0.10、高さのまん中0.86）。光るので、かげをつけない（青白のグラデーション）。
from blueprint import Part as P
from common import *
import math
ID='gekkolamp';BOTTOM=60;GRAD=True
VIEWS=[('gekkolamp',0)]
CX,CY=0.50,0.60;ST=(178,176,170);G0=(236,244,255);G1=(206,224,250);G2=(180,204,244)
def PARTS():
    L=[notex(P('台','cyl',(CX,CY,0.14,0.0,0.06),ST,detail=24,note='地面におく'))]
    L.append(notex(P('柱','lathe',(CX,CY,[(0.0,0.06),(0.07,0.06),(0.05,0.38),(0.06,0.66),(0.07,0.70),(0.0,0.70)]),ST,detail=20,on=('台',))))
    L.append(notex(P('うけ皿','lathe',(CX,CY,[(0.0,0.70),(0.06,0.70),(0.11,0.74),(0.11,0.76),(0.0,0.76)]),ST,detail=24,on=('柱',))))
    g=P('月光石','ball',(CX,CY,0.86,0.10),G1,on=('うけ皿',));g.glow=True;g.tex=False
    g.decal=lambda x,y,z:G0 if math.hypot(x-CX+0.03,z-0.89)<0.05 else G1 if math.hypot(x-CX,z-0.86)<0.08 else G2;L.append(g)
    return L
TONE5=True
