# 洞窟の水門（cave:sluice#o）：石のわくに、木の板の門。あけた絵。
# 設計図（単位はマス）：左右に石の柱（はば0.16・おく0.2・高さ0.8）、上に石のかさ木（高さ0.8〜0.94）。
#   門の板：木の板（はば0.68・あつさ0.08・高さ0.6）を、柱のみぞにはめる。上に、ひきあげる横木。あけた絵は、板が0.34上がり、下から水が出る。
from blueprint import Part as P
from common import *
ID='cave_sluice_o';GRAD=True;BOTTOM=62;PARALLEL=True
VIEWS=[('cave:sluice#o',0)]
ST=(150,134,120);Z=0.34;WATER=(124,192,232)
def PARTS():
    L=[]
    for n,x in enumerate((0.0,0.84)):
        p=P('柱%d'%n,'box',(x,0.5,0.0,x+0.16,0.7,0.8),ST,note='地面にたてる');p.tex=False;L.append(p)
    p=P('かさ木','box',(0.0,0.47,0.8,1.0,0.73,0.94),ST,on=('柱0','柱1'),note='柱の上にのせる');p.tex=False;L.append(p)
    L.append(P('門の板','box',(0.16,0.56,Z,0.84,0.64,Z+0.6),WOOD,on=('柱0','柱1'),note='柱のみぞにはめる'))
    L.append(P('横木','box',(0.2,0.545,Z+0.5,0.8,0.655,Z+0.58),WOOD,on=('門の板',),note='板の上のはし'))
    if Z>0:
        w=P('水','box',(0.17,0.58,0.0,0.83,0.9,0.06),WATER,note='門の下から出る水');w.tex=False;w.glow=True;L.append(w)
    return L
TONE5=True
