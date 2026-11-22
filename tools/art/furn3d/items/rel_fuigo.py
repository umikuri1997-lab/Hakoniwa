# 炉のふいご（rel_fuigo）：マグマのほらあなで見つかる、むかしの道具。かざり。
# 設計図（単位はマス）
#   下の板・上の板：しずくの形の木の板2まい（長さ0.46・はば0.30、あつさ0.03）。下の板は地面（高さ0〜0.03）、上の板は少しひらいて（うしろが高い、高さ0.13〜0.22）。
#   かわ：2まいの板のあいだの、こげた皮（板のふちにそう）。
#   口：板の先の、金ものの細い口（太さ0.03、長さ0.14）。
#   取っ手：板のうしろの、2本の木の取っ手。
from blueprint import Part as P
from common import *
import math
ID='rel_fuigo';GRAD=True;BOTTOM=58
VIEWS=[('rel_fuigo',0)]
CX,CY=0.52,0.58;LEATHER=(150,104,82);NOZ=(150,120,96)
def PARTS():
    L=[]
    base=[(CX-0.16,CY),(CX-0.08,CY-0.14),(CX+0.06,CY-0.15),(CX+0.16,CY-0.08),(CX+0.18,CY),(CX+0.16,CY+0.08),(CX+0.06,CY+0.15),(CX-0.08,CY+0.14)]
    L.append(notex(P('下の板','prism',(base,0.0,0.03,'z'),WOOD,note='地面におく')))
    lp=P('かわ','loft',[( [(x,y) for x,y in base],0.03),([(CX+(x-CX)*0.92,CY+(y-CY)*0.92) for x,y in base],0.10),([(x,y) for x,y in base],0.15)],LEATHER,on=('下の板',),note='板のあいだ');lp.tex=False;L.append(lp)
    L.append(notex(P('上の板','prism',(base,0.15,0.18,'z'),WOOD,on=('かわ',),note='かわの上')))
    L.append(MT2(P('口','tube',([(CX-0.15,CY,0.09),(CX-0.30,CY,0.06)],0.03),NOZ,on=('下の板',),note='板の先')))
    for dy in(-0.06,0.06):
        L.append(notex(P('取っ手%+.2f'%dy,'tube',([(CX+0.17,CY+dy,0.02),(CX+0.32,CY+dy*1.4,0.03)],0.022),WOOD,on=('下の板',),note='うしろ')))
        L.append(notex(P('上の取っ手%+.2f'%dy,'tube',([(CX+0.17,CY+dy,0.165),(CX+0.32,CY+dy*1.4,0.23)],0.022),WOOD,on=('上の板',),note='うしろ')))
    return L
def MT2(p):p.metal=True;p.tex=False;return p
TONE5=True
