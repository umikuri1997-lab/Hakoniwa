# もらった絵（src/）から、チップを作る：ベンチ・キャビネット・かざり棚。
# 見えないほどうすい点（うすさ20まで）をけしてから、色の平均（BOX）でちぢめる。
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
# ベンチ：はば100。もとの絵のはば124ぶんの大きさのまま、座板のまん中だけをぬいて（はしの丸み・脚の形はかえない）、はば100にする。2×1マス：まん中63.5・下のはし64
def narrow(im,full,w):
    im=im.crop(bb(im));k=full/im.width;cut=round((full-w)/k);m=im.width//2;a=np.array(im)
    n=Image.fromarray(np.concatenate([a[:,:m-cut//2],a[:,m-cut//2+cut:]],1));return n.resize((w,round(im.height*k)),Image.BOX)
put('bench',narrow(load('bench'),124,100),63.5,64)
put('cabinet',shrink(load('cabinet'),67),32,39)   # はば67（3Dのお手本）。1×1マス：まん中32・下のはし39（前の絵と同じ）
put('shelf2',shrink(load('shelf2'),62),32,42)   # はば62（3Dのお手本）。1×1マス：まん中32・下のはし42（前の絵と同じ）
chips.pack_imgs(h,C)
