# ランタン（lantern）：いまの絵と同じデザイン・同じ大きさ。鉄のわくの六角のランタン。中に火、ガラスが光る。上に、まるい取っ手。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（38×64ドット）に合わせた）
#   台：六角の鉄の板（外の半径0.23・高さ0〜0.06）。
#   柱6本：六角の角に、鉄の細い柱（太さ0.024・高さ0.06〜0.50）。
#   ガラス：柱のあいだの6まい。中の火の光で、明るいだいだい色（光る）。
#   屋根：六角のかさ（半径0.25→0.08、高さ0.50〜0.58）と、てっぺんの小さな筒（高さ0.58〜0.63）。
#   取っ手：てっぺんの筒の上に、たての輪（半径0.07、太さ0.02）。
#   鉄の色は、黒くない、明るめの灰色（IRON）。
from blueprint import Part as P
from common import *
import math
ID='lantern';BOTTOM=63
VIEWS=[('lantern',0)]
CX,CY=0.50,0.62;IRON=(122,116,124);GLASS=(255,190,96);GLC=(255,232,150)
def MT(p):p.metal=True;return p
def GL(p):p.glow=True;p.tex=False;return p
def hexp(r,a0=0):return [(CX+r*math.cos(math.radians(a0+60*k)),CY+r*math.sin(math.radians(a0+60*k))) for k in range(6)]   # 六角：前（手前）に面がくる向き
def PARTS():
    L=[MT(P('台','prism',(hexp(0.23),0.0,0.06,'z'),IRON,note='地面におく'))]
    for k,(x,y) in enumerate(hexp(0.21)):L.append(MT(P('柱%d'%(k+1),'cyl',(x,y,0.024,0.06,0.50),IRON,detail=8,on=('台',),note='台の角にたてる')))
    L.append(GL(P('ガラス','prism',(hexp(0.205),0.06,0.50,'z'),GLASS,on=('台',),note='柱のあいだ。中の火で光る')))
    L.append(MT(P('屋根','lathe',(CX,CY,[(0.0,0.50),(0.25,0.50),(0.08,0.58),(0.0,0.58)]),IRON,detail=6,on=('柱1','柱4'),note='柱の上')))
    L.append(MT(P('筒','cyl',(CX,CY,0.055,0.58,0.63),IRON,detail=12,on=('屋根',),note='屋根のてっぺん')))
    ring=[(CX+0.07*math.cos(math.radians(a)),CY,0.70+0.07*math.sin(math.radians(a))) for a in range(-90,271,30)]
    L.append(MT(P('取っ手','tube',(ring,0.02),IRON,on=('筒',),note='筒の上')))
    return L
def EXTRA(sc):   # ガラスの中の火（明るい所）：前の面のまん中に、明るい黄色のしずく（光る）
    from blueprint import Part as P_
    import blueprint as B
    p=P_('火','lathe',(CX,CY+0.20,[(0.0,0.16),(0.06,0.23),(0.05,0.31),(0.0,0.38)]),GLC,detail=12);sc.material('flat');B.build(sc,[p]);sc.material(None)
