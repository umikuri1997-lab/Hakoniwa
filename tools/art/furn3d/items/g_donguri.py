# どんぐりのランプ（g_donguri、木のせいれいのお返し）：どんぐりの形のランプ。実の所が光るガラス、ぼうしは木の皮の色、てっぺんに小さなじく。木の輪切りの台にのる。
# 設計図（単位はマス）：台（輪切りの丸太、半径0.2・高さ0〜0.06）→ 実（光るガラス、ろくろの形：下がまるく、半径0.15・高さ0.06〜0.36）→ ぼうし（半径0.17のドーム、高さ0.33〜0.43）→ じく（高さ0.43〜0.48）。
from blueprint import Part as P
from common import *
ID='g_donguri';BOTTOM=46;GRAD=True
VIEWS=[('g_donguri',0)]
CX,CY=0.50,0.55;CAP=(170,122,82);GLO=(255,206,118);GLC=(255,238,170)
def PARTS():
    L=[P('台','cyl',(CX,CY,0.16,0.0,0.05),WOOD,detail=32,note='地面におく。輪切りの丸太')]
    g=P('実','lathe',(CX,CY,[(0.0,0.05),(0.03,0.055),(0.08,0.085),(0.125,0.14),(0.15,0.21),(0.152,0.27),(0.14,0.33),(0.0,0.33)]),GLO,detail=40,on=('台',),note='台の上。中に火');g.glow=True;g.tex=False
    import math
    g.decal=lambda x,y,z:GLC if math.hypot(x-CX,(z-0.19)*0.9)<0.08 else (255,222,140) if math.hypot(x-CX,(z-0.19)*0.9)<0.12 else None;L.append(g)
    c=P('ぼうし','lathe',(CX,CY,[(0.0,0.31),(0.16,0.31),(0.162,0.33),(0.15,0.36),(0.115,0.385),(0.06,0.4),(0.0,0.402)]),CAP,detail=40,on=('実',),note='実の上にかぶせる');c.tex=False;c.curve=True;L.append(c)
    L.append(notex(P('じく','cyl',(CX,CY,0.022,0.40,0.45),CAP,detail=8,on=('ぼうし',),note='ぼうしのてっぺん')))
    return L
TONE5=True
