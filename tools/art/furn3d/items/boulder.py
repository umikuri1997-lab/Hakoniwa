# 大岩（boulder、火山のふもと）：トリポのまるい石（tripo/stone_round.glb）を、3Dのまま写す。
# 色は、いまの絵の、こげ茶の灰色（recol）、石のテクスチャ（p.stone）。正面に、いまの絵と同じ形のひび（もよう。こい線と、右下の明るいふち）。大きさは、いまの絵（30×29、g32）に合わせる。
from blueprint import Part as P
ID='boulder';GRAD=True;BOTTOM=64
VIEWS=[('boulder',0)]
COL=(72,62,56);CRACK=(48,40,36)
CX,CY=0.5,0.52
# ひび：正面（画面の上での場所。よこ x・たて z−0.9y）に、おれ線で描く。いまの絵と同じ形：上から下へおりて、まん中で右下へわかれ、もとの線は左下へ。
# 線は1ドット半のこい色、その右下に1ドットの明るい色（ひびのふちに光があたる）。先ほど細い。
CRK=[[(0.05,0.30),(0.02,0.22),(0.04,0.14),(0.00,0.05),(-0.05,-0.04),(-0.07,-0.12)],[(0.00,0.05),(0.07,0.01),(0.10,-0.05),(0.16,-0.08)],[(0.03,0.18),(-0.04,0.21)]]
LIT=(150,134,122);CK=1.5   # ひびの大きさ（CRK の数×CK）
def _seg(px,py,a,b):
    ax,ay=a;bx,by=b;dx,dy=bx-ax,by-ay;L=dx*dx+dy*dy or 1e-9;t=max(0,min(1,((px-ax)*dx+(py-ay)*dy)/L));qx,qy=ax+dx*t,ay+dy*t;return ((px-qx)**2+(py-qy)**2)**0.5,t,(px-qx,py-qy)
def crack(x,y,z):
    if y<CY+0.12:return None   # 正面だけ
    u,v=x-CX,(z-0.9*(y-CY))-0.12   # 正面の上での場所（まん中から）
    best=None
    for k,L in enumerate(CRK):
        n=len(L)-1
        for i,(a,b) in enumerate(zip(L,L[1:])):
            d,t,(ox,oy)=_seg(u,v,(a[0]*CK,a[1]*CK),(b[0]*CK,b[1]*CK));w=(0.018 if k==0 else 0.014)*(1-0.5*(i+t)/n)+0.005   # 先ほど細い
            if best is None or d-w<best[0]:best=(d-w,ox,oy,w)
    if best is None:return None
    e,ox,oy,w=best
    if e<0:return CRACK
    if e<0.016 and ox>-0.002 and oy<0.002:return LIT   # 右下のふち
    return None
def PARTS():
    p=P('大岩','model',('tripo/stone_round.glb',CX,CY,0,0.80,30,0,0.58),COL,on=('ground',),note='地面に置く');p.recol=COL;p.recolk=0.5;p.stone=True;p.decal=crack
    return [p]
