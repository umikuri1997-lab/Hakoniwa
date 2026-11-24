# ヨルボシの草むら（hotaru、草原の夜の守りの植物）：たてにのびる細い葉のひくい草むら。葉のあいだから細いくきが立ち、さきにうすい黄緑のつぼみ。
# 夜に光るドットは、ゲームのコード（hotaruDots）が上にかさねる。つぼみは昼も見える。
# 設計図（単位はマス。まん中 0.5,0.5）
#   葉：20まい。根もと（まん中から0.04〜0.10）から、上へ斜め（20〜40度）にのび、さきほど外へたおれてたれる（長さ0.42〜0.62・はば0.05→さき0.004）。1まいずつの部品（あいだに輪郭線）。
#   くき：5本（太さ0.008）。まん中から0.12〜0.17の所から、少し外へかたむけて上へ（高さ0.52〜0.66）。さきに、つぼみ（たまご形 半径0.03・たて1.4倍）。
#   色：葉は根もとがこい緑、さきほど明るい緑の3だん（場所ごとの色 decal。面ごとの色だと、すじが出る）。
import math,random
import numpy as np
ID='hotaru';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=25;BOTTOM=60
from natcommon import SUN
LIGHT=SUN
VIEWS=[('hotaru',0)]
CX,CY=0.5,0.5
DARK=(84,150,104);LITE=(150,204,128)   # 葉（根もと→さき）。草原のベリーの茂みより少し青みの緑
STEM=(110,168,108);BUD=(222,238,160)
def PARTS():return[]
def blade(sc,az,r0,L,th0,bend,w0,seed):
    n=9;pts=[];a=th0;p=np.array([CX+r0*math.cos(az),CY+r0*math.sin(az),0.0]);d=np.array([math.cos(az),math.sin(az),0.0])
    for i in range(n+1):
        pts.append(p.copy());t=i/n;a=th0+bend*t*t
        p=p+(L/n)*np.array([math.sin(a)*d[0],math.sin(a)*d[1],math.cos(a)])
    side=np.array([-d[1],d[0],0.0]);zt=max(q[2] for q in pts)
    def col(x,y,z):
        u=min(2,int(3*z/max(zt,1e-6)))/2;return tuple(DARK[k]+(LITE[k]-DARK[k])*u for k in range(3))
    sc.decal(col);sc.part()
    for i in range(n):
        t0,t1=i/n,(i+1)/n;w_0=w0*(1-t0)**0.8/2+0.002;w_1=w0*(1-t1)**0.8/2+0.002
        a,b=pts[i],pts[i+1]
        sc.quad(a-side*w_0,a+side*w_0,b+side*w_1,b-side*w_1,DARK)
def EXTRA(sc):
    rd=random.Random(11);sc.smooth(True);sc.outline(None,0.86)
    for i in range(20):
        az=2*math.pi*i/20+rd.uniform(-0.15,0.15)
        blade(sc,az,rd.uniform(0.04,0.10),rd.uniform(0.42,0.62),math.radians(rd.uniform(20,40)),math.radians(rd.uniform(55,85)),0.05,i)
    for i in range(5):
        az=2*math.pi*i/5+0.4;r=rd.uniform(0.12,0.17);x,y=CX+r*math.cos(az),CY+r*math.sin(az);h=rd.uniform(0.52,0.66)
        sc.decal(None);sc.part();sc.tube([(x,y,0.0),(x+0.04*math.cos(az),y+0.04*math.sin(az),h)],0.008,STEM,n=6)
        sc.part();sc.sphere(x+0.04*math.cos(az),y+0.04*math.sin(az),h+0.026,0.03,BUD,n=14,m=10,zs=1.4)
