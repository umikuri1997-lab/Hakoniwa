# マットキャップ（matcap）：球に光をあてた1まいの絵を、ドットごとの面の向き（画面の右・下・手前）で引いて、かげと質感をつける。
# 3Dから写した家具の、かげのつけかたの1つ（設計図に MATCAP='clay' など。furn3d.py が写したあとに apply をよぶ）。
#   絵は、ここで計算して作る（たしかめ用に tools/art/textures/matcap_<名前>.png にも書き出す）。
#   色＝部品のもとの色 × 絵の明るさ（色はのせない。まん中の明るさを1にそろえる）。明るさは STEPS だんにまとめる（ドット絵なので、なめらかにしすぎない。あみは使わない）。
#   部品のさかいの線・まわりのふちは、furntone と同じ輪郭の色。光る物・すける物（furntone.KEEP）はそのまま。
import os,numpy as np
from PIL import Image
import oblique3d as O
HERE=os.path.dirname(os.path.abspath(__file__));TEX=os.path.join(HERE,'textures')
R=256;STEPS=6;SAT=0.8;VAL=1.5;OLD=(16,6)   # OLD：輪郭線の色（もとの色の明るさをひく数・あざやかさをたす数。持ち主：輪郭線が暗すぎる）。 SAT：もとの色のあざやかさにかける数。VAL：明るさを上げる強さ（明るさ v → 1−(1−v)^VAL。掛け算だと、明るい所が白くとんで、もよう（天板のおひさま・本の背）が消えるので、とばない上げ方に。2.4 で、まん中の明るさが掛け算の1.42倍と同じ）
KINDS={   # 名前：光の向き（左上・手前）・まわりの光・まわりのくらさ・つや（強さ・するどさ）・あたたかさ
    'clay':dict(light=(-0.35,-0.25,0.9),amb=0.80,rim=0.10,spec=(0.10,18),warm=0.0),   # ねんど・やきもののような、やわらかい質感。光は左上の少し手前から（上からだと、正面の面（びょうぶ・ソファの前）が暗くなる。持ち主）
    'gloss':dict(light=(-0.55,-0.6,0.58),amb=0.58,rim=0.18,spec=(0.35,40),warm=0.02),  # つやのある質感（やきもの・ガラスのような物）
}
def build(kind='clay',save=False):
    """球の絵を計算して作る（毎回同じ）。save：たしかめ用に tools/art/textures/matcap_<名前>.png に書く（いくつも同時に写すときに書くと、こわれた絵を読むので、ふだんは書かない）"""
    k=KINDS[kind];y,x=(np.mgrid[0:R,0:R]+0.5)/R*2-1;r2=x*x+y*y;z=np.sqrt(np.clip(1-r2,0,1))
    L=np.array(k['light'],float);L/=np.linalg.norm(L);n=np.dstack([x,y,z]);d=n@L
    dif=np.clip((d+0.35)/1.35,0,1);rim=(1-z)**2*k['rim'];sh=k['amb']+(1-k['amb'])*dif*1.15-rim   # かげのいちばん暗い所は amb（持ち主：かげ色がつよすぎる→0.80）
    h=L+np.array([0,0,1.0]);h/=np.linalg.norm(h);sp=np.clip(n@h,0,1)**k['spec'][1]*k['spec'][0]
    c=np.dstack([sh*(1+k['warm']),sh,sh*(1-k['warm'])])+sp[...,None];c[r2>1]=0;c=np.clip(c*200,0,255).astype(np.uint8)   # 200 が明るさ1（1より明るい所＝つやも入る）
    if save:os.makedirs(TEX,exist_ok=True);Image.fromarray(c).save(os.path.join(TEX,'matcap_%s.png'%kind))
    return c.astype(float)/255
