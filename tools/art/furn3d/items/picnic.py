# ピクニックシート（picnic、2×2マス）：草の上にひろげた、赤と白のチェックの布と、おべんとうのかご。
# 設計図（単位はマス）
#   布：2×2マスより少し小さい（x 0.10〜1.90・y 0.12〜1.88）。地面にひろげる、うすい布（高さ0.012〜0.022、ゆるいしわ）。
#     もよう：0.22マスのチェック（うすい赤・白・そのまざった色）。
#   かご：あんだかご（0.42×0.30・高さ0.18、角を丸める）。布の上、左おく（x 0.36・y 0.62）。ふた（うすい板）と、上にかけた持ち手（細い棒3本で山の形）。
from blueprint import Part as P
from common import *
import math
ID='picnic';SZ=(2,2);GRAD=True;BOTTOM=128
VIEWS=[('picnic',0)]
RED=(232,138,128);WHITE=(248,242,228);MIX=(240,192,176);BASKET=(214,166,104)
X0,X1,Y0,Y1=0.10,1.90,0.12,1.88;CK=0.22
def check(x,y,z):
    a=int((x-X0)//CK)%2;b=int((y-Y0)//CK)%2
    return RED if a and b else WHITE if not a and not b else MIX
def top(x,y):return 0.02+0.004*math.sin(x*7.1)*math.cos(y*5.3)
def EXTRA(sc):
    sc.part();hfield(sc,X0,Y0,X1,Y1,top,lambda x,y:check(x,y,0),bot=lambda x,y:0.008,n=(36,36))
def PARTS():
    L=[];bx,by=0.36,0.62
    b=notex(P('かご','prism',(rrect(bx-0.21,by-0.15,bx+0.21,by+0.15,0.05),0.02,0.20,'z'),BASKET,note='布の上におく'))
    b.decal=lambda x,y,z:(196,146,88) if int(z*60)%3==0 else None;L.append(b)
    L.append(notex(P('かごのふた','prism',(rrect(bx-0.22,by-0.16,bx+0.22,by+0.16,0.05),0.20,0.225,'z'),(226,180,118),on=('かご',),note='かごの上')))
    for (a,b2) in(((bx-0.18,0.21),(bx-0.12,0.33)),((bx-0.12,0.33),(bx+0.12,0.33)),((bx+0.12,0.33),(bx+0.18,0.21))):
        L.append(notex(P('持ち手','beam',((a[0],by,a[1]),(b2[0],by,b2[1]),0.018),(200,150,92),on=('かごのふた',),note='ふたの左右にさしこむ')))
    return L

TONE5=True   # かげは木と同じ5色（furntone。持ち主がきめた）
