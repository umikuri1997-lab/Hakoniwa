# からの水晶（rel_suisho）：水晶のほらあなで見つかる、むかしの道具。かざり。
# 設計図（単位はマス）
#   台：四角い石の台（0.30×0.24・高さ0〜0.16）。上に、水晶をはめる丸いくぼみのわく（半径0.08・高さ0.16〜0.19）。
#   水晶：わくにはめた、すきとおった六角の柱（半径0.07・高さ0.17〜0.46、てっぺんはとがる 0.46〜0.56）。まっすぐ立てる・かたむけない。中はからっぽ（光らない）。
from blueprint import Part as P
from common import *
import math
ID='rel_suisho';GRAD=True;BOTTOM=60
VIEWS=[('rel_suisho',0)]
CX,CY=0.50,0.58;STONE=(190,188,182);GL=(226,232,238);RIM=(150,146,140)
def PARTS():
    L=[notex(P('台','box',(CX-0.15,CY-0.12,0.0,CX+0.15,CY+0.12,0.16),STONE,note='地面におく。石の台'))]
    L[-1].bevel=0.015
    m=P('わく','ring',(CX,CY,0.06,0.085,0.16,0.19),RIM,detail=24,on=('台',),note='台の上の丸いわく');m.metal=True;m.tex=False;L.append(m)
    g=P('水晶','lathe',(CX,CY,[(0.0,0.17),(0.07,0.17),(0.07,0.46),(0.0,0.56)]),GL,detail=6,on=('わく',),note='わくにはめる。六角の柱');g.tex=False;g.glass=True;L.append(g)
    return L
TONE5=True
