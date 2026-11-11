# もらった絵（src/）から、チップを作る：ベンチ。
# 見えないほどうすい点（うすさ20まで）をけしてから、はばを3Dのお手本（set10_3d.py）のはばにして、色の平均（BOX）でちぢめる。
# 下のはしと、よこのまん中は、いまのチップと同じ所にそろえる（数は前のチップから読んだ実数）。
import sys,os
sys.dont_write_bytecode=True
import numpy as np
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.join(HERE,'..','..','..')
sys.path.insert(0,os.path.join(ROOT,'tools'));import chips
S=os.path.join(HERE,'src')
def load(n):
    a=np.array(Image.open(os.path.join(S,n+'.png')).convert('RGBA'));a[a[...,3]<=20]=0;return Image.fromarray(a)
def bb(im):return im.split()[3].getbbox()
def shrink(im,w):im=im.crop(bb(im));return im.resize((w,round(im.height*w/im.width)),Image.BOX)
h,C=chips.load_imgs()
def put(id,im,cx,bottom):
    w,hh=im.size;C[id]={'g':64,'ax':round(cx-w/2),'ay':bottom-hh,'w':w,'h':hh,'f':[im]};print(id,w,hh,'ax',C[id]['ax'],'ay',C[id]['ay'])
put('bench',shrink(load('bench'),124),63.5,64)   # 2×1マス：まん中63.5・下のはし64
chips.pack_imgs(h,C)
