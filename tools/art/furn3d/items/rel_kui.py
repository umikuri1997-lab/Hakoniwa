# さびたくい（rel_kui）：洞窟のねっこの坑道で見つかる、むかしの道具。かざり。
# 設計図（単位はマス）
#   根のかたまり：地面の上の、ひくい木の根のこぶ（半径0.22・高さ0〜0.12）。
#   くい：根のまん中に、まっすぐ打ちこんだ鉄のくい（半径0.045・高さ0.02〜0.62）。まっすぐ立てる・かたむけない。
#   頭：くいのてっぺんの、ひらたい頭（半径0.075・高さ0.62〜0.66）。
#   わ：くいの高さ0.40にはめた鉄の輪（半径0.06〜0.075）。
#   管：わから右へ出て、下へまがって根にささる、細い管（太さ0.02）。
from blueprint import Part as P
from common import *
import math
ID='rel_kui';GRAD=True;BOTTOM=60
VIEWS=[('rel_kui',0)]
CX,CY=0.50,0.58;RUST=(176,112,78);ROOT=(150,112,82);DK=(122,82,62)
def MT(p):p.metal=True;p.tex=False;return p
def PARTS():
    L=[]
    r=P('根','lathe',(CX,CY,[(0.0,0.0),(0.22,0.0),(0.2,0.05),(0.14,0.10),(0.06,0.12),(0.0,0.12)]),ROOT,detail=32,note='地面におく。根のこぶ');r.tex=False;r.curve=True;L.append(r)
    for k,a in enumerate((20,140,250)):
        x,y=CX+0.2*math.cos(math.radians(a)),CY+0.12*math.sin(math.radians(a))
        L.append(notex(P('根%d'%k,'tube',([(CX,CY,0.05),(x,y,0.03),(x+0.08*math.cos(math.radians(a)),y+0.05*math.sin(math.radians(a)),0.01)],0.03),ROOT,on=('根',),note='根のこぶから、外へのびる根')))
    L.append(MT(P('くい','cyl',(CX,CY,0.045,0.02,0.62),RUST,detail=16,on=('根',),note='根のまん中に、まっすぐ打ちこむ')))
    L.append(MT(P('頭','cyl',(CX,CY,0.075,0.62,0.66),DK,detail=16,on=('くい',),note='くいのてっぺん')))
    L.append(MT(P('わ','ring',(CX,CY,0.04,0.072,0.38,0.42),DK,detail=16,on=('くい',),note='くいにはめた輪')))
    pipe=[(CX+0.07,CY,0.40),(CX+0.16,CY,0.38),(CX+0.2,CY+0.02,0.3),(CX+0.2,CY+0.04,0.12),(CX+0.18,CY+0.05,0.06)]
    L.append(MT(P('管','tube',(pipe,0.022),RUST,on=('わ','根'),note='わから出て、根にささる管')))
    return L
TONE5=True
