# おし花のがく（g_oshibana、木のせいれいの手紙のお礼）：木のわくの、立てるがく。うしろの足で立つ。中はクリーム色の紙に、おし花（花3りんと葉）。
# 設計図（単位はマス）：わく（木、はば0.5・高さ0.56・あつさ0.04、少しうしろへかたむける）→ 紙（わくの内がわ）→ おし花（紙の上の、うすいもよう）→ 足（うしろの支え）。
from blueprint import Part as P
from common import *
from gfcommon import *
import math
ID='g_oshibana';BOTTOM=46;GRAD=True;STREAK=(0.32,0.16)
VIEWS=[('g_oshibana',0)]
CX,CY=0.50,0.6;W2=0.25;H=0.56;TILT=0.1
PAPER=(246,238,214)
def fr(x0,x1,z0,z1,y,t=0.04):
    return [(x0,z0),(x1,z0),(x1,z1),(x0,z1)]
def PARTS():
    L=[]
    sh=lambda z:CY-TILT*z
    for k,(x0,x1,z0,z1) in enumerate([(CX-W2,CX+W2,0.0,0.06),(CX-W2,CX+W2,H-0.06,H),(CX-W2,CX-W2+0.06,0.0,H),(CX+W2-0.06,CX+W2,0.0,H)]):
        p=W(P('わく%d'%k,'prism',([(x0,z0),(x1,z0),(x1,z1),(x0,z1)],CY-0.02,CY+0.02,'y'),WOOD,note='わく'));L.append(p)
    pp=P('紙','prism',([(CX-W2+0.06,0.06),(CX+W2-0.06,0.06),(CX+W2-0.06,H-0.06),(CX-W2+0.06,H-0.06)],CY-0.012,CY+0.008,'y'),PAPER,on=('わく0',),note='わくの内がわ');PA(pp)
    FL=[(CX-0.09,0.36,(240,150,176)),(CX+0.08,0.4,(186,160,236)),(CX-0.01,0.22,(250,214,110))]
    def pc(x,y,z):
        for fx,fz,c in FL:
            d=math.hypot(x-fx,z-fz)
            if d<0.018:return (250,224,140)
            if d<0.05 and (int(math.atan2(z-fz,x-fx)*5/math.pi+5))%2==0:return c
        if abs(x-(CX+0.0))<0.008 and 0.1<z<0.36 or abs((z-0.18)-(x-CX)*1.2)<0.012 and CX<x<CX+0.08:return (128,182,104)
        return None
    pp.decal=pc;L.append(pp)
    L.append(W(P('足','prism',([(CX-0.03,0.0),(CX+0.03,0.0),(CX+0.03,0.3),(CX-0.03,0.3)],CY-0.2,CY-0.02,'y'),WOOD,on=('わく2',),note='うしろのささえ')))
    return L
TONE5=True;TONE3=True   # かげは3だん・あみ少し（限定の家具。持ち主がきめた）
