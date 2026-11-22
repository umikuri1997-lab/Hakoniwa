# 読めない字の名ふだ（rel_nafuda）：氷のほらあなで見つかる、むかしの道具。かざり。
# 設計図（単位はマス）
#   足：ひらたい石の台（0.26×0.14・高さ0〜0.05）。
#   柱：台のまん中の、細い金ものの柱2本（太さ0.02・高さ0.05〜0.22）。
#   ふだ：柱の上の、金もののうすい板（0.34×0.03・高さ0.20〜0.46）。まっすぐ立てる・かたむけない。正面に、読めない字の彫りあと（こい線のならび）。
from blueprint import Part as P
from common import *
import math
ID='rel_nafuda';GRAD=True;BOTTOM=60
VIEWS=[('rel_nafuda',0)]
CX,CY=0.50,0.58;STONE=(186,190,196);PLATE=(176,190,204);ENG=(110,122,140)
def PARTS():
    L=[notex(P('足','box',(CX-0.13,CY-0.07,0.0,CX+0.13,CY+0.07,0.05),STONE,note='地面におく'))]
    for k,dx in enumerate((-0.09,0.09)):
        p=P('柱%d'%k,'cyl',(CX+dx,CY,0.02,0.05,0.22),PLATE,detail=8,on=('足',),note='台にたてる');p.metal=True;p.tex=False;L.append(p)
    q=P('ふだ','box',(CX-0.17,CY-0.015,0.20,CX+0.17,CY+0.015,0.46),PLATE,on=('柱0','柱1'),note='柱の上');q.metal=True;q.tex=False;q.bevel=0.008
    def cut(x,y,z):
        if y<CY+0.01:return None
        u=(x-(CX-0.14))/0.28;v=(0.43-z)/0.20
        if not(0<=u<=1 and 0<=v<=1):return None
        row=int(v*4);fr=v*4-row
        if fr<0.55 and 0.3<fr:
            s=int(u*9);w=(u*9)%1
            if (s*7+row*3)%5!=0 and 0.15<w<0.8:return ENG
        return None
    q.decal=cut;L.append(q)
    return L
TONE5=True
