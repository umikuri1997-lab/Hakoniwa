# 洞窟のほね（cave:bone#0）：長いほね（太もものほね）：両はしがこぶのようにふくらみ、まん中がほそい。床に半分うまる。持ち主のたのみで作りなおした（太さのかわる骨 tongue・ふるい骨の色）。見た目だけのかざり。
# 設計図（単位はマス）：はば約1.2マス。床に半分うまる高さ。木と同じ5色のかげ（TONE5、あみかけなし）。
ID='cave_bone0';VIEWS=[('cave:bone#0',0)]
from blueprint import Part as P
import math
TONE5=True;DITHER=0;BOTTOM=56
B=(224,208,172);B2=(196,176,138);K=(70,54,40)
def T(name,pts,rs,col=B,on=('ground',)):
    p=P(name,'tongue',(pts,rs),col,on=on);p.tex=False;return p
POST=None
def PARTS():
    a=(-0.15,0.62,0.05);b=(1.15,0.38,0.05)
    pts=[tuple(a[i]+(b[i]-a[i])*t for i in range(3)) for t in [0,0.06,0.15,0.3,0.5,0.7,0.85,0.94,1.0]]
    rs=[0.09,0.11,0.075,0.055,0.05,0.055,0.075,0.105,0.08]
    L=[T('じく',pts,rs)]
    L.append(P('こぶ0','egg',(a[0]+0.04,a[1]-0.06,0.07,0.09,0.08,0.075,25),B,on=('じく',)))
    L.append(P('こぶ1','egg',(a[0]+0.02,a[1]+0.07,0.06,0.08,0.07,0.065,25),B2,on=('じく',)))
    L.append(P('こぶ2','egg',(b[0]-0.03,b[1]-0.07,0.07,0.1,0.08,0.08,25),B,on=('じく',)))
    return L
