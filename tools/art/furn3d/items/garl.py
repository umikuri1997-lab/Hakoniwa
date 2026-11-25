# ひもと旗のかざり（garl・garlk）：イベントのかざり・大会の旗。会場の、おくの列のマスのきたのふち（y=0）にそって、
# くい（garlk・garlk#1）と、1マスぶんのひもの部品（garl＝旗・garl#1＝赤白・garl#2＝ちょうちん・garl#3＝花）をならべる。ひもの部品は2コマでゆれる。
# 設計図（単位はマス）
#   くい：木の角柱（0.07角・高さ0〜1.55）。てっぺんに、ひもを通す小さな丸い玉（半径0.05）。garlk はマスのいちばん西（x=0）・garlk#1 はいちばん東（x=1）に立つ。
#   ひも：まるい細い管（半径0.016）。マスの西のはし(0,0,1.45)から東のはし(1,0,1.45)へ、ま中で0.07だけたるむ。となりのマスのひもと、はしでぴったりつながる。
#   旗：三角旗（1まいの面。上の辺の両はしをひもの上の2点から作り、先は下へ0.28。あつさ0.012）。1マスに3まい（はば0.22）、色は 橙・黄・水色。先がゆれる。
#   赤白：三角旗（はば0.19）を1マスに4まい。色は 赤・白・赤・白。
#   ちょうちん：ひもから短いひも（0.05）でつるした、丸い提灯（よこ0.055・たて0.075。上下に黒い木のふた）。1マスに3つ。色は 橙・こがね・橙。あかりのように明るい。
#   花：ひもからつるした花（くきの先に、花びら5まいと、まん中のしべ。花びらは平たい形）。1マスに3つ。色は ももいろ・うす黄・むらさき。くきの途中に葉が2まい。
from blueprint import Part as P
from common import *
import math,os
import oblique3d as O
ID='garl';BOTTOM=0;GRAD=True;FRAMES=2
VIEWS=[('garl',0,0),('garl#1',0,1),('garl#2',0,2),('garl#3',0,3),('garlk',0,10),('garlk#1',0,11)]
ZH=1.45;SAG=0.07;ZK=1.55
def zc(x):return ZH-SAG*math.sin(math.pi*x)   # ひもの高さ
STR=(92,74,50);FL=[(255,138,92),(255,210,63),(127,198,255)];RW=[(255,90,74),(250,250,250)];LAMP=[(255,138,92),(255,176,112),(255,138,92)];FLW=[(255,159,184),(255,240,160),(196,156,255)]
DARK=(122,74,42);STEM=(127,176,112)
def sway():return (-1 if (globals().get('FR') or 0)==0 else 1)
def pen(L,nm,x,w,drop,col,s):
    # 三角旗：上の辺は、ひもの上の2点（x−w/2 と x+w/2）。先は、まん中から下へ drop、sway で少しゆれる
    a,b=x-w/2,x+w/2;za,zb=zc(a)-0.01,zc(b)-0.01
    q=notex(P(nm,'mesh',(None,None,None),col,deco=True,note='ひもにとめた三角旗'));q.olk=0.9;q.soft1=True
    t=(a+b)/2+0.035*s;zt=min(za,zb)-drop
    V=[(a,0.0,za),(b,0.0,zb),(t,0.0,zt),(a,0.012,za),(b,0.012,zb),(t,0.012,zt)]
    F=[(0,1,2),(3,5,4),(0,3,4),(0,4,1),(1,4,5),(1,5,2),(2,5,3),(2,3,0)];q.dims=(V,F,[col]*len(F));return q
def PARTS():
    v=globals().get('VAR');v=0 if v is None else v;L=[];s=sway()
    if v>=10:
        x=0.0 if v==10 else 1.0
        k=P('くい','box',(x-0.045,-0.045,0.0,x+0.045,0.045,ZK),WOOD,bevel=0.0,note='地面にうめてたてる');k.texobj=O.Tex(os.path.join(os.path.dirname(O.__file__),'textures','wood049.png'),span=0.7,flow=10,minrun=4,dark=(0.32,0.76),light=(0.22,1.14));L.append(k)
        L.append(P('くいの玉','ball',(x,0.0,ZK+0.03,0.05),WOOD,on=('くい',),note='てっぺん'))
        return L
    n=24;pts=[(i/n,0.0,zc(i/n)) for i in range(n+1)]
    q=notex(P('ひも','tube',(pts,0.016),STR,deco=True,note='くいからくいへ、ひもをはる'));q.olk=0.86;L.append(q)
    if v==0:
        for i,x in enumerate((0.17,0.5,0.83)):L.append(pen(L,'旗%d'%(i+1),x,0.22,0.28,FL[i],s))
    elif v==1:
        for i,x in enumerate((0.125,0.375,0.625,0.875)):L.append(pen(L,'赤白%d'%(i+1),x,0.19,0.26,RW[i%2],s))
    elif v==2:
        for i,x in enumerate((0.17,0.5,0.83)):
            z0=zc(x)-0.05;sx=s*0.02;zb=z0-0.075*2;zm=z0-0.075
            c=notex(P('ひも%d'%(i+1),'tube',([(x,0,zc(x)),(x+sx*.5,0,z0)],0.008),STR,deco=True,note='ひもからつるす短いひも'));c.olk=0.86;L.append(c)
            e=notex(P('ちょうちん%d'%(i+1),'egg',(x+sx,0,zm,0.058,0.058,0.078,0),LAMP[i],deco=True,note='丸い提灯'));e.olk=0.84;e.glow=True;e.grp='ちょうちん%d'%(i+1);L.append(e)
            for nm,zz in(('上',z0-0.01),('下',zb+0.01)):
                f=notex(P('ふた%s%d'%(nm,i+1),'cyl',(x+sx,0,0.032,zz-0.012,zz+0.012),DARK,deco=True,detail=16,note='提灯の木のふた'));f.plainwall=True;f.grp='ちょうちん%d'%(i+1);L.append(f)
    else:
        for i,x in enumerate((0.17,0.5,0.83)):
            z0=zc(x);zf=z0-0.25;sx=s*0.025
            st=notex(P('くき%d'%(i+1),'tube',([(x,0,z0),(x+sx*.4,0,z0-0.10),(x+sx,0,zf)],0.007),STEM,deco=True,note='ひもからたれるくき'));st.olk=0.86;L.append(st)
            for k,(dx,dz) in enumerate(((-0.06,-0.08),(0.06,-0.11))):
                lf=notex(P('葉%d-%d'%(i+1,k+1),'egg',(x+sx*.6+dx,0,z0+dz,0.04,0.008,0.016,(25 if dx<0 else -25)),STEM,deco=True,note='くきの葉'));lf.olk=0.86;L.append(lf)
            for a in range(5):
                r=a*2*math.pi/5+0.3;px,pz=x+sx+0.062*math.sin(r),zf+0.062*math.cos(r)
                pt=notex(P('花びら%d-%d'%(i+1,a+1),'egg',(px,0,pz,0.042,0.014,0.042,0),FLW[i],deco=True,note='花びら（平たい形）'));pt.olk=0.84;pt.soft1=True;pt.grp='花%d'%(i+1);L.append(pt)
            c=notex(P('しべ%d'%(i+1),'egg',(x+sx,-0.006,zf,0.034,0.014,0.034,0),(255,210,63),deco=True,note='花のまん中'));c.olk=0.84;c.grp='花%d'%(i+1);L.append(c)
    return L
TONE5=True
