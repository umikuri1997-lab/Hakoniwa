# 岩（rock・rock#1〜#7）：まん中に、てっぺんのとがった大きな岩（はば1.14・高さ0.675マス）。
# ならびは8とおり（VIEWS の3つめ）：小さな岩が2こ（0〜4）・小さな岩なし（5〜7）。ゲームはマスごとに hash でえらぶ（draw-objects.js の rockChip）。
# 小さな岩は2こまで（持ち主がきめた）。同じ形をまわしてならべない（持ち主がきめた）：小さな岩10こは、どれもべつの形の作り（SHAPES）。
#   まるい石・ひらたい石・角ばった石・とがった石・ななめにかけた石・よこに長い石・三角の石・立てた板石・ひくいドーム・五角の柱。
# 小さな岩は、前の大きさ（中くらい はば0.32・高さ0.44、小さい 0.25・0.31）。大きな岩にくっつける（持ち主がきめた）：
#   足もとの形（でこぼこもふくむ）が、ちょうどふれる所に置く（place。すきまも、めりこみも出ない）。
#   置く向きは、クォータービューの画面の上の向き（0度＝右・90度＝手前・180度＝左）。マスの外へ出てよい（持ち主がきめた）。おく（180〜360度）には置かない（ういて見える・おくのマスの物に見える）。
# 形は、点をつつむ角ばった形（hullrock）。面ごとに、光の向きで、お手本の岩の色（5だん）をつける。
import math
import numpy as np
from natcommon import hullrock,hullpts,SUN
from scipy.spatial import ConvexHull
ID='rock';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=25;BOTTOM=60
LIGHT=SUN   # 光は木と同じ太陽（natcommon.SUN）
VIEWS=[('rock',0,0)]+[('rock#%d'%v,0,v) for v in range(1,8)]
PAL=[(212,208,212),(197,193,204),(174,175,194),(159,164,186),(146,152,177)]   # お手本の岩の色（明るい→暗い）
BIG=((0.57,0.52),0.80)   # 大きな岩の半径（よこ・おく）と高さ（小さな岩のあるならび）
MID=(0.32,0.44);SML=(0.25,0.31)   # 小さな岩の半径・高さ
def ringpts(rs,r,h,ring,yaw):
    """輪（高さの割合・半径の割合・点の数）の点。yaw：形の向き"""
    P=[]
    for z,k,n in ring:
        for i in range(n):
            a=yaw+2*np.pi*(i+rs.uniform(-0.2,0.2))/n;rr=k*rs.uniform(0.92,1.04)
            P.append((np.cos(a)*r[0]*rr,np.sin(a)*r[1]*rr,h*z))
    return np.array(P)
def rot(P,yaw):
    c,s=math.cos(yaw),math.sin(yaw);Q=P.copy();Q[:,0]=c*P[:,0]-s*P[:,1];Q[:,1]=s*P[:,0]+c*P[:,1];return Q
# 小さな岩の形：(r, h, seed) → 足もとのまん中を (0,0) にした点
def s_round(r,h,sd):   # まるい石：輪を多く、ふくらんだ横はら
    rs=np.random.RandomState(sd);return ringpts(rs,(r,r*0.95),h*0.85,((0,0.8,10),(0.3,1.0,11),(0.62,0.88,10),(0.86,0.55,8),(1.0,0.12,4)),rs.uniform(0,6.3))
def s_slab(r,h,sd):   # ひらたい石：まるに近い、うすい石。上はたいら
    rs=np.random.RandomState(sd);return ringpts(rs,(r*1.15,r*1.0),h*0.32,((0,1.0,8),(0.75,0.97,8),(1.0,0.8,8)),rs.uniform(0,6.3))
