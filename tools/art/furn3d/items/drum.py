# 合図の太鼓（drum、草原の夜の守り）：4本脚の木の台に、上を向けてのせた洋風の太鼓（ひもばり）。皮の上に、バチを2本。
# 設計図（単位はマス）
#   台の脚：4本（太さ0.035）。まん中から0.23の所に、地面からまっすぐたてる（かたむけない）。高さ0〜0.30。
#   貫：となりの脚どうしを、高さ0.12でつなぐ。
#   台の天板：まるい板（半径0.32・高さ0.30〜0.35）。4本の脚の上。
#   胴：木の胴（半径0.30・高さ0.39〜0.62）。下のたが（半径0.316・0.35〜0.39）にのせる。胴のまわりに、上と下のたがをつなぐ、ひものジグザグ（もよう、8つの山）。
#   たが：上と下に、赤くぬった木の輪（半径0.316・高さ0.04）。上のたがは、まん中のあいた輪（はば0.028）で、皮を胴の口にしめる。
#   皮：うすいクリーム色（半径0.296・0.62〜0.648）。上のたがの内がわ。
#   バチ：2本（太さ0.016・長さ0.45）。上のたがの内がわの皮の上に、ゆるいXの形にかさねて置く（右のバチは左のバチの上）。
import math
from blueprint import Part as P
from common import *
ID='drum';BOTTOM=60;GRAD=True
VIEWS=[('drum',0)]
CX,CY=0.5,0.5;LP=0.23;ZS=0.30;TS=0.05
RB=0.30;RH=0.316;ZB0=ZS+TS;ZB1=ZB0+0.04;ZT0=0.62;ZT1=ZT0+0.04
HOOP=(206,96,84);HIDE=(246,234,206);ROPE=(244,232,200)
def rope(x,y,z):   # ひも：下のたがと上のたがのあいだを、8つの山のジグザグ
    a=math.atan2(y-CY,x-CX);t=(z-ZB1)/(ZT0-ZB1)
    if not 0<=t<=1:return None
    u=(a/(2*math.pi)*8)%1;w=abs(u-0.5)*2   # 0〜1：ジグザグの線の位置
    return ROPE if abs(w-t)<0.1 else None
def PARTS():
    L=[];pos=[]
    for nm,a in(('前',90),('右',0),('左',180),('うしろ',270)):
        t=math.radians(a+45);x,y=CX+LP*math.cos(t),CY+LP*math.sin(t);pos.append((nm,x,y))
        L.append(P('脚（%s）'%nm,'beam',((x,y,0.0),(x,y,ZS),0.035),WOOD,on=('ground',),note='地面にまっすぐたてる'))
    for (n1,x1,y1),(n2,x2,y2) in((pos[0],pos[1]),(pos[1],pos[3]),(pos[3],pos[2]),(pos[2],pos[0])):
        L.append(P('貫（%s・%s）'%(n1,n2),'beam',((x1,y1,0.12),(x2,y2,0.12),0.022),WOOD,on=('脚（%s）'%n1,'脚（%s）'%n2),note='脚と脚のあいだ'))
    L.append(P('台の天板','cyl',(CX,CY,0.32,ZS,ZS+TS),WOOD,on=tuple('脚（%s）'%n for n,_,_ in pos),detail=64,note='4本の脚の上'));L[-1].plainwall=True;L[-1].grp='stand'
    L.append(notex(P('下のたが','cyl',(CX,CY,RH,ZB0,ZB1),HOOP,on=('台の天板',),detail=64,note='天板の上')))
    c=P('胴','cyl',(CX,CY,RB,ZB1-0.002,ZT0+0.002),WOOD,on=('下のたが',),detail=64,note='下のたがの上');c.plainwall=True;c.decal=rope;L.append(c)
    L.append(notex(P('皮','cyl',(CX,CY,RB-0.004,ZT0,ZT1-0.012),HIDE,on=('胴',),detail=64,note='上のたが（EXTRA）の内がわ')));L[-1].grp='hide'
    for nm,(a,b) in(('左',((CX-0.21,CY+0.10),(CX+0.19,CY-0.06))),('右',((CX-0.21,CY-0.05),(CX+0.19,CY+0.12)))):
        z=ZT1-0.012+0.016 if nm=='左' else ZT1-0.012+0.046
        L.append(P('バチ（%s）'%nm,'beam',((a[0],a[1],z),(b[0],b[1],z),0.016),WOOD,on=('皮',) if nm=='左' else ('バチ（左）',),note='上のたがの内がわの皮の上' if nm=='左' else '左のバチの上にかさねる'))
    return L
def EXTRA(sc):   # 上のたが：皮を胴の口にしめる、赤い輪（そと・上・うちの面。皮が見えるように、まん中はあける）
    c=lambda i,a0,a1:HOOP
    sc.group('hoop');sc.ring_wall(CX,CY,RH,ZT0,ZT1,c,n=64);sc.annulus(CX,CY,RB-0.012,RH,ZT1,c,n=64)
    sc.part()
    for i in range(64):   # うちの面（まん中を向く）
        a0=2*math.pi*i/64;a1=2*math.pi*(i+1)/64;r=RB-0.012;p=lambda a,z:(CX+r*math.cos(a),CY+r*math.sin(a),z)
        sc.quad(p(a1,ZT1-0.012),p(a0,ZT1-0.012),p(a0,ZT1),p(a1,ZT1),HOOP)
    sc.group(None)
TONE5=True
