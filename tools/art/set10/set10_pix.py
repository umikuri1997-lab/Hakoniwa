# set10 の木の家具を、tools/art/pixdown.py でドット絵にちぢめるための設定（もらった絵のセルの色の多いほう・中の線を1ドット・外の輪郭を1ドット）。
# つかいかた：python3 tools/art/pixdown.py --config tools/art/set10/set10_pix.py <出力フォルダ>
# 1つの絵に1つの物の設定。ベンチは、まん中をぬいた絵（set10_art.py の narrow と同じぬき方）を先に作る（BENCH）。
import os,numpy as np
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__));S=os.path.join(HERE,'src')
SRC=None   # 物ごとに src をもつ（OBJS の 'src'）
OBJS={
 'cabinet':  {'src':'cabinet2.png','box':(41,0,120,128),'w':67,'lines':(24,.3)},
 'cabinet>1':{'src':'cabinet2.png','box':(140,0,180,128),'sc':0.8481,'lines':(24,.3)},
 'shelf1':   {'src':'shelf1_3.png','box':(171,262,600,928),'w':64,'lines':(24,.3)},
 'shelf1>1': {'src':'shelf1_3.png','box':(775,32,954,926),'sc':0.14918,'lines':(24,.3)},
 'crate':    {'src':'crate.png','box':(194,141,1068,1088),'w':64,'lines':(24,.3)},
 'bench':    {'src':'@bench','box':(0,0,1320,584),'w':100,'lines':(24,.3)},
 'shelf2':   {'src':'shelf2.png','box':(10,17,132,241),'w':62},
}
def BENCH():
    a=np.array(Image.open(os.path.join(S,'bench.png')).convert('RGBA'));a[a[...,3]<=20]=0;im=Image.fromarray(a).crop((90,167,1727,751))
    w=im.width;k=124/w;cut=round(24/k);m=w//2;b=np.array(im);return Image.fromarray(np.concatenate([b[:,:m-cut//2],b[:,m-cut//2+cut:]],1))
def source(name):
    if name=='@bench':return BENCH()
    a=np.array(Image.open(os.path.join(S,name)).convert('RGBA'));a[a[...,3]<=20]=0;return Image.fromarray(a)
# 手でなおす所（ちぢめたあと、12倍で見て、ドットの座標で書く）。座標は、物のかこみ（透明でない所）の左上から
def _lum(c):return c[...,:3]@np.array([.3,.59,.11])
def _box(o):
    m=o[...,3]>0;ys=np.nonzero(m.any(1))[0];xs=np.nonzero(m.any(0))[0];return xs[0],ys[0],xs[-1],ys[-1]
def fix_cabinet(o):
    x0,y0,x1,y1=_box(o);out=np.median(o[y0+1:y0+20,x0,:3],0)
    for y in range(y0,y0+22):   # 天板の右のはしに輪郭がない（明るいまま）→ 左と同じ輪郭の色
        if o[y,x1,3]>0 and _lum(o[y,x1])>135:o[y,x1,:3]=out
    for y in range(y0+1,y0+22):   # 左の輪郭のすぐ内がわの こい点 → となりの木の色
        if _lum(o[y,x0+1])<100:o[y,x0+1,:3]=o[y,x0+2,:3]
    _row_dots(o,y0+22,x0+3,x1-1)   # 天板の手前のふちの ぽつぽつ
def _row_dots(o,y,xa,xb,d=12):   # 1行の中の こい点（天板のふちの ぽつぽつ）→ 左のドットの色
    med=np.median([_lum(o[y,x]) for x in range(xa,xb) if o[y,x,3]>0])
    for x in range(xa+1,xb):
        if o[y,x,3]>0 and _lum(o[y,x])<med-d:o[y,x,:3]=o[y,x-1,:3]
def _col_dots(o,x,ya,yb,d=20):   # 1列の中の こい点（側板のふちの ぽつぽつ）→ 上のドットの色
    med=np.median([_lum(o[y,x]) for y in range(ya,yb) if o[y,x,3]>0])
    for y in range(ya+1,yb):
        if o[y,x,3]>0 and _lum(o[y,x])<med-d:o[y,x,:3]=o[y-1,x,:3]
def fix_cabinet_r(o):
    x0,y0,x1,y1=_box(o)
    o[:,x0,3]=0   # 左はしの1列は、もらった絵の半分すけた所のこり（ぽつぽつの点）→ けして、つぎの列を輪郭に
    c=x0+1;dark=[o[y,c,:3] for y in range(y0,y1+1) if o[y,c,3]>0 and _lum(o[y,c])<125];out=np.median(dark,0)
    for y in range(y0,y1+1):
        if o[y,c,3]>0:o[y,c,:3]=out
        if o[y,x1,3]>0 and _lum(o[y,x1])>135:o[y,x1,:3]=out   # 右のはしにも、同じ輪郭
    _col_dots(o,x0+2,y0+64-1,y1-3)   # 下の箱の側板の ぽつぽつ
def fix_shelf1(o):
    x0,y0,x1,y1=_box(o)
    for x in (x0,x0+1,x1,x1-1):   # 左右のはしの外にとびでた1ドット（上下とも透明）
        for y in range(y0+1,y1):
            if o[y,x,3]>0 and o[y-1,x,3]==0 and o[y+1,x,3]==0:o[y,x,3]=0
def fix_shelf1_r(o):
    x0,y0,x1,y1=_box(o);_col_dots(o,x0+1,y0+65,y1-3)
FIX={'cabinet':fix_cabinet,'cabinet>1':fix_cabinet_r,'shelf1':fix_shelf1,'shelf1>1':fix_shelf1_r}
