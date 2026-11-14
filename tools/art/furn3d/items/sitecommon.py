# 足場（建てている場所 site）の3D。大きさのちがう5つ（site1・site2・site2d・site2t・site3）で使う。
# 設計図（じっさいに作れる組み方。単位はマス。x=東・y=南・z=上）
#   作りかけの建物：足場の内がわ0.12に、4つのかべ（あつさ0.14）。石は1こ はば0.20・高さ0.12・あつさ0.14（どれも同じ大きさ）。1だんごとに半分ずらしてつむ。
#     前・うしろのかべは x にそって、左右のかべは前・うしろのかべのあいだに y にそってならべる。かべのはしの石だけ、はしで切る。
#     作りかけなので、うしろの左が高く、右・手前ほど、だんの数がへる（手前のかべは1〜2だん。中が見える）。
#     中のゆか：砂山と、つんだ石材（かべと同じ石）。
#   足場：建物のまわりをぐるりとかこむ。柱（0.06角）を四すみと、よこのあいだ（MID）に立てる。柱の下に敷き板（0.12角×0.02）。
#     布板（横木 0.05角）：柱の外がわに、3だん（下・まん中・手すり）。前・うしろは x にそって、左右は y にそって。左右の布板は、前・うしろの布板の0.05上（ぶつからないように）。柱にしばってとめる。
#     すじかい（0.04角）：前の面と右の面に、下の布板から手すりへ、布板の外にとめる。
#     足場板：前の右がわだけ、まん中の布板の高さで、腕木（布板から手前のかべの上へわたす。かべにさしこむ、むかしの足場のやり方）の上に板を1まい。
from blueprint import Part as P
from common import *
import math
SHADES=[(232,222,206),(222,212,196)]   # いまの絵のかべに合わせた、明るいクリーム色の石（色の数をへらすので2つ）
SAND=(232,212,164)
SL,SH,ST=0.20,0.12,0.14
def make(X0,X1,Y0,Y1,H,NR,MID=()):
    L=[];I=0.12;WX0,WX1,WY0,WY1=X0+I,X1-I,Y0+I,Y1-I
    def rows(x,y):   # その場所のかべのだんの数
        tx=(x-WX0)/(WX1-WX0);ty=(y-WY0)/(WY1-WY0)
        return max(1,int(round(NR*(1-0.45*tx)*(1-0.82*ty))))
    def course(nm,a0,a1,fixed0,fixed1,axis):   # a にそって石をならべる（axis 'x'：前・うしろのかべ／'y'：左右のかべ）
        prev=[]
        for r in range(NR):
            z0=r*SH;off=SL/2 if r%2 else 0;a=a0-off;i=0;cur=[]
            while a<a1-1e-6:
                s,e=max(a,a0),min(a+SL,a1);m=(s+e)/2;a+=SL;i+=1
                if e-s<0.03:continue
                x,y=(m,(fixed0+fixed1)/2) if axis=='x' else ((fixed0+fixed1)/2,m)
                if r>=rows(x,y):continue
                b=(s+0.002,fixed0,z0,e-0.002,fixed1,z0+SH-0.002) if axis=='x' else (fixed0,s+0.002,z0,fixed1,e-0.002,z0+SH-0.002)
                on=('ground',) if r==0 else tuple(n for n,qa,qb in prev if qa<e-0.01 and qb>s+0.01) or ('ground',)
                p=P('%s%d-%d'%(nm,r,i),'box',b,SHADES[(i+r)%2],on=on,bevel=0,note='半分ずらしてつむ');p.stone=True;L.append(p);cur.append((p.name,s,e))
            prev=cur
    course('うしろの石',WX0,WX1,WY0,WY0+ST,'x');course('前の石',WX0,WX1,WY1-ST,WY1,'x')
    course('左の石',WY0+ST,WY1-ST,WX0,WX0+ST,'y');course('右の石',WY0+ST,WY1-ST,WX1-ST,WX1,'y')
    # 中のゆかの資材
    cx=(WX0+WX1)/2;cy=(WY0+WY1)/2
    p=P('砂山','cone',(WX1-ST-0.18,cy+0.02,0.13,0,0.05),SAND,note='ゆかに');p.soft=True;p.tex=False;L.append(p)
    for k,(x,z) in enumerate(((WX0+ST+0.04,0),(WX0+ST+0.04+SL,0),(WX0+ST+0.04+SL/2,SH))):
        p=P('つんだ石%d'%k,'box',(x,cy-0.10,z,x+SL-0.004,cy-0.10+ST,z+SH-0.002),SHADES[k%2],on=('ground',) if z==0 else ('つんだ石0','つんだ石1'),bevel=0,note='つむ');p.stone=True;L.append(p)
    # 足場
    PW=0.06;xs=[X0]+list(MID)+[X1-PW];ys=[Y0,Y1-PW]
    for nx,x in enumerate(xs):
        for ny,y in enumerate(ys):
            n='%d-%d'%(nx,ny)
            L.append(P('敷き板'+n,'box',(x-0.03,y-0.03,0,x+PW+0.03,y+PW+0.03,0.02),WOOD,bevel=0,note='地面におく'))
            L.append(P('柱'+n,'box',(x,y,0.02,x+PW,y+PW,H+0.06),WOOD,on=('敷き板'+n,),bevel=0,note='敷き板に立てる'))
    zl=[0.10,H*0.50,H-0.05];LB=0.05
    for k,z in enumerate(zl):
        L.append(P('布板（前%d）'%k,'box',(X0-0.03,Y1,z,X1+0.03,Y1+LB,z+LB),WOOD,on=tuple('柱%d-1'%q for q in range(len(xs))),bevel=0,note='柱の外にしばる'))
        L.append(P('布板（うしろ%d）'%k,'box',(X0-0.03,Y0-LB,z,X1+0.03,Y0,z+LB),WOOD,on=tuple('柱%d-0'%q for q in range(len(xs))),bevel=0,note='柱の外にしばる'))
        zs=z+LB
        L.append(P('布板（左%d）'%k,'box',(X0-LB,Y0-0.03,zs,X0,Y1+0.03,zs+LB),WOOD,on=('柱0-0','柱0-1'),bevel=0,note='柱の外にしばる'))
        L.append(P('布板（右%d）'%k,'box',(X1,Y0-0.03,zs,X1+LB,Y1+0.03,zs+LB),WOOD,on=('柱%d-0'%(len(xs)-1),'柱%d-1'%(len(xs)-1)),bevel=0,note='柱の外にしばる'))
    L.append(P('すじかい（前）','beam',((X0+0.03,Y1+LB+0.02,zl[0]+0.03),(X1-0.03,Y1+LB+0.02,zl[2]+0.02),0.02),WOOD,on=('布板（前0）','布板（前2）'),note='前の布板の外にとめる'))
    L.append(P('すじかい（右）','beam',((X1+LB+0.02,Y1-0.03,zl[0]+LB+0.03),(X1+LB+0.02,Y0+0.03,zl[2]+LB+0.02),0.02),WOOD,on=('布板（右0）','布板（右2）'),note='右の布板の外にとめる'))
    # 前の右がわの足場板（腕木を、まん中の布板から前のかべの上へわたす）
    zd=zl[1]+LB;XD=X0+(X1-X0)*0.5;tw=WY1-ST/2
    xa=[XD+0.02,X1-0.10]
    for q,x in enumerate(xa):L.append(P('腕木%d'%q,'box',(x,tw,zd,x+0.05,Y1+LB,zd+0.05),WOOD,on=('布板（前1）',),bevel=0,note='布板にのせ、うしろのはしは、かべの上にのせる'))
    L.append(P('足場板','box',(XD,tw+0.02,zd+0.05,X1-0.02,Y1+LB-0.01,zd+0.08),WOOD,on=('腕木0','腕木1'),bevel=0,note='腕木の上にのせる'))
    return L
