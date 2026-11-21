# 窓辺の花の鉢（madobachi、水）：粘土をやいた鉢に、アイリスの花。
# 設計図（じっさいに作れる組み方。単位はマス）
#   鉢：粘土をやいた鉢（下の半径0.16・上の半径0.22・高さ0〜0.30、上にふち）。中は土（高さ0.28）。
#   葉：剣の形の葉（細い板、長さ0.30〜0.40）を6まい、外へひらく。花：うすむらさきのアイリス3つ（だ円の花びら3まい＋黄色のまん中）。
from blueprint import Part as P
from common import *
import math
ID='madobachi';BOTTOM=58;GRAD=True
VIEWS=[('madobachi',0)]
CX,CY=0.50,0.60;CLAY=(214,156,124);CLAYD=(196,138,108);SOIL=(150,112,86);LEAF=(150,200,120);PET=(176,170,232);YEL=(248,214,110)
def PARTS():
    L=[notex(P('鉢','lathe',(CX,CY,[(0.0,0.0),(0.16,0.0),(0.20,0.24),(0.23,0.26),(0.23,0.30),(0.0,0.30)]),CLAY,detail=32,note='地面におく'))]
    L.append(notex(P('土','cyl',(CX,CY,0.19,0.27,0.29),SOIL,detail=24,on=('鉢',))))
    for k in range(6):
        a=math.radians(k*60+15);r=0.10;e=(CX+r*math.cos(a)*1.4,CY+r*math.sin(a)*0.6,0.62+0.06*(k%2))
        L.append(notex(P('葉%d'%k,'plate',((CX+0.03*math.cos(a),CY+0.03*math.sin(a),0.29),e,0.05,0.012),LEAF,on=('土',))))
    for k,(dx,dz) in enumerate(((-0.10,0.66),(0.06,0.74),(0.13,0.60))):
        x,z=CX+dx,dz;L.append(notex(P('くき%d'%k,'cyl',(x,CY+0.02,0.012,0.29,z),LEAF,detail=6,on=('土',))))
        for q in range(3):
            a=math.radians(90+q*120);L.append(notex(P('花びら%d_%d'%(k,q),'egg',(x+0.045*math.cos(a),CY+0.04,z+0.035*math.sin(a),0.045,0.02,0.035,0),PET,on=('くき%d'%k,))))
        L.append(notex(P('花のまん中%d'%k,'ball',(x,CY+0.05,z,0.016),YEL,on=('くき%d'%k,))))
    return L
TONE5=True
