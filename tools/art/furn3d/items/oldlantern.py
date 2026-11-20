# 古いカンテラ（oldlantern）：洞窟の宝箱から出る、家の中に置くあかり。ランタン（鉄の六角）とちがい、しんちゅうの丸いカンテラ。大きな取っ手の輪。
# 設計図（じっさいに作れる組み方。単位はマス）
#   台：まるいしんちゅうの台（半径0.20・高さ0〜0.05）。
#   油つぼ：台の上の、ひくいつぼ（半径0.18・高さ0.05〜0.13）。
#   ガラス：油つぼの上の、まるい筒（半径0.16・高さ0.13〜0.42）。中の火で光る。
#   まもりの棒4本：ガラスのまわりに、細い棒（太さ0.014・高さ0.12〜0.425）。油つぼの肩と、かさのふちをつなぐ。
#   かさ：棒の上の、まるいかさ（半径0.185→0.06、高さ0.42〜0.50）と、けむり出しの筒（高さ0.49〜0.54）。
#   取っ手：かさの左右のふちから、上をまわる大きな輪（よこ0.185・高さ0.26、太さ0.018）。
#   火：ガラスの中のまん中に、しずくの形。
from blueprint import Part as P
from common import *
import math
ID='oldlantern';GRAD=True;BOTTOM=63
VIEWS=[('oldlantern',0)]
CX,CY=0.50,0.62;BRASS=(204,166,92);GLASS=(255,196,104);GLC=(255,236,160)
def MT(p):p.metal=True;return p
def GL(p):p.glow=True;p.tex=False;return p
def PARTS():
    L=[MT(P('台','lathe',(CX,CY,[(0.0,0.0),(0.195,0.0),(0.20,0.015),(0.19,0.04),(0.17,0.05),(0.0,0.05)]),BRASS,detail=32,note='地面におく。まるい台'))]
    L.append(MT(P('油つぼ','lathe',(CX,CY,[(0.0,0.05),(0.165,0.05),(0.182,0.075),(0.182,0.10),(0.17,0.125),(0.16,0.13),(0.0,0.13)]),BRASS,detail=32,on=('台',),note='台の上。ひくいつぼ')));L[-1].curve=True
    g=GL(P('ガラス','cyl',(CX,CY,0.16,0.13,0.42),GLASS,detail=32,on=('油つぼ',),note='油つぼの上。中の火で光る'))
    def gcol(x,y,z):
        d=math.hypot(x-CX,(z-0.25)*0.9)/0.19
        return GLC if d<0.45 else (255,216,134) if d<0.8 else GLASS
    g.decal=gcol;L.append(g)
    for k in range(4):
        a=math.radians(45+90*k);x,y=CX+0.175*math.cos(a),CY+0.175*math.sin(a)
        L.append(MT(P('棒%d'%(k+1),'cyl',(x,y,0.014,0.12,0.425),BRASS,detail=8,on=('油つぼ',),note='油つぼの肩にたてる')))
    L.append(MT(P('かさ','lathe',(CX,CY,[(0.0,0.42),(0.185,0.42),(0.187,0.435),(0.16,0.46),(0.115,0.485),(0.06,0.50),(0.0,0.50)]),BRASS,detail=32,on=('棒1','棒3'),note='棒の上。まるいかさ')));L[-1].curve=True
    L.append(MT(P('けむり出し','cyl',(CX,CY,0.05,0.49,0.54),BRASS,detail=12,on=('かさ',),note='かさのてっぺん')))
    ring=[(CX+0.185*math.cos(math.radians(a)),CY,0.44+0.26*math.sin(math.radians(a))) for a in range(0,181,15)]
    L.append(MT(P('取っ手','tube',(ring,0.018),BRASS,on=('かさ',),note='かさの左右のふちから、上をまわる輪')))
    L.append(flame('火',CX,CY+0.13,0.11,0.17,0.05,('油つぼ',),'前のガラスにすけて見える所（ガラスの面のすぐうしろ）'))
    return L

TONE5=True   # かげは木と同じ5色（furntone。持ち主がきめた）
