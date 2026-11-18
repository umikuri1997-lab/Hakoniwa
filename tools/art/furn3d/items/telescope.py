# 星見の望遠鏡（telescope）：宝箱だけの家具。木の三脚に、真ちゅうのつつをななめ上へ向けてのせる。
# 設計図（じっさいに作れる組み方。単位はマス）
#   三脚の足：木の丸い棒3本（太さ0.025）。地面の3点（まん中から0.30はなれる）から、頭（高さ0.78）へあつまる。
#   頭：木のまるい台（半径0.07・高さ0.76〜0.82）。3本の足のさきをとめる。
#   つつ：真ちゅうの円すい台（太い口の半径0.075・細い口の半径0.05、長さ0.80）。頭の上の金具にのせ、左上（北西）へ35度上げる。
#   つつの帯：つつの2か所に、こい真ちゅうの帯。
#   レンズ：太い口に、うすい青のガラス。
#   のぞき口：細い口のさきに、細いつつ（半径0.025・長さ0.10）。
from blueprint import Part as P
from common import *
import math
ID='telescope';BOTTOM=63;GRAD=True
VIEWS=[('telescope',0)]
CX,CY=0.50,0.62
BRASS=(246,206,96);BRASS2=(214,160,64);GLASS=(200,228,244)
def M(p):p.metal=True;p.mtex=True;p.shiny=True;return p   # 真ちゅう：金属（つやのすじ・Metal032）
def G(p):p.tex=False;p.shiny=True;return p
def PARTS():
    L=[];H=0.78
    for i,a in enumerate((90,210,330)):
        r=a*math.pi/180;fx,fy=CX+0.30*math.cos(r),CY+0.24*math.sin(r)
        L.append(P('足%d'%(i+1),'rope',((fx,fy,0.0),(CX,CY,H)),WOOD,note='地面から頭へ'))
        L[-1].dims=((fx,fy,0.0),(CX,CY,H),0.025)
    L.append(P('頭','cyl',(CX,CY,0.07,0.76,0.82),WOOD,detail=24,on=('足1','足2','足3'),note='足のさきをとめる'))
    # つつ：頭のまん中を中心に、太い口（左上）と細い口（右下）
    ang=35*math.pi/180;dx,dy=-0.75,-0.66;l=math.hypot(dx,dy);dx,dy=dx/l,dy/l
    c=(CX,CY+0.02,0.86);hl=0.40
    A=(c[0]+dx*hl*math.cos(ang),c[1]+dy*hl*math.cos(ang),c[2]+hl*math.sin(ang))
    B=(c[0]-dx*hl*math.cos(ang),c[1]-dy*hl*math.cos(ang),c[2]-hl*math.sin(ang))
    L.append(M(P('金具','cyl',(CX,CY,0.03,0.82,0.86),BRASS2,detail=12,on=('頭',),note='頭の上')))
    tube=M(P('つつ','frust',(B,A,0.05,0.075),BRASS,detail=32,on=('金具',),note='左上へ35度上げる'))
    ax=[A[k]-B[k] for k in range(3)];al=math.sqrt(sum(v*v for v in ax));ax=[v/al for v in ax]
    def metal(x,y,z):   # 金属のつや：つつのまわりの向きで、光の帯・こいかげの帯・白い光のすじ（まるいつつに見える）
        p=[x-B[0],y-B[1],z-B[2]];t=sum(p[k]*ax[k] for k in range(3));q=[p[k]-ax[k]*t for k in range(3)];ql=math.sqrt(sum(v*v for v in q)) or 1
        n=[v/ql for v in q];L=(-0.55,-0.25,0.80);d=n[0]*L[0]+n[1]*L[1]+n[2]*L[2]
        if d>0.94:return (255,253,232)
        if d>0.72:return (255,236,160)
        if d>0.35:return (252,218,112)
        if d>-0.05:return (236,190,82)
        if d>-0.45:return (206,152,56)
        if d>-0.80:return (176,122,42)
        return (150,100,36)
    tube.decal=metal;tube.flat=True;tube.metal=False;tube.mtex=False;L.append(tube)   # 場所ごとの色でかげを入れる（5色のかげをかけない）
    def at(t):return tuple(B[k]+(A[k]-B[k])*t for k in range(3))
    for t,nm in((0.30,'帯1'),(0.78,'帯2')):
        r=0.05+0.025*t+0.006
        b=P(nm,'frust',(at(t-0.03),at(t+0.03),r,r),BRASS2,detail=32,on=('つつ',),note='つつにまく');b.tex=False;b.flat=True;b.decal=lambda x,y,z:tuple(int(v*0.86) for v in metal(x,y,z));L.append(b)
    L.append(G(P('レンズ','frust',(at(0.995),at(1.0),0.068,0.068),GLASS,detail=24,on=('つつ',),note='太い口のガラス')))
    E2=tuple(B[k]-(A[k]-B[k])*0.12 for k in range(3))
    e=P('のぞき口','frust',(E2,B,0.025,0.03),BRASS2,detail=16,on=('つつ',),note='細い口のさき');e.tex=False;e.flat=True;e.decal=lambda x,y,z:tuple(int(v*0.86) for v in metal(x,y,z));L.append(e)
    return L
TONE5=True;STREAK=(0.10,0.10)
