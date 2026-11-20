# 石じゅん（cave:stalag#0）：洞窟の床から、上へのびた石。太い1本と、そばに細い2本。
# 設計図（単位はマス）：どれも、ろくろの形。下が太く、だんだん細く、先はまるい。しずくがかたまった、ゆるい段（ふくらみ）が4つ。地面から生える。
from blueprint import Part as P
from common import *
import math
ID='cave_stalag0';TONE5=True;DITHER=0;BOTTOM=60
VIEWS=[('cave:stalag#0',0)]
STONE=(168,152,134)
def prof(r,h):   # 下から上へ：太さが細くなりながら、4か所で少しふくらむ
    pts=[(0.0,0.0),(r,0.0)]
    for i in range(1,13):
        t=i/13;w=r*(1-t)**0.85*(1+0.10*math.sin(t*4*2*math.pi))
        pts.append((max(w,0.006),h*t))
    return pts+[(0.0,h)]
def PARTS():
    L=[]
    for k,(x,y,r,h) in enumerate([(0.5, 0.56, 0.22, 0.95)]+[(0.78, 0.7, 0.1, 0.42), (0.26, 0.76, 0.07, 0.26)]):
        a=P('石じゅん%d'%k,'lathe',(x,y,prof(r,h)),STONE,detail=20,note='地面から生える');a.tex=False;a.curve=True;L.append(a)
    return L
