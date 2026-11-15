# たいこ（taiko）：木の台にのせた、前を向いた太鼓（和風・火山）。たいこの会で使う。
# 設計図（単位はマス）
#   台の柱：2本（0.07角・高さ0〜0.62）。左右（x 0.12・0.88）にまっすぐたてる（かたむけない）。
#   台の横木：柱の下（z 0.06〜0.12）と、太鼓をのせる受け（z 0.20〜0.26）。柱にとめる。
#   胴：木の胴（半径0.30・中心 x0.50・z0.55、おく y0.47〜0.66）。前とおくに皮。胴は赤みのある茶色。受けの上にのせ、柱にはさむ。
#   皮：前とおくの面に、うすいクリーム色の皮（半径0.30）。ふちに、びょう（もよう）。
from blueprint import Part as P
from common import *
import math
ID='taiko';GRAD=True;BOTTOM=63
VIEWS=[('taiko',0)]
CX,CZ,R=0.50,0.55,0.29;Y0,Y1=0.47,0.66
BODY=(206,112,86);HIDE=(246,232,200);TACK=(150,120,96)
def circ(r,n=48):return [(CX+r*math.cos(2*math.pi*k/n),CZ+r*math.sin(2*math.pi*k/n)) for k in range(n)]
def tacks(x,y,z):
    d=math.hypot(x-CX,z-CZ)
    if 0.245<d<0.272 and math.cos(16*math.atan2(z-CZ,x-CX))>0.82:return TACK
    if d>0.272:return (220,200,170)
    return None
def PARTS():
    L=[]
    for nm,x in(('左',0.12),('右',0.88)):L.append(P('台の柱（%s）'%nm,'box',(x-0.035,0.50,0.0,x+0.035,0.60,0.62),WOOD,bevel=0,on=('ground',),note='地面にまっすぐたてる'))
    L.append(P('台の横木','box',(0.155,0.51,0.06,0.845,0.59,0.12),WOOD,bevel=0,on=('台の柱（左）','台の柱（右）'),note='柱の下'))
    L.append(P('受け','box',(0.155,0.44,0.20,0.845,0.66,0.26),WOOD,bevel=0,on=('台の柱（左）','台の柱（右）'),note='胴をのせる'))
    L.append(notex(P('胴','prism',(circ(R),Y0+0.012,Y1-0.012),BODY,on=('受け',),note='受けの上。柱にはさむ')))
    for nm,y0,y1 in(('おくの皮',Y0,Y0+0.012),('前の皮',Y1-0.012,Y1)):
        h=notex(P(nm,'prism',(circ(R+0.012),y0,y1),HIDE,on=('胴',),note='胴の口にはる'));h.decal=tacks;L.append(h)
    return L
