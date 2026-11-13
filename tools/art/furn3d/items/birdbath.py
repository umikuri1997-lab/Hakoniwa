# 水飲み鳥（birdbath）：いまの絵と同じデザイン・同じ大きさ。石の台に、まるい水ばち。ふちに小鳥が1羽とまる。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（58×62ドット）に合わせた）
#   台座：石のまるい台（半径0.24・高さ0〜0.08）。
#   柱：石の、くびれた柱（半径0.10〜0.14・高さ0.08〜0.34）。台座の上。
#   水ばち：石の、ふちの立ったまるいはち（外の半径0.36・高さ0.34〜0.48、かべのあつさ0.05）。柱の上。
#   水：はちの中、ふちの0.04下。すけて見える・つやがある（'clear'）。
#   小鳥：はちの右のふちにとまる、まるい小鳥（左を向いた横向き）。からだ（たまごの形、長さ0.20・高さ0.15）・頭（半径0.06）・くちばし・しっぽ・目。
#     色：茶色のせなかと羽、白いおなか、だいだいのくちばし（からだの面のもよう）。
#   石の色は、あたたかい明るい灰色。石のテクスチャ（Rock030）。
from blueprint import Part as P
from common import *
import math
ID='birdbath';BOTTOM=63;GRAD=True
VIEWS=[('birdbath',0)]
CX,CY=0.50,0.60;STONE=(214,206,196);WATER=(120,192,236);SKY=(220,240,252)
def ST(p):p.stone=True;return p
def PARTS():
    L=[ST(P('台座','lathe',(CX,CY,[(0.0,0.0),(0.24,0.0),(0.24,0.05),(0.20,0.08),(0.0,0.08)]),STONE,detail=40,note='地面におく'))]
    L.append(ST(P('柱','lathe',(CX,CY,[(0.0,0.08),(0.14,0.08),(0.11,0.16),(0.10,0.24),(0.13,0.30),(0.16,0.34),(0.0,0.34)]),STONE,detail=40,on=('台座',),note='台座の上')))
    L.append(ST(P('水ばち','lathe',(CX,CY,[(0.0,0.34),(0.20,0.34),(0.31,0.40),(0.36,0.46),(0.36,0.48),(0.31,0.48),(0.28,0.43),(0.18,0.39),(0.0,0.39)]),STONE,detail=48,on=('柱',),note='柱の上')))
    return L
BR=(200,150,104);WG=(170,120,82);BELLY=(250,244,232);BEAK=(240,170,80);EYE=(90,64,52)
def bird(sc):
    bx,by,bz=CX+0.24,CY+0.04,0.55   # からだのまん中（ふちの上）
    def body(x,y,z):   # おなかは白、羽はこい茶
        if z<bz-0.012 and x<bx+0.04:return BELLY
        if abs(y-by)>0.045 and z>bz-0.005:return WG
        return None
    lay=[]
    for k in range(9):   # たまごの形（よこ長）：x にそって、まるい断面をならべる
        t=-1+2*k/8;rx=0.10;r=0.075*math.sqrt(max(0.02,1-t*t))
        lay.append((bx+rx*t,r))
    sc.decal(body);sc.smooth(True);sc.part()
    n=16
    for (x0,r0),(x1,r1) in zip(lay,lay[1:]):
        for i in range(n):
            a0,a1=2*math.pi*i/n,2*math.pi*(i+1)/n
            P_=lambda x,r,a:(x,by+r*math.cos(a)*0.9,bz+r*math.sin(a))
            sc.quad(P_(x0,r0,a0),P_(x1,r1,a0),P_(x1,r1,a1),P_(x0,r0,a1),BR)
    sc.decal(lambda x,y,z:BELLY if z<bz+0.015 and x<bx-0.095 else None);sc.part();sc.sphere(bx-0.095,by,bz+0.06,0.06,BR,n=14,m=8);sc.decal(None)   # 頭
    sc.part()
    tip=(bx-0.195,by,bz+0.055);bb=[(bx-0.148,by-0.016,bz+0.068),(bx-0.148,by+0.016,bz+0.068),(bx-0.148,by,bz+0.044)]   # くちばし
    for i in range(3):sc.tri(tip,bb[i],bb[(i+1)%3],BEAK)
    sc.part();sc.sphere(bx-0.115,by+0.05,bz+0.075,0.012,EYE,n=8,m=6)   # 目（手前の目）
    sc.part();sc.quad((bx+0.08,by-0.027,bz+0.013),(bx+0.17,by-0.04,bz+0.065),(bx+0.17,by+0.04,bz+0.065),(bx+0.08,by+0.027,bz+0.013),WG)   # しっぽ
    sc.smooth(False)
def EXTRA(sc):
    bird(sc)
    zw=0.44;r=0.30
    def col(x,y):t=max(0,min(1,(CY-y)/(r*1.4)+0.3))**1.4;return tuple(WATER[k]*(1-t)+SKY[k]*t for k in range(3))
    def disk(u,v):U,V=2*u-1,2*v-1;return (CX+r*U*math.sqrt(max(0,1-V*V/2)),CY+r*V*math.sqrt(max(0,1-U*U/2)))
    top=lambda x,y:zw+0.003*math.sin(x*25+y*8)
    sc.material('clear');hfield(sc,CX-r,CY-r,CX+r,CY+r,top,lambda x,y:col(*disk((x-(CX-r))/(2*r),(y-(CY-r))/(2*r))),n=(32,32),shape=disk);sc.material(None)
