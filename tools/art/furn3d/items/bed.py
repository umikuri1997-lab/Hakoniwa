# ベッド（bed）：木のわく（4本の柱・頭の板・足の板・横の板）に、マットレス・まくら・かけぶとん。たて（bed）と横（bed>1）の2つの向き。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（たて63×81・横77×77ドット）に合わせた）
#   柱4本：0.07角。頭がわ（うしろ）は高さ0.46、足がわ（前）は高さ0.32。地面にたてる。
#   頭の板：頭がわの柱のあいだ（高さ0.20〜0.42）。足の板：足がわの柱のあいだ（高さ0.12〜0.28）。全体の長さ1.02・はば0.88。
#   横の板2まい：頭がわと足がわの柱のあいだ（高さ0.12〜0.22）。その内がわに、すのこを受ける桟。
#   マットレス：横の板の内がわ・上（高さ0.20〜0.30）。シーツ（しきシーツ）でつつむ。
#   まくら：マットレスの頭がわにのせる。まん中がふっくら（高さ0.11）、ふちはうすく、4つの角をつまんだ形（EXTRA）。
#   ふとんの重なり（ほんものと同じ順。下から）：マットレス（しきシーツでつつむ）→ うわシーツ → かけぶとん。
#   かけぶとん：あつさ0.025の、なかわたの入った1まいの布。マットレスの上にのせ、頭がわのはしは、まくらの手前に少しかかる（まくらの上にのる。YQ）。
#     左右と足もとは、マットレスのふちで丸くまがり、自分のおもさで、わくの外へ0.035はみ出してたれる（ゆかから0.22まで。わくが見える）。
#     2つのふちがかさなる足もとの角は、左右と足もとの、どちらにもたれるので、いちばん下までさがって、角がとがって見える。
#   うわシーツ：かけぶとんの下から頭がわへ出て、かけぶとんの頭のはしをくるんで、上へ折り返す（折り返しのはば0.10・あつさ0.012）。
#     折り返しは、かけぶとんの上の平らな所だけ（左右のはしまで）。
#   シーツもかけぶとんも白。
# 寝るせいれいの位置（world.js の BEDHX・BEDHY・BEDVY）は、絵に合わせてたしかめる。
from blueprint import Part as P
from common import *
ID='bed';BOTTOM=64
VIEWS=[('bed',0),('bed>1',1)]
X0,X1,Y0,Y1=0.06,0.94,-0.06,0.96;PS=0.07;ZH=0.46;ZF=0.32
SHEET=(252,252,250);QUILT=(246,246,244)   # シーツもかけぶとんも白（折り返しは、形とかげで見せる）
DN=(40,46)   # かけぶとんのます目の数
YQ=Y0+PS+0.23;QT=0.025;ZM=0.31   # YQ：かけぶとんの頭がわのはし（まくらの手前0.05にかかる）   # かけぶとんの頭がわのはし・かけぶとんのあつさ・マットレスの上の高さ
def PARTS():
    L=[]
    for nx,x in(('左',X0),('右',X1-PS)):
        L.append(P('頭の柱（%s）'%nx,'box',(x,Y0,0,x+PS,Y0+PS,ZH),WOOD,bevel=0,note='地面にたてる'))
        L.append(P('足の柱（%s）'%nx,'box',(x,Y1-PS,0,x+PS,Y1,ZF),WOOD,bevel=0,note='地面にたてる'))
        L.append(P('横の板（%s）'%nx,'box',(x+0.01,Y0+PS,0.12,x+PS-0.01,Y1-PS,0.22),WOOD,on=('頭の柱（%s）'%nx,'足の柱（%s）'%nx),bevel=0,note='頭と足の柱のあいだ'))
    L.append(P('頭の板','box',(X0+PS,Y0+0.01,0.20,X1-PS,Y0+PS-0.01,ZH-0.04),WOOD,on=('頭の柱（左）','頭の柱（右）'),bevel=0,note='頭がわの柱のあいだ'))
    L.append(P('足の板','box',(X0+PS,Y1-PS+0.01,0.12,X1-PS,Y1-0.01,ZF-0.04),WOOD,on=('足の柱（左）','足の柱（右）'),bevel=0,note='足がわの柱のあいだ'))
    L.append(SOFT(notex(P('マットレス','loft',soft(X0+PS,Y0+PS,X1-PS,Y1-PS,0.20,0.31,0.04,0.035),SHEET,on=('横の板（左）','横の板（右）'),note='横の板の上'))))
    return L

