# ほりだした土器（doki）：洞窟の宝箱から出る、かざり。すやきのつぼ。胴に、なみのもよう。
# 設計図（ろくろでひいた1つの形。単位はマス）
#   つぼ：底（半径0.11）→ 胴（いちばん太い所 半径0.25・高さ0.24）→ 首（半径0.13・高さ0.44）→ ひらいた口（半径0.19・高さ0.53）。
#   口の中：口のすぐ下の、暗い円（半径0.125・高さ0.495〜0.50）。
#   もよう：胴に、なみの線1本（高さ0.25のまわり）と、肩に、まっすぐな線1本（高さ0.345）。土より少しこい色。
from blueprint import Part as P
from common import *
import math
ID='doki';GRAD=True;BOTTOM=62
VIEWS=[('doki',0)]
CX,CY=0.50,0.60;CLAY=(214,150,112);LINE=(170,104,78);INSIDE=(120,78,62)
def PARTS():
    p=P('つぼ','lathe',(CX,CY,[(0.0,0.0),(0.11,0.0),(0.17,0.04),(0.225,0.13),(0.25,0.24),(0.225,0.33),(0.165,0.40),(0.13,0.44),(0.14,0.485),(0.19,0.53),(0.165,0.535),(0.125,0.50),(0.0,0.50)]),CLAY,detail=48,note='地面におく。ろくろでひいたつぼ')
    p.tex=False;p.curve=True
    def pat(x,y,z):
        a=math.atan2(y-CY,x-CX);t=(a/(2*math.pi)*8)%1.0;w=0.25+0.035*(abs(t-0.5)*4-1)
        if abs(z-w)<0.013 or abs(z-0.345)<0.008:return LINE
        return None
    p.decal=pat
    q=P('口の中','cyl',(CX,CY,0.125,0.495,0.502),INSIDE,detail=32,on=('つぼ',),note='口の中の暗い所');q.tex=False
    return [p,q]

TONE5=True   # かげは木と同じ5色（furntone。持ち主がきめた）
