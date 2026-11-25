# 家具の5色のかげ（木のかげと同じ付け方：natcommon.tone5）。
# かげは明るさ（明度）をかえず、あざやかさ（彩度）でつける：かげほどあざやか・ハイライトほどうすい（SH・HI の (明るさ, あざやかさ)。持ち主がきめた）。輪郭線だけ少し暗く（OLK）。
# 左上から光。部品ごとのもとの色（oblique3d.LAST_CC）から、5色（こいかげ・かげ・もとの色・ハイライト・明るいハイライト）と輪郭の色を作る。
# 面の向きは、写したときの奥行き（LAST_ZB）を部品ごとにぼかして出す（部品どうしでまぜない）。明るさの5だんのさかいめは、市松もようのあみかけ。
# 部品のさかいの線（LAST_LINE）は、その部品の輪郭の色。2ドットめの線（LAST_LINE2）は、ひとつ暗いだん。まわりのふちは、となりの部品の輪郭の色。
# 光る物・すけて見える物・場所ごとに色をぬった物（material flat・clear・ink）は、そのまま。
import colorsys,math
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter,find_objects
import oblique3d as O
HI=((0,-5),(0,-10));SH=((0,10),(0,20));OLK=(38,10);CUTS=(-0.2,0.4,0.88,0.97);DW=0.03;RIMHI=0.0;RIM=0.7;VMIN=45;LIGHT=(-0.6,-0.5,0.8);STREAK=(0.14,0.07)   # CUTS：上の面 0.81・左の面 0.51→もとの色・正面 0.23→かげ・右の面 −0.51→こいかげ。ハイライトは、光を向いたまるい所と、ふちの左上
KEEP=('flat','clear','ink','glass','glassc','gwater');DW3=0.0   # 特別な家具：あみは使わない（持ち主がきめた）
def _hsv(base,dv,ds):
    h,s,v=colorsys.rgb_to_hsv(*(np.asarray(base,float)/255));v=min(1,max(VMIN/100 if dv<-30 else 0,v+dv/100));s=min(1,max(0,s+ds/100))
    return np.array([round(x*255) for x in colorsys.hsv_to_rgb(h,s,v)],np.uint8)
_PC={}
def pal(base):
    k=tuple(int(c) for c in base)
    if k not in _PC:_PC[k]=(np.array([_hsv(k,-SH[1][0],SH[1][1]),_hsv(k,-SH[0][0],SH[0][1]),_hsv(k,0,0),_hsv(k,HI[0][0],HI[0][1]),_hsv(k,HI[1][0],HI[1][1])]),_hsv(k,-OLK[0],OLK[1]))
    return _PC[k]
def worldlight(ref=42,light=LIGHT):
    """見おろし ref 度のときの画面の光（light）を、せかいの向きにする。tone の world にわたすと、角度をかえても光の当たり方がかわらない"""
    t=math.radians(ref);D=np.array([0,math.cos(t),math.sin(t)]);X=np.array([1.0,0,0]);U=np.cross(D,X);U=U if U[2]>0 else -U;l=np.asarray(light,float);l=l/np.linalg.norm(l)
    return l[0]*X-l[1]*U+l[2]*D
