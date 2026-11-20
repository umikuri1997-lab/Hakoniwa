# 限定の家具（トリポ）のテクスチャを、持ち主のデザインの絵から焼きなおす（gf/tex.png → gf/tex2.png、2048×2048）。
# 使い方：python3 tools/art/models/tripo/gf_bake.py [--check 絵.png]
#   トリポのテクスチャは25こで1024×1024なので、もよう（本の背・天板のおひさま・びょうぶの火）がぼやける。
#   トリポのモデルは、デザインの絵（gf/design.png、5×5 にならんだ絵）を正面から見た形で作られているので、
#   切りわけたままのモデル（gf/orig/、かたむきを直す前）を正面から見て、見えている面のテクセルに、デザインの絵のその場所の色を焼く。
#   正面から見えない面（うしろ・かげになる所）・絵の外（透明）にあたる所は、トリポのテクスチャの色のまま（2倍にのばした物）。
#   絵とモデルは少しずれるので、ずれた色を入れない：手前の物のふちのまわり（EDGE）は焼かない・トリポのテクスチャの色と大きくちがう色（GATE）は焼かない
#   （入れると、ポットの絵がうしろの天板にうつる・葉の色が木にうつる）。
#   UV はかえないので、形を直したモデル（gf/*.glb）にも、そのまま使える。
import os,sys,numpy as np,trimesh
from PIL import Image
from scipy import ndimage
D=os.path.join(os.path.dirname(os.path.abspath(__file__)),'gf')
N=['g_w_bed','g_w_stump','g_w_clover','g_w_shelf','g_w_acorn','g_e_planter','g_e_bath','g_e_geode','g_e_arch','g_e_lantern','g_f_table','g_f_sofa','g_f_hanger','g_f_lamp','g_f_screen','g_k_egg','g_k_screen','g_k_fan','g_k_chest','g_k_bed','g_s_sofa','g_s_table','g_s_tank','g_s_jelly','g_s_vanity']
CELL={'g_k_chest':(3,1),'g_k_bed':(3,2),'g_k_screen':(3,3),'g_k_fan':(3,4)}   # デザインの絵でのならび（行・列）。ほかは N の順（風の行だけ、切りわけた順とちがう）
T=2048;TOL=0.006;NZ=0.12;EDGE=4;GATE=120   # EDGE：奥行きがとぶ所（手前の物のふち）のまわり、このドット数は焼かない。GATE：トリポの色と、これより（RGB の差の合計）ちがう色は焼かない
des=np.asarray(Image.open(os.path.join(D,'design.png')).convert('RGBA')).astype(float);DH,DW=des.shape[:2]
solid=ndimage.binary_erosion(des[...,3]>200,iterations=2)   # 絵のふち（背景とまざった色）は使わない
lab,nl=ndimage.label(ndimage.binary_dilation(des[...,3]>128,iterations=3))
out=np.asarray(Image.open(os.path.join(D,'tex.png')).convert('RGB').resize((T,T),Image.BICUBIC)).astype(float).copy()
base=out.copy();done=np.zeros((T,T),bool);chk=np.full((DH,DW,3),255,np.uint8)
def bary(P,gx,gy):
    (ax,ay),(bx,by),(cx,cy)=P;den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy)
    if abs(den)<1e-12:return None
    w0=((by-cy)*(gx-cx)+(cx-bx)*(gy-cy))/den;w1=((cy-ay)*(gx-cx)+(ax-cx)*(gy-cy))/den;return w0,w1,1-w0-w1
