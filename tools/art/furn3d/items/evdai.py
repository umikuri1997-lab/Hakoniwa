# 体そうのお立ち台（evdai）：木の四角い低い台（ev-show.js の evShowGround）。
# 設計図（単位はマス）
#   わく：木の箱（0.78×0.78・高さ0〜0.10）。 上の板：よこにのびる板3まい（0.78×0.26・高さ0.10〜0.17）をわくの上にのせて、くぎでとめる（板のあいだは0.01）。
from blueprint import Part as P
from common import *
ID='evdai';BOTTOM=0;GRAD=True
VIEWS=[('evdai',0)]
X0,X1,Y0,Y1=0.11,0.89,0.11,0.89
def PARTS():
    L=[P('わく','box',(X0,Y0,0.0,X1,Y1,0.10),WOOD,bevel=0.0,note='地面にのせる、木のわく')]
    w=(Y1-Y0)/3
    for i in range(3):L.append(P('上の板%d'%(i+1),'box',(X0,Y0+w*i+0.005,0.10,X1,Y0+w*(i+1)-0.005,0.17),WOOD,bevel=0.0,on=('わく',),note='わくの上にのせて、くぎでとめる'))
    return L
TONE5=True