def tone(im,cuts=CUTS,light=LIGHT,streak=STREAK,three=False,dw=None,world=None):   # dw：あみかけのはば（設計図の DITHER。0 で、あみかけなし）   # world：せかいの向きの光（worldlight）。あれば light のかわりに（光がカメラといっしょに回らない）
    """three=True：かげは3だん（かげ・もとの色・ハイライト）、あみかけは少し（DW3）。限定の家具（持ち主がきめた）"""
    a=np.array(im).copy();H,W=a.shape[:2];ids=O.LAST_IDS;zb=O.LAST_ZB;cc=np.round(O.LAST_CC).astype(int);LN=O.LAST_LINE;LN2=O.LAST_LINE2;MT=O.LAST_MT
    if ids.shape!=(H,W):return im
    keep=np.isin(ids,[p for p,m in MT.items() if m in KEEP])
    tgt=(ids>=0)&~keep&~O.LAST_CLR;body=tgt&~LN   # すけて見える部品（水）をかさねた所も、そのまま
    if body.sum()<8:return im
    # 面の向き（せかいの向き）を、画面の向き（右・下・手前）になおして、光（左上・手前から）とくらべる
    N=O.LAST_N;D=O.LAST_DEPTH/np.linalg.norm(O.LAST_DEPTH);X=np.array([1.0,0,0]);X=X-D*(X@D);X/=np.linalg.norm(X);U=np.cross(D,X);U=U if U[2]>0 else -U
    if world is not None:light=(world@X,-(world@U),world@D)   # せかいの光を、いまのカメラの画面の向きに
    n=np.dstack([N@X,-(N@U),N@D]);lv_=np.asarray(light,float);d=n@(lv_/np.linalg.norm(lv_))
    t=np.interp(d,[-1.0]+list(cuts)+[1.0],[0,0.5,1.5,2.5,3.5,4])   # だんのさかいめは、光の向きとの内積の数（家具は平らな面が多いので、木のような順番（%）ではなく、数できめる。上の面・正面・左・右の面が、だんのまん中に入る）
    t0=t.copy()
    A0=a[...,3]>0;outer=A0&(ids<0)&~O.LAST_CLR   # ガラス（すけて見える所）は、まわりのふちにしない
    po=np.pad(outer|~A0|(LN&(ids>=0)),1);nb=lambda dy,dx:po[1+dy:1+dy+H,1+dx:1+dx+W]   # ふち：まわりのふちと、部品のさかいの線
    t[body&(nb(0,1)|nb(1,0)|nb(1,1))]-=RIM;t[body&(nb(0,-1)|nb(-1,0)|nb(-1,-1))&~(nb(0,1)|nb(1,0)|nb(1,1))]+=RIM*RIMHI   # 線の左上がわを明るくする分。RIMHI は0（明るくしない。線のまわりにうすい色がのると、へこんで見える。持ち主がきめた。前は0.6）
    L=a[...,:3].astype(float)@[0.299,0.587,0.114];mf=body.astype(float);Lb=gaussian_filter(L*mf,1.4)/np.maximum(gaussian_filter(mf,1.4),1e-6);dd=L-Lb
    lv=np.floor(t+0.5);fr=t+0.5-lv;yy,xx=np.mgrid[0:H,0:W];ck=(xx+yy)%2==0
    from scipy.ndimage import maximum_filter,minimum_filter
    gr=maximum_filter(np.where(body,t0,-9),3)-minimum_filter(np.where(body,t0,9),3)
    grad=body&(gr>0.05)&(gr<3)   # あみかけは、明るさがなめらかにかわる所（まるい面）だけ。平らな面がまるごと、さかいめの近くにあっても、あみにしない
    dw=DW3 if three else (DW if dw is None else dw);lv[(fr<dw)&ck&grad]-=1;lv[(fr>1-dw)&~ck&grad]+=1
    tx=body&np.isin(ids,list(getattr(O,'LAST_TX',())) or [-9])
    for sgn,k_ in ((-1,streak[0]),(1,streak[1])):   # 木目のすじ：いちばん強い所だけ（細長いすじだけ）。かえる段は1、streak の3つめがあれば、その数（樹皮など、こいすじ）
        if k_<=0 or tx.sum()<8:continue
        from scipy.ndimage import label
        thr=np.quantile(sgn*dd[tx],1-k_);lab,_=label(tx&(sgn*dd>=thr),structure=np.ones((3,3)))   # ななめにつづくドットも、1本のすじ
        for i_,sl in enumerate(find_objects(lab),1):
            yy_,xx_=np.nonzero(lab[sl]==i_)
            if len(yy_)<3:continue
            ev=np.linalg.eigvalsh(np.cov(np.vstack([yy_,xx_]).astype(float))) if len(yy_)>1 else np.zeros(2)   # 細長さは、すじの向きにそってはかる（ななめのすじも、すじとして残す。外わくの四角ではかると、ななめの丸太の木目が消えた）
            Lmaj,Lmin=math.sqrt(12*max(ev[1],0))+1,math.sqrt(12*max(ev[0],0))+1
            if Lmaj>=3 and Lmaj>=2*Lmin:lv[sl][lab[sl]==i_]+=sgn*(streak[2] if len(streak)>2 else 1)
    lv[LN2&tgt]-=1
    lv=np.clip(lv,1,3).astype(int) if three else np.clip(lv,0,4).astype(int)
    for y,x in zip(*np.nonzero(tgt)):
        P,OL=pal(cc[y,x]);a[y,x,:3]=OL if LN[y,x] else P[lv[y,x]]
    for y,x in zip(*np.nonzero(outer)):   # まわりのふち：となりの部品の輪郭の色（いちばん多いもの）
        best=None
        for dy,dx in ((0,-1),(0,1),(-1,0),(1,0)):
            yy_,xx_=y+dy,x+dx
            if 0<=yy_<H and 0<=xx_<W and ids[yy_,xx_]>=0 and not keep[yy_,xx_]:best=cc[yy_,xx_];break
        if best is not None:a[y,x,:3]=pal(best)[1]
    return Image.fromarray(a)
