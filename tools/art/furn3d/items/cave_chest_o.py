# 洞窟の宝箱（cave:chest#o）：木の箱に、鉄のおび。ひらいた絵。
# 設計図（単位はマス）：箱（はば0.66・おく0.42・高さ0.3）を地面におく。ふた：かまぼこ形（高さ0.16）。うしろのちょうつがいで、ひらく。
#   鉄のおび：箱とふたの左右に、たてに2本。前に、金の錠。
from blueprint import Part as P
from common import *
import math
ID='cave_chest_o';GRAD=True;BOTTOM=60
VIEWS=[('cave:chest#o',0)]
OPEN=1;IRON=(150,146,156);GOLD=(232,196,90);DARK=(70,46,34)
X0,X1,Y0,Y1,H=0.17,0.83,0.42,0.84,0.30
def lidpts():
    pts=[(Y0,0.0)]+[(Y0+(Y1-Y0)*(0.5-0.5*math.cos(math.pi*i/8)),0.16*math.sin(math.pi*i/8)) for i in range(1,8)]+[(Y1,0.0)]
    if OPEN:
        a=math.radians(-100);ca,sa=math.cos(a),math.sin(a);pts=[(Y0+(y-Y0)*ca-z*sa,(y-Y0)*sa*-1+z*ca) for y,z in [(Y0+Y1-y,z) for y,z in pts]]
        pts=[(y-0.02,z) for y,z in pts]
    return [(y,H+z) for y,z in pts]
def PARTS():
    L=[P('箱','box',(X0,Y0,0.0,X1,Y1,H),WOOD,note='地面におく')]
    if OPEN:
        q=P('中','box',(X0+0.04,Y0+0.04,H-0.02,X1-0.04,Y1-0.04,H+0.004),DARK,on=('箱',),note='箱の中の暗い所');q.tex=False;L.append(q)
    L.append(P('ふた','prism',(lidpts(),X0,X1,'x'),WOOD,on=('箱',),note='うしろのちょうつがいで、ひらく'))
    for n,x in enumerate((X0+0.08,X1-0.14)):
        b=P('おび%d'%n,'box',(x,Y1-0.005,0.0,x+0.06,Y1+0.012,H),IRON,on=('箱',),note='箱の前の面');b.metal=True;L.append(b)
    k=P('錠','box',(0.46,Y1,H-0.11,0.54,Y1+0.02,H-0.01),GOLD,on=('箱',),note='箱の前の面');k.metal=True;L.append(k)
    return L
TONE5=True