def s_block(r,h,sd):   # 角ばった石：4つの角の箱（角を少し切る。点ごとに大きさをばらさない：ほそい面ができて、きざみの線が出た）
    rs=np.random.RandomState(sd);yaw=rs.uniform(0,6.3);P=[]
    for z,k in((0,1.0),(0.82,0.98),(1.0,0.8)):
        for i in range(4):
            for e in(-0.14,0.14):
                a=np.pi/4+np.pi/2*i+e;P.append((np.cos(a)*r*0.95*k,np.sin(a)*r*0.8*k,h*0.8*z))
    return rot(np.array(P),yaw)
def s_point(r,h,sd):   # とがった石：ほそく高く、てっぺんが横へずれる
    rs=np.random.RandomState(sd);yaw=rs.uniform(0,6.3);P=ringpts(rs,(r*0.8,r*0.7),h*1.2,((0,1.0,7),(0.4,0.78,6),(0.75,0.4,4)),yaw)
    P=np.r_[P,[[r*0.25*math.cos(yaw),r*0.25*math.sin(yaw),h*1.2]]];P[:,0]+=P[:,2]/(h*1.2)*r*0.22*math.cos(yaw+1.3);return P
def s_wedge(r,h,sd):   # ななめにかけた石：上の面が、かたほうへ大きくさがる（角は少なく、かけた面をはっきり。さがるがわを画面の手前に向ける：iso3d.py の45度とあわせて）
    rs=np.random.RandomState(sd);yaw=rs.uniform(0,6.3);P=ringpts(rs,(r*1.05,r*0.9),h,((0,1.0,6),(0.5,0.96,6),(1.0,0.82,6)),0)
    P[:,2]=np.minimum(P[:,2],h*(0.22+0.78*(P[:,0]/(r*1.05)+1)/2));return rot(P,math.radians(-135)+rs.uniform(-0.3,0.3))
def s_long(r,h,sd):   # よこに長い石：ほそ長いだんご
    rs=np.random.RandomState(sd);return ringpts(rs,(r*1.45,r*0.55),h*0.7,((0,0.85,10),(0.4,1.0,10),(0.8,0.75,8),(1.0,0.3,4)),rs.uniform(0,6.3))
def s_tri(r,h,sd):   # 三角の石：足もとが三角、上はたいら
    rs=np.random.RandomState(sd);yaw=rs.uniform(0,6.3);P=[]
    for z,k in((0,1.0),(0.85,0.96),(1.0,0.75)):
        for i in range(3):
            for e in(-0.2,0.2):
                a=2*np.pi/3*i+e;P.append((np.cos(a)*r*1.1*k,np.sin(a)*r*1.1*k,h*0.7*z*rs.uniform(0.95,1.0)))
    return rot(np.array(P),yaw)
def s_plate(r,h,sd):   # 立てた板石：うすく、はばがあって高い。上は少しななめ
    rs=np.random.RandomState(sd);yaw=rs.uniform(0,6.3);P=[]
    for x in(-0.75,-0.45,0.45,0.75):
        for y in(-1,1):
            ex=abs(x)==1
            for z in(0,1):P.append((x*r*0.95,y*r*(0.16 if ex else 0.22),(h*2.2*(0.82+0.18*(x/0.75+1)/2) if z else 0)*(0.92 if ex and z else 1)))
    return rot(np.array(P),yaw)
def s_dome(r,h,sd):   # ひくいドーム：はばひろく、ひくく、なめらか
    rs=np.random.RandomState(sd);return ringpts(rs,(r*1.15,r*1.05),h*0.5,((0,1.0,12),(0.35,0.92,12),(0.7,0.62,10),(0.92,0.3,6),(1.0,0.0,1)),rs.uniform(0,6.3))
def s_column(r,h,sd):   # 五角の柱：足もとが五角、まっすぐ立って、上はたいら
    rs=np.random.RandomState(sd);yaw=rs.uniform(0,6.3);P=[]
    for z,k in((0,1.0),(0.9,1.0),(1.0,0.85)):
        for i in range(5):a=2*np.pi/5*i;P.append((np.cos(a)*r*0.75*k,np.sin(a)*r*0.75*k,h*1.1*z))
    return rot(np.array(P),yaw)
