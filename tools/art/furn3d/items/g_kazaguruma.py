# かざぐるまのかざり（g_kazaguruma、風のせいれいのお返し）：木の台に立てた棒の先に、4まいの羽のかざぐるま。羽は、むらさき・水色・きみどり・もも色の紙。
# 設計図（単位はマス）：台（木の輪切り、半径0.13・高さ0〜0.05、木目）→ 棒（太さ0.022、高さ0.05〜0.56、木目）→ じく（棒の先の前、小さな玉）
#   → 羽4まい（棒の先を中心に、目のほうを向いた面。紙のすじ。1まいは、まん中から外へのびて、さきが折れ返った三角。半径0.17）。
from blueprint import Part as P
from common import *
from gfcommon import *
import math
ID='g_kazaguruma';BOTTOM=46;GRAD=True;STREAK=(0.32,0.16)
VIEWS=[('g_kazaguruma',0)]
CX,CY=0.50,0.62;HZ=0.56;R=0.17
COLS=[(190,160,232),(150,204,240),(176,222,130),(244,168,196)]
def PARTS():
    L=[W(P('台','cyl',(CX,CY,0.13,0.0,0.05),WOOD,detail=32,note='地面におく'))]
    L.append(W(P('棒','cyl',(CX,CY,0.022,0.05,HZ),WOOD,detail=8,on=('台',),note='台のまん中にさす')))
    for k in range(4):
        a=math.radians(45+90*k);b=a+math.radians(80)
        pts=[(CX,HZ),(CX+R*math.cos(a),HZ+R*math.sin(a)),(CX+R*0.55*math.cos(b),HZ+R*0.55*math.sin(b))]
        L.append(PA(P('羽%d'%k,'prism',(pts,CY+0.035+0.004*k,CY+0.045+0.004*k,'y'),COLS[k],on=('棒',),note='棒の先の前。目のほうを向く')))
    p=P('じく','ball',(CX,CY+0.065,HZ,0.025),(240,206,110),on=('羽0',),note='羽のまん中をとめる');p.tex=False;p.shiny=True;L.append(p)
    return L
TONE5=True;TONE3=True   # かげは3だん・あみ少し（限定の家具。持ち主がきめた）
