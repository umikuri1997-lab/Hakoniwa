# もらった絵（src/）から、チップを作る：よまわりのランタン・ガーデンアーチ・石どうろう・にぐるま・ブランコ・コンポスター・すべり台・井戸・シーソー。
# すべり台は、もらった絵を色の平均で、はば2マスにする。石どうろうは前の絵のまま。
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
for id,W in(('yomawari',22),):
    a,b=load(id+'_off'),load(id+'_on');box=bb(a);cx,bt=old(id)
    fa,fb=shrink(a,box,W),shrink(b,box,W);put(id,[fa,fb,fb],cx,bt)
for id,W in(('arch',113),('niguruma',122),('composter',55)):
    im=load(id)
    if id=='arch':a_=np.array(im);a_[a_[...,3]<=20]=0;im=Image.fromarray(a_)   # アーチの絵の、見えないほどうすい点（うすさ20まで）をけす
    cx,bt=old(id);put(id,[shrink(im,bb(im),W)],cx,bt)
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
# すべり台：色の平均（BOX）で、はば2マス（128）にちぢめる。置くマスは2×1。まん中は63、下のはしは1マスめの下（63）
im=load('slide');im=im.crop(bb(im));put('slide',[im.resize((128,round(im.height*128/im.width)),Image.BOX)],63,63)
# 石どうろう：もらった絵 src/toro2.png（左が消えた・右がついた）。ついた絵は、消えた絵に、右の絵の窓の所だけをはりつけて作る（ほかは1コマめとまったく同じ）。
# はば43（前の絵と同じ）に色の平均でちぢめ、まん中31.5・下のはし63（前の絵と同じ）。見えないほどうすい点（うすさ20まで）はけす。
_t=np.array(Image.open(os.path.join(S,'toro2.png')).convert('RGBA'));_t[_t[...,3]<=20]=0
_off=_t.copy();_on=_t.copy();_on[418:478,544:640]=_t[418:478,544+592:640+592]   # 窓（右の絵は592ドット右）
_off=Image.fromarray(_off).crop((417,139,767,749));_on=Image.fromarray(_on).crop((417,139,767,749))
_w=43;_h=round(_off.height*_w/_off.width);fo,fn=_off.resize((_w,_h),Image.BOX),_on.resize((_w,_h),Image.BOX)
put('toro',[fo,fn,fn],31.5,63)
# 井戸：石のふちのはばを3Dのお手本（0.84マス＝53.5ドット）に合わせる。まん中は1マスのまん中、下のはしは前の絵と同じ60。
im=load('well');b=bb(im);a=np.array(im)[...,3]>20;c=np.nonzero(a[b[1]+round((b[3]-b[1])*.7)])[0];k=53.5/(c.max()-c.min())
put('well',[shrink(im,b,round((b[2]-b[0])*k))],32.0,60)
# シーソー：台（本体）と板（部品。板のまん中を軸に、ゲームでかたむける）。板のはばは122。
# 板の下のはしが台の木のブロックの上にのる形に組み、板のまん中は3Dのお手本の高さ（マスの上から13）、台の下のはしはそこから組んだ所。
im=load('seesaw');a=np.array(im)[...,3]>20;rows=np.nonzero(a.any(1))[0];gap=[rows[i] for i in range(len(rows)-1) if rows[i+1]-rows[i]>5][0]+1
B=im.crop((0,0,im.width,gap));Bb=bb(B);k=122/(Bb[2]-Bb[0])
body=[y for y in range(Bb[1],Bb[3]) if a[y].sum()>(Bb[2]-Bb[0])*.9];by0,by1=body[0],body[-1]+1   # 板（取っ手をのぞく）の上下
T=im.crop((0,gap,im.width,im.height));Tb=bb(T);blk=np.nonzero(a[gap+Tb[1]])[0];top=gap+Tb[1]   # 台のいちばん上＝木のブロックの上
board=B.crop(Bb);board=board.resize((round(board.width*k),round(board.height*k)),Image.BOX)
base=T.crop(Tb);base=base.resize((round(base.width*k),round(base.height*k)),Image.BOX)
pcy=13.0;bmid=(by0+by1)/2                      # 板のまん中（もとの絵）
basebot=pcy+((Tb[3]+gap-top)+(by1-bmid))*k   # 板のまん中→板の下（＝ブロックの上）→台の下
put('seesaw',[base],32.0,round(basebot))
C['seesaw']['parts']=[{'ax':round(32-board.width/2),'ay':round(pcy-(bmid-Bb[1])*k),'w':board.width,'h':board.height,'px':32,'py':pcy,'f':[board]}]
print('seesaw board',board.size,C['seesaw']['parts'][0]['ax'],C['seesaw']['parts'][0]['ay'])
chips.pack_imgs(h,C)
