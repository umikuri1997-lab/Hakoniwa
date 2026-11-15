# 弓の的（mato）：わらをまるくたばねた的を、2本の柱の台にかけた物。的あてのイベントで使う。
# 設計図（じっさいに作れる組み方。単位はマス）
#   柱：2本（0.07角・高さ0〜0.95）。左右（x 0.13・0.80）にまっすぐたてる（かたむけない）。地面にうめる。
#   横木：柱と柱のあいだに2本（下 z0.10〜0.16・上 z0.86〜0.92）。柱にとめる。
#   的：わらをまるくたばねた板（半径0.30・あつさ0.09、中心 x0.50・z0.52）。前を向けて、横木2本のあいだに、柱にしばってかける。
#     前の面に、まん中から黄・赤・白・青の輪（もよう）。
from blueprint import Part as P
from common import *
import math
ID='mato';GRAD=True;BOTTOM=63
VIEWS=[('mato',0)]
CX,CZ,R=0.50,0.52,0.30;YF=0.52;YB=0.61
STRAW=(238,218,160);RINGS=[(0.08,(250,214,96)),(0.15,(232,120,104)),(0.23,(248,244,232)),(0.30,(132,170,214))]
def ring(x,y,z):
    if y<YB-0.01:return None   # 前（手前、y の大きいほう）の面だけ
    d=math.hypot(x-CX,z-CZ)
    for r,c in RINGS:
        if d<=r-0.006:return c
    return None
def PARTS():
    L=[]
    for nm,x in(('左',0.165),('右',0.835)):L.append(P('柱（%s）'%nm,'box',(x-0.035,YF+0.01,0.0,x+0.035,YB-0.01,0.95),WOOD,bevel=0,on=('ground',),note='地面にまっすぐたてる'))
    for nm,z0 in(('下',0.16),('上',0.82)):L.append(P('横木（%s）'%nm,'box',(0.20,YF+0.025,z0,0.80,YB-0.025,z0+0.06),WOOD,bevel=0,on=('柱（左）','柱（右）'),note='柱と柱のあいだ'))
    pts=[(CX+R*math.cos(2*math.pi*k/48),CZ+R*math.sin(2*math.pi*k/48)) for k in range(48)]
    t=notex(P('的','prism',(pts,YF,YB),STRAW,on=('横木（下）','横木（上）'),note='横木のあいだに、柱にしばってかける'));t.decal=ring;L.append(t)
    return L
