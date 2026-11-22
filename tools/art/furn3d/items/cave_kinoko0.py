# 光るきのこ（cave:kinoko#0）：洞窟の床に生える、青みどりに光るきのこ。大1・中2・小2のむれ（持ち主のたのみ：同じきのこで、大きさ・生え方をばらばらに）。
# 設計図（単位はマス）：根もとが少しふくらんだ太いじく（lathe。持ち主のたのみで太く：かさの半径の0.3倍）の上に、ひらいた、あついかさ（ふちが少し下へまるまる、まん中が少し高い、玉にしない。かさの半径の1.1倍・あつさ0.8倍）。
#   かさの下（ひだ）は、くらい色の輪。あみかけなし（DITHER=0）。木と同じ5色のかげ（TONE5）。
from blueprint import Part as P
from common import *
import math
ID='cave_kinoko0';TONE5=True;DITHER=0;BOTTOM=58;ELEV=14
VIEWS=[('cave:kinoko#0',0)]
CAP=(74,190,178);CAPL=(178,250,232);GILL=(40,110,110);STEM=(214,236,222)
M=[(0.52,0.44,0.54,0.28,0),(0.10,0.58,0.36,0.20,0),(0.92,0.60,0.32,0.18,0),(0.30,0.84,0.17,0.11,0),(0.72,0.88,0.14,0.08,0)]   # (x,y,じくの高さ,かさの半径,-)。持ち主のたのみで、0.75倍に小さく
def PARTS():
    L=[]
    for n,(x,y,h,r,lean) in enumerate(M):
        tx=x
        s=P('じく%d'%n,'lathe',(x,y,[(0.0,0.0),(r*0.50,0.0),(r*0.44,h*0.12),(r*0.30,h*0.4),(r*0.27,h*0.8),(r*0.30,h),(0.0,h)]),STEM,detail=12,note='地面から生える');s.tex=False
        L.append(s)
        g=P('ひだ%d'%n,'lathe',(tx,y,[(0.0,h+r*0.10),(r*1.08,h+r*0.05),(r*0.98,h+r*0.18),(0.0,h+r*0.28)]),GILL,detail=24,on=('じく%d'%n,),note='かさのうら');g.tex=False;L.append(g)
        c=P('かさ%d'%n,'lathe',(tx,y,[(r*1.02,h+r*0.02),(r*1.1,h+r*0.16),(r*1.04,h+r*0.36),(r*0.82,h+r*0.58),(r*0.46,h+r*0.74),(0.0,h+r*0.8)]),CAP,detail=24,on=('ひだ%d'%n,),note='ひだの上');c.tex=False
        L.append(c)
    return L
def POST(im):   # かさの中にぽつんとのこる、くらい1ドット（まわりがみな、ちがう色）は、まわりの多い色に
    import numpy as np
    from PIL import Image
    a=np.array(im);H,W=a.shape[:2]
    for y in range(1,H-1):
        for x in range(1,W-1):
            if a[y,x,3]==0:continue
            nb=[tuple(a[y+dy,x+dx]) for dy,dx in((-1,0),(1,0),(0,-1),(0,1))]
            if all(n[3] for n in nb) and all(n!=tuple(a[y,x]) for n in nb):
                a[y,x]=max(set(nb),key=nb.count)
    return Image.fromarray(a)
