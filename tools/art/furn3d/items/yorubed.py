# よぞらのベッド（yorubed）：ふつうのベッド（bed.py）と同じ作り・同じ大きさ。木はダークチェリー、かけぶとんは夜空の色に、月と星のもよう。
# 設計図：bed.py と同じ（柱・頭の板・足の板・横の板・マットレス・まくら・かけぶとん・うわシーツの折り返し）。
#   木の部品の色：ダークチェリー（明るい所の色 #86552f をもとの色にする。かげは toon で）。
#   かけぶとんの色：夜空の紺（YORU）。月（三日月、半径0.12）と星（十字）を金色（GOLD）で、3Dの面にのるもようとしてつける（sc.decal）。
#   もようは、ひろげた1まいの布の上できめる（unfold）。上の面に月と星5つ（月とはなす）、たれた所（左右・足もと）にも星をまばらに6つ。
from common import *
import bed as B
ID='yorubed';BOTTOM=B.BOTTOM
VIEWS=[('yorubed',0),('yorubed>1',1)]
CHERRY=(134,85,47);YORU=(44,62,128);GOLD=(240,204,112)
MX,MY,MR=0.60,0.62,0.12   # 月のまん中・半径（ひろげたかけぶとんの上で）
STARS=[(0.24,0.46),(0.82,0.40),(0.26,0.82),(0.86,0.86),(0.50,0.90),   # 上の面の星（月から0.14より、はなす）
       (-0.04,0.34),(-0.05,0.74),(1.04,0.52),(1.05,0.88),(0.22,1.02),(0.70,1.03)]   # たれた所（左・右・足もと）の、まばらな星
ZT=B.ZM+B.QT   # かけぶとんの上の面の高さ
def unfold(x,y,z):   # かけぶとんの面の場所を、ひろげた1まいの布の上の場所にする（たれた所は、さがった長さだけ外へ）
    d=max(0.0,ZT-z);u,v=x,y
    if x>B.X1-0.005:u=B.X1+d
    elif x<B.X0+0.005:u=B.X0-d
    if y>B.Y1-0.005:v=B.Y1+d
    return u,v
def quilt3d(x,y,z):
    if y<B.YQ+0.10:return None   # 折り返しのシーツの所は、もようなし
    u,v=unfold(x,y,z)
    d=math.hypot(u-MX,v-MY);d2=math.hypot(u-(MX+0.06),v-(MY-0.04))
    if d<MR and d2>MR*0.85:return GOLD   # 三日月
    for sx,sy in STARS:
        if(abs(u-sx)<0.010 and abs(v-sy)<0.032)or(abs(v-sy)<0.010 and abs(u-sx)<0.032):return GOLD   # 星（十字）
    return None
import math
B.QUILT=YORU
_duvet=B.duvet
def duvet(sc):   # かけぶとんの月と星は、3Dの面にのるもよう（たれた所にも、布にそって続く）
    sc.decal(quilt3d);_duvet(sc);sc.decal(None)
B.duvet=duvet
def PARTS():
    L=B.PARTS()
    for p in L:
        if tuple(p.col)==tuple(WOOD):p.col=CHERRY
    return L
EXTRA=B.EXTRA
