# どんぐりのランプ（g_w_acorn、特別な家具・木）。もらったデザインの形・色に合わせる。
# 設計図（単位はマス）：台（木の輪切り、半径0.16・高さ0〜0.05）→ こけ（台の上）→ 枝（台から上へのび、0.9でまがって前へ。とちゅうに2まいの葉が3か所）
#   → じく → どんぐりのランプ（ぼうし：うろこもよう・実：とがった下、あめ色に光る。高さ0.46〜0.8）。
from blueprint import Part as P
from common import *
from gfcommon import *
import math
ID='g_w_acorn';BOTTOM=46;GRAD=True;STREAK=(0.3,0.15)
VIEWS=[('g_w_acorn',0)]
CX,CY=0.38,0.6;LX,LY=0.66,0.6;WOODL=(216,168,112);CAP=(196,140,90);CAPD=(170,116,74);NUT=(250,196,120);GLC=(255,236,180);MOSS=(170,164,96);LEAF=(184,180,116)
def PARTS():
    L=[W(P('台','cyl',(CX,CY,0.16,0.0,0.05),WOODL,detail=32,note='地面におく'))]
    m=P('こけ','ball',(CX,CY,0.05,0.14,0.22),MOSS,on=('台',),note='台の上');m.tex=False;m.soft=True;L.append(m)
    pts=[(CX,CY,0.05),(CX-0.01,CY,0.35),(CX+0.01,CY,0.7),(CX+0.06,CY,0.88),(CX+0.16,CY,0.95),(LX-0.02,LY,0.92),(LX,LY,0.86)]
    for k,(a,b) in enumerate(zip(pts,pts[1:])):
        L.append(W(P('枝%d'%k,'frust',(a,b,0.04-0.004*k,0.036-0.004*k),WOODL,on=('台',) if k==0 else ('枝%d'%(k-1),),note='台から上へ、先は前へまがる')))
    L.append(notex(P('じく','cyl',(LX,LY,0.012,0.8,0.87),CAPD,detail=8,on=('枝5',),note='枝の先からさがる')))
    c=P('ぼうし','lathe',(LX,LY,[(0.0,0.7),(0.15,0.7),(0.155,0.72),(0.14,0.76),(0.09,0.79),(0.0,0.8)]),CAP,detail=40,on=('じく',),note='じくの下');c.tex=False;c.curve=True
    def sc_(x,y,z):
        a=(math.atan2(y-LY,x-LX)+math.pi)*10/math.pi
        return CAPD if (int(a+z*50)+int(a-z*50))%2==0 else None
    c.decal=sc_;L.append(c)
    g=P('実','lathe',(LX,LY,[(0.0,0.44),(0.03,0.45),(0.09,0.5),(0.135,0.58),(0.14,0.66),(0.0,0.7)]),NUT,detail=40,on=('ぼうし',),note='ぼうしの下にさがる。中に火');g.glow=True;g.tex=False
    g.decal=lambda x,y,z:GLC if math.hypot(x-LX,(z-0.57)*0.9)<0.07 else (252,214,150) if math.hypot(x-LX,(z-0.57)*0.9)<0.11 else None;L.append(g)
    return L
def EXTRA(sc):
    for (z,s0) in [(0.3,-1),(0.55,1),(0.78,-1)]:
        for s in(-1,1):leaf(sc,(CX,CY,z),(s0*0.9,0.15,0.5+0.3*s),0.11,0.05,LEAF,curl=0.1)
TONE5=True;TONE3=True   # かげは3だん・あみなし（特別な家具。持ち主がきめた）
