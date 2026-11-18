# 森の柱時計（hdokei）：宝箱だけの家具。木の背の高い箱の時計。上に文字ばん、下にふりこのまど。
# 設計図（じっさいに作れる組み方。単位はマス。せいれいの背 約1.7マスより少し低い）
#   台：木の箱（よこ0.46・おく0.30・高さ0〜0.10）。地面におく。
#   胴：木の箱（よこ0.38・おく0.24・高さ0.10〜1.10）。台の上。
#   頭：木の箱（よこ0.46・おく0.30・高さ1.10〜1.46）。胴の上。てっぺんに、三角のかざり屋根（高さ1.46〜1.58）。
#   文字ばん：頭の正面に、クリーム色のまるい板（半径0.14）。12の目もりと、長い針・短い針。まわりに金の輪。
#   ふりこのまど：胴の正面に、うすい青のガラス（よこ0.20・高さ0.30〜0.86）。中に金のふりこ（棒と、まるい重り）。
#   葉のかざり：頭の左右の上に、木を彫った葉（みどりは、ぬらない）。
from blueprint import Part as P
from common import *
import math,os
import oblique3d as O
ID='hdokei';BOTTOM=63;GRAD=True;PARALLEL=True
VIEWS=[('hdokei',0)]
CX,CY=0.50,0.60
FACE=(250,244,226);GOLD=(236,200,112);GLASS=(208,230,242);HAND=(96,74,64)
GRAIN=O.Tex(os.path.join(os.path.dirname(__file__),'..','..','textures','wood049.png'),span=1.2,flow=8,minrun=3,dark=(0.30,0.84),light=(0.22,1.08))   # 木目をはっきり（持ち主のたのみ）
def W(p):p.texobj=GRAIN;return p
def M(p):p.tex=False;p.shiny=True;return p
def PARTS():
    L=[W(P('台','box',(CX-0.23,CY-0.15,0.0,CX+0.23,CY+0.15,0.10),WOOD,note='地面におく'))]
    L.append(W(P('胴','box',(CX-0.19,CY-0.12,0.10,CX+0.19,CY+0.12,1.10),WOOD,on=('台',),note='台の上')))
    L.append(W(P('頭','box',(CX-0.23,CY-0.15,1.10,CX+0.23,CY+0.15,1.46),WOOD,on=('胴',),note='胴の上')))
    L.append(W(P('かざり屋根','prism',([(CX-0.24,1.46),(CX+0.24,1.46),(CX,1.58)],CY-0.16,CY+0.16),WOOD,on=('頭',),note='頭のてっぺん')))
    fy=CY+0.152
    L.append(M(P('金の輪','prism',([(CX+0.155*math.cos(2*math.pi*k/32),1.28+0.155*math.sin(2*math.pi*k/32)) for k in range(32)],fy-0.004,fy+0.002),GOLD,on=('頭',),note='文字ばんのまわり')))
    face=notex(P('文字ばん','prism',([(CX+0.135*math.cos(2*math.pi*k/32),1.28+0.135*math.sin(2*math.pi*k/32)) for k in range(32)],fy,fy+0.004),FACE,on=('金の輪',),note='頭の正面'))
    def fcol(x,y,z):
        dx,dz=x-CX,z-1.28;r=math.hypot(dx,dz);a=math.atan2(dz,dx)
        if r>0.105 and r<0.125 and (a*6/math.pi)%1<0.16:return HAND   # 目もり
        if r<0.016:return HAND
        if abs(dx)<0.010 and 0<dz<0.10:return HAND   # 長い針（12）
        if abs(dz)<0.010 and 0<dx<0.07:return HAND   # 短い針（3）
        return FACE
    face.decal=fcol;L.append(face)
    gy=CY+0.122
    L.append(M(P('まどのわく','box',(CX-0.12,gy,0.28,CX+0.12,gy+0.006,0.88),GOLD,on=('胴',),note='胴の正面')))
    g=M(P('ガラス','box',(CX-0.10,gy+0.006,0.30,CX+0.10,gy+0.0065,0.86),GLASS,on=('まどのわく',),note='うすい青'));g.shiny=False;L.append(g)
    L.append(M(P('ふりこの棒','box',(CX-0.008,gy+0.008,0.50,CX+0.008,gy+0.011,0.84),GOLD,on=('まどのわく',),note='まどの中')))
    L.append(M(P('ふりこの重り','cyl',(CX,gy+0.010,0.05,0.44,0.445),GOLD,detail=24,on=('ふりこの棒',),note='棒のさき')))
    L[-1].kind='prism';L[-1].dims=([(CX+0.05*math.cos(2*math.pi*k/24),0.47+0.05*math.sin(2*math.pi*k/24)) for k in range(24)],gy+0.008,gy+0.013)
    for s in(-1,1):
        L.append(P('葉のかざり','ball',(CX+s*0.19,CY+0.12,1.46,0.05,0.5),WOOD,on=('頭',),note='頭の上の角'))
    return L
def EXTRA(sc):pass
TONE5=True;STREAK=(0.45,0.30)   # 木目のすじを、はっきり（持ち主のたのみ）
