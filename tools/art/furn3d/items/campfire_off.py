# 雨で消えたたき火（campfire#off）：たき火（campfire.py）と同じ石・灰・まきで、火の粒とおき火はない。まきと灰は、ぬれて少しこい色。
import campfire as C
from blueprint import Part as P
from common import *
ID='campfire_off';GRAD=True;BOTTOM=63;TONE5=True
VIEWS=[('campfire#off',0)]
CX,CY=C.CX,C.CY
WETASH=(132,124,120);WETLOG=tuple(max(0,int(v*0.78)) for v in LOG)
def PARTS():
    L=[]
    for p in C.PARTS():
        if p.name.startswith('おき火'):continue
        if p.name=='灰':p.col=WETASH
        elif p.name.startswith('まき'):p.col=WETLOG
        L.append(p)
    return L
