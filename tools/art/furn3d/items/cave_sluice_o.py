# 洞窟の水門（cave:sluice）：岩のわくに、木の板の門。あけた絵（板が0.34上がる）。
# 設計図（単位はマス）：まわりは、だ円の岩をつんだわく（cave_common.rockframe、高さ0.9）。
#   門の板：たて板4まいの門（はば0.7・あつさ0.08・高さ0.6、上のかどはまるい）を、わくの中にはめる。上に、ひきあげる横木と、なわ。あけた絵は、板が0.34上がり、下から水が出る。
from blueprint import Part as P
from common import *
from cave_common import rockframe,arch
ID='cave_sluice_o';TONE5=True;DITHER=0;BOTTOM=62;PARALLEL=True
VIEWS=[('cave:sluice#o',0)]
Z=0.34;WATER=(124,192,232)
def PARTS():
    L=rockframe(top=0.92)
    pts=[(x,z+Z) for x,z in arch(0.15,0.85,0.62)]
    b=P('門の板','prism',(pts,0.56,0.64),WOOD,on=('岩00','岩10'),note='わくの中にはめる')
    b.decal=lambda x,y,z:tuple(int(c*0.78) for c in WOOD) if any(abs(x-q)<0.008 for q in(0.325,0.5,0.675)) else None;L.append(b)
    L.append(P('横木','tube',([(0.2,0.53,Z+0.46),(0.8,0.53,Z+0.46)],0.03),WOOD,on=('門の板',),note='板の前'))
    L.append(P('なわ','tube',([(0.5,0.6,Z+0.62),(0.5,0.6,0.95)],0.012),(196,170,120),on=('上の岩1',),note='上の岩からつるす'))
    if Z>0:
        w=P('水','egg',(0.5,0.74,0.0,0.33,0.2,0.035,0),WATER,note='門の下から出る水（まるい水たまり）');w.tex=False;w.glow=True;L.append(w)
    return L
