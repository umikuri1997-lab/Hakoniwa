# 洞窟の、下の階へおりる所（cave:down）：岩山にあいた、まっ暗な入り口へ、自然の岩の段が下っていく（持ち主のたのみ：階段に見えるように）。
# 設計図（単位はマス）：おくに岩山（角ばった岩 hullrock を3つ、はば約1.8マス・高さ0.95〜1.3）。岩山の手前の面に、上のまるい、まっ暗な入り口（はば0.74・高さ0.95。ぜんたいを1.7倍にして、せいれいが通れる大きさ。持ち主のたのみ）。
#   入り口の前に、上の平らな岩の段を3つ（はば0.72〜0.78）（手前ほど高く・広い。入り口に近いほど暗い）。直角を出さない。色はこさの番号で写し、ゲームで階の岩の色にぬりかえる。
import numpy as np
from blueprint import Part as P
from natcommon import hullrock
from cave_common import arch
ID='cave_down';GRAD=False;SHADE=[(9,-2.5),(18,-5)];BOTTOM=60;PARALLEL=True
VIEWS=[('cave_down',0)]
PAL=[(235,235,235),(200,200,200),(160,160,160),(120,120,120),(85,85,85)]
SLAB=((0,1.0,7),(0.8,1.0,7),(1.0,0.86,7))
def PARTS():return[]
K=1.7   # 持ち主のたのみ：せいれいが通れる大きさに（入り口のはば・高さが、せいれいより大きい）
X=lambda v:0.5+(v-0.5)*K
Y=lambda v:0.62+(v-0.62)*K
def EXTRA(sc):
    for k,(x,y,r,h) in enumerate([(0.0,0.36,(0.36,0.26),1.0),(0.5,0.26,(0.46,0.28),1.3),(1.0,0.36,(0.36,0.26),0.95)]):
        hullrock(sc,(X(x),Y(y)),(r[0]*K,r[1]*K),h*K,PAL,seed=950+k,gi='m%d'%k)
    pts=[(X(px),pz*K) for px,pz in arch(0.13,0.87,0.95)];sc.texture(None);sc.material('flat');sc.smooth(False);sc.group('mouth');sc.part()   # まっ暗な入り口：岩山の手前の面にはる、上のまるい板
    c=(PAL[4][0]-40,)*3;y=Y(0.58)
    for i in range(1,len(pts)-1):
        a,b=pts[0],pts[i];d=pts[i+1];sc.tri((a[0],y,a[1]),(b[0],y,b[1]),(d[0],y,d[1]),c);sc.tri((a[0],y,a[1]),(d[0],y,d[1]),(b[0],y,b[1]),c)
    sc.group(None);sc.material(None)
    for i in range(3):   # 段：入り口に近いほど低く・せまく・暗い
        pal=PAL[min(4,2-i+1):]+[PAL[4]]*min(4,2-i+1) if i<2 else PAL
        hullrock(sc,(0.5,Y(0.68+i*0.12)),((0.36+i*0.03)*K,0.07*K),(0.03+i*0.05)*K,pal,seed=970+i,ring=SLAB,gi='s%d'%i)
