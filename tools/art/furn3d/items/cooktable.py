# 調理台（cooktable）：ひきだし2つの木の台（上には何ものせない）。前・右・後ろ・左の4つの向き。料理をしているときの上の物（道具・材料・できた料理）は cooktop.py の絵をかさねる。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（64×75ドット）に合わせた）
#   柱4本：0.07角・高さ0.54。地面にたてる。
#   横の板2まい・うしろの板：柱のあいだ（あつさ0.03・高さ0.04〜0.54）。柱にほぞでとめる。
#   前のわく：柱のあいだの、上・まん中・下の横木（高さ0.04）。そのあいだに、同じ大きさのひきだし2つ（前板 あつさ0.03、取っ手つき）。
#   天板：はば0.98・おく0.62・あつさ0.06（高さ0.54〜0.60）。柱と板の上にのせ、まわりへ0.02出す。
from blueprint import Part as P
from common import *
def MT(p):p.metal=True;return p
ID='cooktable';BOTTOM=45;TONE5=True   # かげは木と同じ5色（furntone。持ち主がきめた）
VIEWS=[('cooktable',0),('cooktable>1',1),('cooktable>2',2)]   # 前・右・後ろ（左は右の反転）
X0,X1,Y0,Y1=0.0,1.0,0.0,0.58;PS=0.07;H=0.54;TT=0.06;BW=0.04   # はば1.0（マスのはばぴったり）。うしろの面はマスのうしろのふち（壁にそう。持ち主がきめた）
def PARTS():
    L=[]
    for nx,x in(('左',X0),('右',X1-PS)):
        for ny,y in(('うしろ',Y0),('前',Y1-PS)):L.append(P('柱（%s%s）'%(nx,ny),'box',(x,y,0,x+PS,y+PS,H),WOOD,bevel=0,note='地面にたてる'))
        L.append(P('横の板（%s）'%nx,'box',(x+0.02,Y0+PS,0.04,x+0.05,Y1-PS,H),WOOD,on=('柱（%sうしろ）'%nx,'柱（%s前）'%nx),bevel=0,note='柱のあいだ'))
    L.append(P('うしろの板','box',(X0+PS,Y0+0.02,0.04,X1-PS,Y0+0.05,H),WOOD,on=('柱（左うしろ）','柱（右うしろ）'),bevel=0,note='柱のあいだ'))
    fy=Y1-0.05;zs=(0.04,0.27,0.50)
    for k,z in enumerate(zs):L.append(P('前の横木%d'%(k+1),'box',(X0+PS,fy,z,X1-PS,fy+0.04,z+BW),WOOD,on=('柱（左前）','柱（右前）'),bevel=0,note='柱のあいだ'))
    for k in range(2):
        z0,z1=zs[k]+BW,zs[k+1];L.append(P('ひきだし%dの前板'%(k+1),'box',(X0+PS+0.01,fy+0.01,z0+0.008,X1-PS-0.01,fy+0.04,z1-0.008),WOOD,on=('前の横木%d'%(k+1),),bevel=0,note='横木のあいだ'))
        zc=(z0+z1)/2;L.append(P('取っ手%d'%(k+1),'box',(0.42,fy+0.04,zc-0.018,0.58,fy+0.065,zc+0.018),WOOD,on=('ひきだし%dの前板'%(k+1),),bevel=0,note='前板にとめる'))
    L.append(P('天板','box',(X0,Y0,H,X1,Y1+0.02,H+TT),WOOD,on=('柱（左うしろ）','柱（右前）'),bevel=0,note='柱と板の上'))
    return L
