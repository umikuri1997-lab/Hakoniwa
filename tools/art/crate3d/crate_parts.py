# 木箱（わくつきの木箱）の設計図（部品の表）。3Dから作るドット絵のお手本（スキル model3d-pixel）。
# x=東, y=南, z=上（マス）。置くマスの左上が(0,0)。
# 作り：底板に四すみの角柱 → 柱のあいだに側板3まい（4つの面）→ 4つの面の側板の外に上下の横桟 →
#       4つの面とも、柱と横桟でかこんだ中にすじかい（1本は通し、もう1本は2つに分けて、はしを通しのふちで切ってつきあてる）→
#       ふたは、左右の桟（前から後ろのはしまで）のあいだに、ふた板4まいを入れる。
import sys,os
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
from blueprint import Part as P
FRAME=(240,198,134);BOARD=(222,172,106);BOARD2=BOARD;LID=(230,183,117);LID2=LID;BASE=(196,137,78)   # 木目で板の見分けがつくので、板ごとに色をかえない。わくの中の側板も明るい木の色（暗い色は底板と中だけ）
X0,X1,Y0,Y1=0.05,0.95,0.30,1.0;   # 上から見て、はば0.9・おくゆき0.7（横向きにしても長く見えすぎない）
ZB=0.04;ZT=0.58;PO=0.09;T=0.03;E=0.03;R=0.08
def parts():
    L=[P('底板','box',(X0,Y0,0,X1,Y1,ZB),BASE,bevel=0,note='地面におく')]
    for nx,x in(('左',X0),('右',X1-PO)):
        for ny,y in(('うしろ',Y0),('前',Y1-PO)):L.append(P('角柱（%s%s）'%(nx,ny),'box',(x,y,ZB,x+PO,y+PO,ZT),FRAME,on=('底板',),bevel=0,note='底板にたてる'))
    hs=[(ZB+(ZT-ZB)*i/3,ZB+(ZT-ZB)*(i+1)/3) for i in range(3)]
    for face,yy in(('前',Y1-E-T),('うしろ',Y0+E)):
        for i,(z0,z1) in enumerate(hs):
            L.append(P('%sの側板%d'%(face,i+1),'box',(X0+PO,yy,z0,X1-PO,yy+T,z1),BOARD if i%2 else BOARD2,on=('底板',) if i==0 else ('%sの側板%d'%(face,i),),bevel=0,note='柱にくぎでとめる'))
    for face,xx in(('左',X0+E),('右',X1-E-T)):
        for i,(z0,z1) in enumerate(hs):
            L.append(P('%sの側板%d'%(face,i+1),'box',(xx,Y0+PO,z0,xx+T,Y1-PO,z1),BOARD if i%2 else BOARD2,on=('底板',) if i==0 else ('%sの側板%d'%(face,i),),bevel=0,note='柱にくぎでとめる'))
    # 4つの面に、わく（上下の横桟）とすじかい。すじかいは横桟と柱でかこんだ中に、1本は通し、もう1本は2つに分けて、
    # はしを通しの1本のふちにそって切り、つきあてる。u は面にそった向き（前・うしろは x、左・右は y）
    import numpy as np
    W=0.09;o=0.04;BT=0.017;za,zb=ZB+R,ZT-R
    def band(p,q,w):   # p→q の線の、はば w の帯（点・向き・はばの半分のずれ）
        p,q=np.array(p,float),np.array(q,float);d=(q-p)/np.linalg.norm(q-p);nn=np.array([-d[1],d[0]]);return p,d,nn*w/2
    def cut(p,d,q,e):  # p+t*d の線と、q+s*e の線の交わる点
        t,_=np.linalg.solve(np.array([d,-e]).T,q-p);return p+t*d
    FACES=(('前','y',X0+PO,X1-PO,(Y1-E,Y1),(Y1-E,Y1-E+BT)),('うしろ','y',X0+PO,X1-PO,(Y0,Y0+E),(Y0+E-BT,Y0+E)),
           ('左','x',Y0+PO,Y1-PO,(X0,X0+E),(X0+E-BT,X0+E)),('右','x',Y0+PO,Y1-PO,(X1-E,X1),(X1-E,X1-E+BT)))
    for face,ax,ua,ub,(w0,w1),(b0,b1) in FACES:
        bx=(lambda u0,u1,z0,z1:(w0,u0,z0,w1,u1,z1)) if ax=='x' else (lambda u0,u1,z0,z1:(u0,w0,z0,u1,w1,z1))
        L.append(P('%sの横桟（下）'%face,'box',bx(ua,ub,ZB,ZB+R),FRAME,on=('%sの側板1'%face,),bevel=0,note='側板の外にうつ'))
        L.append(P('%sの横桟（上）'%face,'box',bx(ua,ub,ZT-R,ZT),FRAME,on=('%sの側板3'%face,),bevel=0,note='側板の外にうつ'))
        k=(zb-za)/(ub-ua);A,B=(ua-o,za-o*k),(ub+o,zb+o*k);M=((ua+ub)/2,(za+zb)/2)
        p0,d0,h0=band(A,B,W);ex=(b0,b1)+(('x',) if ax=='x' else ())
        L.append(P('%sのすじかい（通し）'%face,'prism',([tuple(A-h0),tuple(B-h0),tuple(B+h0),tuple(A+h0)],)+ex,FRAME,on=('%sの側板2'%face,),grp='すじかい'+face,note='はしは横桟と柱の下へ'))
        for nm,Cp in(('上',(ua-o,zb+o*k)),('下',(ub+o,za-o*k))):
            p1,d1,h1=band(Cp,M,W);fa=p0+h0 if nm=='上' else p0-h0
            e1=cut(np.array(Cp)+h1,d1,fa,d0);e2=cut(np.array(Cp)-h1,d1,fa,d0)
            poly=[tuple(np.array(Cp)+h1),tuple(e1),tuple(e2),tuple(np.array(Cp)-h1)]
            L.append(P('%sのすじかい（%s）'%(face,nm),'prism',(poly,)+ex,FRAME,on=('%sの側板2'%face,),grp='すじかい'+face,note='通しのすじかいのふちで切って、つきあてる'))
    n=4
    for i in range(n):
        y0=Y0+(Y1-Y0)*i/n;y1=Y0+(Y1-Y0)*(i+1)/n
        L.append(P('ふた板%d'%(i+1),'box',(X0+PO,y0,ZT,X1-PO,y1,ZT+0.035),LID if i%2 else LID2,on=('角柱（左うしろ）','角柱（右前）','前の側板3','うしろの側板3','左の側板3','右の側板3'),bevel=0,note='柱と側板の上'))
    for nx,x in(('左',X0),('右',X1-PO)):L.append(P('ふたの桟（%s）'%nx,'box',(x,Y0,ZT,x+PO,Y1,ZT+0.065),FRAME,on=('角柱（%sうしろ）'%nx,'角柱（%s前）'%nx),bevel=0,note='ふたの左右のわく。ふた板は桟のあいだに入れて、桟に横からくぎでとめる。前から後ろのはしまで'))
    # 中のかげ（ふたを開けたときに見える、箱の中の暗い所。うすい板を内がわにはる。ささえのたしかめなし・輪郭線なし）
    IN=(150,98,51);a=X0+E+T+0.003;b_=X1-E-T-0.003;ya,yb=Y0+E+T+0.003,Y1-E-T-0.003;zt=ZT-0.002
    L.append(P('中のかげ（底）','box',(a,ya,ZB,b_,yb,ZB+0.004),IN,deco=True,bevel=0))
    for nm,b in(('前',(a,yb-0.003,ZB,b_,yb,zt)),('うしろ',(a,ya,ZB,b_,ya+0.003,zt)),('左',(a,ya,ZB,a+0.003,yb,zt)),('右',(b_-0.003,ya,ZB,b_,yb,zt))):
        L.append(P('中のかげ（%s）'%nm,'box',b,IN,deco=True,bevel=0))
    return L
LIDP=lambda name:name.startswith('ふた')   # ふた（ふた板・ふたの桟）。うしろのはし（y=Y0, z=ZT）をちょうつがいにして開く
INNER=lambda name:name.startswith('中のかげ')
