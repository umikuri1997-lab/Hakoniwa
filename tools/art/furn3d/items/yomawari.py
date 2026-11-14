# よまわりのランタン（yomawari）：いまの絵と同じデザイン・同じ色。まるい台（下に茶色のふち）から細い柱がのび、上に四角い灯り（うすむらさきのガラスに三日月）、
#   灯りより外へ出た四角い屋根と、その上の小さな屋根、てっぺんに金の星。鉄は、こい青むらさきの灰色。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（22×97ドット）に合わせた）
#   台：茶色の、まるい板（半径0.165・高さ0〜0.025）の上に、まるい鉄の台（半径0.14・0.025〜0.07、上へすぼまる）と、首（半径0.07・0.07〜0.11）。
#   柱：鉄の細い柱（半径0.028・0.11〜0.84）。首にさす。とちゅうに茶色の輪2つ（半径0.036・あつさ0.02・高さ0.40と0.62）。
#   灯りの受け：柱の上で、上へひろがる鉄のじょうご（0.06角→0.19角・0.80〜0.87）。
#   灯り：受けの上。四すみの鉄の柱（0.03角・0.87〜1.10）と、中の光るガラスの箱（0.14角）。前のガラスに三日月（もよう）。
#   屋根：柱の上の鉄の板（0.33角・1.10〜1.125）と、四方へながれる屋根（0.32角→0.09角・1.125〜1.22。四方の面のさかいに、むね）。
#   小さな屋根：屋根の上の鉄の台（0.09角・1.22〜1.24）と、とがった屋根（0.09角→0.02角・1.24〜1.29）。
#   星：小さな屋根のてっぺんの筒（1.28〜1.31）に、金の五つ星（はば0.13・あつさ0.025、たて向き）。
#   金属のつや：鉄の部品に、明るいすじ（HI）と、くらいうつりこみ（LO）をもようで入れる（まるい部品は左手前・右うしろ、柱は左手前の角、屋根はむね）。
#   コマ3：ガラスの光のつよさだけかわる（FRAMES）。
from blueprint import Part as P
from common import *
import math
ID='yomawari';GRAD=True;BOTTOM=63;FRAMES=3;FR=0
VIEWS=[('yomawari',0)]
CX,CY=0.50,0.62;IRON=(100,98,124);HI=(196,194,222);LO=(66,64,84);BROWN=(122,96,92);RING=(150,126,104);GOLD=(250,200,92);MOON=(236,218,170)
GLOWS=[(166,154,184),(178,166,196),(156,146,176)]   # コマごとのガラスの光（うすむらさき）
def MT(p,f=None):p.metal=True;p.tex=False;p.decal=f or shine;return p
def shine(x,y,z):   # 金属のつや（まるい部品）：左手前に明るいすじ、右うしろに、くらいうつりこみ
    a=math.atan2(y-CY,x-CX);u=math.cos(a-math.radians(125))
    return HI if u>0.93 else LO if u<-0.55 else None
def shine2(x,y,z):   # 台（ひろい面）は、すじを細く
    a=math.atan2(y-CY,x-CX);u=math.cos(a-math.radians(125))
    return HI if u>0.985 else LO if u<-0.7 else None
def posts(x,y,z):   # 灯りの柱：柱ごとに、左手前の角に明るいすじ
    px=CX-0.08 if x<CX else CX+0.08;py=CY-0.08 if y<CY else CY+0.08
    return HI if x<px-0.004 and y>py+0.004 else None
def roof(x,y,z):   # 屋根：左手前のむねに明るいすじ、右のむねのそばは、くらいうつりこみ
    u,v=x-CX,y-CY
    if abs(-u-v)<0.012 and v>0:return HI
    if abs(u-v)<0.016 and v>0:return LO
    return None
