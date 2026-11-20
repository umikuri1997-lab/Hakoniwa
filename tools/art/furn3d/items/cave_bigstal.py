# 大きな石じゅん（cave:bigstal）：ARKの洞窟のような、大きな岩の形（持ち主のたのみ）。床から高くのびた石じゅん3本（高さ1.7・1.1・0.7マス）。
# 設計図（単位はマス）：小さな石じゅん（cave_stalag0）と同じ作り：ろくろの形で、下が太く、だんだん細く、しずくがかたまった、ゆるい段（ふくらみ）が5つ。地面から生える。
from blueprint import Part as P
from common import *
import math
ID='cave_bigstal';TONE5=True;DITHER=0;BOTTOM=58
VIEWS=[('cave:bigstal',0)]
STONE=(168,152,134)
def prof(r,h,ph):
    pts=[(0.0,0.0),(r,0.0)]
    for i in range(1,17):
        t=i/17;w=r*(1-t)**0.8*(1+0.12*math.sin(t*5*2*math.pi+ph))
        pts.append((max(w,0.008),h*t))
    return pts+[(0.0,h)]
def PARTS():
    L=[]
    for k,(x,y,r,h) in enumerate([(0.50,0.52,0.30,1.7),(0.18,0.68,0.20,1.1),(0.82,0.72,0.16,0.7)]):
        a=P('石じゅん%d'%k,'lathe',(x,y,prof(r,h,k*1.3)),STONE,detail=20,note='地面から生える');a.tex=False;a.curve=True;L.append(a)
    return L
