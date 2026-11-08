# パラソル（もらった絵 image.png はドット絵。1ドットが約10.05ピクセルなので、そのドットのさかいに合わせて切る）
import numpy as np
SRC='tools/art/parasol/image.png'
OBJS={'parasol':{'box':(170,203,914,1228),'w':74}}
def smooth(o):
    """輪郭の仕上げ：とび出た1ドット（たて・よこのとなりの不透明が1つ以下）をけし、
    1ドットのへこみ（たて・よこのとなりの3つ以上が不透明）を、となりの色の平均でうめる"""
    for _ in range(2):
        a=o[...,3]>0;H,W=a.shape;p=np.pad(a,1)
        n=p[:-2,1:-1].astype(int)+p[2:,1:-1]+p[1:-1,:-2]+p[1:-1,2:]
        o[a&(n<=1)]=0
        for y,x in zip(*np.where(~a&(n>=3))):
            c=[o[yy,xx,:3] for yy,xx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)) if 0<=yy<H and 0<=xx<W and o[yy,xx,3]>0]
            o[y,x,:3]=np.mean(c,0);o[y,x,3]=255
    return o
FIX={'parasol':smooth}
