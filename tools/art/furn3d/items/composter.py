# コンポスター（composter）：いまの絵と同じデザイン・同じ大きさ。木の柱4本に、すきまをあけて横板をうちつけた箱。中に、草がいっぱい。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（55×94ドット）に合わせた）
#   柱4本：0.07角・高さ0.69。地面にたてる。
#   横板：まわり4面に、同じ大きさの板（高さ0.08・あつさ0.025）を、すきま0.035で6だん（高さ0.04〜0.695）。柱の外がわにくぎでとめる。
#   草：箱の中、横板の上のはしより少し上まで、ふんわりもった草（高さ0.69〜0.78、まん中がもりあがる）。長い草（長さ0.17）が、ばらばらの向きに見えるもよう（明るい緑・黄緑・こい緑）。
from blueprint import Part as P
from common import *
import math
ID='composter';BOTTOM=45;GRAD=True
VIEWS=[('composter',0)]
X0,X1,Y0,Y1=0.10,0.90,0.42,0.92;PS=0.07;H=0.69;BH=0.08;GAP=0.035;BT=0.025
G1=(150,196,84);G2=(196,216,104);G3=(110,160,66)
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
    def top(x,y):
        u=(x-X0)/(X1-X0)*2-1;v=(y-Y0)/(Y1-Y0)*2-1;return 0.69+0.09*max(0,1-0.6*(u*u+v*v))+0.006*math.sin(x*61+y*37)
    import random
    rnd=random.Random(3);CE=0.09;strands={}
    def col(x,y,z):   # 草のすじ：ます目（0.09）ごとに、ばらばらの向きの、長い草（長さ0.17・はば0.022、さきは細い）を2本
        i,j=int(x/CE),int(y/CE)
        for di in(-1,0,1):
            for dj in(-1,0,1):
                k=(i+di,j+dj)
                if k not in strands:
                    r=random.Random(k[0]*7919+k[1]*104729);strands[k]=[((k[0]+r.random())*CE,(k[1]+r.random())*CE,r.uniform(0,math.pi),r.random()<0.5) for _ in range(2)]
                for sx,sy,a,lt in strands[k]:
                    dx,dy=x-sx,y-sy;along=dx*math.cos(a)+dy*math.sin(a);acr=-dx*math.sin(a)+dy*math.cos(a)
                    if abs(along)<0.085 and abs(acr)<0.011*(1-abs(along)/0.1):return G2 if lt else G3
        return G1
    sc.decal(col);sc.smooth(True);hfield(sc,X0,Y0,X1,Y1,top,G1,bot=lambda x,y:0.45,n=(40,30));sc.smooth(False);sc.decal(None)
