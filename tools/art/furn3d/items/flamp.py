# フロアランプ（flamp）：いまの絵と同じデザイン・同じ大きさ。木のまるい台と柱に、ひだのある布のかさ。ひくひもつき。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（44×72ドット）に合わせた）
#   台：木のまるい台（半径0.16・高さ0〜0.06）。
#   柱：木のまるい柱（半径0.042・高さ0.06〜0.74）。台のまん中にさす。
#   かさ：布のかさ（下の半径0.32・上の半径0.22、高さ0.62〜0.88）。まわりに、ひだ（24本）。柱のてっぺんの金具にのせる。中の明かりですけて光る（かげをつけない。ひだは、こい・うすいの2つの色）。上の口は、さらに明るい。
#   ひくひも：かさの右下から、たらす（長さ0.12）。さきに木の玉。
from blueprint import Part as P
from common import *
import math
ID='flamp';BOTTOM=63
VIEWS=[('flamp',0)]
CX,CY=0.50,0.62;SHADE=(250,244,226);LIT=(255,240,190)
def GL(p):p.glow=True;p.tex=False;return p
def PARTS():
    L=[P('台','lathe',(CX,CY,[(0.0,0.0),(0.16,0.0),(0.16,0.04),(0.13,0.06),(0.0,0.06)]),WOOD,detail=32,note='地面におく')]
    L.append(P('柱','cyl',(CX,CY,0.042,0.06,0.74),WOOD,detail=16,on=('台',),note='台のまん中にさす'))
    n=48;pr=[]
    L.append(PLEAT(GL(P('かさ','loft',[([(CX+(0.32+(0.012 if k%2 else 0))*math.cos(2*math.pi*k/n),CY+(0.32+(0.012 if k%2 else 0))*math.sin(2*math.pi*k/n)) for k in range(n)],0.62),
        ([(CX+(0.22+(0.008 if k%2 else 0))*math.cos(2*math.pi*k/n),CY+(0.17+(0.008 if k%2 else 0))*math.sin(2*math.pi*k/n)) for k in range(n)],0.88)],SHADE,on=('柱',),note='柱のてっぺんの金具にのせる。ひだ24本'))))
    L.append(GL(P('かさの口','cyl',(CX,CY,0.215,0.875,0.882),LIT,detail=32,on=('かさ',),note='中の明かりで明るい')))
    x=CX+0.22
    L.append(notex(P('ひくひも','rope',((x,CY+0.20,0.66),(x,CY+0.20,0.54),0.006),(176,150,110),on=('かさ',),note='かさの右下からたらす')))
    L.append(P('ひもの玉','ball',(x,CY+0.20,0.53,0.018),WOOD,on=('ひくひも',),note='ひものさき'))
    return L
SHADE2=(240,230,206)   # ひだのかげの色
def PLEAT(p):   # ひだ：まわりの角度で、24本のこい・うすいのすじ
    p.decal=lambda x,y,z:SHADE2 if int((math.atan2(y-CY,x-CX)/(2*math.pi)+1)*48)%2 else None;return p
