# 光るきのこ（cave:kinoko）：洞窟の床に生える、青みどりに光るきのこ3本。
# 設計図（単位はマス）：じく（まるい棒）の上に、まるいかさ。大（じく高さ0.26・かさ半径0.15）、中（0.18・0.12）、小（0.1・0.08）。地面から生える。
from blueprint import Part as P
from common import *
import math
ID='cave_kinoko';GRAD=True;BOTTOM=58
VIEWS=[('cave:kinoko',0)]
CAP=(98,214,196);CAPL=(190,255,238);STEM=(206,240,226)
def PARTS():
    L=[]
    for n,(x,y,h,r) in enumerate([(0.58,0.50,0.26,0.15),(0.33,0.60,0.18,0.12),(0.60,0.74,0.10,0.08)]):
        s=P('じく%d'%n,'cyl',(x,y,r*0.26,0.0,h),STEM,detail=10,note='地面から生える');s.tex=False;s.glow=True;L.append(s)
        c=P('かさ%d'%n,'lathe',(x,y,[(0.0,h-0.01),(r,h-0.01),(r*0.98,h+r*0.18),(r*0.8,h+r*0.48),(r*0.5,h+r*0.7),(0.0,h+r*0.8)]),CAP,detail=20,on=('じく%d'%n,),note='じくの上');c.tex=False;c.glow=True;c.curve=True
        def col(px,py,pz,x=x,y=y,h=h,r=r):
            d=math.hypot(px-x,py-y)/r
            return CAPL if d<0.38 else None
        c.decal=col;L.append(c)
    return L
