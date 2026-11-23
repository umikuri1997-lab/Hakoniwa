# カミサマの台座（altar）：いまの絵と同じデザイン（持ち主がえらんだ）。神殿と同じ白い石の、まるい2だんの台。ふちに金の輪、上に青く光るまるい円と、そのまわりをまわる光のつぶ。
# カミサマは、この台の上に立つ（ゲームは、上の段の高さ TOPZ だけ上げて描く）。
# 設計図（じっさいに作れる組み方。単位はマス。1マスの中のまん中 (0.5,0.5) に置く）
#   下の段：まるい石の台（半径0.42・高さ0.10）。地面にすえる。
#   上の段：下の段の上に、ひとまわり小さいまるい石の台（半径0.34・高さ0.08、上の面は z 0.18）。
#   金の輪：上の段の上のふちに、はめこんだ金の輪（はば0.02・高さ0.03）。
#   光る円：上の段の上の面に、はめこんだ青い石の円（半径0.26・あつさ0.006）。まん中ほど明るい（コマごとに、ゆっくり明るさがかわる）。
#   光のつぶ：光る円のふちの上（半径0.24・高さ0.22。台座の絵の外へ出ない所）を、4つの小さな光のつぶがまわる（FRAMES 12コマで、4分の1まわる＝ループ）。
from blueprint import Part as P
from common import *
import math
from temple import ST,ST2,GOLD,STONETEX
ID='altar';BOTTOM=62;GRAD=True;CONTRAST=1.25;OUTERK=True;POUT=0.84;FRAMES=12
VIEWS=[('altar',0)]
CX,CY=0.5,0.5;R0,R1,Z0,TOPZ=0.42,0.34,0.10,0.18
FR=0   # いまのコマ（furn3d が入れる）
def S_(p):p.texobj=STONETEX;p.soft1=True;p.olk=0.96;return p   # 白い石（神殿と同じ）
def MT(p):p.metal=True;p.tex=False;return p
def GL(p):p.glow=True;p.tex=False;return p
def PARTS():
    fr=FR;tw=0.5+0.5*math.sin(2*math.pi*fr/FRAMES)   # 光る円の明るさ（12コマで1回）
    L=[S_(P('下の段','cyl',(CX,CY,R0,0.0,Z0),ST2,detail=96,note='地面にすえる'))]
    L.append(S_(P('上の段','cyl',(CX,CY,R1,Z0,TOPZ),ST,detail=96,on=('下の段',),note='下の段の上')))
    L.append(MT(P('金の輪','ring',(CX,CY,R1-0.02,R1+0.004,TOPZ-0.012,TOPZ+0.018),GOLD,on=('上の段',),detail=96,note='上のふちにはめこむ')))
    g=GL(P('光る円','cyl',(CX,CY,0.26,TOPZ+0.001,TOPZ+0.006),(120,170,232),detail=96,on=('上の段',),note='上の面にはめこむ'))
    def disc(x,y,z,tw=tw):
        r=math.hypot(x-CX,y-CY)
        if r<0.11:return tuple(int(a+(b-a)*tw) for a,b in zip((170,206,248),(200,226,255)))
        if r<0.20:return tuple(int(a+(b-a)*tw) for a,b in zip((124,170,232),(150,192,244)))
        return tuple(int(a+(b-a)*tw) for a,b in zip((100,146,214),(118,162,226)))
    g.decal=disc;L.append(g)
    for k in range(4):   # 光のつぶ（台にのらず、うく）
        a=math.radians(90*k+7.5*fr)
        L.append(GL(P('光のつぶ%d'%(k+1),'ball',(CX+0.24*math.cos(a),CY+0.24*math.sin(a),TOPZ+0.04,0.022),(200,228,255),on=(),deco=True)))
    return L

TONE5=True   # かげは木と同じ5色（furntone。持ち主がきめた）
