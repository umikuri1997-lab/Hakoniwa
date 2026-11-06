# 指の絵(finger.png)から、4つの手をドット絵にする（もとは約10.7倍にのばした絵）。
# 手ごとに、マスの位置（ずれ）をさがし、1マスの中でいちばん多い色（パレット5色）をとる。
# 使い方: python3 tools/art/finger/finger_art.py <出力フォルダ>
import sys, numpy as np
from PIL import Image
SRC='tools/art/finger/finger.png'; P=10.7
BOX={'down':(193,448,121,464),'press':(807,1064,147,536),'left':(130,489,823,1077),'up':(806,1066,760,1112)}
def cells(H,W,p,ox,oy):
    ys=np.floor((np.arange(H)-oy)/p).astype(int);xs=np.floor((np.arange(W)-ox)/p).astype(int)
    return ys-ys.min(),xs-xs.min()
def err(c,ys,xs):
    nx=xs.max()+1;ny=ys.max()+1;idx=(ys[:,None]*nx+xs[None,:]).ravel();f=c.reshape(-1,c.shape[2])
    s=np.zeros((ny*nx,c.shape[2]));np.add.at(s,idx,f);n=np.bincount(idx,minlength=ny*nx)[:,None]
    m=s/np.maximum(n,1);return ((f-m[idx])**2).sum()/len(f)
def main(out):
    im=np.array(Image.open(SRC).convert('RGBA')).astype(float)
    pal=np.array([[245,197,168],[192,115,92],[223,164,138],[252,228,197],[255,255,255]],float)  # 肌・輪郭・かげ・明るい肌・ハイライト
    for n,(x0,x1,y0,y1) in BOX.items():
        c=im[y0-12:y1+13,x0-12:x1+13].copy(); H,W=c.shape[:2]
        best=None
        sm=c[::2,::2]; sm=np.dstack([sm[...,:3]*sm[...,3:]/255,sm[...,3:]])
        for ox in np.arange(0,P,.5):
            for oy in np.arange(0,P,.5):
                ys,xs=cells(sm.shape[0],sm.shape[1],P/2,ox/2,oy/2);e=err(sm,ys,xs)
                if best is None or e<best[0]:best=(e,ox,oy)
        _,ox,oy=best; ys,xs=cells(H,W,P,ox,oy); ny,nx=ys.max()+1,xs.max()+1
        o=np.zeros((ny,nx,4),'uint8')
        for y in range(ny):
            for x in range(nx):
                blk=c[np.ix_(ys==y,xs==x)].reshape(-1,4)
                if (blk[:,3]>128).mean()<.45: continue
                q=blk[blk[:,3]>128][:,:3]; k=((q[:,None]-pal[None])**2).sum(2).argmin(1)
                o[y,x]=[*pal[np.bincount(k,minlength=5).argmax()].astype(int),255]
        ys_,xs_=np.where(o[...,3]>0);o=o[ys_.min():ys_.max()+1,xs_.min():xs_.max()+1];ny,nx=o.shape[:2]
        Image.fromarray(o,'RGBA').save(f'{out}/finger-{n}.png'); print(n,nx,ny,best[1:])
main(sys.argv[1])
# 3まいのゲーム用の絵にする: 下むき（ふつう・おす）を1まいにならべた絵、左むき、上むき。ゲームの assets/g へ（名前は中身のハッシュ）
def pack(out):
    import hashlib, shutil
    L=lambda n:Image.open(f'{out}/finger-{n}.png')
    d,pr=L('down'),L('press'); W=24; Hh=39
    sheet=Image.new('RGBA',(W*2,Hh)); sheet.alpha_composite(d,(0,0)); sheet.alpha_composite(pr,(W,2))  # 左：ふつう、右：おす（2ドット下）
    for n,im in (('downs',sheet),('left',L('left')),('up',L('up'))):
        p=f'{out}/finger-{n}.webp'; im.save(p,lossless=True,exact=True)
        h=hashlib.sha1(open(p,'rb').read()).hexdigest()[:10]; shutil.copy(p,f'assets/g/{h}.webp'); print(n,h,im.size)
if len(sys.argv)>2: pack(sys.argv[1])
