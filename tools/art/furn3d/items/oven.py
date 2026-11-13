# かまど（oven）：いまの絵のデザインのまま。正面から見て、たて長でうえがまるい形（まるい屋根のついた箱）の、石をつんだかまど。
#   前の下に、レンガのアーチの大きな口（両わきのレンガの柱は地面まで）。口の中はくらく、火がもえる（3コマでうごく）。屋根のまん中に煙突。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（66×75ドット）に合わせた）
#   本体：石をつんだ1つの形。上から見て角のまるい長四角（はば0.92・おく0.60、角の半径0.18）を、高さ0〜0.30までまっすぐつみ、
#     その上は、はばもおくも半円のようにすぼまるドーム（高さ0.30〜0.62）。石のテクスチャ。石のつみ目（よこ0.18・たて0.11、1だんごとに半分ずらす）のもよう。
#   口：前の面の下の、アーチの形の口（はば0.50・高さ0〜0.49）。中は、くらい灰茶（すすの色、くろくしない）。
#   レンガ：口のまわりに、アーチ11こと、口の両わき（本体のはしまで、3だん）。前の面から0.03出る。
#   火：口の中の手前に、まき2本と、火3つ（まん中が大きい）。コマごとに火の形がかわる（common.flame）。
#   煙突：ドームの上の手前よりに、こい灰色の石のまるい太い煙突（半径0.13・高さ0.56〜0.74）。
from blueprint import Part as P
from common import *
import math
ID='oven';BOTTOM=43;GRAD=True;FRAMES=3
VIEWS=[('oven',0)]
FR=0
CX,CY=0.50,0.60;HW,HD,RC=0.46,0.30,0.18;STONE=(206,196,184);JOINT=(176,164,152);BRICK=(204,108,74);MOUTH=(122,98,88)
YF=CY+HD   # 前の面
def ST(p):p.stone=True;return p
def body_col(x,y,z):   # 石のつみ目：よこ0.18・たて0.11。1だんごとに半分ずらす（前と横の面だけ）
    row=int(z/0.11);u=(x+(0.09 if row%2 else 0))/0.18
    if z<0.62 and (abs(z/0.11-round(z/0.11))*0.11<0.006 or (abs(u-round(u))*0.18<0.006 and z<0.45)):return JOINT
    return None
def PARTS():
    lay=[]
    for z in(0.0,0.30):lay.append((rrect(CX-HW,CY-HD,CX+HW,CY+HD,RC,n=6),z))
    for k in range(1,9):
        a=math.pi/2*k/8;z=0.30+0.32*math.sin(a);c=max(0.02,math.cos(a))
        w,d=HW*c,HD*(0.5+0.5*c);lay.append((rrect(CX-w,CY-d,CX+w,CY+d,max(0.01,min(RC,w*0.9,d*0.9)),n=6),z))
    b=SOFT(P('本体','loft',lay,STONE,note='地面におく。石をつむ'));b.stone=True;b.decal=body_col;L=[b]
    arch=[(CX-0.25,0.0)]+[(CX+0.25*math.cos(math.pi-math.pi*i/12),0.26+0.23*math.sin(math.pi-math.pi*i/12)) for i in range(13)]+[(CX+0.25,0.0)]
    m=P('口の中','prism',(arch,YF+0.002,YF+0.008,'y'),MOUTH,on=('本体',),note='口の中（すす）');m.tex=False
    m.decal=lambda x,y,z:(150,112,90) if z<0.12 and abs(x-CX)<0.16 else None;L.append(m)
    for i in range(11):   # アーチのレンガ
        a0=math.pi*i/11;a1=math.pi*(i+1)/11;ri,ro=0.255,0.345
        pts=[(CX+ri*math.cos(a0),0.26+ri*math.sin(a0)*0.9),(CX+ro*math.cos(a0),0.26+ro*math.sin(a0)*0.9),(CX+ro*math.cos(a1),0.26+ro*math.sin(a1)*0.9),(CX+ri*math.cos(a1),0.26+ri*math.sin(a1)*0.9)]
        q=P('レンガ%d'%(i+1),'prism',(pts,YF-0.01,YF+0.03,'y'),BRICK,on=('本体',),note='口のまわりにアーチ');q.tex=False;L.append(q)
    for nx,xs in(('左',(CX-0.44,CX-0.345,CX-0.255)),('右',(CX+0.255,CX+0.345,CX+0.44))):   # 口の両わき：はしまで、レンガを3だん（1だんに2こ、だんごとに半分ずらす）
        for j in range(3):
            z0=j*0.0867;cuts=xs if j%2==0 else (xs[0],(xs[0]+xs[2])/2,xs[2])
            for a,b in zip(cuts,cuts[1:]):
                q=P('レンガの柱（%s%d-%.2f）'%(nx,j+1,a),'box',(a+0.003,YF-0.01,z0+0.003,b-0.003,YF+0.03,z0+0.0867),BRICK,on=('ground',),bevel=0,note='口の両わき');q.tex=False;L.append(q)
    L.append(ST(P('煙突','cyl',(CX,CY+0.04,0.13,0.56,0.74),(132,124,122),detail=24,on=('本体',),note='ドームのてっぺん')))
    for k,(x,ang) in enumerate(((CX,15),(CX+0.02,-20))):   # まき
        a=math.radians(ang);L.append(notex(P('まき%d'%(k+1),'beam',((x-0.12*math.cos(a),YF+0.03,0.03+0.012*k),(x+0.12*math.cos(a),YF+0.03,0.03+0.012*k),0.025),LOG,on=('ground',),note='口の手前')))
    H=[(0.30,0.14,0.12),(0.34,0.15,0.11),(0.28,0.12,0.14)][FR]   # コマごとの火の高さ（まん中・左・右）
    L.append(flame('火（まん中）',CX,YF+0.035,0.05,H[0],0.10,('まき1','まき2')))
    L.append(flame('火（左）',CX-0.11,YF+0.035,0.045,H[1],0.06,('まき1',)))
    L.append(flame('火（右）',CX+0.11,YF+0.035,0.045,H[2],0.06,('まき2',)))
    return L
