# 洞窟のほね（cave:bone#2）：大きな生き物の頭のほね：ながい口先・目のあな・鼻のあな・歯のならんだ下あご。持ち主のたのみで作りなおした（太さのかわる骨 tongue・ふるい骨の色）。見た目だけのかざり。
# 設計図（単位はマス）：はば約1.2マス。床に半分うまる高さ。木と同じ5色のかげ（TONE5、あみかけなし）。
ID='cave_bone2';VIEWS=[('cave:bone#2',0)]
from blueprint import Part as P
import math
TONE5=True;DITHER=0;BOTTOM=56
B=(224,208,172);B2=(196,176,138);K=(70,54,40)
def T(name,pts,rs,col=B,on=('ground',)):
    p=P(name,'tongue',(pts,rs),col,on=on);p.tex=False;return p
POST=None
def PARTS():
    h=P('あたま','egg',(0.26,0.50,0.15,0.22,0.2,0.15,0),B);h.tex=False
    def holes(px,py,pz):
        if py>0.58 and math.hypot((px-0.4)/0.08,(pz-0.22)/0.06)<1:return K
        if py>0.6 and 0.66<px<0.74 and 0.14<pz<0.19:return K
        return None
    h.decal=holes
    s=T('口先',[(0.3,0.52,0.15),(0.55,0.55,0.14),(0.8,0.58,0.12),(1.08,0.6,0.08)],[0.15,0.12,0.09,0.045])
    s.decal=holes
    j=T('下あご',[(0.2,0.56,0.05),(0.5,0.62,0.04),(0.8,0.66,0.035),(0.98,0.67,0.03)],[0.06,0.05,0.04,0.02],B2)
    L=[h,s,j]
    for i in range(7):
        x=0.42+i*0.08;L.append(P('歯%d'%i,'cone',(x,0.62+i*0.007,0.018,0.05,0.12),(240,232,210),on=('下あご',)))
    return L
