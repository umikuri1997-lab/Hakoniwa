# 洞窟のほね（cave:bone#2）：床にころがる、大きな生き物の頭のほね（目のあな・鼻のあな・歯）。見た目だけのかざり。
# 設計図（単位はマス）：頭（だ円の玉 0.40×0.36×0.31）、手前に、あご（つぶしたたまご形、歯のすきまはうすい線）。目・鼻のあなは面のもよう（くらい色）。
#   持ち主のたのみで大きく（はば0.8マス）。木と同じ5色のかげ（TONE5）。
from blueprint import Part as P
import math
ID='cave_bone2';TONE5=True;BOTTOM=56
VIEWS=[('cave:bone#2',0)]
B=(236,226,200);K=(70,56,44)
def PARTS():
    h=P('あたま','egg',(0.50,0.42,0.31,0.40,0.36,0.31,0),B)
    def holes(px,py,pz):
        if py<0.53:return None
        for ex in(0.34,0.66):
            if math.hypot((px-ex)/0.1,(pz-0.34)/0.09)<1:return K
        if abs(px-0.5)<0.04 and 0.18<pz<0.25:return K
        return None
    h.decal=holes
    j=P('あご','egg',(0.50,0.64,0.09,0.22,0.16,0.11,0),B,on=('ground',))
    j.decal=lambda px,py,pz:(170,150,120) if py>0.72 and 0.06<pz<0.15 and (px*100)%7<1.5 else None
    return[h,j]
