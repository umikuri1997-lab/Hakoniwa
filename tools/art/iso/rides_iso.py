# 遊園地の遊具（merry・cup・skyswing・wheel）を、クォータービューで写す（iso3d.py の build から呼ぶ。設計図は furn3d/items/<id>.py と ride_common.py）。
# 出すチップ（ゲームの置き方 iso:1。ax・ay は置いたマスのまん中の地面の点から）：
#   <id>      1コマめのまるごとの絵（アイコン・置く前）。pf：遊具のまわる角度 → コマの数（ゲームの rideFrame）
#   <id>:s    動かない所（16コマぜんぶで同じドット）
#   <id>:m0〜m15  動く所（動かない所とちがうドットだけ。うしろの動かない所にかさねる。動く部品の手前にある動かない所も、ここにふくむ）
# 色は、16コマで共通のパレットにそろえる（コマごとに、にた色のまとめ方がちがうと、動かない所がちらつく）。
import os,sys,math
import numpy as np
from PIL import Image
def palette(images,threshold=12):
    """全コマで共通のパレット（handoff3d/render.py の palette と同じ）"""
    frames=[np.array(im) for im in images];pix=np.concatenate([a[a[:,:,3]==255,:3] for a in frames])
    colors,counts=np.unique(pix,axis=0,return_counts=True);rgb=colors.astype(int);mapped=np.arange(len(colors))
    for i in np.argsort(-counts,kind='stable'):
        if mapped[i]==i:
            close=((rgb-rgb[i])**2).sum(axis=1)<threshold**2;mapped[close&(mapped==np.arange(len(colors)))]=i
    lut={tuple(c):colors[mapped[i]] for i,c in enumerate(colors)}
    for fr in frames:
        for c,rep in lut.items():
            m=(fr[:,:,:3]==c).all(axis=2)&(fr[:,:,3]==255);fr[m,:3]=rep
    return frames
def run(iid,out,I,only_frames=None):
    F3,O=I.F3,I.O;M=F3.load(iid)
    O.GRAD=getattr(M,'GRAD',False);O.SHADE=getattr(M,'SHADE',[(17.5,-5),(35,-10)]);O.OSAT=getattr(M,'OSAT',0);O.SHADE4=getattr(M,'SHADE4',[(9,-2.5),(18,-5),(30,-9)]);l=np.array(getattr(M,'LIGHT',(-0.35,0.25,1.0)),float);O.LIGHT=l/np.linalg.norm(l)
    T0=O.Scene.turn;FOOT=(0,0,*M.SZ);O.Scene.turn=lambda self,k,foot=None:T0(self,k,FOOT)   # まわす中心は、置くマスのまん中のまま（コマごとに、絵のわくでかわらない）
    NF=M.FRAMES;imgs=[];inf={}
    try:
        for f in range(NF):
            M.FR=f;inf={};im,ex0,base,yb=F3.shot(M,0,info=inf);imgs.append(im)
            if f==0:print(iid,'コマ',im.size,flush=True)
    finally:O.Scene.turn=T0
    assert len({im.size for im in imgs})==1
    u,v=I.anchor(inf,iid,0)
    fr=palette(imgs);stable=np.logical_and.reduce([(a==fr[0]).all(axis=2) for a in fr])
    still=Image.fromarray(np.where(stable[...,None],fr[0],0).astype(np.uint8))
    R={};dx=lambda bb:round(bb[0]-u);dy=lambda bb:round(bb[1]-v)
    def chip(im,extra=None):
        bb=im.getbbox();c=im.crop(bb);d={'g':64,'ax':dx(bb),'ay':dy(bb),'w':c.width,'h':c.height,'f':[c],'iso':1}
        if extra:d.update(extra)
        return d
    full0=Image.fromarray(fr[0]);R[iid]=chip(full0,{'pf':M.PF})
    R[iid+':s']=chip(still)
    for i,a in enumerate(fr):
        patch=Image.fromarray(np.where(stable[...,None],0,a).astype(np.uint8))
        assert (np.asarray(Image.alpha_composite(still,patch))==a).all(),i   # 動かない所＋動く所＝そのコマ
        R['%s:m%d'%(iid,i)]=chip(patch)
    R['_full']=[chip(Image.fromarray(a)) for a in fr]   # 見せる絵・たしかめ用（チップには入れない）
    return R
def view(c,Z=4,grid=None):
    """ゲームの地面のマス（64×48 のひし形）の上に置いた絵。置くマスの数 grid=(よこ,たて) の四角ぜんぶを、ひし形でしめす。足もとのマスのまん中が (ax,ay) の点"""
    a,b=grid or (2,2);im=c['f'][0];ax,ay=-c['ax'],-c['ay']
    hw,hh=(a+b)*16,(a+b)*12
    L=max(ax,hw)+30;Rr=max(im.width-ax,hw)+30;Tp=max(ay,hh)+30;Bt=max(im.height-ay,hh)+30
    W,Hh=L+Rr,Tp+Bt;cx,cy=L,Tp;bg=np.zeros((Hh,W,4),np.uint8);bg[:]=(232,226,210,255)
    # 置くマス（a×b）のひし形：中心 (cx,cy) が、マスのかたまりのまん中
    yy,xx=np.mgrid[0:Hh,0:W];px,py=(xx-cx+.5),(yy-cy+.5)
    # 画面→せかい（マスの辺 = 1）：u=(px/32+py/24)/2 ・ v=(py/24-px/32)/2
    u=(px/32+py/24)/2;v=(py/24-px/32)/2;inn=(abs(u)<=a/2)&(abs(v)<=b/2);edge=inn&((abs(u)>a/2-.04)|(abs(v)>b/2-.04))
    cell=(((np.floor(u+a/2)+np.floor(v+b/2))%2)==0)
    bg[inn&cell]=(196,214,170,255);bg[inn&~cell]=(184,204,160,255);bg[edge]=(150,170,128,255)
    img=Image.fromarray(bg,'RGBA');img.alpha_composite(im.convert('RGBA'),(cx-ax,cy-ay))
    return img.resize((W*Z,Hh*Z),Image.NEAREST)
