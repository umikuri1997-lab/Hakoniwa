# 採石場（quarry）：色は、いまの絵に合わせる。いまの絵（お手本）と同じならび。切り出した石をよせてつみ、右にツルハシを立てかける。手前に小石。
# 形は、トリポのモデル（tools/art/models/tripo：stone_big・stone_mid・stone_round・stone_chunk・stone_slab・pebbles3a・pebble_a）。色は設計図でつける（モデルは色なし）。単位はマス。大きさは、いまの絵（94×72ドット）に合わせた。
#   うしろ：大きな石（stone_big、高さ0.38）の上に、石のかけら（stone_chunk、高さ0.20）をのせる（大きな石のいちばん上の高さに置く）。
#   左：まるい石（stone_round、0.32）。手前：大きな石を小さく向きをかえて（0.26）。右：中くらいの石（stone_mid、0.26）。右手前：平たい石（stone_slab、0.07）。どれも地面に置く。
#   上を向いた面のところどころに、こけ（うすい緑。石の面のもよう）。
#   ツルハシ：木の柄（半径0.030→上0.034）を、地面（1.08,0.84）から、うしろの石によせて立てかける。柄の上のはしは、鉄の頭のまん中の目（半径0.046・長さ0.11の筒）をとおって0.02出る。
#     頭のうで：目から左右へ0.30ずつ、さきほど柄のほうへまがる。右はとがった先（太さ0.034→0.004）、左は平たいのみ（うで0.034→0.020のさきに、はば0.06・あつさ0.014の刃。はばは柄とちょっかくの向き）。
#   小石：3このかたまり・1こを、手前の地面に。
from blueprint import Part as P,model_tris
from common import *
import numpy as np
ID='quarry';GRAD=True;BOTTOM=63
VIEWS=[('quarry',0)]
STONE=(192,178,166);MOSS=(174,200,96);IRON=(196,196,212);HANDLE=(214,150,90);T='tripo/'   # 色は、いまの絵（お手本）に合わせる
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
    # ツルハシ：柄を、鉄の頭のまん中の目（穴）にとおす。頭は目から左右へのびる2本のうで（とがった先・平たいのみ）。柄の上のはしは、目から少し出る
    B=np.array((1.08,0.84,0.0));Tp=np.array((0.90,0.46,0.58));a=(Tp-B)/np.linalg.norm(Tp-B)
    side=np.cross(a,(0,1.0,0));side/=np.linalg.norm(side)
    if side[0]<0:side=-side
    h=P('ツルハシの柄','frust',(tuple(B),tuple(Tp+a*0.075),0.030,0.034),HANDLE,on=('右の石','大きな石'),note='地面から、石に立てかける。上のはしは、頭の目をとおって少し出る');h.detail=12;L.append(notex(h))
    m=P('ツルハシの目','frust',(tuple(Tp-a*0.055),tuple(Tp+a*0.055),0.046,0.046),IRON,on=('ツルハシの柄',),note='柄にはめる（穴に柄をとおす）',grp='ツルハシの頭');m.detail=12;m.metal=True;L.append(notex(m))
    arm=lambda s_,sg:Tp+sg*side*s_-a*0.10*(s_/0.30)**2   # うで：目から外へ、さきほど柄のほうへまがる
    ss=np.linspace(0.03,0.31,8)
    for i in range(7):   # とがった先（右）：目のそばの太さ0.034から、さき0.004へ
        r=lambda s_:0.004+0.030*(1-(s_-0.03)/0.28)**0.9
        p=P('ツルハシのうで（とがった先%d）'%(i+1),'frust',(tuple(arm(ss[i],1)),tuple(arm(ss[i+1],1)),r(ss[i]),r(ss[i+1])),IRON,on=('ツルハシの目',) if i==0 else ('ツルハシのうで（とがった先%d）'%i,),note='目から外へ、ひとつ前につづける',grp='ツルハシの頭');p.detail=12;p.metal=True;L.append(notex(p))
    sc=np.linspace(0.03,0.22,5)
    for i in range(4):   # 平たいのみ（左）：うでは0.034→0.020、そのさきに平たい刃
        r=lambda s_:0.034-0.014*(s_-0.03)/0.19
        p=P('ツルハシのうで（のみ%d）'%(i+1),'frust',(tuple(arm(sc[i],-1)),tuple(arm(sc[i+1],-1)),r(sc[i]),r(sc[i+1])),IRON,on=('ツルハシの目',) if i==0 else ('ツルハシのうで（のみ%d）'%i,),note='目から外へ、ひとつ前につづける',grp='ツルハシの頭');p.detail=12;p.metal=True;L.append(notex(p))
    p=P('ツルハシののみの刃','plate',(tuple(arm(0.21,-1)),tuple(arm(0.30,-1)),0.060,0.014),IRON,on=('ツルハシのうで（のみ4）',),note='うでのさきに、平たい刃（はばは柄とちょっかくの向き）',grp='ツルハシの頭');p.metal=True;L.append(notex(p))
    return L
