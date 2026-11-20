# マットキャップ（matcap）：球に光をあてた1まいの絵を、ドットごとの面の向き（画面の右・下・手前）で引いて、かげと質感をつける。
# 3Dから写した家具の、かげのつけかたの1つ（設計図に MATCAP='clay' など。furn3d.py が写したあとに apply をよぶ）。
#   絵は、ここで計算して作る（tools/art/textures/matcap_<名前>.png にも書き出す。ほかの絵にかえるときは、その png をおきかえる）。
#   色＝部品のもとの色 × 絵の明るさ（まん中の明るさを1にそろえる）＋ 絵のつやの白。明るさは STEPS だんにまとめる（ドット絵なので、なめらかにしすぎない。あみは使わない）。
#   部品のさかいの線・まわりのふちは、furntone と同じ輪郭の色。光る物・すける物（furntone.KEEP）はそのまま。
import os,numpy as np
from PIL import Image
import oblique3d as O
HERE=os.path.dirname(os.path.abspath(__file__));TEX=os.path.join(HERE,'textures')
R=256;STEPS=6
KINDS={   # 名前：光の向き（左上・手前）・まわりの光・まわりのくらさ・つや（強さ・するどさ）・あたたかさ
    'clay':dict(light=(-0.55,-0.6,0.58),amb=0.62,rim=0.22,spec=(0.10,18),warm=0.04),   # ねんど・やきもののような、やわらかい質感
    'gloss':dict(light=(-0.55,-0.6,0.58),amb=0.58,rim=0.18,spec=(0.35,40),warm=0.02),  # つやのある質感（やきもの・ガラスのような物）
}
def build(kind='clay'):
    p=os.path.join(TEX,'matcap_%s.png'%kind)
    if os.path.exists(p):return np.asarray(Image.open(p).convert('RGB'),float)/255
    k=KINDS[kind];y,x=(np.mgrid[0:R,0:R]+0.5)/R*2-1;r2=x*x+y*y;z=np.sqrt(np.clip(1-r2,0,1))
    L=np.array(k['light'],float);L/=np.linalg.norm(L);n=np.dstack([x,y,z]);d=n@L
    dif=np.clip((d+0.35)/1.35,0,1);rim=(1-z)**2*k['rim'];sh=k['amb']+(1-k['amb'])*dif*1.25-rim
    h=L+np.array([0,0,1.0]);h/=np.linalg.norm(h);sp=np.clip(n@h,0,1)**k['spec'][1]*k['spec'][0]
    c=np.dstack([sh*(1+k['warm']),sh,sh*(1-k['warm'])])+sp[...,None];c[r2>1]=0
    os.makedirs(TEX,exist_ok=True);Image.fromarray(np.clip(c*200,0,255).astype(np.uint8)).save(p)   # 200 が明るさ1（1より明るい所＝つやも入る）
    return np.asarray(Image.open(p).convert('RGB'),float)/255
def apply(im,kind='clay',steps=STEPS):
    import furntone as FT
    mc=build(kind)*255/200;a=np.array(im).copy();H,W=a.shape[:2];ids=O.LAST_IDS;cc=np.round(O.LAST_CC).astype(float);LN=O.LAST_LINE;MT=O.LAST_MT
    if ids.shape!=(H,W):return im
    keep=np.isin(ids,[p for p,m in MT.items() if m in FT.KEEP]);tgt=(ids>=0)&~keep&~O.LAST_CLR
    N=O.LAST_N;D=O.LAST_DEPTH/np.linalg.norm(O.LAST_DEPTH);X=np.array([1.0,0,0]);X=X-D*(X@D);X/=np.linalg.norm(X);U=np.cross(D,X);U=U if U[2]>0 else -U
    n=np.dstack([N@X,-(N@U),N@D]);n/=np.maximum(np.linalg.norm(n,axis=2,keepdims=True),1e-6)
    u=np.clip(((n[...,0]+1)/2*R).astype(int),0,R-1);v=np.clip(((n[...,1]+1)/2*R).astype(int),0,R-1);s=mc[v,u]   # 画面の下が +y
    lum=s.mean(2,keepdims=True);q=np.round(lum*steps)/steps;s=s*(q/np.maximum(lum,1e-6))   # 明るさを STEPS だんに
    col=np.clip(cc*s,0,255)
    a[...,:3][tgt&~LN]=col[tgt&~LN].astype(np.uint8)
    for y_,x_ in zip(*np.nonzero(tgt&LN)):a[y_,x_,:3]=FT.pal(cc[y_,x_].astype(int))[1]
    outer=(a[...,3]>0)&(ids<0)&~O.LAST_CLR
    for y_,x_ in zip(*np.nonzero(outer)):
        for dy,dx in ((0,-1),(0,1),(-1,0),(1,0)):
            yy,xx=y_+dy,x_+dx
            if 0<=yy<H and 0<=xx<W and ids[yy,xx]>=0 and not keep[yy,xx]:a[y_,x_,:3]=FT.pal(cc[yy,xx].astype(int))[1];break
    return Image.fromarray(a)