def boost(cc,sat=SAT,val=VAL):
    """色（…×3）のあざやかさ・明るさを上げる（HSV の s・v にかける）"""
    c=np.clip(cc,0,255)/255;mx=c.max(-1,keepdims=True);mn=c.min(-1,keepdims=True);v=mx;s=np.where(mx>0,(mx-mn)/np.maximum(mx,1e-6),0)
    v2=1-(1-np.clip(v,0,1))**val;s2=np.clip(s*sat,0,1);g=np.where(mx-mn>1e-6,(c-mn)/np.maximum(mx-mn,1e-6),0)   # 色あいの形（0〜1）はそのまま
    return (v2*(1-s2)+g*v2*s2)*255
def apply(im,kind='clay',steps=STEPS,sat=SAT,val=VAL,glow=None):
    import furntone as FT
    mc=build(kind)*255/200;a=np.array(im).copy();H,W=a.shape[:2];ids=O.LAST_IDS;cc=boost(np.round(O.LAST_CC).astype(float),sat,val);LN=O.LAST_LINE;MT=O.LAST_MT
    if ids.shape!=(H,W):return im
    keep=np.isin(ids,[p for p,m in MT.items() if m in FT.KEEP]);tgt=(ids>=0)&~keep&~O.LAST_CLR
    N=O.LAST_N;D=O.LAST_DEPTH/np.linalg.norm(O.LAST_DEPTH);X=np.array([1.0,0,0]);X=X-D*(X@D);X/=np.linalg.norm(X);U=np.cross(D,X);U=U if U[2]>0 else -U
    n=np.dstack([N@X,-(N@U),N@D]);n/=np.maximum(np.linalg.norm(n,axis=2,keepdims=True),1e-6)
    u=np.clip(((n[...,0]+1)/2*R).astype(int),0,R-1);v=np.clip(((n[...,1]+1)/2*R).astype(int),0,R-1);s=mc[v,u]   # 画面の下が +y
    lum=s.mean(2,keepdims=True);s=np.round(lum*steps)/steps   # 明るさだけ（色はのせない。持ち主：マットキャップの色をのせない）を STEPS だんに
    col=np.clip(cc*s,0,255)
    a[...,:3][tgt&~LN]=col[tgt&~LN].astype(np.uint8)
    # 点のごみ（モデルのすきま・テクスチャのはしで出る、まわりとちがう1ドット）を、まわりの色にする
    from scipy.ndimage import median_filter
    med=np.dstack([median_filter(a[...,k],3) for k in range(3)]).astype(int);dif=np.abs(a[...,:3].astype(int)-med).sum(2)
    nbm=np.pad(tgt,1);same=sum(nbm[1+dy:1+dy+H,1+dx:1+dx+W] for dy,dx in ((0,1),(0,-1),(1,0),(-1,0)))==4
    sp=tgt&~LN&same&(dif>90);a[...,:3][sp]=med[sp].astype(np.uint8)
    if glow is not None:   # 光る所（ランプの火・あかり）：かげをつけず、明るく（まん中ほど白く）
        g=tgt&glow(np.round(O.LAST_CC).astype(float))
        if g.any():
            from scipy.ndimage import distance_transform_edt
            dd=distance_transform_edt(g);w=np.clip(dd/3,0,1)[...,None];base=np.clip(np.round(O.LAST_CC)*1.12+18,0,255);a[...,:3][g]=np.clip(base*(1-w*0.35)+255*w*0.35,0,255)[g].astype(np.uint8)
    for y_,x_ in zip(*np.nonzero(tgt&LN)):a[y_,x_,:3]=FT._hsv(cc[y_,x_].astype(int),-OLD[0],OLD[1])
    outer=(a[...,3]>0)&(ids<0)&~O.LAST_CLR
    for y_,x_ in zip(*np.nonzero(outer)):
        for dy,dx in ((0,-1),(0,1),(-1,0),(1,0)):
            yy,xx=y_+dy,x_+dx
            if 0<=yy<H and 0<=xx<W and ids[yy,xx]>=0 and not keep[yy,xx]:a[y_,x_,:3]=FT._hsv(cc[yy,xx].astype(int),-OLD[0],OLD[1]);break
    return Image.fromarray(a)
if __name__=='__main__':
    for k_ in KINDS:build(k_,save=True)