for i,n in enumerate(N):
    r,c=CELL.get(n,divmod(i,5));cw=DW/5;ch=DH/5
    cs=ndimage.center_of_mass(np.ones_like(lab),lab,range(1,nl+1));ar=ndimage.sum(np.ones_like(lab),lab,range(1,nl+1))
    ks=[k+1 for k,(cy_,cx_) in enumerate(cs) if c*cw<=cx_<(c+1)*cw and r*ch<=cy_<(r+1)*ch]
    if not ks:print(n,'絵が見つからない');continue
    big=max(ar[k-1] for k in ks);ks=[k for k in ks if ar[k-1]>=big*0.08]
    ys,xs=np.nonzero(np.isin(lab,ks)&(des[...,3]>128));bx0,bx1,by0,by1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
    m=trimesh.load(os.path.join(D,'orig',n+'.glb'),force='mesh');v=np.asarray(m.vertices,float);F=np.asarray(m.faces);uv=np.asarray(m.visual.uv,float)
    lo,hi=v.min(0),v.max(0)
    px=bx0+(v[:,0]-lo[0])/(hi[0]-lo[0])*(bx1-bx0);py=by1-(v[:,1]-lo[1])/(hi[1]-lo[1])*(by1-by0)
    zb=np.full((DH,DW),-1e9)
    for f in F:   # 正面から見た奥行き（いちばん手前）
        X,Y,Z=px[f],py[f],v[f,2];x0,x1=int(max(0,np.floor(X.min()))),int(min(DW-1,np.ceil(X.max())));y0,y1=int(max(0,np.floor(Y.min()))),int(min(DH-1,np.ceil(Y.max())))
        gy,gx=np.mgrid[y0:y1+1,x0:x1+1]+0.5;w=bary(list(zip(X,Y)),gx,gy)
        if w is None:continue
        ins=(w[0]>=-0.02)&(w[1]>=-0.02)&(w[2]>=-0.02);z=w[0]*Z[0]+w[1]*Z[1]+w[2]*Z[2]
        s=zb[y0:y1+1,x0:x1+1];s[ins]=np.maximum(s[ins],z[ins])
    zf=np.where(zb>-1e8,zb,np.nan);gmx=ndimage.maximum_filter(np.nan_to_num(zf,nan=-1e9),3);gmn=ndimage.minimum_filter(np.nan_to_num(zf,nan=1e9),3)
    edge=ndimage.binary_dilation(((gmx-gmn)>TOL*2.5)|np.isnan(zf),iterations=EDGE)   # 奥行きがとぶ所・物の外のまわり
    nrm=np.cross(v[F[:,1]]-v[F[:,0]],v[F[:,2]]-v[F[:,0]]);nrm/=np.maximum(np.linalg.norm(nrm,axis=1,keepdims=True),1e-12)
    U=uv[:,0]%1*T;V_=(1-uv[:,1]%1)*T;nb=0
    for fi,f in enumerate(F):   # テクセルごとに、正面から見える所なら、デザインの絵の色
        if abs(nrm[fi,2])<NZ:continue   # 面の表うらは見ない（トリポのモデルは、面の向きがそろっていない物がある）。いちばん手前かどうかは、奥行きでたしかめる
        X,Y=U[f],V_[f];x0,x1=int(max(0,np.floor(X.min())-1)),int(min(T-1,np.ceil(X.max())+1));y0,y1=int(max(0,np.floor(Y.min())-1)),int(min(T-1,np.ceil(Y.max())+1))
        gy,gx=np.mgrid[y0:y1+1,x0:x1+1]+0.5;w=bary(list(zip(X,Y)),gx,gy)
        if w is None:continue
        ins=(w[0]>=-0.15)&(w[1]>=-0.15)&(w[2]>=-0.15)   # 島のふちは少し外まで（すきまが出ないように）
        if not ins.any():continue
        W3=np.stack([np.clip(q,0,1) for q in w],-1);W3/=W3.sum(-1,keepdims=True)
        qx=(W3*px[f]).sum(-1);qy=(W3*py[f]).sum(-1);qz=(W3*v[f,2]).sum(-1)
        ix=np.clip(qx.astype(int),0,DW-1);iy=np.clip(qy.astype(int),0,DH-1)
        ok=ins&solid[iy,ix]&~edge[iy,ix]&(qz>=zb[iy,ix]-TOL)
        if ok.any():ok&=np.abs(des[iy,ix,:3]-base[y0:y1+1,x0:x1+1]).sum(-1)<GATE
        if not ok.any():continue
        out[y0:y1+1,x0:x1+1][ok]=des[iy,ix,:3][ok];done[y0:y1+1,x0:x1+1][ok]=True;nb+=int(ok.sum())
    print(n,'焼いたテクセル',nb,'絵のわく',(bx0,by0,bx1,by1))
Image.fromarray(np.clip(out,0,255).astype(np.uint8)).save(os.path.join(D,'tex2.png'))
print('tex2.png  焼いたわりあい %.1f%%'%(done.mean()*100))
