# 依頼ボード（board、2×1マス）：いまの絵のデザインのまま。2本の柱にわたした木のわく・横板をはったボード・上のまん中に金のかざりと青い水晶・
# 右に、金の玉をのせた旗ざおと青い旗（金の星）・足もとの草と白い花。
# 設計図（じっさいに作れる組み方。単位はマス。依頼ボードの左のマスの左上が(0,0)。神殿の絵が左のマスに0.875はみ出すので、ボードは x 0.95 から。
#   大きさは、いまの絵（145×117ドット）に合わせる）
#   柱：2本（0.12角・高さ0〜1.12。x 0.95〜1.07・2.32〜2.44、y 0.58〜0.70）。地面にうめて立てる。てっぺんに、四角いかさ（0.16角）。
#   下の横木：柱のあいだに、ほぞでさしこむ（高さ0.30〜0.40）。
#   上の横木：柱のてっぺんの少し下に、柱の外まで0.06出してのせる（高さ0.98〜1.08）。
#   ボードの板：柱と横木のあいだに、横板5まい（おく0.04）を、柱のうしろの桟にくぎでとめる。
#   かざり：上の横木のまん中に、金の山の形の板と、まん中に青い水晶（光る）。
#   旗ざお：x 2.66 に、まるいさお（半径0.03・高さ0〜1.30）。てっぺんに金の玉。さおの右に、金の横棒でつるした青い旗（下はつばめの尾、金の星のもよう）。
#   草：柱・さおの足もとに、草むらと白い花（粒）。
from blueprint import Part as P
from common import *
import math,random
from temple import GOLD,BAN,STARC,CRY,LEAF,LEAF2,star,MT,GL,LF,grass,gbox
ID='board';BOTTOM=62;GRAD=True;CONTRAST=1.25;OUTERK=True;POUT=0.78   # まわりのふちの輪郭線は、目地のうすい線（olk）にしない。粒のコケ・草むらにも輪郭線
VIEWS=[('board',0)]
XA,XB=0.95,2.44;PW=0.12;Y0,Y1=0.60,0.70;ZT=1.35
def PARTS():
    L=[]
    for nm,x in(('左',XA),('右',XB-PW)):
        L.append(P('%sの柱'%nm,'box',(x,Y0,0,x+PW,Y1,ZT),WOOD,bevel=0.01,note='地面にうめて立てる'))
        L.append(P('%sのかさ'%nm,'box',(x-0.03,Y0-0.02,ZT,x+PW+0.03,Y1+0.035,ZT+0.04),WOOD,on=('%sの柱'%nm,),bevel=0.01,note='柱のてっぺん'))
    # わく：上と下の横木（柱のあいだに、ほぞでさしこむ。前へ少し出す）・柱との交わる所に四角い金具のような木のブロック・中に、へこんだ横板
    L.append(P('下の横木','box',(XA+PW,Y0-0.01,0.34,XB-PW,Y1+0.02,0.46),WOOD,on=('左の柱','右の柱'),bevel=0.01,note='柱にほぞでさしこむ'))
    L.append(P('上の横木','box',(XA+PW,Y0-0.01,1.20,XB-PW,Y1+0.02,1.32),WOOD,on=('左の柱','右の柱'),bevel=0.01,note='柱にほぞでさしこむ'))
    for nm,x in(('左',XA),('右',XB-PW)):
        for hn,(z0_,z1_) in(('上',(1.19,1.35)),('下',(0.33,0.47))):
            L.append(P('%s%sのブロック'%(nm,hn),'box',(x-0.02,Y0-0.015,z0_,x+PW+0.02,Y1+0.03,z1_),WOOD,on=('%sの柱'%nm,),bevel=0.01,note='柱と横木の交わる所'))
    L.append(P('うしろの桟','box',(XA+PW,Y0,0.46,XB-PW,Y0+0.03,1.20),WOOD,on=('下の横木',),bevel=0.01,note='板をとめる'))
    n=5;z0,z1=0.46,1.20;h=(z1-z0)/n
    for k in range(n):
        L.append(P('板%d'%(k+1),'box',(XA+PW,Y0+0.03,z0+k*h+0.003,XB-PW,Y0+0.065,z0+(k+1)*h-0.003),WOOD,on=('うしろの桟',),bevel=0.01,note='桟にくぎでとめる（わくより、へこむ）'))
    mx=(XA+XB)/2
    L.append(MT(P('金のかざり','prism',([(mx-0.32,1.32),(mx+0.32,1.32),(mx+0.24,1.38),(mx,1.52),(mx-0.24,1.38)],Y1-0.06,Y1+0.01),GOLD,on=('上の横木',),note='上の横木にのせる')))
    c=GL(P('青い水晶','lathe',(mx,Y1+0.02,[(0.0,1.52),(0.085,1.40),(0.0,1.28)]),CRY,detail=4,on=('金のかざり',)))
    c.decal=lambda x,y,z:(230,248,255) if x<mx and z>1.40 else (110,176,236) if x>mx+0.01 and z<1.40 else None;L.append(c)
    # 旗ざお
    PX=2.66;PY=0.64
    L.append(P('旗ざお','cyl',(PX,PY,0.035,0,1.60),WOOD,on=('ground',),detail=24,note='地面にうめて立てる'))
    L.append(MT(P('さおの玉','ball',(PX,PY,1.65,0.06),GOLD,on=('旗ざお',))))
    L.append(MT(P('旗の横棒','box',(PX,PY-0.015,1.44,PX+0.40,PY+0.015,1.48),GOLD,on=('旗ざお',),note='さおにさしこむ')))
    bx0,bx1,zt,zb=PX+0.06,PX+0.38,1.44,0.86
    f=P('旗','prism',([(bx0,zt),(bx1,zt),(bx1,zb),((bx0+bx1)/2,zb+0.09),(bx0,zb)],PY-0.01,PY+0.01),BAN,on=('旗の横棒',));f.tex=False;f.soft1=True
    cx=(bx0+bx1)/2
    def deco(x,y,z):
        if z>zt-0.035:return (196,204,214)   # 上のはしの白い帯
        r=math.hypot(x-cx,z-1.12);a=math.atan2(z-1.12,x-cx)
        if r<0.09*(0.3+0.7*abs(math.cos(2*a))**3):return STARC
        return None
    f.decal=deco;L.append(f)
    return L
GSP=((XA+0.02,Y1+0.02),(XA+0.13,Y1+0.03),(XB-0.11,Y1+0.02),(XB,Y1+0.03),(2.66,0.69))
PBOX=gbox(GSP)
def PWATER():return grass(GSP,6,flowers=((XA+0.07,Y1+0.10,0.16),(XB-0.05,Y1+0.10,0.17)))   # 足もとの草むらと白い花は粒
