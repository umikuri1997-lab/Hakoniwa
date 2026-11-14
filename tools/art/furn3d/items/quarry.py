# 採石場（quarry）：いまの絵（お手本）と同じならび。岩（トリポの岩モデル tripo/rock.glb）をよせておき、右にツルハシを立てかける。手前に小石。
# 設計図（単位はマス。大きさは、いまの絵（94×72ドット）に合わせた）
#   岩：同じモデルを、大きさ・向きをかえて4つ（同じ物に見えないように）。どれも地面に置く。色は、うすいあたたかい灰色にする（明るさのちがいだけのこす）。
#     うしろの大きな岩（高さ0.50）・左の岩（0.32）・手前の岩（0.28）・右の岩（0.24）。上の面のところどころに、こけ（うすい緑。岩の面のもよう）。
#   ツルハシ：木の柄（半径0.03）を、地面（1.08,0.84）から、うしろの岩によせて立てかける。頭は鉄（まがった管、半径0.026）。柄のさきを頭の穴にさしこむ。
#   小石：同じ岩のモデルを小さく（高さ0.05〜0.07）4こ、地面に。
from blueprint import Part as P,model_tris
from common import *
import numpy as np
ID='quarry';GRAD=True;BOTTOM=63
VIEWS=[('quarry',0)]
STONE=(168,160,150);MOSS=(170,200,112);IRON=(176,180,196);RK='tripo/rock.glb'
def moss(spots,ztop):
    def f(x,y,z):
        if z<ztop-0.06:return None
        for cx,cy,r in spots:   # こけ：まるを3つかさねた、でこぼこの形
            for dx,dy,k in((0,0,1.0),(r*0.8,r*0.3,0.6),(-r*0.6,r*0.5,0.55)):
                if (x-cx-dx)**2+(y-cy-dy)**2<(r*k)**2:return MOSS
        return None
    return f
def rock(nm,x,y,h,rot,tilt=0,spots=(),note='地面に置く'):
    d=(RK,x,y,0,h,rot,tilt);p=P(nm,'model',d,STONE,note=note);p.recol=STONE;p.recolk=0.9;p.stone=True
    if spots:p.decal=moss(spots,model_tris(*d)[0][:,2].max())
    return p
def PARTS():
    L=[rock('うしろの岩',0.52,0.30,0.50,12,spots=((0.40,0.24,0.08),(0.66,0.32,0.06))),
       rock('左の岩',0.10,0.60,0.32,-28,spots=((0.06,0.56,0.07),)),
       rock('手前の岩',0.56,0.74,0.28,18,spots=((0.60,0.70,0.08),)),
       rock('右の岩',0.98,0.46,0.24,62)]
    for k,(x,y,h,r) in enumerate(((0.12,0.96,0.07,20),(0.94,0.98,0.07,80),(0.26,0.88,0.05,140),(1.14,0.80,0.05,200))):
        s=rock('小石%d'%(k+1),x,y,h,r);s.decal=None;L.append(s)
    B=np.array((1.08,0.84,0.0));T=np.array((0.90,0.46,0.58));a=(T-B)/np.linalg.norm(T-B)
    h=P('ツルハシの柄','frust',(tuple(B),tuple(T+a*0.02),0.032,0.030),WOOD,on=('右の岩','うしろの岩'),note='地面から、岩に立てかける');h.detail=12;L.append(notex(h))
    side=np.cross(a,(0,1.0,0));side/=np.linalg.norm(side)
    if side[0]<0:side=-side
    pts=[tuple(T+side*s_-a*0.16*(s_/0.30)**2) for s_ in np.linspace(-0.30,0.30,11)]
    m=P('ツルハシの頭','tube',(pts,0.026),IRON,on=('ツルハシの柄',),note='柄のさきを、頭の穴にさしこむ');m.metal=True;L.append(notex(m))
    return L
