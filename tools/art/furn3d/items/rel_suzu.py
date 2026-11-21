# ゆりかごのすず（rel_suzu）：ゆりかごのへやで見つかる、むかしの道具。かざり。
# 設計図（単位はマス）
#   台：まるい金ものの台（半径0.16・高さ0〜0.04）。
#   柱：台のうしろに、まっすぐ立てた細い柱（太さ0.022・高さ0.04〜0.58）。まっすぐ立てる・かたむけない。
#   うで：柱のてっぺんから前へ出る、まがったうで（太さ0.018）。
#   すず：うでの先にさげた、つりがねの形のすず（半径0.10・高さ0.22〜0.40）と、中の玉（半径0.03）。
from blueprint import Part as P
from common import *
import math
ID='rel_suzu';GRAD=True;BOTTOM=60
VIEWS=[('rel_suzu',0)]
CX,CY=0.50,0.58;BR=(206,176,104);DK=(150,124,80)
def MT(p):p.metal=True;p.tex=False;return p
def PARTS():
    L=[MT(P('台','lathe',(CX,CY,[(0.0,0.0),(0.16,0.0),(0.16,0.02),(0.13,0.04),(0.0,0.04)]),DK,detail=32,note='地面におく'))]
    L.append(MT(P('柱','cyl',(CX,CY-0.10,0.022,0.04,0.58),DK,detail=10,on=('台',),note='台のうしろにたてる')))
    arm=[(CX,CY-0.10,0.57),(CX,CY-0.05,0.60),(CX,CY,0.57),(CX,CY,0.395)]
    L.append(MT(P('うで','tube',(arm,0.018),DK,on=('柱',),note='柱の先から前へ')))
    b=MT(P('すず','lathe',(CX,CY,[(0.0,0.40),(0.04,0.40),(0.07,0.37),(0.08,0.30),(0.10,0.24),(0.105,0.22),(0.0,0.22)]),BR,detail=32,on=('うで',),note='うでの先にさげる'));b.curve=True;b.shiny=True;L.append(b)
    L.append(MT(P('玉','ball',(CX,CY+0.02,0.21,0.03,1.0),DK,on=('すず',),note='すずの中')))
    return L
TONE5=True
