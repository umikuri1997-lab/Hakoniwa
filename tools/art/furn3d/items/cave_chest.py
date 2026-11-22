# 洞窟の宝箱（cave:chest）：木の箱に、鉄のおび。しまった絵。
# 設計図（単位はマス）：箱（はば0.66・おく0.42・高さ0.3）を地面におく。ふた：かまぼこ形（高さ0.24）。うしろのちょうつがいで、ひらく。
#   鉄のおび：箱とふたの左右に、たてに2本。前に、金の錠。木は、こい茶色（床の色とまざらないように）。
from blueprint import Part as P
from common import *
import math
ID='cave_chest';TONE5=True;DITHER=0;BOTTOM=60
VIEWS=[('cave:chest',0)]
OPEN=0;CW=(178,108,58);IRON=(150,146,156);GOLD=(232,196,90);DARK=(70,46,34)
X0,X1,Y0,Y1,H=0.17,0.83,0.42,0.84,0.30
def lidpts():
    pts=[(Y0,0.0)]+[(Y0+(Y1-Y0)*(0.5-0.5*math.cos(math.pi*i/8)),0.24*math.sin(math.pi*i/8)) for i in range(1,8)]+[(Y1,0.0)]
    if OPEN:
        a=math.radians(-100);ca,sa=math.cos(a),math.sin(a);pts=[(Y0+(y-Y0)*ca-z*sa,(y-Y0)*sa*-1+z*ca) for y,z in [(Y0+Y1-y,z) for y,z in pts]]
        pts=[(y-0.02,z) for y,z in pts]
    return [(y,H+z) for y,z in pts]
def PARTS():
    L=[P('箱','box',(X0,Y0,0.0,X1,Y1,H),CW,note='地面におく',bevel=0.025)]
    if OPEN:
        q=P('中','box',(X0+0.04,Y0+0.04,H-0.02,X1-0.04,Y1-0.04,H+0.004),DARK,on=('箱',),note='箱の中の暗い所');q.tex=False;L.append(q)
    L.append(P('ふた','prism',(lidpts(),X0,X1,'x'),CW,on=('箱',),note='うしろのちょうつがいで、ひらく'))
    for n,x in enumerate((X0+0.08,X1-0.14)):   # ふたの鉄のおび：ふたの形を少し外へ広げた、はば0.06の帯
        c=((Y0+Y1)/2,H);lp=[(c[0]+(y-c[0])*1.04,c[1]+(z-c[1])*1.06) for y,z in lidpts()];b=P('ふたのおび%d'%n,'prism',(lp,x,x+0.06,'x'),IRON,on=('ふた',));b.metal=True;L.append(b)
    for n,x in enumerate((X0+0.08,X1-0.14)):
        b=P('おび%d'%n,'box',(x,Y1-0.005,0.0,x+0.06,Y1+0.012,H),IRON,on=('箱',),note='箱の前の面');b.metal=True;L.append(b)
    k=P('錠','box',(0.44,Y1,H-0.13,0.56,Y1+0.025,H+0.01),GOLD,on=('箱',),note='箱の前の面');k.metal=True;L.append(k)
    return L
TONE5=True
