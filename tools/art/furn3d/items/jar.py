# みずがめ（jar）：いまの絵と同じデザイン・同じ大きさ。ふっくらしたクリーム色のやきもののかめ。うすい緑の帯が2本。水あり（jar）・水なし（jar~e）の2つの絵。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（64×68ドット）に合わせた）
#   かめ：ろくろでひいた1つの形（底の半径0.28・いちばん太い所の半径0.48（高さ0.24）・首の半径0.38（高さ0.46）・口のふちの半径0.41（高さ0.51））。
#     かべのあつさ0.04。中は、底（高さ0.06）までへこむ。地面におく。
#   帯：うすい緑の帯2本（高さ0.10〜0.19・0.29〜0.36）。やきものの面にのるもよう。
#   水：水ありの絵だけ、かめの中、口のふちの0.07下。すけて見える・つやがある（'clear'）。
from blueprint import Part as P
from common import *
import math
ID='jar';BOTTOM=55;GRAD=True
VIEWS=[('jar',0,'full'),('jar~e',0,'empty')]
CX,CY=0.50,0.52;CLAY=(230,212,176);BAND=(196,208,140);WATER=(120,192,236);SKY=(220,240,252)
VAR='full'
PROF=[(0.0,0.0),(0.28,0.0),(0.38,0.06),(0.46,0.15),(0.48,0.24),(0.46,0.34),(0.41,0.42),(0.38,0.46),(0.40,0.49),(0.41,0.51),(0.37,0.515),(0.35,0.48),(0.38,0.42),(0.42,0.34),(0.44,0.24),(0.42,0.15),(0.34,0.08),(0.0,0.06)]
def PARTS():
    p=P('かめ','lathe',(CX,CY,PROF),CLAY,detail=48,note='地面におく。ろくろでひいた1つの形');p.tex=False;p.soft1=False
    p.decal=lambda x,y,z:BAND if ((0.10<=z<=0.19 and math.hypot(x-CX,y-CY)>0.445) or (0.29<=z<=0.36 and math.hypot(x-CX,y-CY)>0.43)) else None   # 外の面だけ（中の面には帯なし）
    return [p]
def EXTRA(sc):
    if VAR!='full':return
    zw=0.44;r=0.36
    def col(x,y):t=max(0,min(1,(CY-y)/(r*1.4)+0.3))**1.4;return tuple(WATER[k]*(1-t)+SKY[k]*t for k in range(3))
    def disk(u,v):U,V=2*u-1,2*v-1;return (CX+r*U*math.sqrt(max(0,1-V*V/2)),CY+r*V*math.sqrt(max(0,1-U*U/2)))
    top=lambda x,y:zw+0.003*math.sin(x*25+y*8)
    sc.material('clear');hfield(sc,CX-r,CY-r,CX+r,CY+r,top,lambda x,y:col(*disk((x-(CX-r))/(2*r),(y-(CY-r))/(2*r))),n=(32,32),shape=disk);sc.material(None)