PXA,PXB=X0+PS+0.06,X1-PS-0.06;PYA,PYB=Y0+PS+0.02,Y0+PS+0.28;PZ0=0.312;PH=0.11   # まくらのはんい・高さ
def pshape(x,y):
    u=(2*(x-PXA)/(PXB-PXA)-1);v=(2*(y-PYA)/(PYB-PYA)-1)
    if abs(u)>=1 or abs(v)>=1:return 0.0
    return max(0,(1-u*u))**0.6*max(0,(1-v*v))**0.6
def ptop(x,y):return PZ0+PH*pshape(x,y)   # まくらの上の面の高さ
def EXTRA(sc):   # まくら：まん中がふっくら（高さ0.11）、ふちはうすく、4つの角をつまんだ形。かげは、つけない（ふつうの3だんのかげはこすぎる）。
    # かわりに、面の向きから、ごくうすいかげ（明るさ−4〜−12%）を、場所ごとの色でつける（まるく見せる）
    import math
    xa,xb,ya,yb,z0=PXA,PXB,PYA,PYB,PZ0;sh=pshape;top=ptop
    from oblique3d import LIGHT
    def col(x,y):
        e=0.004;gx=(top(x+e,y)-top(x-e,y))/(2*e);gy=(top(x,y+e)-top(x,y-e))/(2*e);n=(-gx,-gy,1.0);L=math.sqrt(sum(c*c for c in n));d=sum(n[k]/L*LIGHT[k] for k in range(3))
        k=1-min(0.12,max(0.0,(0.97-d)*0.35));return tuple(c*k for c in SHEET)
    def pinch(u,v):   # 角をつまむ：まん中の辺は外へふくらみ、角は内へ
        U,V=2*u-1,2*v-1;k=0.10*(1-V*V)*U;l=0.10*(1-U*U)*V
        return (xa+(xb-xa)*(u+k*0.5),ya+(yb-ya)*(v+l*0.5))
    sc.material('flat');hfield(sc,xa,ya,xb,yb,top,col,bot=lambda x,y:z0-0.01*sh(x,y),n=(28,16),shape=pinch);sc.material(None)
    duvet(sc)

def duvet(sc):   # かけぶとんと、うわシーツの折り返し（たれる形を、高さの面で組む）
    import math
    OV=0.035;r=0.03;k=9.0   # はみ出す長さ・マットレスのふちでまがる丸み・たれるかたむき
    xa,xb=X0-OV,X1+OV;ya,yb=YQ,Y1+OV
    def drop(t):   # マットレスのふちから t だけ外の、さがる量（はじめは丸く、そのあとは急に）
        if t<=0:return 0.0
        if t<r:return r-math.sqrt(max(0,r*r-t*t))
        return r+(t-r)*k
    def top(x,y):
        dx=max(0.0,x-(X1-0.005),(X0+0.005)-x);dy=max(0.0,y-(Y1-0.005))
        z=max(0.22,ZM+QT-drop(dx)-drop(dy))   # 角は、左右と足もとの両方へさがる
        return max(z,ptop(x,y)+0.008) if pshape(x,y)>0 else z   # まくらにかかる所は、まくらの上にのる
    bot=lambda x,y:top(x,y)-QT
    sc.material('soft');hfield(sc,xa,ya,xb,yb,top,QUILT,bot=bot,n=DN);sc.material(None)
    # うわシーツの折り返し：かけぶとんの頭のはしをくるみ、上にはば0.10
    def stop(x,y):
        if y>=YQ:return top(x,YQ+0.0001 if y<YQ+0.0001 else y)+0.012
        return top(x,YQ)+0.012-(YQ-y)/0.014*(QT+0.012)*0.5   # 頭のはしで、まるくまわりこむ
    sb=lambda x,y:(top(x,max(y,YQ))+0.002) if y>=YQ else ZM
    sc.material('soft');hfield(sc,X0+0.01,YQ-0.012,X1-0.01,YQ+0.10,stop,SHEET,bot=sb,n=(40,10));sc.material(None)
