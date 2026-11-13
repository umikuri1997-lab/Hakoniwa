# コンポスター（composter）：いまの絵と同じデザイン・同じ大きさ。木の柱4本に、すきまをあけて横板をうちつけた箱。中に、草がいっぱい。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（55×94ドット）に合わせた）
#   柱4本：0.07角・高さ0.69。地面にたてる。
#   横板：まわり4面に、同じ大きさの板（高さ0.08・あつさ0.025）を、すきま0.035で6だん（高さ0.04〜0.695）。柱の外がわにくぎでとめる。
#   なかみ：入っている量（草＋肥料、20こまで）で高さがかわる。いっぱい（20こ）で高さ0.48〜0.56（まん中がもりあがる）。5こごとに1だん：0.165・0.27・0.375・0.48。
#     草があるときは草：大きな草（長さ0.24）が、ばらばらの向きに見えるもよう（明るい緑・黄緑・こい緑）。草がなくて肥料だけのときは、こげ茶の肥料（こまかいもよう）。
#     からのときは、箱の中の地面（土）が見える。
#   絵：composter（草いっぱい）・composter~0（から）・composter~1〜3（草）・composter~c1〜c4（肥料）。
from blueprint import Part as P
from common import *
import math
ID='composter';BOTTOM=45;GRAD=True
VIEWS=[('composter',0,('g',4)),('composter~0',0,('g',0))]+[('composter~%d'%k,0,('g',k)) for k in(1,2,3)]+[('composter~c%d'%k,0,('c',k)) for k in(1,2,3,4)]
VAR=('g',4)
X0,X1,Y0,Y1=0.10,0.90,0.42,0.92;PS=0.07;H=0.69;BH=0.08;GAP=0.035;BT=0.025
G1=(150,196,84);G2=(196,216,104);G3=(110,160,66)
C1=(128,98,74);C2=(152,120,90);C3=(104,80,62)   # 肥料
SOIL=(150,118,90)   # からの箱の中の地面
def PARTS():
    L=[]
    for nx,x in(('左',X0),('右',X1-PS)):
        for ny,y in(('うしろ',Y0),('前',Y1-PS)):L.append(P('柱（%s%s）'%(nx,ny),'box',(x,y,0,x+PS,y+PS,H),WOOD,bevel=0,note='地面にたてる'))
    for i in range(6):
        z=0.04+i*(BH+GAP)
        L.append(P('前の板%d'%(i+1),'box',(X0,Y1,z,X1,Y1+BT,z+BH),WOOD,on=('柱（左前）','柱（右前）'),bevel=0,note='柱の外にくぎでとめる'))
        L.append(P('うしろの板%d'%(i+1),'box',(X0,Y0-BT,z,X1,Y0,z+BH),WOOD,on=('柱（左うしろ）','柱（右うしろ）'),bevel=0,note='柱の外にくぎでとめる'))
        for nx,x0,x1 in(('左',X0-BT,X0),('右',X1,X1+BT)):L.append(P('%sの板%d'%(nx,i+1),'box',(x0,Y0,z,x1,Y1,z+BH),WOOD,on=('柱（%s前）'%nx,'柱（%sうしろ）'%nx),bevel=0,note='柱の外にくぎでとめる'))
    return L
def EXTRA(sc):   # 草：ふんわりもった草の山。細いすじが、ばらばらの向きに見えるもよう
    kd,lv=VAR
    if lv==0:   # から：箱の中の地面
        sc.decal(None);hfield(sc,X0+0.003,Y0+0.003,X1-0.003,Y1-0.003,lambda x,y:0.012,SOIL,bot=lambda x,y:0.0,n=(8,6));return
    Z0=0.06+(0.48-0.06)*lv/4;AM=0.03+0.0125*lv   # だんの高さ・もりあがり
    def top(x,y):
        u=(x-X0)/(X1-X0)*2-1;v=(y-Y0)/(Y1-Y0)*2-1;return Z0+AM*max(0,1-0.6*(u*u+v*v))+0.006*math.sin(x*61+y*37)
    import random
    CE=0.14 if kd=='g' else 0.06;strands={}
    A,B_,Cc=(G1,G2,G3) if kd=='g' else (C1,C2,C3);SL_=0.12 if kd=='g' else 0.04;SW=0.017 if kd=='g' else 0.012
    def col(x,y,z):   # 草のすじ：ます目（0.14）ごとに、ばらばらの向きの、大きな草（長さ0.24・はば0.034、さきは細い）を1〜2本
        i,j=int(x/CE),int(y/CE)
        for di in(-1,0,1):
            for dj in(-1,0,1):
                k=(i+di,j+dj)
                if k not in strands:
                    r=random.Random(k[0]*7919+k[1]*104729);strands[k]=[((k[0]+r.random())*CE,(k[1]+r.random())*CE,r.uniform(0,math.pi),r.random()<0.5) for _ in range(1+(k[0]+k[1])%2)]
                for sx,sy,a,lt in strands[k]:
                    dx,dy=x-sx,y-sy;along=dx*math.cos(a)+dy*math.sin(a);acr=-dx*math.sin(a)+dy*math.cos(a)
                    if abs(along)<SL_ and abs(acr)<SW*(1-abs(along)/(SL_+0.02)):return B_ if lt else Cc
        return A
    sc.decal(col);sc.smooth(True);hfield(sc,X0+0.003,Y0+0.003,X1-0.003,Y1-0.003,top,A,bot=lambda x,y:0.0,n=(40,30));sc.smooth(False);sc.decal(None)
