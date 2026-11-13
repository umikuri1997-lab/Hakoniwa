# 木のスツール（stool）：まるい座面・まっすぐな4本の脚（前・左・右・うしろ）・脚をつなぐ横木（貫）。
import math
from blueprint import Part as P
from common import *
ID='stool';BOTTOM=45
VIEWS=[('stool',0)]
CX,CY=0.5,0.60;R=0.27;ZS=0.38;TS=0.08;LR=0.035;LP=0.20;ZN=0.13
def PARTS():
    L=[];pos=[]
    for i,(nm,a) in enumerate((('前',90),('右',0),('左',180),('うしろ',270))):   # 角度は手前（+y）が90度
        t=math.radians(a);x,y=CX+LP*math.cos(t),CY+LP*math.sin(t);pos.append((nm,x,y))
        L.append(P('脚（%s）'%nm,'beam',((x,y,0.0),(x,y,ZS),LR),WOOD,on=('ground',),note='地面にまっすぐたてる'))
    for (n1,x1,y1),(n2,x2,y2) in((pos[0],pos[1]),(pos[1],pos[3]),(pos[3],pos[2]),(pos[2],pos[0])):   # 貫：となりの脚どうしをつなぐ
        L.append(P('貫（%s・%s）'%(n1,n2),'beam',((x1,y1,ZN),(x2,y2,ZN),0.022),WOOD,on=('脚（%s）'%n1,'脚（%s）'%n2),note='脚と脚のあいだ'))
    L.append(P('座面','cyl',(CX,CY,R,ZS,ZS+TS),WOOD,on=tuple('脚（%s）'%n for n,_,_ in pos),detail=64,note='4本の脚の上'));L[-1].plainwall=True;L[-1].grp='top'
    return L
