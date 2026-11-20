# 洞窟の、下の階へおりる階段（cave:down）：床にあいた穴の中を、石の段が、おく（北）へ下っていく（持ち主のたのみ：ひと目で下り階段に見えるように）。
# 設計図（単位はマス）：穴は、だ円（はば1.1・おく1.3、まん中 (0.5,0.45)）。穴のかべは、ふちから下へ0.9。
#   段は6つ：手前（南）から、おくへ、1段ごとに0.07ずつ低くなる（上の面と、手前を向いた けこみ）。おくほど暗い色。いちばんおくは、まっ暗。
#   穴のふちには、角ばった小さな岩（hullrock）をならべる（直角を出さない）。色はこさの番号で写し、ゲームで階の岩の色にぬりかえる。
import math
import numpy as np
from natcommon import hullrock
ID='cave_down';GRAD=False;SHADE=[(9,-2.5),(18,-5)];BOTTOM=60;PARALLEL=True
VIEWS=[('cave_down',0)]
PAL=[(235,235,235),(200,200,200),(160,160,160),(120,120,120),(85,85,85)]
MASK=(255,0,255)
CX,CY,RX,RY,D=0.5,0.45,0.55,0.65,0.9
NS=6;DZ=0.07   # 段の高さ（ななめ上から見るので、ひくめにして、段がつぶれないように）
def hw(y):   # 穴の、その y でのはばの半分
    t=(y-CY)/RY;return RX*math.sqrt(max(0.0,1-t*t))
def PARTS():return[]
def face(sc,pts,col,g):
    sc.texture(None);sc.material('flat');sc.smooth(False);sc.group(g);sc.part()
    for i in range(1,len(pts)-1):sc.tri(pts[0],pts[i],pts[i+1],col);sc.tri(pts[0],pts[i+1],pts[i],col)
    sc.group(None);sc.material(None)
def EXTRA(sc):
    y0,y1=CY+RY*0.92,CY-RY*0.92   # 段のある所（手前のはし〜おくのはし）
    ys=np.linspace(y0,y1,NS+1)
    for i in range(NS):
        z=-0.04-i*DZ;a,b=ys[i],ys[i+1];top=[];
        for y in np.linspace(a,b,6):top.append((CX-hw(y),y,z))
        for y in np.linspace(b,a,6):top.append((CX+hw(y),y,z))
        lv=min(4,i*4//NS);face(sc,top,PAL[lv],'t%d'%i)   # 段の上の面（おくほど暗い）
        w=hw(b);face(sc,[(CX-w,b,z),(CX+w,b,z),(CX+w,b,z-DZ),(CX-w,b,z-DZ)],PAL[min(4,lv+2)],'r%d'%i)   # けこみ（手前を向く）
    zb=-0.04-NS*DZ;bot=[(CX+RX*0.9*math.cos(t),y1-0.02-0.12*abs(math.sin(t)),zb) for t in np.linspace(0,math.pi,10)]
    n=40   # 穴のかべ：おくがわの半分（手前を向く。見える）
    wall=[];th=np.linspace(math.pi,2*math.pi,n)
    for k in range(n-1):
        t0,t1=th[k],th[k+1];p0=(CX+RX*math.cos(t0),CY+RY*math.sin(t0));p1=(CX+RX*math.cos(t1),CY+RY*math.sin(t1))
        d0,d1=D*abs(math.sin(t0)),D*abs(math.sin(t1))   # 左右のはしほど浅く（手前の地面の下へ、はみ出さない）
        face(sc,[(p0[0],p0[1],0.0),(p1[0],p1[1],0.0),(p1[0],p1[1],-d1),(p0[0],p0[1],-d0)],PAL[4],'w')
    # 穴のまわりの地面（写したあとに消す色 MASK）：穴の中の物が、穴の外へはみ出して見えないように、手前で かくす
    m=48;th=np.linspace(0,2*math.pi,m+1);sc.texture(None);sc.material('flat');sc.smooth(False);sc.group('g');sc.part()
    for k in range(m):
        a0,a1=th[k],th[k+1];P=[(CX+RX*f*math.cos(a),CY+RY*f*math.sin(a),0.002) for f,a in((1,a0),(1,a1),(1.6,a1),(1.6,a0))]
        sc.tri(P[0],P[1],P[2],MASK);sc.tri(P[0],P[2],P[3],MASK);sc.tri(P[0],P[2],P[1],MASK);sc.tri(P[0],P[3],P[2],MASK)
    sc.group(None);sc.material(None)
    for k,t in enumerate(np.linspace(0,2*math.pi,25)[:-1]):   # ふちの岩
        rs=np.random.RandomState(990+k);x=CX+(RX+0.08)*math.cos(t);y=CY+(RY+0.08)*math.sin(t)
        hullrock(sc,(x,y),(0.11+rs.uniform(0,.04),0.09),0.07+rs.uniform(0,.06),PAL,seed=990+k,gi='e%d'%k)
def POST(im):   # 穴のまわりの地面（MASK の色）と、そのふちの線を消す
    from PIL import Image
    a=np.array(im).astype(int);mk=(a[...,0]>200)&(a[...,1]<80)&(a[...,2]>200)
    pk=(abs(a[...,0]-a[...,2])<40)&(a[...,0]-a[...,1]>60)   # 線の色（MASK をくらくした色）も
    a[mk|pk]=0;return Image.fromarray(a.astype(np.uint8))
