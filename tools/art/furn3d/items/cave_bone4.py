# 洞窟のほね（cave:bone#4）：ちらばった小さなほね：短いほね・こまかなかけら・骨のかたまり。持ち主のたのみで作りなおした（太さのかわる骨 tongue・ふるい骨の色）。見た目だけのかざり。
# 設計図（単位はマス）：はば約1.2マス。床に半分うまる高さ。木と同じ5色のかげ（TONE5、あみかけなし）。
ID='cave_bone4';VIEWS=[('cave:bone#4',0)]
from blueprint import Part as P
import math
TONE5=True;DITHER=0;BOTTOM=56
B=(224,208,172);B2=(196,176,138);K=(70,54,40)
def T(name,pts,rs,col=B,on=('ground',)):
    p=P(name,'tongue',(pts,rs),col,on=on);p.tex=False;return p
POST=None
def PARTS():
    L=[]
    for i,(x,y,a,l) in enumerate([(0.3,0.5,20,0.34),(0.7,0.42,-35,0.28),(0.55,0.72,70,0.22),(0.2,0.78,-10,0.18)]):
        ca,sa=math.cos(math.radians(a)),math.sin(math.radians(a));p0=(x-ca*l/2,y-sa*l/2,0.035);p1=(x+ca*l/2,y+sa*l/2,0.035)
        L.append(T('ほね%d'%i,[p0,tuple((p0[k]+p1[k])/2 for k in range(3)),p1],[0.045,0.028,0.045],B if i%2 else B2))
    for i,(x,y) in enumerate([(0.82,0.66),(0.44,0.3),(0.12,0.4)]):L.append(P('かけら%d'%i,'egg',(x,y,0.02,0.04,0.03,0.025,i*40),B2))
    return L
