# 運河の街灯（canallamp、水）：丸石の台に、鉄の柱。上に、四角いガラスのランプと、とがった屋根。
# 設計図（じっさいに作れる組み方。単位はマス）
#   台：丸石を2だんつんだ台（0.30角・高さ0〜0.08、0.22角・高さ0.08〜0.14）。柱：鉄の丸い柱（半径0.035・高さ0.14〜1.10）。とちゅうに、ふくらんだ輪（高さ0.30・0.80）。
#   ランプ：鉄のわく（0.20角・高さ1.10〜1.34）に、光るガラス。中に火。屋根：四角すい（高さ1.34〜1.46）と、てっぺんの玉。
from blueprint import Part as P
from common import *
ID='canallamp';BOTTOM=60;GRAD=True
VIEWS=[('canallamp',0)]
CX,CY=0.50,0.60;IRON=(120,128,140);ST=(206,210,214);GLASS=(255,190,96);GLC=(255,232,150)
def MT(p):p.metal=True;return p
def PARTS():
    L=[notex(P('台','box',(CX-0.15,CY-0.15,0,CX+0.15,CY+0.15,0.08),ST,note='地面におく')),notex(P('台2','box',(CX-0.11,CY-0.11,0.08,CX+0.11,CY+0.11,0.14),ST,on=('台',)))]
    L.append(MT(P('柱','cyl',(CX,CY,0.035,0.14,1.10),IRON,detail=12,on=('台2',))))
    for z in(0.30,0.80):L.append(MT(P('輪','cyl',(CX,CY,0.05,z-0.02,z+0.02),IRON,detail=12,on=('柱',))))
    L.append(MT(P('ランプの台','box',(CX-0.11,CY-0.11,1.10,CX+0.11,CY+0.11,1.13),IRON,on=('柱',))))
    g=P('ガラス','box',(CX-0.09,CY-0.09,1.13,CX+0.09,CY+0.09,1.34),GLASS,on=('ランプの台',));g.glow=True;g.tex=False
    g.decal=lambda x,y,z:GLC if abs(z-1.22)<0.05 else (255,212,128) if abs(z-1.22)<0.09 else GLASS;L.append(g)
    for dx in(-0.1,0.1):
        for dy in(-0.1,0.1):L.append(MT(P('わく','box',(CX+dx-0.012,CY+dy-0.012,1.13,CX+dx+0.012,CY+dy+0.012,1.34),IRON,on=('ランプの台',))))
    L.append(MT(P('屋根','pyr',(CX,CY,0.14,0.14,1.34,1.46),IRON,on=('わく',))))
    L.append(MT(P('玉','ball',(CX,CY,1.48,0.025),IRON,on=('屋根',))))
    return L
TONE5=True
