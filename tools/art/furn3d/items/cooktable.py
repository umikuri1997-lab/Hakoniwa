# 調理台（cooktable）：いまの絵と同じデザイン・同じ大きさ。ひきだし2つの木の台。上に、やさいをのせたまな板。前・右・後ろ・左の4つの向き。
# 設計図（じっさいに作れる組み方。単位はマス。大きさは、いまの絵（64×75ドット）に合わせた）
#   柱4本：0.07角・高さ0.54。地面にたてる。
#   横の板2まい・うしろの板：柱のあいだ（あつさ0.03・高さ0.04〜0.54）。柱にほぞでとめる。
#   前のわく：柱のあいだの、上・まん中・下の横木（高さ0.04）。そのあいだに、同じ大きさのひきだし2つ（前板 あつさ0.03、取っ手つき）。
#   天板：はば0.98・おく0.62・あつさ0.06（高さ0.54〜0.60）。柱と板の上にのせ、まわりへ0.02出す。
#   まな板：天板の手前に、ななめ（14度）に置く木の板（0.60×0.30・あつさ0.03）。左はしに取っ手（0.08×0.12）。
#   まな板の上：にんじん（ねかせる）・包丁（金属の刃 長さ0.27・もとのはば0.076、さきは細くとがる。木の柄。ななめに置く）。天板のおくの左に、キャベツ1つ・おくの右に、大きさのちがうトマト2つ（へたつき。CC0の Kenney のモデル）。
from blueprint import Part as P
from common import *
def MT(p):p.metal=True;return p
ID='cooktable';BOTTOM=45
VIEWS=[('cooktable',0),('cooktable>1',1),('cooktable>2',2)]   # 前・右・後ろ（左は右の反転）
X0,X1,Y0,Y1=0.03,0.97,0.30,0.88;PS=0.07;H=0.54;TT=0.06;BW=0.04
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
    L.append(P('天板','box',(X0-0.02,Y0-0.02,H,X1+0.02,Y1+0.02,H+TT),WOOD,on=('柱（左うしろ）','柱（右前）'),bevel=0,note='柱と板の上'))
    zt=H+TT;bx0,bx1,by0,by1=0.24,0.78,0.52,0.82;K='kenney/food/'
    import math;BA=math.radians(-14);ux,uy=math.cos(BA),math.sin(BA);bc=(0.52,0.70);BL_,BW_=0.60,0.30   # まな板：天板の上にななめ（14度）に置く
    A=(bc[0]-ux*BL_/2,bc[1]-uy*BL_/2,zt+0.015);B=(bc[0]+ux*BL_/2,bc[1]+uy*BL_/2,zt+0.015)
    L.append(P('まな板','plate',(A,B,BW_,0.03),WOOD,on=('天板',),note='天板の上にななめに置く',grp='まな板'))
    L.append(P('まな板の取っ手','plate',((A[0]-ux*0.08,A[1]-uy*0.08,A[2]),A,0.12,0.03),WOOD,on=('天板',),note='まな板と1まいの板',grp='まな板'))
    L.append(notex(P('にんじん','model',(K+'carrot.glb',0.37,0.73,zt+0.03,0.38,-15,90),on=('まな板',),note='まな板の上にねかせる',deco=True)))
    bx,by=0.75,0.67;tx,ty=0.53,0.82;Lb=math.hypot(tx-bx,ty-by);du,dv=(tx-bx)/Lb,(ty-by)/Lb;nu,nv=-dv,du;h=0.038   # 包丁の刃：もとは はば0.076、背はまっすぐ、刃はさきへいくほど背へまがって、とがる
    shape=[(0,h),(0.62,h),(0.86,0.55*h),(1.0,0.25*h),(0.92,-0.25*h),(0.72,-0.75*h),(0.45,-h),(0,-h)]
    pts=[(bx+du*Lb*u+nu*v,by+dv*Lb*u+nv*v) for u,v in shape]
    L.append(MT(P('包丁の刃','prism',(pts,zt+0.03,zt+0.042,'z'),METAL,on=('まな板',),note='まな板の上に、ななめに置く。さきは細くとがる')))
    L.append(P('包丁の柄','plate',((bx,by,zt+0.041),(bx-du*0.13,by-dv*0.13,zt+0.041),0.05,0.022),(176,118,72),on=('まな板',),note='刃につける'))
    c=P('キャベツ','model',(K+'cabbage.glb',0.22,0.42,zt,0.25,0,0),on=('天板',),note='天板のおく',deco=True);c.recol=(176,220,116);c.recolk=0.6;L.append(notex(c))
    for k,(x,y,sz) in enumerate(((0.68,0.40,0.16),(0.83,0.46,0.12))):   # トマトは大きさをかえる
        t=P('トマト%d'%(k+1),'model',(K+'tomato.glb',x,y,zt,sz,k*40,0),on=('天板',),note='天板のおく',deco=True);t.recol=(224,44,24);t.recolk=0.25;L.append(notex(t))
        st=[(x+(0.032 if q%2==0 else 0.014)*math.cos(math.radians(q*36+k*20)),y+(0.032 if q%2==0 else 0.014)*math.sin(math.radians(q*36+k*20))) for q in range(10)]   # へた：5つにひらいた緑の葉と、まん中の短いじく
        L.append(notex(P('トマト%dのへた'%(k+1),'prism',(st,zt+sz-0.004,zt+sz+0.006,'z'),(118,178,74),on=('トマト%d'%(k+1),),note='トマトのてっぺん')))
        L.append(notex(P('トマト%dのじく'%(k+1),'cyl',(x,y,0.006,zt+sz+0.006,zt+sz+0.026),(118,178,74),detail=8,on=('トマト%dのへた'%(k+1),),note='へたのまん中')))
    return L
