# かまど（oven）：いまの絵と同じデザイン・同じ大きさ。石をつんだドームのかまど。前にレンガのアーチの口、中で火がもえる（3コマでうごく）。うしろに煙突。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（66×75ドット）に合わせた）
#   台：石の台（はば0.94・おく0.66・高さ0〜0.08）。地面におく。
#   ドーム：石でつんだ、まるいドーム（はば0.94・おく0.66、高さ0.08〜0.60。まわりはふくらんだ形）。台の上。石のテクスチャ。
#   口：ドームの前の、アーチの形の口（はば0.40・高さ0.08〜0.38）。まわりにレンガ9こをアーチにならべる（あつさ0.06）。口の中は、火の光でだいだいに光る（おくほどくらい）。
#   火：口の中に、まき2本と、火3つ（まん中が大きい）。火はコマごとに形がかわる（光るのでかげなし。common.flame）。
#   煙突：ドームのうしろの上に、石のまるい煙突（半径0.08・高さ0.50〜0.74）。
from blueprint import Part as P
from common import *
import math
ID='oven';BOTTOM=43;GRAD=True;FRAMES=3
VIEWS=[('oven',0)]
FR=0
CX,CY=0.50,0.58;STONE=(216,204,190);BRICK=(206,112,76);MOUTH=(252,170,84)
YF=CY+0.345   # 口の前の面（ドームのいちばん前より少し前）
def ST(p):p.stone=True;return p
def PARTS():
    L=[ST(P('台','box',(0.03,CY-0.33,0,0.97,CY+0.33,0.08),STONE,bevel=0.01,note='地面におく'))]
    lay=[]
    for k in range(9):
        a=math.pi/2*k/8;z=0.08+0.52*math.sin(a);sx=0.47*math.cos(a)**0.6;sy=0.33*math.cos(a)**0.6
        lay.append(([(CX+max(0.01,sx)*math.cos(t),CY+max(0.01,sy)*math.sin(t)) for t in [2*math.pi*i/40 for i in range(40)]],z))
    d=SOFT(P('ドーム','loft',lay,STONE,on=('台',),note='台の上。石でつむ'));d.stone=True;L.append(d)
    # 口：アーチの形の、光る面（ドームの前の面より少し前）
    arch=[(CX-0.20,0.08)]+[(CX+0.20*math.cos(math.pi-math.pi*i/12),0.26+0.12*math.sin(math.pi-math.pi*i/12)) for i in range(13)]+[(CX+0.20,0.08)]
    m=P('口の中','prism',(arch,YF-0.02,YF-0.005,'y'),MOUTH,on=('台',),note='口の中（火の光）');m.glow=True;m.tex=False
    m.decal=lambda x,y,z:(255,214,120) if z<0.20 and abs(x-CX)<0.12 else (238,140,74) if z>0.32 else None;L.append(m)
    for i in range(9):   # レンガのアーチ
        a0=math.pi*i/9;a1=math.pi*(i+1)/9;ri,ro=0.21,0.28
        pts=[(CX+ri*math.cos(a0),0.26+ri*math.sin(a0)*0.62),(CX+ro*math.cos(a0),0.26+ro*math.sin(a0)*0.62),(CX+ro*math.cos(a1),0.26+ro*math.sin(a1)*0.62),(CX+ri*math.cos(a1),0.26+ri*math.sin(a1)*0.62)]
        b=P('レンガ%d'%(i+1),'prism',(pts,YF-0.03,YF+0.03,'y'),BRICK,on=('ドーム',),note='口のまわりにアーチにならべる',grp='レンガ%d'%i);b.tex=False;L.append(b)
    for nx,x in(('左',CX-0.245),('右',CX+0.245)):
        b=P('レンガの足（%s）'%nx,'box',(x-0.035,YF-0.03,0.08,x+0.035,YF+0.03,0.26),BRICK,on=('台',),bevel=0,note='アーチの両はしの下');b.tex=False;L.append(b)
    L.append(ST(P('煙突','cyl',(CX+0.16,CY-0.14,0.08,0.50,0.74),(204,194,184),detail=24,on=('ドーム',),note='ドームのうしろの上')))
    for k,(x,ang) in enumerate(((CX,20),(CX+0.02,-25))):   # まき：口の中に、ななめに2本
        a=math.radians(ang);L.append(notex(P('まき%d'%(k+1),'beam',((x-0.12*math.cos(a),YF+0.012-0.01*math.sin(a),0.11),(x+0.12*math.cos(a),YF+0.012+0.01*math.sin(a),0.11),0.025),LOG,on=('台',),note='口の中')))
    H=[(0.17,0.11,0.10),(0.20,0.13,0.09),(0.15,0.10,0.12)][FR]   # コマごとの火の高さ（まん中・左・右）
    L.append(flame('火（まん中）',CX,YF+0.012,0.12,H[0],0.06,('まき1','まき2')))
    L.append(flame('火（左）',CX-0.09,YF+0.012,0.11,H[1],0.04,('まき1',)))
    L.append(flame('火（右）',CX+0.09,YF+0.012,0.11,H[2],0.04,('まき2',)))
    return L
