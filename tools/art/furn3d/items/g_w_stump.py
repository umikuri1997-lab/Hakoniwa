# 切り株のいす（g_w_stump、特別な家具・木）。もらったデザインの形・色に合わせる。
# 設計図（単位はマス）：切り株（明るい木、たての木目。半径0.3・うしろのかべは高さ0.56、前は高さ0.26まで。中はくりぬいて、すわる所）
#   → すわる所（高さ0.2）→ こけのクッション（ふっくら、高さ0.2〜0.3）と白い花2つ → 左の前に、きのこの段2つ（クリーム色のかさ）
#   → 根もとのこけ2つ → うしろのふちの左右に、2まいの葉の芽。
from blueprint import Part as P
from common import *
from gfcommon import *
import math
ID='g_w_stump';BOTTOM=50;GRAD=True;STREAK=(0.3,0.15)
VIEWS=[('g_w_stump',0)]
CX,CY=0.50,0.55;WOODL=(216,168,112);CUT=(215,170,112);MOSS=(170,164,96);MOSSD=(150,146,84);MUSH=(232,214,184);LEAF=(184,180,116)
def ring(r0,r1,a0,a1,n=18):
    o=[(CX+r1*math.cos(math.radians(a0+(a1-a0)*i/n)),CY+r1*math.sin(math.radians(a0+(a1-a0)*i/n))) for i in range(n+1)]
    return o+[(CX+r0*math.cos(math.radians(a1-(a1-a0)*i/n)),CY+r0*math.sin(math.radians(a1-(a1-a0)*i/n))) for i in range(n+1)]
def PARTS():
    L=[W(P('切り株の底','cyl',(CX,CY,0.3,0.0,0.2),WOODL,detail=40,note='地面におく'))]
    L.append(W(P('うしろのかべ','prism',(ring(0.22,0.3,180,360),0.2,0.56,'z'),WOODL,on=('切り株の底',),note='底の上、うしろ半分')))
    L.append(W(P('前のかべ','prism',(ring(0.22,0.3,0,180),0.2,0.26,'z'),WOODL,on=('切り株の底',),note='底の上、前半分はひくい')))
    L.append(W(P('すわる所','cyl',(CX,CY,0.225,0.2,0.21),CUT,detail=40,on=('切り株の底',),note='くりぬいた中')))
    c=P('こけのクッション','ball',(CX,CY+0.02,0.215,0.21,0.4),MOSS,on=('すわる所',),note='すわる所の上');c.tex=False;c.soft=True;L.append(c)
    for k,(dx,dy) in enumerate([(0.15,0.13)]):
        for j in range(5):
            a=math.radians(90+72*j);f=P('花%d-%d'%(k,j),'ball',(CX+dx+0.018*math.cos(a),CY+dy+0.018*math.sin(a),0.3,0.015,0.4),(252,248,236),on=('こけのクッション',),note='こけの上');f.tex=False;L.append(f)
        L.append(notex(P('花芯%d'%k,'ball',(CX+dx,CY+dy,0.305,0.009),(240,180,100),on=('こけのクッション',),note='花のまん中')))
    for k,(a,z,r) in enumerate([(150,0.1,0.1),(135,0.2,0.085)]):
        x,y=CX+0.3*math.cos(math.radians(a)),CY+0.3*math.sin(math.radians(a))
        m=P('きのこの段%d'%k,'ball',(x-0.02,y+0.03,z,r,0.28),MUSH,on=('切り株の底',),note='切り株のよこに生える');m.tex=False;m.soft=True;L.append(m)
    for k,(a,r) in enumerate([(40,0.09),(200,0.08)]):
        x,y=CX+0.3*math.cos(math.radians(a)),CY+0.3*math.sin(math.radians(a))
        g=P('根もとのこけ%d'%k,'ball',(x,y+0.02,0.03,r,0.5),MOSSD,on=('ground',),note='根もと');g.tex=False;g.soft=True;L.append(g)
    return L
def EXTRA(sc):
    for x in (CX-0.24,CX+0.24):   # うしろのふちの芽（2まいの葉）
        y=CY-0.15
        for s in(-1,1):leaf(sc,(x,y,0.56),(s*0.8,0.2,0.7),0.11,0.05,LEAF,curl=0.1)
TONE5=True;TONE3=True   # かげは3だん・あみなし（特別な家具。持ち主がきめた）
