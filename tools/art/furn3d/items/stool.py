# 木のスツール（stool）：まるい座面・3本の脚（まっすぐ）。手前に2本・おくに1本。
import math
from blueprint import Part as P
from common import *
ID='stool';BOTTOM=45
VIEWS=[('stool',0)]
CX,CY=0.5,0.60;R=0.27;ZS=0.38;TS=0.08;LR=0.04
def PARTS():
    L=[]
    for i,a in enumerate((60,120,270)):   # 角度は手前（+y）が90度
        t=math.radians(a)
        top=(CX+0.21*math.cos(t),CY+0.21*math.sin(t),ZS);bot=(CX+0.21*math.cos(t),CY+0.21*math.sin(t),0.0)
        L.append(P('脚%d'%(i+1),'beam',(bot,top,LR),WOOD2,note='地面から座面の下へ'))
    L.append(P('座面','cyl',(CX,CY,R,ZS,ZS+TS),WOOD,on=('脚1','脚2','脚3'),detail=64,note='3本の脚の上'));L[-1].plainwall=True;L[-1].grp='top'
    return L
