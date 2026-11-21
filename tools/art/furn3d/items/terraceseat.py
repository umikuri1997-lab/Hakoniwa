# テラスの席（terraceseat、水）：2×1。丸石をしいた台に、まるい木のテーブルと、いす2きゃく。
# 設計図（じっさいに作れる組み方。単位はマス）
#   台：丸石をしいた低い台（x 0.06〜1.94・y 0.30〜0.94・高さ0〜0.04）。丸石のもよう（0.16ごと、明るさを2だん）。
#   テーブル：まるい天板（半径0.26・高さ0.50〜0.54）を、まん中の脚（半径0.04）と台の足（半径0.14・高さ0.04〜0.07）でささえる。まん中 (1.0, 0.60)。
#   いす：左右に1きゃくずつ（x 0.42・1.58）。座面（0.30角・高さ0.30〜0.34）、4本の脚（0.03角）、背もたれ（外がわ、高さ0.34〜0.66）。
from blueprint import Part as P
from common import *
import math
ID='terraceseat';BOTTOM=60;GRAD=True;SZ=(2,1)
VIEWS=[('terraceseat',0)]
ST=(206,210,214);STD=(190,196,202);TOP=(236,226,206)
def PARTS():
    s=notex(P('台','box',(0.06,0.30,0.0,1.94,0.94,0.04),ST,note='地面におく'));s.decal=lambda x,y,z:ST if (int(x/0.16)+int(y/0.16))%2 else STD;L=[s]
    L.append(P('台の足','cyl',(1.0,0.60,0.14,0.04,0.07),WOOD,detail=24,on=('台',)))
    L.append(P('脚','cyl',(1.0,0.60,0.04,0.07,0.50),WOOD,detail=12,on=('台の足',)))
    L.append(P('天板','cyl',(1.0,0.60,0.26,0.50,0.54),WOOD,detail=32,on=('脚',)))
    for k,(cx,sx) in enumerate(((0.42,-1),(1.58,1))):
        nm='座面%d'%k;L.append(P(nm,'box',(cx-0.15,0.48,0.30,cx+0.15,0.78,0.34),WOOD,on=('脚%d_0'%k,)))
        for q,(dx,dy) in enumerate(((-0.12,-0.12),(0.12,-0.12),(-0.12,0.12),(0.12,0.12))):L.append(P('脚%d_%d'%(k,q),'box',(cx+dx-0.015,0.63+dy-0.015,0.04,cx+dx+0.015,0.63+dy+0.015,0.30),WOOD,on=('台',)))
        bx=cx+sx*0.13;L.append(P('背もたれ%d'%k,'box',(bx-0.02,0.50,0.34,bx+0.02,0.76,0.66),WOOD,on=(nm,)))
    return L
TONE5=True
