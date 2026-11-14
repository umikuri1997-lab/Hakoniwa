# 岩（rock）：モデルは使わずに組む。いまの絵と同じデザイン：まん中に、上がとがった大きな岩、その左手前と右手前に小さな岩。
# どの岩も、面のはっきりした角ばった形（点をまいて、そのまわりをつつむ形 ConvexHull）。かげは面ごと（なめらかにしない）。
# 色は、いまの絵の青みのある灰色。
# 設計図（単位はマス。地面 z=0）：
#   大きな岩：まん中 (0.50, 0.46)、はば 0.74・おく 0.48・高さ 0.50。てっぺんは少し左おく。
#   左の小さな岩：(0.20, 0.72)、はば 0.30・おく 0.24・高さ 0.20。右の小さな岩：(0.80, 0.74)、はば 0.24・おく 0.20・高さ 0.16。
import numpy as np
from scipy.spatial import ConvexHull
ID='rock';GRAD=True;BOTTOM=60
VIEWS=[('rock',0)]
COL=(176,178,198)
ROCKS=[((0.50,0.46),(0.74,0.48,0.50),(-0.08,-0.04),1),((0.20,0.72),(0.30,0.24,0.20),(0.0,0.0),2),((0.80,0.74),(0.24,0.20,0.16),(0.02,0.0),3)]
def stone(sc,c,sz,peak,seed):
    rs=np.random.RandomState(seed);w,d,h=sz;P=[]
    big=w>0.5
    for z,k in(((0,1.0),(0.35,0.92),(0.7,0.62)) if big else ((0,1.0),(0.55,0.72))):
        n=7 if big else 5
        for i in range(n):
            a=2*np.pi*(i+rs.uniform(-0.25,0.25))/n;P.append((c[0]+np.cos(a)*w/2*k*rs.uniform(0.85,1.0),c[1]+np.sin(a)*d/2*k*rs.uniform(0.85,1.0),z*h))
    P.append((c[0]+peak[0],c[1]+peak[1],h));P=np.array(P);H=ConvexHull(P)
    sc.part()
    for f in H.simplices:
        a,b,e=P[f]
        if min(a[2],b[2],e[2])>=0 and max(a[2],b[2],e[2])==0:continue   # 底はいらない
        sc.tri(a,b,e,COL)
def PARTS():return []
def EXTRA(sc):
    for c,sz,pk,sd in ROCKS:stone(sc,c,sz,pk,sd)
