# しずくのガラスばち（g_shizuku、水のせいれいのお返し）：まるいガラスのはちに、水と小石と水草。木の台にのる。
# 設計図（単位はマス）：台（木、半径0.22・高さ0〜0.05）→ はち（すけるガラス、ろくろの形。半径0.25・高さ0.05〜0.42、口は半径0.17）→ 中の水（高さ0.34まで）・底の小石3つ・水草2本。
from blueprint import Part as P
from common import *
ID='g_shizuku';BOTTOM=46;GRAD=True
VIEWS=[('g_shizuku',0)]
CX,CY=0.50,0.55
def PARTS():
    L=[P('台','cyl',(CX,CY,0.22,0.0,0.05),WOOD,detail=32,note='地面におく')]
    for k,(dx,dy,r,c) in enumerate([(-0.08,0.03,0.05,(214,206,190)),(0.06,-0.02,0.045,(196,186,170)),(0.0,0.06,0.04,(226,214,196))]):
        p=P('小石%d'%k,'ball',(CX+dx,CY+dy,0.075,r,0.6),c,on=('台',),note='はちの底');p.tex=False;L.append(p)
    for k,(dx,h) in enumerate([(-0.04,0.22),(0.05,0.17)]):
        L.append(notex(P('水草%d'%k,'cyl',(CX+dx,CY,0.018,0.06,0.06+h),(122,196,128),detail=6,on=('台',),note='底の小石のあいだ')))
    w=P('水','lathe',(CX,CY,[(0.0,0.055),(0.19,0.06),(0.235,0.12),(0.25,0.2),(0.235,0.29),(0.0,0.29)]),(150,206,236),detail=48,on=('台',),note='ガラスのはちの中の水（はちはうすく、すけるので、水の形で見せる）');w.tex=False;w.clear=True;L.append(w)
    g=P('ふち','lathe',(CX,CY,[(0.2,0.285),(0.238,0.285),(0.244,0.3),(0.238,0.315),(0.2,0.315),(0.196,0.3)]),(236,248,252),detail=48,on=('水',),note='ガラスのはちの口のふち');g.tex=False;g.shiny=True;L.append(g)
    return L
TONE5=True
