# しずけさの石どうろう（toro）：いまの絵と同じデザイン・同じこい灰色の石。四角い台・まるい竿・中台・火袋（まどから火の光）・四角い笠・てっぺんの宝珠。ところどころ、こけ。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（43×75ドット）に合わせた）
#   基礎：四角い石の台（0.46角・高さ0〜0.07）。その上に、ひとまわり小さい段（0.32角・0.07〜0.11）。
#   竿：まるい石の柱（中台のかげになるので、少しくらい石の色 STONE2）（半径0.078・0.11〜0.425）。段の上にのせる。上下に、ふくらんだ節（半径0.10）。まわりに、たてのみぞ12本（もよう）。
#   中台：竿の上にのる、下がすぼまった四角い台（下0.22角→上0.38角・0.425〜0.485）。
#   火袋：中台の上。四すみの石の柱（0.07角・0.48〜0.70）と、上の石のまぐさ（0.38角・0.70〜0.73）。
#     中に、あかりの入った石の箱（0.26角、光る）。前と左右のまど（あかりの箱の外）に、石の格子（たて1本・よこ1本、太さ0.025）。
#   笠：火袋の上。うすい軒（0.57角・0.73〜0.765）と、四方へながれる屋根（0.54角→0.10角・0.76〜0.84。こう配3.5寸＝高さ0.077／ながれ0.22。四方の面のさかいに、むね）。
#   宝珠：笠のてっぺん。うけ（半径0.06・0.835〜0.85）と、さきのとがった玉（半径0.078・0.85〜0.975）。
#   こけ：笠・基礎の上の面のあたりに、うすい緑（もよう）。
#   コマ3：火の光のつよさだけかわる（FRAMES）。
from blueprint import Part as P
from common import *
import math
ID='toro';GRAD=True;BOTTOM=63;FRAMES=3;FR=0
VIEWS=[('toro',0)]
CX,CY=0.50,0.60;STONE=(104,100,100);STONE2=(92,88,88);MOSS=(128,132,62)
GLOWS=[((214,160,92),(240,196,120)),((226,172,100),(250,210,136)),((204,150,86),(230,186,112))]   # コマごとの火の光（ふち・まん中）
def ST(p):p.stone=True;return p
def GL(p):p.glow=True;p.tex=False;return p
def sq(h,cx=CX,cy=CY):return [(cx-h,cy-h),(cx+h,cy-h),(cx+h,cy+h),(cx-h,cy+h)]
def _h(i,j):
    n=(i*374761393+j*668265263)&0xffffffff;n=(n^(n>>13))*1274126177&0xffffffff;return (n&0xffff)/65535
def noise(x,y,s=0.09):   # なめらかなノイズ（こけのまだら）
    u,v=x/s,y/s;i,j=math.floor(u),math.floor(v);fu,fv=u-i,v-j;fu,fv=fu*fu*(3-2*fu),fv*fv*(3-2*fv)
    a,b,c,d=_h(i,j),_h(i+1,j),_h(i,j+1),_h(i+1,j+1);return a+(b-a)*fu+(c-a)*fv+(a-b-c+d)*fu*fv
def moss(z0,z1,th=0.62):
    def f(x,y,z):
        if not(z0<=z<=z1):return None
        return MOSS if noise(x+z*0.7,y-z*0.4)>th else None
    return f
def flute(x,y,z):   # 竿のたてのみぞ（12本）：みぞは、くらい石の色
    if not 0.15<z<0.39:return None
    return (76,72,74) if math.cos(12*math.atan2(y-CY,x-CX))>0.4 else None
def PARTS():
    L=[]
    b=ST(P('基礎','box',(CX-0.23,CY-0.23,0.0,CX+0.23,CY+0.23,0.07),STONE,note='地面におく'));b.decal=moss(0.06,0.08,0.74);L.append(b)
    L.append(ST(P('段','box',(CX-0.16,CY-0.16,0.068,CX+0.16,CY+0.16,0.11),STONE,on=('基礎',),note='基礎の上')))
    L.append(ST(P('竿','lathe',(CX,CY,[(0.0,0.108),(0.10,0.108),(0.10,0.13),(0.078,0.145),(0.078,0.395),(0.095,0.41),(0.095,0.425),(0.0,0.425)]),STONE2,detail=32,on=('段',),note='段のまん中にたてる')))
    L[-1].decal=flute
    L.append(ST(P('中台','loft',[(sq(0.11),0.423),(sq(0.19),0.47),(sq(0.19),0.485)],STONE,on=('竿',),note='竿の上')))
    lit,core=GLOWS[FR%3]
    g=GL(P('あかり','box',(CX-0.13,CY-0.13,0.482,CX+0.13,CY+0.13,0.70),lit,on=('中台',),note='火袋の中。光る'))
    g.decal=lambda x,y,z:core if abs(x-CX)<0.08 and abs(z-0.59)<0.07 else None;L.append(g)
    for k,(x,y) in enumerate(sq(0.15)):L.append(ST(P('火袋の柱%d'%(k+1),'box',(x-0.035,y-0.035,0.48,x+0.035,y+0.035,0.70),STONE,on=('中台',),note='中台の四すみ')))
    L.append(ST(P('まぐさ','box',(CX-0.19,CY-0.19,0.698,CX+0.19,CY+0.19,0.73),STONE,on=tuple('火袋の柱%d'%k for k in range(1,5)),note='柱の上')))
    T=0.0125;W=0.115
    for nx in('前','左','右'):   # まどの格子（柱と柱のあいだ。たて1本・よこ1本）
        if nx=='前':
            yy=CY+0.132;L.append(ST(P('前の格子たて','box',(CX-T,yy,0.48,CX+T,yy+0.02,0.70),STONE,on=('中台',),note='まどのまん中',grp='格子前')))
            L.append(ST(P('前の格子よこ','box',(CX-W,yy,0.59-T,CX+W,yy+0.02,0.59+T),STONE,on=('火袋の柱3','火袋の柱4'),note='柱と柱のあいだ',grp='格子前')))
        else:
            xx=CX-0.152 if nx=='左' else CX+0.132
            L.append(ST(P('%sの格子たて'%nx,'box',(xx,CY-T,0.48,xx+0.02,CY+T,0.70),STONE,on=('中台',),note='まどのまん中',grp='格子'+nx)))
            L.append(ST(P('%sの格子よこ'%nx,'box',(xx,CY-W,0.59-T,xx+0.02,CY+W,0.59+T),STONE,on=(('火袋の柱1','火袋の柱4') if nx=='左' else ('火袋の柱2','火袋の柱3')),note='柱と柱のあいだ',grp='格子'+nx)))
    L.append(ST(P('軒','box',(CX-0.285,CY-0.285,0.728,CX+0.285,CY+0.285,0.765),STONE,on=('まぐさ',),note='まぐさの上')))
    r=ST(P('笠','loft',[(sq(0.27),0.763),(sq(0.05),0.84)],STONE,on=('軒',),note='軒の上。四方へながれる屋根'));r.split=True;r.decal=moss(0.76,0.84,0.78);L.append(r)
    L.append(ST(P('宝珠','lathe',(CX,CY,[(0.0,0.835),(0.06,0.835),(0.05,0.85),(0.072,0.87),(0.078,0.888),(0.064,0.91),(0.036,0.935),(0.014,0.96),(0.0,0.975)]),STONE,detail=32,on=('笠',),note='笠のてっぺん')))
    return L
