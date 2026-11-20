# 木の枝の本だな（g_w_shelf、特別な家具・木）。もらったデザインの形・色に合わせる。前・右・左の3つの向き。
# 設計図（単位はマス）：根もと（左右2つの根、木）→ 左の幹（太さ0.07、根もとから上へ、S字にまがって0.98まで）・右の幹（0.06、0.8まで）
#   → 板3まい（幹のあいだ、高さ0.08・0.38・0.66。あつさ0.035・おく0.22。はしは丸く）→ 本（下：クリーム・緑・クリーム・緑・クリーム、上：緑・クリーム・緑）
#   → 光る石（下の板の右、ハスの形の水晶、ほんのり光る）→ 枝のさきの葉の芽（2まいずつ、5か所）。
from blueprint import Part as P
from common import *
from gfcommon import *
ID='g_w_shelf';BOTTOM=50;GRAD=True;STREAK=(0.3,0.15)
VIEWS=[('g_w_shelf',0),('g_w_shelf>1',1),('g_w_shelf>2',3)]
X0,X1,Y0,Y1=0.1,0.9,0.46,0.68;YC=(0.46+0.68)/2;WOODL=(216,168,112);LEAF=(184,180,116);BC=(236,222,196);BG=(170,176,120);GEM=(252,212,170)
import math
def PARTS():
    L=[]
    for k,(x0,x1) in enumerate([(X0-0.05,X0+0.12),(X1-0.12,X1+0.04)]):L.append(W(P('根%d'%k,'ball',((x0+x1)/2,YC,0.03,(x1-x0)/2,0.4),WOODL,on=('ground',),note='地面')))
    pts=[(X0+0.03,YC,0.03),(X0+0.06,YC,0.3),(X0+0.02,YC,0.56),(X0+0.08,YC,0.8),(X0+0.2,YC,0.98)]
    for k,(a,b) in enumerate(zip(pts,pts[1:])):L.append(W(P('左の幹%d'%k,'frust',(a,b,0.07-0.008*k,0.062-0.008*k),WOODL,on=('根0',) if k==0 else ('左の幹%d'%(k-1),),note='根もとから上へ')))
    pts=[(X1-0.05,YC,0.03),(X1-0.08,YC,0.4),(X1-0.04,YC,0.66),(X1+0.04,YC,0.8)]
    for k,(a,b) in enumerate(zip(pts,pts[1:])):L.append(W(P('右の幹%d'%k,'frust',(a,b,0.06-0.008*k,0.054-0.008*k),WOODL,on=('根1',) if k==0 else ('右の幹%d'%(k-1),),note='根もとから上へ')))
    for k,z in enumerate((0.08,0.38,0.66)):
        L.append(W(P('板%d'%k,'loft',soft(X0+0.06,Y0,X1-0.07 if k<2 else X1-0.18,Y1,z,z+0.035,0.04,0.01),WOODL,on=('左の幹0',),note='幹のあいだにわたす')))
    def books(z,cols,x):
        for k,(w,h,c) in enumerate(cols):
            L.append(notex(P('本%.2f-%d'%(z,k),'box',(x,Y0+0.03,z,x+w-0.004,Y1-0.02,z+h),c,bevel=0,on=('板0',),note='板の上')));x+=w
    books(0.115,[(0.05,0.25,BC),(0.045,0.26,BG),(0.05,0.25,BC),(0.045,0.26,BG),(0.05,0.24,BC)],X0+0.12)
    books(0.415,[(0.05,0.22,BG),(0.045,0.24,BC),(0.05,0.21,BG)],X0+0.22)
    g=P('光る石','lathe',(X1-0.2,YC,[(0.0,0.115),(0.07,0.12),(0.095,0.18),(0.06,0.24),(0.0,0.28)]),GEM,detail=6,on=('板0',),note='下の板の右');g.glow=True;g.tex=False
    g.decal=lambda x,y,z:(255,240,214) if z>0.17 else None;L.append(g)
    return L
def EXTRA(sc):
    for (x,z,a) in [(X0+0.2,0.98,0.4),(X0-0.02,0.7,-1),(X0+0.0,0.42,-1),(X1+0.04,0.8,0.6),(X1+0.02,0.3,1)]:
        for s in(-1,1):leaf(sc,(x,YC,z),(a+s*0.5,0.1,0.7 if s>0 else 0.4),0.12,0.055,LEAF,curl=0.1)
TONE5=True;TONE3=True   # かげは3だん・あみなし（特別な家具。持ち主がきめた）
