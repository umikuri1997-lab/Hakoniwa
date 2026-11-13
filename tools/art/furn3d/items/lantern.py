# ランタン（lantern）：いまの絵と同じデザイン。高さは、いまの絵より低い（持ち主がきめた）。鉄のわくの六角のランタン。中に火、ガラスが光る。上に、まるい取っ手。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（38×64ドット）に合わせた）
#   台：まるい鉄の台（半径0.24・高さ0〜0.045。ふちはまるい）。
#   柱6本：六角の角に、鉄の細い柱（太さ0.024・高さ0.045〜0.375）。
#   ガラス：柱のあいだの6まい。中の火の光で光る（かげをつけない）。火に近い所ほど明るい黄色、はなれるほど、だいだい（もよう）。
#   火：ガラスの中のまん中に、しずくの形（高さ0.165・はば0.10。common.flame）。
#   屋根：まるいドームのかさ（半径0.25、高さ0.375〜0.46）と、てっぺんの小さな筒（高さ0.45〜0.48）。
#   取っ手：てっぺんの筒の上に、たての輪（半径0.055、太さ0.02）。
#   鉄の色は、黒くない、明るめの灰色（IRON）。
from blueprint import Part as P
from common import *
import math
ID='lantern';GRAD=True;BOTTOM=63
VIEWS=[('lantern',0)]
CX,CY=0.50,0.62;IRON=(122,116,124);GLASS=(255,190,96);GLC=(255,232,150)
def MT(p):p.metal=True;return p
def GL(p):p.glow=True;p.tex=False;return p
def hexp(r,a0=0):return [(CX+r*math.cos(math.radians(a0+60*k)),CY+r*math.sin(math.radians(a0+60*k))) for k in range(6)]   # 六角：前（手前）に面がくる向き
def PARTS():
    L=[MT(P('台','lathe',(CX,CY,[(0.0,0.0),(0.235,0.0),(0.24,0.015),(0.232,0.035),(0.215,0.045),(0.0,0.045)]),IRON,detail=32,note='地面におく。まるい台'))]
    for k,(x,y) in enumerate(hexp(0.21)):L.append(MT(P('柱%d'%(k+1),'cyl',(x,y,0.024,0.045,0.375),IRON,detail=8,on=('台',),note='台の角にたてる')))
    g=GL(P('ガラス','prism',(hexp(0.205),0.045,0.375,'z'),GLASS,on=('台',),note='柱のあいだ。中の火で光る'))
    def gcol(x,y,z):   # 火（高さ0.20）に近いほど明るい
        d=math.hypot(x-CX,(z-0.20)*0.85)/0.18
        return GLC if d<0.45 else (255,212,128) if d<0.75 else GLASS
    g.decal=gcol;L.append(g)
    L.append(MT(P('屋根','lathe',(CX,CY,[(0.0,0.375),(0.25,0.375),(0.245,0.394),(0.225,0.4125),(0.19,0.431),(0.14,0.446),(0.085,0.457),(0.0,0.461)]),IRON,detail=32,on=('柱1','柱4'),note='柱の上。まるいドーム')))
    L.append(MT(P('筒','cyl',(CX,CY,0.045,0.45,0.48),IRON,detail=12,on=('屋根',),note='屋根のてっぺん')))
    ring=[(CX+0.055*math.cos(math.radians(a)),CY,0.53+0.055*math.sin(math.radians(a))) for a in range(-90,271,30)]
    L.append(MT(P('取っ手','tube',(ring,0.02),IRON,on=('筒',),note='筒の上')))
    L.append(flame('火',CX,CY+0.17,0.11,0.165,0.05,('台',),'前のガラスにすけて見える所（ガラスの面のすぐうしろ）'))
    return L
