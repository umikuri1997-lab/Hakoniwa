# 黒い水のびん（rel_bin）：地底のみずうみで見つかる、むかしの道具。かざり。
# 設計図（単位はマス）
#   びん：まるい胴のガラスのびん（底の半径0.12・胴の半径0.17（高さ0.16）・首の半径0.055（高さ0.34〜0.42））。まっすぐ立てる・かたむけない。
#   水：びんの中の、黒くすんだ水（高さ0.30まで）。
#   せん：首の上の、木のせん（半径0.06・高さ0.41〜0.47）。
from blueprint import Part as P
from common import *
import math
ID='rel_bin';GRAD=True;BOTTOM=58
VIEWS=[('rel_bin',0)]
CX,CY=0.50,0.58;GL=(214,226,236);WA=(34,36,58)
OUT=[(0.12,0.0),(0.16,0.05),(0.17,0.16),(0.15,0.25),(0.09,0.31),(0.055,0.34),(0.055,0.42)]
def r_at(z):
    for (r0,a),(r1,b) in zip(OUT,OUT[1:]):
        if a<=z<=b:return r0+(r1-r0)*(z-a)/max(1e-9,b-a)
    return OUT[-1][0]
def PARTS():
    L=[]
    w=P('水','lathe',(CX,CY,[(0.0,0.012)]+[(r_at(z)-0.012,z) for z in (0.012,0.05,0.16,0.25,0.29)]+[(0.0,0.29)]),WA,detail=40,note='びんの中');w.tex=False;w.gwater=True;L.append(w)
    g=P('びん','lathe',(CX,CY,[(0.0,0.0)]+OUT+[(0.043,0.42)]+[(r_at(z)-0.012,z) for z in (0.34,0.31,0.25,0.16,0.05,0.012)]+[(0.0,0.012)]),GL,detail=48,note='地面におく');g.tex=False;g.glass=True;L.append(g)
    L.append(notex(P('せん','cyl',(CX,CY,0.06,0.41,0.47),WOOD,detail=16,on=('びん',),note='首にさす')))
    return L
TONE5=True
