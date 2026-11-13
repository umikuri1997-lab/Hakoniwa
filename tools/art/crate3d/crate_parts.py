# 木箱（わくつきの木箱）の設計図（部品の表）。3Dから作るドット絵のお手本（スキル model3d-pixel）。
# x=東, y=南, z=上（マス）。置くマスの左上が(0,0)。
# 作り：底板に四すみの角柱 → 柱のあいだに側板3まい（4つの面）→ 前とうしろは側板の外に上下の横桟 →
#       柱と横桟でかこんだ中にすじかい（1本は通し、もう1本は2つに分けて、はしを通しのふちで切ってつきあてる）→
#       ふた板4まいを柱と側板の上に → ふたの左右に桟。
import sys,os
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
from blueprint import Part as P
FRAME=(240,204,150);BOARD=(196,146,96);BOARD2=BOARD;LID=(230,190,134);LID2=LID   # 木目で板の見分けがつくので、板ごとに色をかえない
Y0,Y1=0.44,1.0;ZB=0.04;ZT=0.58;PO=0.09;T=0.03;E=0.03;R=0.08
def parts():
    L=[P('底板','box',(0,Y0,0,1,Y1,ZB),BOARD,bevel=0,note='地面におく')]
    for nx,x in(('左',0),('右',1-PO)):
        for ny,y in(('うしろ',Y0),('前',Y1-PO)):L.append(P('角柱（%s%s）'%(nx,ny),'box',(x,y,ZB,x+PO,y+PO,ZT),FRAME,on=('底板',),bevel=0,note='底板にたてる'))
    hs=[(ZB+(ZT-ZB)*i/3,ZB+(ZT-ZB)*(i+1)/3) for i in range(3)]
    for face,yy in(('前',Y1-E-T),('うしろ',Y0+E)):
        for i,(z0,z1) in enumerate(hs):
            L.append(P('%sの側板%d'%(face,i+1),'box',(PO,yy,z0,1-PO,yy+T,z1),BOARD if i%2 else BOARD2,on=('底板',) if i==0 else ('%sの側板%d'%(face,i),),bevel=0,note='柱にくぎでとめる'))
    for face,xx in(('左',E),('右',1-E-T)):
        for i,(z0,z1) in enumerate(hs):
            L.append(P('%sの側板%d'%(face,i+1),'box',(xx,Y0+PO,z0,xx+T,Y1-PO,z1),BOARD if i%2 else BOARD2,on=('底板',) if i==0 else ('%sの側板%d'%(face,i),),bevel=0,note='柱にくぎでとめる'))
    for face,ya,yb in(('前',Y1-E,Y1),('うしろ',Y0,Y0+E)):
        L.append(P('%sの横桟（下）'%face,'box',(PO,ya,ZB,1-PO,yb,ZB+R),FRAME,on=('%sの側板1'%face,),bevel=0,note='側板の外にうつ'))
        L.append(P('%sの横桟（上）'%face,'box',(PO,ya,ZT-R,1-PO,yb,ZT),FRAME,on=('%sの側板3'%face,),bevel=0,note='側板の外にうつ'))
    # すじかい：横桟と柱でかこんだ中。1本は通し、もう1本は2つに分けて、はしを通しの1本のふちにそって切り、つきあてる
    import numpy as np
    xa,xb,za,zb=PO,1-PO,ZB+R,ZT-R;W=0.09;o=0.04;BT=0.017
    def band(p,q,w):   # p→q の線の、はば w の帯の2本のふち（点と向き）
        p,q=np.array(p,float),np.array(q,float);d=(q-p)/np.linalg.norm(q-p);nn=np.array([-d[1],d[0]]);return p,d,nn*w/2
    def cut(p,d,q,e):  # p+t*d の線と、q+s*e の線の交わる点
        t,_=np.linalg.solve(np.array([d,-e]).T,q-p);return p+t*d
    A,B=(xa-o,za-o*0.45),(xb+o,zb+o*0.45);M=((xa+xb)/2,(za+zb)/2)
    p0,d0,h0=band(A,B,W)
    thr=[tuple(A-h0),tuple(B-h0),tuple(B+h0),tuple(A+h0)]
    yf0,yf1=Y1-E,Y1-E+BT
    L.append(P('前のすじかい（通し）','prism',(thr,yf0,yf1),FRAME,on=('前の側板2',),grp='すじかい',note='左下から右上へ。はしは横桟と柱の下へ'))
    for nm,C in(('左上',(xa-o,zb+o*0.45)),('右下',(xb+o,za-o*0.45))):
        p1,d1,h1=band(C,M,W)
        fa=p0+h0 if nm=='左上' else p0-h0          # Cがわの、通しのふち
        e1=cut(np.array(C)+h1,d1,fa,d0);e2=cut(np.array(C)-h1,d1,fa,d0)
        poly=[tuple(np.array(C)+h1),tuple(e1),tuple(e2),tuple(np.array(C)-h1)]
        L.append(P('前のすじかい（%s）'%nm,'prism',(poly,yf0,yf1),FRAME,on=('前の側板2',),grp='すじかい',note='通しのすじかいのふちで切って、つきあてる'))
    n=4
    for i in range(n):
        y0=Y0+(Y1-Y0)*i/n;y1=Y0+(Y1-Y0)*(i+1)/n
        L.append(P('ふた板%d'%(i+1),'box',(0,y0,ZT,1,y1,ZT+0.035),LID if i%2 else LID2,on=('角柱（左うしろ）','角柱（右前）','前の側板3','うしろの側板3','左の側板3','右の側板3'),bevel=0,note='柱と側板の上'))
    for nx,x in(('左',0),('右',1-PO)):L.append(P('ふたの桟（%s）'%nx,'box',(x,Y0,ZT+0.035,x+PO,Y1,ZT+0.065),FRAME,on=['ふた板%d'%(i+1) for i in range(n)],bevel=0,note='ふた板をつなぐ'))
    return L
