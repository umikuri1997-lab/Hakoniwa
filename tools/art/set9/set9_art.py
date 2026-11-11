# もらった絵（src/）から、チップを作る：よまわりのランタン・ガーデンアーチ・石どうろう・にぐるま・ブランコ・コンポスター・すべり台。
# すべり台は、もらった絵が1マス64ドットの大きさなので、トリミングしてそのまま（ちぢめない）。
# 透過と色はそのまま、BOX でちぢめる。はばは3Dのお手本（set9_3d.py）のはば、下のはしと、よこのまん中は、いまのチップと同じ所にそろえる。
# ランタン・石どうろうは3コマ（消えた・ついた・ついた）。動くのは灯りの所だけ（もらった2まいは灯りの所いがい同じ絵）。
# ブランコは、わく（本体）と、なわつきの座席（部品 parts。上のはしのまん中を軸 px,py にゆれる）に分ける。
import sys,os
sys.dont_write_bytecode=True
import numpy as np
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.join(HERE,'..','..','..')
sys.path.insert(0,os.path.join(ROOT,'tools'));import chips
S=os.path.join(HERE,'src')
def load(n):return Image.open(os.path.join(S,n+'.png')).convert('RGBA')
def bb(im):return im.split()[3].point(lambda v:255 if v>20 else 0).getbbox()
def shrink(im,box,w):im=im.crop(box);h=round(im.height*w/im.width);return im.resize((w,h),Image.BOX)
h,C=chips.load_imgs()
def put(id,frames,cx,bottom,parts=None):
    w,hh=frames[0].size;c={'g':64,'ax':round(cx-w/2),'ay':bottom-hh,'w':w,'h':hh,'f':frames}
    if parts:c['parts']=parts
    C[id]=c;print(id,w,hh,'ax',c['ax'],'ay',c['ay'])
def old(id):v=C[id];return v['ax']+v['w']/2,v['ay']+v['h']   # いまのチップの、よこのまん中と下のはし
# 2コマ（消えた・ついた）の物
for id,W in(('yomawari',22),('toro',39)):
    a,b=load(id+'_off'),load(id+'_on');box=bb(a);cx,bt=old(id)
    fa,fb=shrink(a,box,W),shrink(b,box,W);put(id,[fa,fb,fb],cx,bt)
for id,W in(('arch',113),('niguruma',122),('composter',55)):
    im=load(id);cx,bt=old(id);put(id,[shrink(im,bb(im),W)],cx,bt)
# ブランコ：わくと座席
sw=load('swing');a=np.array(sw)[...,3]>20;cols=np.nonzero(a.any(0))[0]
cut=[cols[i] for i in range(len(cols)-1) if cols[i+1]-cols[i]>20][0]+1
L=sw.crop((0,0,cut,sw.height));R=sw.crop((cut,0,sw.width,sw.height))
fb_=bb(L);k=95/(fb_[2]-fb_[0])
fa=np.array(L)[...,3]>20;xc=(fb_[0]+fb_[2])//2;beam_bot=np.nonzero(fa[:,xc])[0].max()   # 横木の下のはし（もとの絵）
frame=shrink(L,fb_,95);bt=old('swing')[1];cx=64.0   # まん中は2×1マスのまん中（くりかえし動かしてもずれない）
put('swing',[frame],cx,bt)
sb=bb(R);seat=R.crop(sb);seat=seat.resize((round(seat.width*k),round(seat.height*k)),Image.BOX)
fx0=C['swing']['ax'];fy0=C['swing']['ay']
top=fy0+(beam_bot-fb_[1])*k-1                    # なわの上のはしを、横木の下のはしに
pax=round(cx-seat.width/2);pay=round(top)
C['swing']['parts']=[{'ax':pax,'ay':pay,'w':seat.width,'h':seat.height,'px':cx,'py':top,'f':[seat]}]
print('swing seat',seat.size,'ax',pax,'ay',pay,'px',cx,'py',round(top,1))
# すべり台：トリミングしてそのまま
im=load('slide');cx,bt=old('slide');put('slide',[im.crop(bb(im))],cx,bt)
chips.pack_imgs(h,C)
