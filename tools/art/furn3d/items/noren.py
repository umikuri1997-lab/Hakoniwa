# のれん（noren）：いまの絵と同じデザイン・同じ大きさ。温泉の入り口の上にかける、木の竿と、うすい青の布3まい。まん中の布に、温泉のしるし。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（80×60ドット）に合わせた。入り口の上の高い所にかける）
#   竿：まるい木の竿（半径0.03、x=-0.10〜1.10・高さ1.55）。両はしに、まるい木の玉（半径0.045）。
#   布：うすい青の布3まい（1まいのはば0.33・高さ1.55 → 0.82、あつさ0.012）。布のあいだは0.015あける。上のはしは、布のはしを細くおり返した輪2つ（はば0.07、高さ1.50〜1.60）で竿に通す。
#   しるし：まん中の布に、温泉のしるし（おわんと、ゆらゆらの湯気3本。クリーム色。布の面のもよう）。
from blueprint import Part as P
from common import *
import math
ID='noren';GRAD=True;BOTTOM=-30   # 入り口の上の高い所にかけるので、絵は地面より上（いまの絵と同じ所）
VIEWS=[('noren',0)]
CY=0.55;CLOTH=(168,182,208);MARK=(244,236,214);ZT,ZB=1.55,0.82
def mark(x,y,z):   # 温泉のしるし：まん中の布（x 0.335〜0.665）の、おわん（下の半円の線）と、湯気3本（ゆらゆらの線）
    u=(x-0.50)/0.22;v=(z-1.10)/0.22
    if abs(math.hypot(u,v*1.4)-0.66)<0.12 and v<-0.05:return MARK   # おわん
    for k in(-0.36,0.0,0.36):
        if -0.05<v<1.05 and abs(u-k-0.10*math.sin(v*6.0))<0.09:return MARK   # 湯気
    return None
def PARTS():
    r=P('竿','frust',((-0.10,CY,ZT),(1.10,CY,ZT),0.03,0.03),WOOD,note='入り口の上の金具にかける（金具は入り口の物）');r.deco=True;L=[r]
    for k,x in enumerate((-0.10,1.10)):L.append(P('竿の玉%d'%(k+1),'ball',(x,CY,ZT,0.045),WOOD,on=('竿',),note='竿のはし'))
    for i in range(3):
        x0=-0.0+i*0.345;x1=x0+0.33
        c=notex(P('布%d'%(i+1),'box',(x0,CY+0.04,ZB,x1,CY+0.052,ZT-0.05),CLOTH,bevel=0.0,on=('竿',),note='上のはしの輪で竿に通す'));c.soft1=True
        if i==1:c.decal=mark
        L.append(c)
        for j,xt in enumerate((x0+0.035,x1-0.035)):   # 布の上のはしの、細い輪2つ
            L.append(notex(P('布の輪%d-%d'%(i+1,j+1),'box',(xt-0.035,CY-0.04,ZT-0.05,xt+0.035,CY+0.052,ZT+0.05),CLOTH,bevel=0.01,on=('竿',),note='布の上のはしを細くおり返して竿に通す輪')))
    return L
