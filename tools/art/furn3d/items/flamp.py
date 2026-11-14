# フロアランプ（flamp）：いまの絵と同じデザイン・同じ大きさ。木のまるい台と柱に、ひだのある布のかさ。ひくひもつき。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（44×72ドット）に合わせた）
#   台：木のまるい台（半径0.16・高さ0〜0.06）。
#   柱：木のまるい柱（半径0.042・高さ0.06〜0.74）。台のまん中にさす。
#   かさ：布のかさ（下の半径0.32・上の半径0.22、高さ0.62〜0.88）。まわりに、ひだ（24本）。柱のてっぺんの金具にのせる。中の明かりですけて光る（かげをつけない。上ほど明るいグラデーション、ひだはこい・うすいの2つの色）。輪郭線は、あざやかさ+10（光る布が1トーンに見えないように）。上の口は、まん中（電球）ほど白く、ふちへいくほどあたたかい黄色のグラデーション。
#   ひくひも：かさの右下から、たらす（長さ0.12）。さきに木の玉。
from blueprint import Part as P
from common import *
import math
ID='flamp';GRAD=True;OSAT=10;BOTTOM=63
VIEWS=[('flamp',0)]
CX,CY=0.50,0.62;SHADE=(250,244,226);LIT=(255,240,190)
def GL(p):p.glow=True;p.tex=False;return p
def PARTS():
    L=[P('台','lathe',(CX,CY,[(0.0,0.0),(0.16,0.0),(0.16,0.04),(0.13,0.06),(0.0,0.06)]),WOOD,detail=32,note='地面におく')]
    L.append(P('柱','cyl',(CX,CY,0.042,0.06,0.74),WOOD,detail=16,on=('台',),note='台のまん中にさす'))
    n=48;pr=[]
    L.append(PLEAT(GL(P('かさ','loft',[([(CX+(0.32+(0.012 if k%2 else 0))*math.cos(2*math.pi*k/n),CY+(0.32+(0.012 if k%2 else 0))*math.sin(2*math.pi*k/n)) for k in range(n)],0.62),
        ([(CX+(0.22+(0.008 if k%2 else 0))*math.cos(2*math.pi*k/n),CY+(0.17+(0.008 if k%2 else 0))*math.sin(2*math.pi*k/n)) for k in range(n)],0.88)],SHADE,on=('柱',),note='柱のてっぺんの金具にのせる。ひだ24本'))))
    m=GL(P('かさの口','cyl',(CX,CY,0.215,0.875,0.882),LIT,detail=32,on=('かさ',),note='中の明かりで明るい'))
    def mcol(x,y,z):   # かさの口：まん中（電球）ほど白く明るく、ふちへいくほど、あたたかい黄色
        t=min(1,math.hypot(x-CX,y-CY)/0.215)
        return (255,252,236) if t<0.3 else (255,242,200) if t<0.55 else (252,228,168) if t<0.8 else (244,214,150)
    m.decal=mcol;L.append(m)
    x=CX+0.22
    L.append(notex(P('ひくひも','rope',((x,CY+0.20,0.66),(x,CY+0.20,0.54),0.006),(176,150,110),on=('かさ',),note='かさの右下からたらす')))
    L.append(P('ひもの玉','ball',(x,CY+0.20,0.53,0.018),WOOD,on=('ひくひも',),note='ひものさき'))
    return L
SHLO=(232,214,178);SHHI=(255,248,226)   # かさの色：下のふち（少しこい）→ 上（明るい）
def PLEAT(p):   # ひだ：まわりの角度で、24本のこい・うすいのすじ。上ほど明るく、下のふちほど少しこい（中の明かりのグラデーション）
    def f(x,y,z):
        t=max(0,min(1,(z-0.62)/0.26));c=[SHLO[k]+(SHHI[k]-SHLO[k])*t for k in range(3)]
        if int((math.atan2(y-CY,x-CX)/(2*math.pi)+1)*48)%2:c=[v*0.96 for v in c]
        return tuple(c)
    p.decal=f;return p
