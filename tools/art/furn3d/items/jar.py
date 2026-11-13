# みずがめ（jar）：いまの絵と同じデザイン・同じ大きさ。ふっくらしたクリーム色のやきもののかめ。うすい緑の帯が2本。水あり（jar）・水なし（jar~e）の2つの絵。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（64×68ドット）に合わせた）
#   かめ：ろくろでひいた1つの形（底の半径0.28・いちばん太い所の半径0.48（高さ0.24）・首の半径0.38（高さ0.46）・口のふちの半径0.41（高さ0.51））。
#     かべのあつさ0.08。中は、底（高さ0.10）までへこむ。地面におく。
#   帯：うすい緑の帯2本（高さ0.10〜0.19・0.29〜0.36）。やきものの面にのるもよう。
#   中の面：光がとどかないので、外よりくらい（口の近く → 底へ、だんだんくらく）。
#   水：水ありの絵だけ、かめの中、口のふちの0.07下。すけて見える・つやがある（'clear'）。
from blueprint import Part as P
from common import *
import math
ID='jar';BOTTOM=55;GRAD=True
VIEWS=[('jar',0,'full'),('jar~e',0,'empty')]
CX,CY=0.50,0.52;CLAY=(230,212,176);BAND=(196,208,140);WATER=(120,192,236);SKY=(220,240,252)
INLIT=(196,176,140);INDARK=(150,128,100)   # 中の面の色（口の近く → 底）
VAR='full'
PROF=[(0.0,0.0),(0.28,0.0),(0.38,0.06),(0.46,0.15),(0.48,0.24),(0.46,0.34),(0.41,0.42),(0.38,0.46),(0.40,0.49),(0.41,0.51),(0.33,0.515),(0.31,0.48),(0.34,0.42),(0.38,0.34),(0.40,0.24),(0.38,0.15),(0.30,0.10),(0.0,0.10)]
def PARTS():
    p=P('かめ','lathe',(CX,CY,PROF),CLAY,detail=48,note='地面におく。ろくろでひいた1つの形');p.tex=False;p.soft1=False
    OUT=PROF[1:11]   # 外の面の形（底のふちから口のふちまで）
    def rout(z):
        for (r0,a),(r1,b) in zip(OUT,OUT[1:]):
            if a<=z<=b:return r0+(r1-r0)*(z-a)/max(1e-9,b-a)
        return OUT[-1][0]
    def col(x,y,z):
        r=math.hypot(x-CX,y-CY)
        if r<rout(z)-0.03:   # 中の面：光がとどかず、くらい。底ほどくらい
            t=max(0,min(1,(z-0.10)/0.40));return tuple(INDARK[k]+(INLIT[k]-INDARK[k])*t for k in range(3))
        return BAND if (0.10<=z<=0.19 or 0.29<=z<=0.36) else None
    p.decal=col
    return [p]
def EXTRA(sc):
    if VAR!='full':return
    zw=0.44;r=0.33
    def col(x,y):t=max(0,min(1,(CY-y)/(r*1.4)+0.3))**1.4;return tuple(WATER[k]*(1-t)+SKY[k]*t for k in range(3))
    def disk(u,v):U,V=2*u-1,2*v-1;return (CX+r*U*math.sqrt(max(0,1-V*V/2)),CY+r*V*math.sqrt(max(0,1-U*U/2)))
    top=lambda x,y:zw+0.003*math.sin(x*25+y*8)
    sc.material('clear');hfield(sc,CX-r,CY-r,CX+r,CY+r,top,lambda x,y:col(*disk((x-(CX-r))/(2*r),(y-(CY-r))/(2*r))),n=(32,32),shape=disk);sc.material(None)
