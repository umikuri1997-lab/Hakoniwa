# かけたつるはし（rel_tsuru）：古い採掘場で見つかる、むかしの道具。かざり。
# 設計図（単位はマス）
#   石：地面の上の、ひくい石のかたまり（半径0.20・高さ0〜0.10）。
#   頭：石に、かた方の先を打ちこんだ鉄の頭。弓の形にまがった太さ0.035の棒。ささった先（左）は、弓なりにまがって石の中へ、のこったほう（右）は、とちゅうでかけて短い。
#   柄：頭のまん中から、上へのびる木の柄（太さ0.034・長さ0.36）。柄は少しうしろへたおれる（頭が石にささっているので）。
#   くさび：柄と頭のつなぎ目の、鉄の輪。
from blueprint import Part as P
from common import *
import math
ID='rel_tsuru';GRAD=True;BOTTOM=58
VIEWS=[('rel_tsuru',0)]
CX,CY=0.50,0.58;IRON=(150,150,158);ROCK=(150,138,120);DK=(118,112,110)
def MT(p):p.metal=True;p.tex=False;return p
def PARTS():
    L=[]
    r=P('石','lathe',(CX,CY,[(0.0,0.0),(0.15,0.0),(0.13,0.03),(0.08,0.055),(0.0,0.06)]),ROCK,detail=24,note='地面におく');r.tex=False;r.stone=True;r.curve=True;L.append(r)
    hx,hy,hz=CX+0.04,CY,0.20          # 頭のまん中（柄のつけね）
    head=[(CX-0.10,CY,0.02),(CX-0.13,CY,0.09),(CX-0.08,CY,0.165),(hx,hy,hz),(CX+0.12,CY,0.195),(CX+0.17,CY,0.17)]   # 右は、かけて短い
    L.append(MT(P('頭','tube',(head,0.04),IRON,on=('石',),note='左の先を石に打ちこむ')))
    L.append(MT(P('かけ口','cyl',(CX+0.175,CY,0.042,0.15,0.19),DK,detail=10,on=('頭',),note='かけたはし')))
    L.append(notex(P('柄','tube',([(hx,hy,hz),(hx+0.04,hy-0.05,hz+0.36)],0.034),WOOD,on=('頭',),note='頭のまん中から上へ')))
    L.append(MT(P('くさび','ring',(hx,hy,0.025,0.045,hz-0.02,hz+0.03),DK,detail=12,on=('頭','柄'),note='つなぎ目の輪')))
    return L
TONE5=True
