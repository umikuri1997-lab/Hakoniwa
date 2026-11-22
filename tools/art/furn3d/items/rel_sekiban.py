# 組み立ての石板（rel_sekiban）：化石の大ひろまで見つかる、むかしの道具。かざり。
# 設計図（単位はマス）
#   台：ひくい石の台（0.42×0.18・高さ0〜0.06）。
#   板：台のみぞに立てた石の板（0.40×0.06・高さ0.06〜0.52）。まっすぐ立てる・かたむけない。
#   正面に、あなぐまのほねの組み立ての絵の彫りあと（頭・せぼね・あばら・4本の足）。
from blueprint import Part as P
from common import *
import math
ID='rel_sekiban';GRAD=True;BOTTOM=60
VIEWS=[('rel_sekiban',0)]
CX,CY=0.50,0.58;STONE=(204,192,170);ENG=(140,124,102)
def PARTS():
    L=[notex(P('台','box',(CX-0.21,CY-0.09,0.0,CX+0.21,CY+0.09,0.06),(184,172,150),note='地面におく'))]
    q=P('板','box',(CX-0.20,CY-0.03,0.06,CX+0.20,CY+0.03,0.52),STONE,on=('台',),note='台のみぞに立てる');q.tex=False;q.bevel=0.012
    def cut(x,y,z):
        if y<CY+0.02:return None
        u=x-CX;v=z-0.30
        if -0.13<u<0.10 and abs(v)<0.012:return ENG   # せぼね
        if math.hypot(u-0.13,v-0.02)<0.04 and math.hypot(u-0.13,v-0.02)>0.022:return ENG   # 頭
        for k in range(5):
            xx=-0.09+k*0.04
            if abs(u-xx)<0.008 and -0.05<v<0.05:return ENG   # あばら
        for xx in(-0.12,-0.08,0.05,0.09):
            if abs(u-xx)<0.009 and -0.17<v<-0.01:return ENG   # 足
        return None
    q.decal=cut;L.append(q)
    return L
TONE5=True
