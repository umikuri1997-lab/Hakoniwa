# 岩（rock）：モデルは使わずに組む。いまの絵と同じデザイン：まん中に、上がとがった大きな岩、その左手前と右手前に小さな岩。
# どの岩も、面のはっきりした角ばった形（点をまいて、そのまわりをつつむ形 ConvexHull）。かげは面ごと（なめらかにしない）。
# 色は、いまの絵の青みのある灰色。
# 設計図（単位はマス。地面 z=0）：
#   大きな岩：まん中 (0.50, 0.44)、はば 0.96・おく 0.64・高さ 0.82（持ち主の指示：石でなく岩なので、大きく）。てっぺんは少し左おく。
#   左の小さな岩：(0.12, 0.74)、はば 0.38・おく 0.30・高さ 0.28。右の小さな岩：(0.88, 0.76)、はば 0.32・おく 0.26・高さ 0.22。
import numpy as np
from scipy.spatial import ConvexHull
ID='rock';GRAD=True;BOTTOM=60
VIEWS=[('rock',0)]
COL=(176,178,198)
ROCKS=[((0.50,0.44),(0.96,0.64,0.82),(-0.10,-0.05),1),((0.12,0.74),(0.38,0.30,0.28),(0.0,0.0),2),((0.88,0.76),(0.32,0.26,0.22),(0.02,0.0),3)]
def stone(sc,c,sz,peak,seed):
    rs=np.random.RandomState(seed);w,d,h=sz;P=[]
    big=w>0.6
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