def GL(p):p.glow=True;p.tex=False;return p
def sq(h,cx=CX,cy=CY):return [(cx-h,cy-h),(cx+h,cy-h),(cx+h,cy+h),(cx-h,cy+h)]
Z0,Z1=0.87,1.10   # 灯りの下と上
def PARTS():
    L=[notex(P('ふち','lathe',(CX,CY,[(0.0,0.0),(0.165,0.0),(0.165,0.025),(0.0,0.025)]),BROWN,detail=32,note='地面におく'))]
    L.append(MT(P('台','lathe',(CX,CY,[(0.0,0.023),(0.14,0.023),(0.14,0.035),(0.115,0.06),(0.085,0.07),(0.0,0.07)]),IRON,detail=32,on=('ふち',),note='ふちの上'),shine2))
    L.append(MT(P('台の首','lathe',(CX,CY,[(0.0,0.068),(0.07,0.068),(0.055,0.09),(0.04,0.11),(0.0,0.11)]),IRON,detail=24,on=('台',),note='台の上')))
    L.append(MT(P('柱','cyl',(CX,CY,0.028,0.108,0.84),IRON,detail=12,on=('台の首',),note='首にさす')))
    for k,z in enumerate((0.40,0.62)):L.append(notex(P('輪%d'%(k+1),'cyl',(CX,CY,0.036,z,z+0.02),RING,detail=12,on=('柱',),note='柱にはめる')))
    L.append(MT(P('受け','loft',[(sq(0.03),0.80),(sq(0.075),0.85),(sq(0.095),0.87)],IRON,on=('柱',),note='柱の上。上へひろがる')))
    lit=GLOWS[FR%3]
    g=GL(P('ガラス','box',(CX-0.07,CY-0.07,Z0,CX+0.07,CY+0.07,Z1),lit,on=('受け',),note='受けの上。中のあかりで光る'))
    def moon(x,y,z):   # 前のガラスの三日月：大きな円から、右上へずらした円をぬいた形
        if y<CY+0.065:return None
        u,v=x-CX,z-(Z0+Z1)/2
        return MOON if u*u+v*v<0.054**2 and (u-0.026)**2+(v-0.014)**2>0.044**2 else None
    g.decal=moon;L.append(g)
    for k,(x,y) in enumerate(sq(0.08)):L.append(MT(P('灯りの柱%d'%(k+1),'box',(x-0.015,y-0.015,Z0,x+0.015,y+0.015,Z1),IRON,on=('受け',),note='受けの四すみ'),posts))
    L.append(MT(P('屋根の板','box',(CX-0.165,CY-0.165,Z1-0.002,CX+0.165,CY+0.165,Z1+0.025),IRON,on=tuple('灯りの柱%d'%k for k in range(1,5)),note='柱の上')))
    r=MT(P('屋根','loft',[(sq(0.16),Z1+0.023),(sq(0.045),1.22)],IRON,on=('屋根の板',),note='四方へながれる屋根'),roof);r.split=True;L.append(r)
    L.append(MT(P('小屋根の台','box',(CX-0.045,CY-0.045,1.218,CX+0.045,CY+0.045,1.24),IRON,on=('屋根',),note='屋根のてっぺん')))
    r=MT(P('小屋根','loft',[(sq(0.045),1.238),(sq(0.01),1.29)],IRON,on=('小屋根の台',),note='とがった屋根'),roof);r.split=True;L.append(r)
    L.append(MT(P('星の軸','cyl',(CX,CY,0.012,1.28,1.31),GOLD,detail=8,on=('小屋根',),note='小屋根のてっぺん')))
    st=[];zc=1.37
    for i in range(10):a=math.radians(90+36*i);rr=0.065 if i%2==0 else 0.028;st.append((CX+rr*math.cos(a),zc+rr*math.sin(a)))
    s=P('星','prism',(st,CY-0.0125,CY+0.0125,'y'),GOLD,on=('星の軸',),note='軸のさき');s.glow=True;s.tex=False;L.append(s)
    return L
