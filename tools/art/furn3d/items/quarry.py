# 採石場（quarry）：いまの絵（お手本）と同じならび。切り出した石をよせてつみ、右にツルハシを立てかける。手前に小石。
# 形は、トリポのモデル（tools/art/models/tripo：stone_big・stone_mid・stone_round・stone_chunk・stone_slab・pebbles3a・pebble_a）。色は設計図でつける（モデルは色なし）。単位はマス。大きさは、いまの絵（94×72ドット）に合わせた。
#   うしろ：大きな石（stone_big、高さ0.38）の上に、石のかけら（stone_chunk、高さ0.20）をのせる（大きな石のいちばん上の高さに置く）。
#   左：まるい石（stone_round、0.32）。手前：大きな石を小さく向きをかえて（0.26）。右：中くらいの石（stone_mid、0.26）。右手前：平たい石（stone_slab、0.07）。どれも地面に置く。
#   上を向いた面のところどころに、こけ（うすい緑。石の面のもよう）。
#   ツルハシ：木の柄（半径0.03）を、地面（1.08,0.84）から、うしろの石によせて立てかける。頭は鉄（まがった管、半径0.026）。柄のさきを頭の穴にさしこむ。
#   小石：3このかたまり・1こを、手前の地面に。
from blueprint import Part as P,model_tris
from common import *
import numpy as np
ID='quarry';GRAD=True;BOTTOM=63
VIEWS=[('quarry',0)]
STONE=(196,188,176);MOSS=(170,200,112);IRON=(176,180,196);T='tripo/'
def moss(spots,ztop):
    def f(x,y,z):
        if z<ztop-0.07:return None
        for cx,cy,r in spots:   # こけ：まるを3つかさねた、でこぼこの形
            for dx,dy,k in((0,0,1.0),(r*0.8,r*0.3,0.6),(-r*0.6,r*0.5,0.55)):
                if (x-cx-dx)**2+(y-cy-dy)**2<(r*k)**2:return MOSS
        return None
    return f
def rock(nm,f,x,y,h,rot,z0=0,spots=(),on=('ground',),note='地面に置く'):
    d=(T+f,x,y,z0,h,rot,0);p=P(nm,'model',d,STONE,on=on,note=note);p.recol=STONE;p.recolk=0.9;p.stone=True;V=model_tris(*d)[0]
    if spots:p.decal=moss(spots,V[:,2].max())
    return p,V
def PARTS():
    big,V=rock('大きな石','stone_big.glb',0.50,0.30,0.38,8,spots=((0.40,0.26,0.07),))
    top,_=rock('上の石','stone_chunk.glb',0.46,0.28,0.20,-20,z0=float(V[:,2].max())-0.03,spots=((0.50,0.28,0.06),),on=('大きな石',),note='大きな石の上にのせる')
    L=[big,top,
       rock('まるい石','stone_round.glb',0.08,0.58,0.32,-30,spots=((0.04,0.56,0.07),))[0],
       rock('手前の石','stone_big.glb',0.56,0.76,0.26,35,spots=((0.58,0.74,0.06),))[0],
       rock('右の石','stone_mid.glb',1.00,0.44,0.26,70)[0],
       rock('平たい石','stone_slab.glb',0.92,0.92,0.07,20)[0],
       rock('小石（3こ）','pebbles3a.glb',0.16,0.96,0.07,10)[0],
       rock('小石','pebble_a.glb',1.18,0.80,0.05,40)[0]]
    B=np.array((1.08,0.84,0.0));Tp=np.array((0.90,0.46,0.58));a=(Tp-B)/np.linalg.norm(Tp-B)
    h=P('ツルハシの柄','frust',(tuple(B),tuple(Tp+a*0.02),0.032,0.030),WOOD,on=('右の石','大きな石'),note='地面から、石に立てかける');h.detail=12;L.append(notex(h))
    side=np.cross(a,(0,1.0,0));side/=np.linalg.norm(side)
    if side[0]<0:side=-side
    pts=[tuple(Tp+side*s_-a*0.16*(s_/0.30)**2) for s_ in np.linspace(-0.30,0.30,11)]
    m=P('ツルハシの頭','tube',(pts,0.026),IRON,on=('ツルハシの柄',),note='柄のさきを、頭の穴にさしこむ');m.metal=True;L.append(notex(m))
    return L
