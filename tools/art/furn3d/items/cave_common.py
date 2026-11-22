# 洞窟の小物の共通の部品：岩のわく（とびら・水門）。直角を出さない（持ち主のきまり）ので、だ円の岩をつみかさねて、わくにする。
from blueprint import Part as P
import math
ROCK=(150,134,120)
def rockframe(col=ROCK,top=1.05,y=0.62):
    """左右に、だ円の岩を3つずつつみ、上に3つの岩をわたす。(部品の一覧)"""
    L=[]
    for s,x in((0,0.06),(1,0.94)):
        for i,(z,r) in enumerate(((0.12,0.15),(0.42,0.13),(0.70,0.12))):
            L.append(P('岩%d%d'%(s,i),'egg',(x+(0.01 if i%2 else -0.01)*(1 if s else -1),y,z,r,0.14,r*1.05,20*i+(40 if s else 0)),col,on=('ground',) if i==0 else ('岩%d%d'%(s,i-1),)))
    for i,(x,r) in enumerate(((0.22,0.15),(0.5,0.17),(0.78,0.15))):
        L.append(P('上の岩%d'%i,'egg',(x,y,top-0.02+(0.03 if i==1 else 0),r,0.14,0.11,15*i),col,on=('岩02','岩12')))
    return L
def arch(x0,x1,z1,n=10):
    """上がまるいアーチの形（x,z の点）"""
    cx,r=(x0+x1)/2,(x1-x0)/2;pts=[(x0,0.0),(x0,z1-r*0.8)]
    for i in range(1,n):a=math.pi-math.pi*i/n;pts.append((cx+r*math.cos(a),z1-r*0.8+r*0.8*math.sin(a)))
    return pts+[(x1,z1-r*0.8),(x1,0.0)]
