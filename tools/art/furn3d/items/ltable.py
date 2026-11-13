# ローテーブル（ltable）：いまの絵と同じデザイン・同じ大きさ。角を丸めた天板と、4本の短い脚のひくいテーブル。前（ltable）と横（ltable>1）の2つの向き。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（前61×31・横26×50ドット）に合わせた）
#   脚4本：0.09角・高さ0.12。地面にたてる。天板のはしから0.06内がわ。
#   幕板4まい：脚のあいだ（高さ0.07・あつさ0.04）。脚にほぞでとめ、天板をささえる（天板のうしろにかくれる）。
#   天板：はば0.94・おく0.40・あつさ0.06（高さ0.12〜0.18）。上から見た4つの角を丸める（半径0.06）。脚と幕板の上にのせる。
from blueprint import Part as P
from common import *
import math
ID='ltable';BOTTOM=63
VIEWS=[('ltable',0),('ltable>1',1)]
X0,X1,Y0,Y1=0.03,0.97,0.50,0.90;ZL=0.12;TT=0.06;LG=0.09;IN=0.06;AP=0.07
def PARTS():
    L=[];xs=(X0+IN,X1-IN-LG);ys=(Y0+IN,Y1-IN-LG)
    for nx,x in zip('左右',xs):
        for ny,y in zip(('うしろ','前'),ys):L.append(P('脚（%s%s）'%(nx,ny),'box',(x,y,0,x+LG,y+LG,ZL),WOOD,bevel=0,note='地面にたてる'))
    for ny,y in zip(('うしろ','前'),ys):L.append(P('幕板（%s）'%ny,'box',(xs[0]+LG,y+0.025,ZL-AP,xs[1],y+LG-0.025,ZL),WOOD,on=('脚（左%s）'%ny,'脚（右%s）'%ny),bevel=0,note='脚のあいだ'))
    for nx,x in zip('左右',xs):L.append(P('幕板（%s）'%nx,'box',(x+0.025,ys[0]+LG,ZL-AP,x+LG-0.025,ys[1],ZL),WOOD,on=('脚（%sうしろ）'%nx,'脚（%s前）'%nx),bevel=0,note='脚のあいだ'))
    RC=0.06;pts=[]
    for cx,cy,a0 in((X1-RC,Y1-RC,0),(X0+RC,Y1-RC,90),(X0+RC,Y0+RC,180),(X1-RC,Y0+RC,270)):
        for k in range(5):a=math.radians(a0+90*k/4);pts.append((cx+RC*math.cos(a),cy+RC*math.sin(a)))
    L.append(P('天板','prism',(pts,ZL,ZL+TT,'z'),WOOD,on=('脚（左うしろ）','脚（右前）'),note='脚と幕板の上。角を丸める'))
    return L
