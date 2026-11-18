# 炉（smelter、2×2マス）：いまの絵のデザインのまま。石をつんだ、四角いかまど。前のまん中に、アーチの口と、とけた金物をうける石のとい。
#   うしろの右に、まるい煙突。左に、木のふいご（風を送る箱）と、炉へ風を送る木の管。
#   向きをかえられるように（ROTS の 4）、4つの面を作る（前：口・とい、左：ふいご、うしろ・右：石のかべ）。
# 設計図（じっさいに建てられる組み方。単位はマス）
#   炉の本体：石をつんだかたまり（x 0.62〜1.90・y 1.05〜1.62）。左の部分は高さ0.62、右の部分（x 1.40〜）は煙突をのせる高い所（高さ0.86）。
#     前のかべ（あつさ0.24）だけべつの石で、口の形にぬく（上の面は本体と同じ石で、さかいに線を引かない）。
#   口：前のかべの左より（x 1.04）。はば0.40（半径0.20）、アーチのはじまりは高さ0.26。おく0.24まで（中のかべ・天井は、すすの色）。
#   中の火（#on の絵だけ）：口のおくの床に、まっ赤にとけた鉱石の山（光る）。
#   とい：口の前の地面に、石のとい（x 0.86〜1.22・y 1.62〜1.76・高さ0〜0.06）。上の面はくぼみ（くらい色）。
#   煙突：本体の右の高い所の上（中心 x 1.65・y 1.25）。石の筒（外の半径0.18・高さ0.86〜1.10）。穴の中はすす。
#   ふいご：本体の左（x 0.10〜0.50・y 1.10〜1.56）。木の板の箱（高さ0.10〜0.42）を、4本の短い脚（0.06角）にのせる。上に取っ手。
#   管：ふいごの右の面から、本体の左のかべへ（よこの木の角材 0.06角・高さ0.22〜0.28）。
from blueprint import Part as P
from common import *
import math
from shapely.geometry import box as sbox,Point
from shapely.ops import unary_union
ID='smelter';SZ=(2,2);BOTTOM=124;GRAD=True;TONE5=True   # かげは木と同じ5色（furntone。持ち主がきめた）
VIEWS=[('smelter',0),('smelter>1',1),('smelter>2',2),('smelter#on',0,'on'),('smelter>1#on',1,'on'),('smelter>2#on',2,'on')]   # 前・右・後ろ（左は右の反転）。#on は精錬しているあいだの絵
CENTER=None
X0,X1,Y0,Y1,ZT,ZH,XH=0.62,1.90,1.05,1.62,0.62,0.86,1.40;T=0.24
MX,MR,MZ=1.04,0.20,0.26   # 口のまん中・半径・アーチのはじまりの高さ
STONEC=(232,218,184);STONE2=(214,198,166);SOOT=(120,100,88);SOOT2=(96,80,72)
def mouth():return unary_union([sbox(MX-MR,0,MX+MR,MZ),Point(MX,MZ).buffer(MR,64).intersection(sbox(MX-MR,MZ,MX+MR,MZ+MR))])
def soot(x,y,z):   # 口のトンネルの面と、おくのかべは、すす
    if y>Y1-T-0.006 and y<Y1-0.004 and abs(x-MX)<MR+0.004 and (z<MZ+0.004 or math.hypot(x-MX,z-MZ)<MR+0.004):return SOOT if y>Y1-T*0.5 else SOOT2
    if abs(y-(Y1-T))<0.01 and abs(x-MX)<MR and (z<MZ or math.hypot(x-MX,z-MZ)<MR):return (236,140,84) if globals().get('VAR')=='on' else SOOT2   # おくのかべ（精錬中は、火にてらされる）
    return None
def PARTS():
    L=[]
    front=sbox(X0,0,XH,ZT).difference(mouth())
    p=P('前のかべ','prism',(list(front.exterior.coords)[:-1],Y1-T,Y1,'y'),STONEC,on=('ground',),bevel=0,grp='炉',note='地面に石をつむ。口の形にぬく');p.stone=True;p.decal=soot;L.append(p)
    p=P('炉の本体','box',(X0,Y0,0,XH,Y1-T,ZT),STONEC,on=('ground',),bevel=0,grp='炉',note='地面に石をつむ（前のかべのうしろ）');p.stone=True;p.decal=soot;L.append(p)
    p=P('高い所','box',(XH,Y0,0,X1,Y1,ZH),STONE2,on=('ground',),bevel=0,note='地面に石をつむ（煙突をのせる）');p.stone=True;L.append(p)
    L.append(notex(P('口の床','box',(MX-MR,Y1-T,0,MX+MR,Y1-0.002,0.012),SOOT2,on=('ground',),bevel=0,note='口の中の床の石（すす）')))
    if globals().get('VAR')=='on':
        def glow(x,y,z):
            t=min(1,z/0.12);return (255,int(236-60*t),int(150-110*t))
        g=notex(P('とけた鉱石','egg',(MX,Y1-T*0.5,0.02,0.14,0.08,0.07,0),(255,180,90),on=('ground',),note='口のおくの床'));g.glow=True;g.decal=glow;L.append(g)
    def trough(x,y,z):return (150,140,132) if z>0.055 and 0.89<x<1.19 and 1.65<y<1.73 else None
    p=P('とい','box',(0.86,Y1+0.004,0,1.22,1.76,0.06),(206,200,192),on=('ground',),bevel=0,note='口の前の地面におく');p.stone=True;p.decal=trough;L.append(p)
    hole=lambda x,y,z:(92,80,74) if z>1.09 and math.hypot(x-1.65,y-1.25)<0.115 else None
    c=P('煙突','cyl',(1.65,1.25,0.18,ZH,1.10),(204,192,170),on=('高い所',),detail=48,note='本体の上にのせる');c.stone=True;c.decal=hole;L.append(c)
    for nx,x in(('左',0.12),('右',0.42)):
        for ny,y in(('おく',1.12),('前',1.48)):
            L.append(P('ふいごの脚（%s%s）'%(nx,ny),'box',(x,y,0,x+0.06,y+0.06,0.10),WOOD,bevel=0,note='地面に立てる'))
    L.append(P('ふいごの箱','box',(0.10,1.10,0.10,0.50,1.56,0.42),WOOD,bevel=0,on=tuple('ふいごの脚（%s%s）'%(a,b) for a in('左','右') for b in('おく','前')),note='脚の上にのせる'))
    L.append(P('ふいごの取っ手','box',(0.26,1.30,0.42,0.34,1.36,0.48),WOOD,bevel=0,on=('ふいごの箱',),note='箱のふたにとめる'))
    L.append(P('風を送る管','box',(0.50,1.30,0.22,X0,1.36,0.28),(204,166,112),bevel=0,on=('ふいごの箱','炉の本体'),note='ふいごから炉のかべの穴へさしこむ'))
    return L
