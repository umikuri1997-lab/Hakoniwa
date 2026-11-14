# ガゼボ（gazebo）・東屋（azumaya）の共通の組み方（2×2マス、屋根のある休み場所）。家具の設計図ではない（gazebo.py・azumaya.py がよぶ）。
# 設計図（じっさいに作れる組み方。単位はマス。置くマスは x 0〜2・y 0〜2）
#   礎石：柱の下に1こずつ（0.24角・高さ0〜0.06）。地面にうめる。          （東屋だけ。ガゼボは柱の台座 0.20角・高さ0.12）
#   柱：4本（PW 角・高さ BASE〜PH）。四すみ（置くマスより0.08外、のきの下）に立て、礎石・台座にほぞでさす。
#   桁：前・うしろ（x にのびる）と左・右（y にのびる）、0.10×0.12。柱の上にのせて、ほぞでとめる。左右の桁は前うしろの桁のあいだに入れる。
#   貫：柱と柱のあいだに、横木（0.06×0.10、高さ NZ）。柱にほぞでさしてとめる（前・うしろ・左・右）。見おろしでは、桁はのきにかくれるので、のきの下に見える横木にする。
#   方杖：柱と貫の角の下に、三角の板（長さ0.18・はば0.05）。柱と貫にとめる（前・うしろの面、左右の面）。
#   たる木：桁の上にのせ、屋根のてっぺんへあつめる（見えないので、屋根の板にふくめる）。
#   屋根：四方へながれる屋根（方形）、勾配1.5寸（よこ10に高さ1.5）。のき先は置くマスより O ずつ外、高さ RZ。てっぺんは AZ＝RZ＋0.15×1.2＝RZ＋0.18。屋根の板（あつさ RT）をたる木にとめる。
#   鼻かくし：のき先に、ぐるりと板（たかさ FH）。屋根の板のはしにとめる。
#   すみむね：四すみからてっぺんへ、屋根の板の上にのせる。
#   てっぺんのかざり：すみむねのあつまる所にさす（ガゼボは木の玉のかざり、東屋は宝珠）。
from blueprint import Part as P
from common import *
import math
IN=-0.08;O=0.20;RT=0.04
SLOPE=0.15   # 屋根の勾配（1.5寸）
def build(L,col_post,col_beam,col_roof,col_ridge,PW,PH,FH,base,finial,ridge_r,roof_decal,eave_tiles=None):
    xs=(IN,2-IN-PW);ys=(IN,2-IN-PW);B0=base[0]
    for nx,x in zip('左右',xs):
        for ny,y in zip(('うしろ','前'),ys):
            cx,cy=x+PW/2,y+PW/2;nm='%s%s'%(nx,ny)
            if base[1]=='stone':
                s=P('礎石（%s）'%nm,'box',(cx-0.12,cy-0.12,0,cx+0.12,cy+0.12,B0),(206,200,188),bevel=0,note='地面にうめる');s.stone=True;L.append(s);on=('礎石（%s）'%nm,)
            else:
                L.append(P('台座（%s）'%nm,'box',(cx-0.10,cy-0.10,0,cx+0.10,cy+0.10,B0),col_post,bevel=0,note='地面にすえる'));on=('台座（%s）'%nm,)
            L.append(P('柱（%s）'%nm,'box',(x,y,B0,x+PW,y+PW,PH),col_post,bevel=0,on=on,note='四すみに立て、台にほぞでさす'))
    BT,BH=0.10,0.12
    for ny,y in zip(('うしろ','前'),ys):
        L.append(P('桁（%s）'%ny,'box',(xs[0]-0.03,y+PW/2-BT/2,PH,xs[1]+PW+0.03,y+PW/2+BT/2,PH+BH),col_beam,bevel=0,on=('柱（左%s）'%ny,'柱（右%s）'%ny),note='柱の上にのせて、ほぞでとめる'))
    for nx,x in zip('左右',xs):
        L.append(P('桁（%s）'%nx,'box',(x+PW/2-BT/2,ys[0]+PW/2+BT/2+0.002,PH+0.002,x+PW/2+BT/2,ys[1]+PW/2-BT/2-0.002,PH+BH-0.002),col_beam,bevel=0,on=('柱（%sうしろ）'%nx,'柱（%s前）'%nx),note='前うしろの桁のあいだ'))
    NZ=PH-0.24;NT,NH=0.06,0.10   # 貫：のきの下に見える高さ
    for ny,y in zip(('うしろ','前'),ys):L.append(P('貫（%s）'%ny,'box',(xs[0]+PW,y+PW/2-NT/2,NZ,xs[1],y+PW/2+NT/2,NZ+NH),col_beam,bevel=0,on=('柱（左%s）'%ny,'柱（右%s）'%ny),note='柱にほぞでさす'))
    for nx,x in zip('左右',xs):L.append(P('貫（%s）'%nx,'box',(x+PW/2-NT/2,ys[0]+PW,NZ,x+PW/2+NT/2,ys[1],NZ+NH),col_beam,bevel=0,on=('柱（%sうしろ）'%nx,'柱（%s前）'%nx),note='柱にほぞでさす'))
    S_=0.18   # 方杖：柱と貫の角の下の三角（柱からの長さ）
    for nx,x in zip('左右',xs):
        for ny,y in zip(('うしろ','前'),ys):
            nm='%s%s'%(nx,ny);sx=1 if nx=='左' else -1;ex=x+PW if nx=='左' else x;cy=y+PW/2
            L.append(P('方杖（%s・よこ）'%nm,'prism',([(ex,NZ),(ex+sx*S_,NZ),(ex,NZ-S_)],cy-0.025,cy+0.025),col_beam,on=('柱（%s）'%nm,'貫（%s）'%ny),note='柱と前うしろの貫にとめる'))
            sy=1 if ny=='うしろ' else -1;ey=y+PW if ny=='うしろ' else y;cx=x+PW/2
            L.append(P('方杖（%s・おく）'%nm,'prism',([(ey,NZ),(ey+sy*S_,NZ),(ey,NZ-S_)],cx-0.025,cx+0.025,'x'),col_beam,on=('柱（%s）'%nm,'貫（%s）'%nx),note='柱と左右の貫にとめる'))
    top=PH+BH;RZ=top;AZ=top+SLOPE*(1+O)   # 屋根ののき先の下のはしは、桁の上（屋根の板は桁にのる）
    # 屋根：のき先の下のはしが RZ。屋根の板は4まいの三角（たる木にとめる）
    pr=P('屋根','pyr',(1,1,1+O,1+O,top,AZ),col_roof,on=('桁（前）','桁（うしろ）','桁（左）','桁（右）'),note='たる木にとめる（たる木は桁の上にのせ、てっぺんへあつめる）',grp='屋根');pr.tex=False;pr.decal=roof_decal;L.append(pr)
    for nm,b in(('前',(-O,2+O-0.03,RZ-FH,2+O,2+O,RZ)),('うしろ',(-O,-O,RZ-FH,2+O,-O+0.03,RZ)),('左',(-O,-O+0.03,RZ-FH,-O+0.03,2+O-0.03,RZ)),('右',(2+O-0.03,-O+0.03,RZ-FH,2+O,2+O-0.03,RZ))):
        f=P('鼻かくし（%s）'%nm,'box',b,col_beam,bevel=0,on=('屋根',),note='のき先にとめる');L.append(f)
    for nm,(cx,cy) in(('左うしろ',(-O,-O)),('右うしろ',(2+O,-O)),('左前',(-O,2+O)),('右前',(2+O,2+O))):
        a=(cx+(1-cx)*0.02,cy+(1-cy)*0.02,RZ+ridge_r*0.6);b=(1,1,AZ+ridge_r*0.6)
        r=P('すみむね（%s）'%nm,'beam',(a,b,ridge_r,ridge_r),col_ridge,on=('屋根',),note='屋根の板の上にのせる');r.tex=False;L.append(r)
    if eave_tiles:eave_tiles(L,RZ)
    fn=P('てっぺんのかざり','lathe',(1,1,[(0.0,AZ-0.02)]+finial(AZ)),col_ridge if base[1]=='stone' else col_post,detail=24,on=('すみむね（左前）',),note='すみむねのあつまる所にさす');fn.tex=False;L.append(fn)
    return L
def face(x,y):   # 屋根の、どの面か（'y'：前うしろの面・'x'：左右の面）と、のき先からの長さ（上から見て）
    dx,dy=abs(x-1),abs(y-1)
    return ('y',1+O-dy) if dy>=dx else ('x',1+O-dx)
