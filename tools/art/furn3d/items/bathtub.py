# バスタブ（bathtub）：いまの絵と同じデザイン・同じ大きさ。ねこ足の、ふちのまるい白いバスタブ。左のはしに真ちゅうのじゃぐち。中に水。前（bathtub）と横（bathtub>1、左へまわして、じゃぐちがうしろ）の2つの向き。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（前84×53・横48×84ドット）に合わせた）
#   おけ：ほうろうの1つの形。上から見て角の大きくまるい長四角（長さ1.26・はば0.62、角の半径0.24）。
#     外がわ：底（高さ0.12、まわりより0.08内がわ）から、高さ0.28まで、ふくらみながら広がる。ふちは、かべのあつさいっぱいの、まるい断面（半径0.06、外へ0.035出る）で、分厚くする（高さ0.288〜0.40）。内がわは、内のかべにそのままつながる。
#     内がわ：かべのあつさ0.09。ふちの内がわから、底（高さ0.17）までへこませる。
#   ねこ足4つ：真ちゅう。おけの底の4つの角の下（高さ0〜0.13）。おけの底をささえる。
#   じゃぐち：真ちゅう。左のはしのふちのてっぺんに、たての管（高さ0.39〜0.56）と、内がわへまがる口。左右に、まるいハンドル2つ。
#   水：おけの中、ふちの0.10下。すけて見える・つやがある（'clear'、水おけと同じ）。
from blueprint import Part as P
from common import *
import math
ID='bathtub';BOTTOM=54
VIEWS=[('bathtub',0),('bathtub>1',3)]
CX,CY=0.50,0.58;HL,HW,RC=0.63,0.31,0.24;BRASS=(222,170,92);ENAMEL=(250,246,238)
WATER=(120,192,236);SKY=(220,240,252)
def rr(inset,z,n=8):return rrect(CX-HL+inset,CY-HW+inset,CX+HL-inset,CY+HW-inset,max(0.02,RC-inset),n=n)
def MT(p):p.metal=True;return p
def SOFT1(p):p.soft1=True;return p   # ほうろう：うすいかげだけ（白い物を灰色にしない）
def PARTS():
    RC_,RR,ZR=0.025,0.06,0.34   # ふちのまき返し：まるい断面の中心（内がわへの量）・半径・高さ
    lay=[(rr(0.08,0),0.12),(rr(0.035,0),0.18),(rr(0.008,0),0.24),(rr(0.0,0),0.28)]
    for k in range(14):   # ふち：かべのあつさいっぱいの、まるい断面（下 → 外 → 上 → 内がわ）。内がわは、内のかべにそのままつながる（内へはみ出さない）
        t=math.radians(-60+k*18);lay.append((rr(RC_-RR*math.cos(t),0),ZR+RR*math.sin(t)))
    lay+=[(rr(0.09,0),0.27),(rr(0.095,0),0.25),(rr(0.105,0),0.21),(rr(0.14,0),0.17)]
    L=[notex(SOFT1(P('おけ','loft',lay,ENAMEL,on=('ねこ足（左うしろ）','ねこ足（右前）'),note='ねこ足の上。ふちはまるくまき返す')))]
    for nx,x in(('左',CX-HL+0.17),('右',CX+HL-0.17)):
        for ny,y in(('うしろ',CY-HW+0.12),('前',CY+HW-0.12)):L.append(MT(P('ねこ足（%s%s）'%(nx,ny),'cone',(x,y,0.045,0.0,0.13),BRASS,detail=10,note='地面にたてる。おけの底をささえる')))
    zt=0.40;xf=CX-HL+0.03   # じゃぐちは、左のはしのふちのてっぺん（まん中）にたてる
    L.append(MT(P('じゃぐちの管','cyl',(xf,CY,0.022,zt-0.01,zt+0.16),BRASS,detail=10,on=('おけ',),note='ふちにたてる')))
    L.append(MT(P('じゃぐちの口','beam',((xf,CY,zt+0.15),(xf+0.13,CY,zt+0.10),0.02),BRASS,on=('じゃぐちの管',),note='管の上から、おけの内がわへ')))
    for ny,y in(('うしろ',CY-0.07),('前',CY+0.07)):L.append(MT(P('ハンドル（%s）'%ny,'ball',(xf,y,zt+0.08,0.025),BRASS,on=('じゃぐちの管',),note='管の左右')))
    return L
def EXTRA(sc):   # 水：おけの中、ふちの0.10下。すけて見える・つやがある。おくのほうは空をうつして明るい
    zw=0.30;ins=0.09
    def col(x,y):t=max(0,min(1,(CY-y)/(HW*1.4)+0.25))**1.4;return tuple(WATER[k]*(1-t)+SKY[k]*t for k in range(3))
    a,b=HL-ins,HW-ins
    def shp(u,v):   # 0〜1 のます目を、角のまるい長四角の水面にうつす（超楕円）
        U,V=2*u-1,2*v-1;m=max(abs(U),abs(V),1e-9);p=4.0;r=(abs(U)**p+abs(V)**p)**(1/p)/m
        return (CX+a*U/max(r,1e-9),CY+b*V/max(r,1e-9))
    top=lambda x,y:zw+0.004*math.sin(x*21+y*7)+0.003*math.sin(y*29-x*9)
    sc.material('clear');hfield(sc,CX-a,CY-b,CX+a,CY+b,top,col,n=(48,24),shape=shp);sc.material(None)
