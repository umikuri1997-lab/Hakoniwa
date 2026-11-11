# もらった絵（src/）から、チップを作る：ベンチ・キャビネット・かざり棚・木箱・食料箱、キャビネット・本棚の右向き。
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
# キャビネット：もらった絵 src/cabinet2.png（左が正面・右が右向き）。正面をはば67（3Dのお手本）にし、右向きも同じ倍率でちぢめる。
# ちぢめたあと cleanup.py で、うすさを2だんに・1ドットのぶつぶつをけす・外の輪郭を同じ色の1ドットの線にする（両方の向きで同じ輪郭の色）
sys.path.insert(0,HERE);from cleanup import cleanup
_c=load('cabinet2');_F=_c.crop((0,0,130,_c.height));_R=_c.crop((130,0,_c.width,_c.height));_F=_F.crop(bb(_F));_R=_R.crop(bb(_R));_k=67/_F.width
_F,_oc=cleanup(_F.resize((67,round(_F.height*_k)),Image.BOX),athr=80);_R,_=cleanup(_R.resize((round(_R.width*_k),round(_R.height*_k)),Image.BOX),out=_oc,athr=80)
put('cabinet',_F,32,39)   # 1×1マス：まん中32・下のはし39（前の絵と同じ）
put('cabinet>1',_R,27,60)   # 右向き：まん中27・下のはし60（右向きの3Dと同じ）
put('shelf2',shrink(load('shelf2'),62),32,42)   # はば62（3Dのお手本）。1×1マス：まん中32・下のはし42（前の絵と同じ）
put('crate',shrink(load('crate'),64),32,45)   # はば1マス（64）。1×1マス：まん中32・下のはし45（前の絵・たると同じ）
# 食料箱：はば1マス（64）。まん中32・下のはし45（木箱・たると同じ）。もらった絵は、ほとんどの所のうすさが250〜254（少しすける）なので、245より上は255にする
def opaque(im):a=np.array(im);a[...,3][a[...,3]>=245]=255;return Image.fromarray(a)
put('stor',shrink(opaque(load('stor')),64),32,45)
# キャビネット・本棚の右向き（id>1。左向きはゲームで反転）：もらった絵は1マス64ドットの大きさなので、そのまま。置く場所は右向きの3D（set10_rot.py）と同じ所
# 本棚：もらった絵 src/shelf1_3.png（左から正面・右向き・左向き）。正面をはば1マス（64）にし、右向きも同じ倍率でちぢめる（左向きはゲームで右向きの反転）。
# ちぢめたあと cleanup.py で、うすさを2だん・1ドットのぶつぶつをけす（輪郭は、さいごの outline_unify でそろえる）
_b=load('shelf1_3');_bF=_b.crop((0,0,690,_b.height));_bR=_b.crop((690,0,1070,_b.height));_bF=_bF.crop(bb(_bF));_bR=_bR.crop(bb(_bR));_k=64/_bF.width
_bF,_oc=cleanup(_bF.resize((64,round(_bF.height*_k)),Image.BOX),athr=80);_bR,_=cleanup(_bR.resize((round(_bR.width*_k),round(_bR.height*_k)),Image.BOX),out=_oc,athr=80)
put('shelf1',_bF,32,44)   # 1×1マス：まん中32・下のはし44（前の絵と同じ）
put('shelf1>1',_bR,32,59)   # 右向き：まん中32・下のはし59（右向きの3Dと同じ）
# 木の家具の輪郭線をそろえる：外のふちを1ドットにし、色は、すぐ内がわの色を0.62倍にこくした色（cleanup.py の outline_unify）。
# 何回動かしても同じ絵になる。ここにない物（前からある絵）も、このならびに足してそろえる
sys.path.insert(0,HERE);from cleanup import outline_unify
for k in ('cabinet','cabinet>1','crate','stor','mbox','shelf2','shelf1','shelf1>1','bench'):
    C[k]['f']=[outline_unify(f) for f in C[k]['f']]
chips.pack_imgs(h,C)
