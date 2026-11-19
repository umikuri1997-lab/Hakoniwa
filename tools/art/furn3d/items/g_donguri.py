# どんぐりのランプ（g_donguri、木のせいれいのお返し）：どんぐりの形のランプ。実はたまごの形で、下はとがり、あめ色にほんのり光る。
#   上には、うろこもようのぼうし（はかま）がかぶさり、てっぺんに短いじく。とがった下のさきを、小さな木の輪の台にさして立てる。
# 設計図（単位はマス）：台（木の輪、半径0.09・高さ0〜0.04）→ 実（ろくろ：下のさき（高さ0.03）→ いちばん太い所 半径0.13（高さ0.2）→ ぼうしの下 半径0.12（高さ0.3））
#   → ぼうし（半径0.135のおわん、高さ0.28〜0.37。うろこもよう）→ じく（高さ0.37〜0.42）。
from blueprint import Part as P
from common import *
import math
ID='g_donguri';BOTTOM=46;GRAD=True
VIEWS=[('g_donguri',0)]
CX,CY=0.50,0.55;CAP=(176,128,84);CAPD=(140,98,62);NUT=(232,166,86);GLC=(255,230,150)
def PARTS():
    L=[P('台','cyl',(CX,CY,0.11,0.0,0.045),WOOD,detail=24,note='地面におく。木の輪')]
    g=P('実','lathe',(CX,CY,[(0.0,0.03),(0.035,0.05),(0.09,0.1),(0.14,0.18),(0.165,0.27),(0.16,0.35),(0.15,0.4),(0.0,0.4)]),NUT,detail=40,on=('台',),note='とがった下のさきを台にさす。中に小さな火');g.glow=True;g.tex=False
    def gc(x,y,z):
        d=math.hypot(x-CX,(z-0.24)*0.9)
        return GLC if d<0.075 else (250,204,124) if d<0.12 else None
    g.decal=gc;L.append(g)
    c=P('ぼうし','lathe',(CX,CY,[(0.0,0.38),(0.168,0.38),(0.172,0.4),(0.16,0.425),(0.12,0.445),(0.06,0.455),(0.0,0.457)]),CAP,detail=40,on=('実',),note='実の上にかぶせる');c.tex=False;c.curve=True
    def sc_(x,y,z):   # うろこもよう：ななめの格子
        a=math.atan2(y-CY,x-CX);u=a*8/math.pi+z*40;v=a*8/math.pi-z*40
        return CAPD if (math.floor(u)+math.floor(v))%2==0 and (u%1<0.3 or v%1<0.3) else None
    c.decal=sc_;L.append(c)
    L.append(notex(P('じく','cyl',(CX+0.01,CY,0.02,0.45,0.51),CAPD,detail=8,on=('ぼうし',),note='ぼうしのてっぺん')))
    return L
TONE5=True;TONE3=True   # かげは3だん・あみ少し（限定の家具。持ち主がきめた）