SHAPES={'round':s_round,'slab':s_slab,'block':s_block,'point':s_point,'wedge':s_wedge,'long':s_long,'tri':s_tri,'plate':s_plate,'dome':s_dome,'column':s_column}
# ならび：大きな岩（半径・高さ・てっぺんのずれ・seed）と、小さな岩の (画面の向き, 大きさ, 形, seed)。小さな岩10こは、どれもべつの形
B0=(BIG[0],BIG[1],(0.03,0))
LAYOUT=[
    (B0+(3,),[(180,MID,'round',5),(48,SML,'slab',7)]),       # 左にまるい石・右手前にひらたい石
    (B0+(11,),[(0,MID,'block',13),(128,SML,'point',17)]),    # 右に角ばった石・左手前にとがった石
    (B0+(19,),[(95,MID,'long',23),(8,SML,'tri',29)]),        # 手前によこに長い石・右に三角の石
    (B0+(31,),[(182,SML,'plate',37),(62,MID,'wedge',43)]),   # 左に立てた板石・右手前にかけた石
    (B0+(47,),[(20,MID,'column',53),(160,SML,'dome',59)]),   # 右手前に五角の柱・左にひくいドーム
    (((0.66,0.6),0.42,(0,0),61),[]),          # 小さな岩なし：ひくく、はばひろい
    (((0.5,0.46),0.92,(-0.08,0.04),67),[]),    # 小さな岩なし：ほそく高く、てっぺんが左へ
    (((0.57,0.52),0.80,(0.06,-0.03),71),[]),   # 小さな岩なし：ふつうの大きさ
]
VAR=0
def foot(P):
    """岩の足もとの形（地面に写した点をつつむ多角形）"""
    Q=np.asarray(P)[:,:2];return Q[ConvexHull(Q).vertices]
def apart(A,B):
    """2つの多角形（どちらも凸）がはなれているか（わける線がある）"""
    for Pg in(A,B):
        for i in range(len(Pg)):
            e=Pg[(i+1)%len(Pg)]-Pg[i];n=np.array([-e[1],e[0]])
            if (A@n).max()<(B@n).min() or (B@n).max()<(A@n).min():return True
    return False
def place(big,deg,P0):
    """大きな岩（足もとの形 big）から、画面の向き deg に、小さな岩（点 P0、足もとのまん中が0）のすそがちょうどふれるきょりの所（せかいのマスの場所。iso3d.py が45度まわす前）。
    足もとの形どうしが、はなれる・かさなるのさかいを、きょりの半分わけでさがす"""
    c=math.sqrt(0.5);X,Y=math.cos(math.radians(deg)),math.sin(math.radians(deg));ux,uy=c*(X+Y),c*(Y-X)   # 画面の向き → せかいの向き（45度もどす）
    f0=foot(P0);lo,hi=0.0,2.0
    for _ in range(30):
        d=(lo+hi)/2
        if apart(big,f0+[0.5+ux*d,0.5+uy*d]):hi=d
        else:lo=d
    hi*=0.97   # さかいちょうどだと、ふちの1ドットの線のぶん、画面で緑がのぞく
    return(0.5+ux*hi,0.5+uy*hi)
def PARTS():return[]
def EXTRA(sc):
    (br,bh,pk,sd),L=LAYOUT[VAR or 0]
    hullrock(sc,(0.5,0.5),br,bh,PAL,seed=sd,peak=pk,gi='r0');big=foot(hullpts((0.5,0.5),br,bh,sd,pk))
    for i,(deg,(r,h),shp,s_) in enumerate(L):
        P=SHAPES[shp](r,h,s_);p=place(big,deg,P);P=P+[p[0],p[1],0]
        hullrock(sc,p,(r,r),h,PAL,gi='r%d'%(i+1),P=P)
