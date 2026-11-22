# 石じゅん（cave:stalag#1）：洞窟の床から、上へのびた石。太い1本と、そばに細い2本。
# 設計図（単位はマス）：どれも、ろくろの形。下が太く、だんだん細く、先はまるい。しずくがかたまった、ゆるい段（ふくらみ）が4つ。地面から生える。
from blueprint import Part as P
from common import *
import math
ID='cave_stalag1';TONE5=True;DITHER=0;BOTTOM=60
VIEWS=[('cave:stalag#1',0)]
STONE=(168,152,134)
def prof(r,h):   # 下から上へ：太さが細くなりながら、4か所で少しふくらむ
    pts=[(0.0,0.0),(r,0.0)]
    for i in range(1,13):
        t=i/13;w=r*(1-t)**0.85*(1+0.10*math.sin(t*4*2*math.pi))
        pts.append((max(w,0.006),h*t))
    return pts+[(0.0,h)]
def PARTS():
    L=[]
    for k,(x,y,r,h) in enumerate([(0.46, 0.58, 0.25, 0.68)]+[(0.22, 0.72, 0.12, 0.5), (0.74, 0.78, 0.08, 0.3)]):
        a=P('石じゅん%d'%k,'lathe',(x,y,prof(r,h)),STONE,detail=20,note='地面から生える');a.tex=False;a.curve=True;L.append(a)
    return L
