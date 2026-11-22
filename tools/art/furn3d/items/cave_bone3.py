# 洞窟のほね（cave:bone#3）：しっぽのほね：小さな骨が、ゆるくまがりながら、つらなる（先ほど小さい）。持ち主のたのみで作りなおした（太さのかわる骨 tongue・ふるい骨の色）。見た目だけのかざり。
# 設計図（単位はマス）：はば約1.2マス。床に半分うまる高さ。木と同じ5色のかげ（TONE5、あみかけなし）。
ID='cave_bone3';VIEWS=[('cave:bone#3',0)]
from blueprint import Part as P
import math
TONE5=True;DITHER=0;BOTTOM=56
B=(224,208,172);B2=(196,176,138);K=(70,54,40)
def T(name,pts,rs,col=B,on=('ground',)):
    p=P(name,'tongue',(pts,rs),col,on=on);p.tex=False;return p
POST=None
def PARTS():
    L=[]
    for i in range(12):
        t=i/11;x=-0.1+t*1.2;y=0.5+0.18*math.sin(t*3.4);r=0.075*(1-t*0.6)
        L.append(P('ほね%d'%i,'egg',(x,y,r*0.9,r*1.1,r,r*0.9,math.degrees(math.atan2(0.18*3.4*math.cos(t*3.4)/1.2,1))),B if i%2 else B2))
        if i%2==0:L.append(T('とげ%d'%i,[(x,y,r*1.5),(x,y-0.02,r*1.5+0.08*(1-t))],[0.022*(1-t*0.5),0.006]))
    return L
