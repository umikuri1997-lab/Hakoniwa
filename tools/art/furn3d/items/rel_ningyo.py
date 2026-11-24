# 木のにんぎょう（rel_ningyo）：地下の廃村の食卓のいすに、すわっていた、むかしの道具。かざり。
# お手本：持ち主がくれた写真（木のブロックと麻ひもの、すわる人形。ポリフォークに、にた物はなかった）。
#   頭は木の玉（まるい鼻・点の目）、首は丸い棒、どうは下ほど広い台形のブロック。うでと脚は麻ひもで、手は木の玉・足は四角い木のブロック。
#   床にすわっているので、脚のひもは前へのび、足のブロックは前へたおれて床にねている。
# 設計図（単位はマス。x=東・y=南（顔のむき）・z=上）
#   どう：台形のブロック（下のはば0.16・上のはば0.10・おくゆき0.08・高さ0.22）。床にすわる。まっすぐ立てる・かたむけない。
#   首：どうの上の丸い棒（半径0.016・高さ0.215〜0.28。0.005見える）。 頭：首の上の木の玉（半径0.07）。鼻：顔のまん中の小さな玉（半径0.016）。目：2つの点。
#   うで：麻ひも（半径0.007）。どうの上の角の中から出て、外へふくらんで下へ。手：木の玉（半径0.042。頭の6わり）。床におく。
#   脚：麻ひも（半径0.007）。どうの下の前から、床の上を前へ。足：四角い木のブロック（はば0.055・長さ0.085・高さ0.045）。ひもは足のうしろのはしに入る。
#   ひもは、よった2色の短い管をならべる（同じ grp なので、あいだに線を引かない）。
from blueprint import Part as P
from common import *
import math
ID='rel_ningyo';GRAD=True;BOTTOM=60
VIEWS=[('rel_ningyo',0)]
CX,CY=0.50,0.36;BEECH=(226,202,166);JUTE=((198,174,130),(184,160,118));DK=(92,70,52)
def T(p):p.tex=False;return p
def bez(a,c,b,n):return[tuple(a[i]*(1-t)**2+2*c[i]*(1-t)*t+b[i]*t*t for i in range(3)) for t in(k/n for k in range(n+1))]
def rope(nm,a,c,b,on):
    L=bez(a,c,b,24);seg=0.024;out=[];acc=0;cur=[L[0]];n=0
    for p,q in zip(L,L[1:]):
        cur.append(q);acc+=math.dist(p,q)
        if acc>=seg or q==L[-1]:
            r=T(P('%s%d'%(nm,n),'tube',(cur,0.014),JUTE[n%2],on=on if n==0 else ('%s%d'%(nm,n-1),),note='よったひも'));r.grp=nm;out.append(r);n+=1;cur=[q];acc=0
    return out
def PARTS():
    L=[T(P('どう','prism',([(CX-0.08,0.0),(CX+0.08,0.0),(CX+0.05,0.22),(CX-0.05,0.22)],CY-0.04,CY+0.04),BEECH,note='床にすわる台形のブロック'))]
    L.append(T(P('首','cyl',(CX,CY,0.016,0.215,0.28),BEECH,detail=16,on=('どう',),note='どうの上にさす')))
    h=T(P('頭','ball',(CX,CY,0.34,0.07,1.0),BEECH,on=('首',),note='首の上の木の玉'));h.curve=True;L.append(h)
    L.append(T(P('鼻','ball',(CX,CY+0.072,0.33,0.016,1.0),BEECH,on=('頭',),note='顔のまん中')))
    for s in(-1,1):L.append(notex(P('め%d'%s,'ball',(CX+s*0.026,CY+0.062,0.355,0.008,0.8),DK,on=('頭',),note='かいた点の目')))
    for s in(-1,1):
        A=rope('うで%d'%s,(CX+s*0.046,CY,0.20),(CX+s*0.16,CY+0.01,0.17),(CX+s*0.13,CY+0.03,0.07),('どう',));L+=A
        L.append(T(P('手%d'%s,'ball',(CX+s*0.13,CY+0.03,0.042,0.042,1.0),BEECH,on=(A[-1].name,),note='木の玉の手。床におく')))
        G=rope('脚%d'%s,(CX+s*0.035,CY+0.03,0.03),(CX+s*0.04,CY+0.10,0.012),(CX+s*0.045,CY+0.165,0.022),('どう',));L+=G
        L.append(T(P('足%d'%s,'box',(CX+s*0.045-0.0275,CY+0.16,0.0,CX+s*0.045+0.0275,CY+0.245,0.045),BEECH,on=(G[-1].name,),note='四角い木のブロック。前へたおれて床にねる')))
    return L
TONE5=True
