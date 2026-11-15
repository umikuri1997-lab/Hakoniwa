# 茶道具の台（chadogu）：ひくい木の台に、てつのかま・茶わん・茶せん・なつめをのせた物（和風・火山）。お茶のけいこで使う。
# 設計図（単位はマス）
#   台：天板（0.80×0.56・あつさ0.05・高さ0.30〜0.35）と脚4本（0.06角）。地面にたてる。
#   かま：てつのかま（ろくろの形、半径0.15・高さ0.20、ふた・つまみ）。台の左おく。
#   茶わん：やきもの（半径0.08・高さ0.07、中はくらい緑）。台の右前。
#   茶せん：竹（半径0.03・高さ0.07）。茶わんのとなり。なつめ：うるしの入れ物（半径0.045・高さ0.07）。台の右おく。
from blueprint import Part as P
from common import *
import math
ID='chadogu';GRAD=True;BOTTOM=63
VIEWS=[('chadogu',0)]
X0,X1,Y0,Y1,H=0.10,0.90,0.30,0.86,0.35
IRON=(132,128,136);BOWL=(232,214,176);MATCHA=(150,182,104);BAMBOO=(226,206,140);NATSUME=(150,84,70)
def PARTS():
    L=[]
    for nx,x in(('左',X0+0.03),('右',X1-0.09)):
        for ny,y in(('おく',Y0+0.03),('前',Y1-0.09)):L.append(P('脚（%s%s）'%(nx,ny),'box',(x,y,0,x+0.06,y+0.06,H-0.05),WOOD,bevel=0,on=('ground',),note='地面にたてる'))
    L.append(P('天板','prism',(rrect(X0,Y0,X1,Y1,0.04),H-0.05,H,'z'),WOOD,on=tuple('脚（%s%s）'%(a,b) for a in'左右' for b in('おく','前')),note='脚の上'))
    kx,ky=0.34,0.50
    L.append(notex(P('かま','lathe',(kx,ky,[(0.0,H),(0.09,H),(0.14,H+0.05),(0.15,H+0.10),(0.13,H+0.16),(0.07,H+0.19),(0.0,H+0.19)]),IRON,detail=40,on=('天板',),note='天板の上')))
    L.append(notex(P('かまのつまみ','lathe',(kx,ky,[(0.0,H+0.185),(0.025,H+0.185),(0.025,H+0.22),(0.0,H+0.225)]),(160,150,150),detail=20,on=('かま',),note='ふたのまん中')))
    bx,by=0.62,0.70
    b=notex(P('茶わん','lathe',(bx,by,[(0.0,H),(0.05,H),(0.075,H+0.03),(0.085,H+0.07),(0.07,H+0.07),(0.06,H+0.035),(0.0,H+0.02)]),BOWL,detail=32,on=('天板',),note='天板の上'))
    b.decal=lambda x,y,z:MATCHA if math.hypot(x-bx,y-by)<0.066 and z>H+0.015 else None;L.append(b)
    L.append(notex(P('茶せん','lathe',(0.76,0.66,[(0.0,H),(0.032,H),(0.026,H+0.05),(0.012,H+0.075),(0.0,H+0.075)]),BAMBOO,detail=24,on=('天板',),note='茶わんのとなり')))
    L.append(notex(P('なつめ','lathe',(0.70,0.44,[(0.0,H),(0.04,H),(0.046,H+0.035),(0.04,H+0.07),(0.0,H+0.072)]),NATSUME,detail=24,on=('天板',),note='天板の右おく')))
    return L
