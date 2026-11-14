# とげの罠（spike）：石の台に、先をとがらせた木のくい4本を、よこ1列にたてた罠。
# 設計図（じっさいに作れる組み方。単位はマス）
#   台：石の板 0.94×0.30・あつさ0.08。地面におく。くいの穴を4つあける。
#   くい：皮のついた8角の木のくい（半径0.075・同じ寸法4本）。台の穴にさしこんで立てる（台の上に0.34）。0.215ずつあけて、まん中にそろえる。
#   先：くいの先を8角の円すいにけずる（高さ0.18）。けずった所は、皮の下の明るい木の色。
from blueprint import Part as P
from common import *
ID='spike';BOTTOM=62;GRAD=True;MERGE=18
VIEWS=[('spike',0)]
STONE=(196,184,168)
CY=0.70;R=0.075;ZB=0.08;ZT=ZB+0.34;ZP=ZT+0.18;XS=[0.5+0.215*(i-1.5) for i in range(4)]
def PARTS():
    b=P('台','box',(0.03,CY-0.15,0,0.97,CY+0.15,ZB),STONE,bevel=0,note='地面におく');b.stone=True;L=[b]
    for i,x in enumerate(XS):
        k=P('くい%d'%(i+1),'cyl',(x,CY,R,ZB-0.002,ZT),LOG,on=('台',),detail=8,note='台の穴にさしこむ');k.plainwall=True;k.tex=False;L.append(k)
        t=P('先%d'%(i+1),'cone',(x,CY,R,ZT,ZP),WOOD,on=('くい%d'%(i+1),),detail=8,note='くいの先をけずる');t.tex=False;L.append(t)
    return L
