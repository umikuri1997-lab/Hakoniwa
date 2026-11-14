# 東屋（azumaya、2×2マス、おそなえの家具）：いまの絵と同じデザイン。礎石にたてた木の柱4本・貫・方杖、本瓦ぶきの方形の屋根（勾配1.5寸）、てっぺんに宝珠。
# 設計図は canopy.py（柱は礎石にのせる）。屋根は本瓦ぶき：
#   平瓦：屋根の板（野地）の上に、のき先から上へ段にかさねる（1段 C=0.19。段のさかいは、上の瓦の下のはし）。屋根の面のもようで描く。
#   丸瓦：平瓦と平瓦のあいだに、のき先から上へ、半円のつつの瓦（半径 R=0.046、1まいの長さ C）。上の瓦の下のはしが、下の瓦の上のはしにかぶさる（上のはしは少し細い）。
#         列は、のき先にそって G=0.22 ごと。すみむねにつきあたる所で止める（すみむねの下にさしこむ）。
#   軒丸瓦（巴瓦）：のき先の丸瓦のはしに、まるい面（半径 R×1.15）。
#   すみむね：熨斗瓦をつんだ棟（0.08角）の上に、丸瓦（半径0.05）をならべる（1まい0.14）。のき先のはしに、まるい面（鬼瓦のかわり）。
#   鼻かくし：のき先の板（茶色、桁と同じ木）。
from blueprint import Part as P
from common import *
import canopy as C,math
import numpy as np
ID='azumaya';SZ=(2,2);BOTTOM=136;GRAD=True
VIEWS=[('azumaya',0)]
POST=(176,120,94);ROOF=(160,157,163);TILE=(176,173,179);LINE=(128,125,132);RIDGE=(188,185,191);CAP=(184,181,187)   # お手本の色（瓦 #a09da2・柱 #ac765c）
PH=1.84;RZ=PH+0.12;O=C.O;SL=C.SLOPE;CC=0.19;R=0.046;G=0.22;RR=0.05
def roof(x,y,z):   # 平瓦：段のさかい（上の瓦の下のはし）に線、そのすぐ上は、かさなりのかげで少し暗く
    f,d=C.face(x,y);m=d%CC
    if m<0.018:return LINE
    return (150,147,153) if m<0.04 else ROOF
def fin(az):
    az+=0.10   # すみむねの丸瓦があつまる上にのせる
    return [(0.13,az-0.02),(0.13,az+0.05),(0.10,az+0.08),(0.115,az+0.12),(0.08,az+0.15),(0.10,az+0.19),(0.10,az+0.21),(0.07,az+0.24),(0.06,az+0.27),(0.085,az+0.32),(0.08,az+0.37),(0.05,az+0.41),(0.0,az+0.44)]
def PARTS():
    L=C.build([],POST,POST,ROOF,ROOF,PW=0.13,PH=PH,FH=0.07,base=(0.06,'stone'),finial=fin,ridge_r=RR,roof_decal=roof)
    for p in L:
        if p.name.startswith('すみむね'):p.note='熨斗瓦をつんだ棟。屋根の上にのせる';p.soft1=True
    return L
def rot(k,p):   # 前の面の点を、屋根のまん中（1,1）のまわりに90度ずつまわす（k：0前・1右・2うしろ・3左）
    x,y,z=p
    for _ in range(k):x,y=1+(y-1),1-(x-1)
    return np.array((x,y,z))
def onroof(u,s):return (u,2+O-s,RZ+SL*s)   # 前の面：のき先からの長さ s（上から見て）・のき先にそった場所 u
def halfpipe(sc,a,b,r0,r1,col,n=8):   # a→b の半円のつつ（屋根の面の上にふせる）。r0・r1：はしの半径。下のはし（a）はふさぐ
    a,b=np.array(a,float),np.array(b,float);ax=b-a;ax/=np.linalg.norm(ax);h=np.cross(ax,[0,0,1.0]);h/=np.linalg.norm(h);up=np.cross(h,ax);up/=np.linalg.norm(up)
    sc.part();P_=lambda e,r,t:e+r*(math.cos(t)*h+math.sin(t)*up)
    for i in range(n):
        t0,t1=math.pi*i/n,math.pi*(i+1)/n;sc.quad(P_(a,r0,t0),P_(b,r1,t0),P_(b,r1,t1),P_(a,r0,t1),col)
        sc.tri(a,P_(a,r0,t1),P_(a,r0,t0),col)
    return h,up,ax
def disc(sc,c,ax,h,up,r,col,n=12):   # まるい面（軸 ax に直角）
    sc.part();c=np.array(c,float)
    for i in range(n):t0,t1=2*math.pi*i/n,2*math.pi*(i+1)/n;sc.tri(c,c+r*(math.cos(t1)*h+math.sin(t1)*up),c+r*(math.cos(t0)*h+math.sin(t0)*up),col)
def EXTRA(sc):
    sc.texture(None);sc.material(None)
    for k in range(4):
        u=-O+G/2
        while u<2+O-G/2+1e-9:
            smax=1+O-abs(u-1)-0.08   # すみむねの下にさしこむ所まで
            if smax>0.02:
                s=0.0;first=True
                while s<smax-1e-6:
                    s1=min(smax,s+CC);a=rot(k,onroof(u,s));b=rot(k,onroof(u,s1+0.012))
                    sc.smooth(True);h,up,ax=halfpipe(sc,a,b,R,R*0.86,TILE);sc.smooth(False)
                    if first:disc(sc,a-ax*0.004,ax,h,up,R*1.15,CAP);first=False   # 軒丸瓦（巴瓦）
                    s=s1
            u+=G
    for cx,cy in((-O,-O),(2+O,-O),(-O,2+O),(2+O,2+O)):   # すみむねの丸瓦
        A=np.array((cx,cy,RZ+RR*0.6+RR));B=np.array((1.0,1.0,RZ+SL*(1+O)+RR*0.6+RR));Lh=np.linalg.norm(B-A);n=int(Lh/0.14)+1
        for i in range(n):
            a=A+(B-A)*i/n;b=A+(B-A)*min(1,(i+1)/n+0.012/Lh)
            sc.smooth(True);h,up,ax=halfpipe(sc,a,b,RR,RR*0.86,RIDGE);sc.smooth(False)
            if i==0:disc(sc,a-ax*0.004,ax,h,up,RR*1.25,CAP)
