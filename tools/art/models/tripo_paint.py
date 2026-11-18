# 色のないトリポのモデルに、元の絵（トリポにわたした絵）の色を、正面からまっすぐ写してつける（点ごとの色）。
# 使い方：python3 tools/art/models/tripo_paint.py <モデル（.glb・.fbx）> <元の絵.png> <出力.glb> [--up y|z] [--check 絵.png]
#   絵の、白い背景でない所のわく と、モデルを正面（+Z）から見たわく を合わせ、さらに物ごとに、絵の中のその物のかたまりのわくに合わせて、点ごとに、その場所の絵の色をとる（背景の白はまぜない）。
#   うしろの面にも、同じ場所の色がつく（正面から見る物なので、かまわない）。点のまわり（--r、3なら7×7ドット）のまん中の色をとり、ぜんぶの色を --k 色にまとめる（色むら・ふちのにじみをなくす）。
#   できた glb は tripo_split.py（--wall）で切りわけると、色がついたまま切れる。
import sys,os,subprocess,argparse,numpy as np,trimesh
from PIL import Image
ap=argparse.ArgumentParser();ap.add_argument('model');ap.add_argument('img');ap.add_argument('out');ap.add_argument('--up',default='y');ap.add_argument('--check');ap.add_argument('--r',type=int,default=3);ap.add_argument('--k',type=int,default=96);ap.add_argument('--edge',type=float,default=1/300)
A=ap.parse_args();src=A.model
if src.lower().endswith('.fbx'):src=A.out+'.tmp.glb';subprocess.run(['assimp','export',A.model,src],check=True,capture_output=True)
g=trimesh.util.concatenate(list(trimesh.load(src,force='scene').dump()))
if A.edge>0:   # 大きな三角形をこまかく分ける（色は点ごとにつくので、たいらな面の小さなもよう（地図の×印など）が、点のあいだにおちないように）
    from trimesh.remesh import subdivide_to_size
    v_,f_=subdivide_to_size(g.vertices,g.faces,max_edge=A.edge*float(np.ptp(g.vertices[:,0])),max_iter=8);g=trimesh.Trimesh(v_,f_,process=False)
V=np.asarray(g.vertices,float);up=1 if A.up=='y' else 2
im=np.asarray(Image.open(A.img).convert('RGB')).astype(int);H,W=im.shape[:2]
bg=(im.min(2)<235)|(im.max(2)-im.min(2)>14);ys,xs=np.nonzero(bg);x0,x1,y0,y1=xs.min(),xs.max(),ys.min(),ys.max()   # 絵の中身のわく
px,py=V[:,0],V[:,up];mx0,mx1,my0,my1=px.min(),px.max(),py.min(),py.max()
u=x0+(px-mx0)/(mx1-mx0)*(x1-x0);w=y1-(py-my0)/(my1-my0)*(y1-y0)   # まず、ぜんたいのわくで合わせる
# 物ごとに合わせなおす：トリポのならびは絵と少しずれるので、物（正面から見て重なる部品のまとまり）ごとに、絵の中のその物のかたまりのわくに合わせる
from scipy import ndimage
lab,nl=ndimage.label(ndimage.binary_dilation(bg,iterations=4))
F=np.asarray(g.faces);comps=trimesh.graph.connected_components(g.face_adjacency,min_len=1,nodes=np.arange(len(F)))
vs=[np.unique(F[c]) for c in comps];bb=[(u[v].min(),w[v].min(),u[v].max(),w[v].max()) for v in vs];n=len(vs);par=list(range(n))
def fd(i):
    while par[i]!=i:par[i]=par[par[i]];i=par[i]
    return i
for i in range(n):
    for j in range(i+1,n):
        a,b=bb[i],bb[j]
        if a[0]<=b[2] and b[0]<=a[2] and a[1]<=b[3] and b[1]<=a[3]:par[fd(i)]=fd(j)
grp={}
for i in range(n):grp.setdefault(fd(i),[]).append(i)
for ids in grp.values():
    v=np.unique(np.concatenate([vs[i] for i in ids]))
    if len(v)<30:continue
    ua,wa,ub,wb=u[v].min(),w[v].min(),u[v].max(),w[v].max()
    sub=lab[int(max(0,wa)):int(min(H,wb+1)),int(max(0,ua)):int(min(W,ub+1))]
    ks,cn=np.unique(sub[sub>0],return_counts=True)
    if not len(ks):continue
    keep=ks[cn>=cn.max()*0.15];m=np.isin(lab,keep)&bg;yy,xx=np.nonzero(m)
    u[v]=xx.min()+(u[v]-ua)/max(1e-6,ub-ua)*(xx.max()-xx.min());w[v]=yy.min()+(w[v]-wa)/max(1e-6,wb-wa)*(yy.max()-yy.min())
ui=np.clip(np.round(u).astype(int),1,W-2);wi=np.clip(np.round(w).astype(int),1,H-2)
R_=A.r;ui=np.clip(ui,R_,W-1-R_);wi=np.clip(wi,R_,H-1-R_)
pat=np.stack([im[wi+dy,ui+dx] for dy in range(-R_,R_+1) for dx in range(-R_,R_+1)],1).astype(float)
pbg=np.stack([bg[wi+dy,ui+dx] for dy in range(-R_,R_+1) for dx in range(-R_,R_+1)],1)
pat[~pbg]=np.nan;col=np.nanmedian(pat,1)   # 背景の白はまぜない
miss=np.isnan(col).any(1)
if miss.any():   # まわりがぜんぶ背景の点は、いちばん近い物のドットの色
    dist,(iy,ix)=ndimage.distance_transform_edt(~bg,return_indices=True);col[miss]=im[iy[wi[miss],ui[miss]],ix[wi[miss],ui[miss]]]
if A.k:   # 色をまとめる（点ごとの色むら・ふちのにじみをなくす）
    from scipy.cluster.vq import kmeans2
    cb,lb=kmeans2(col.astype(float),A.k,minit='++',seed=1);col=cb[lb]
col=np.clip(col,0,255).astype(np.uint8)
g.visual=trimesh.visual.ColorVisuals(g,vertex_colors=np.c_[col,np.full(len(col),255)])
g.export(A.out);print('わく 絵',(x0,y0,x1,y1),'モデル',np.round([mx0,my0,mx1,my1],3),'→',A.out)
if A.check:   # たしかめ：点の色を、絵の上の場所にうって、元の絵とならべる
    c=np.full((H,W,3),255,np.uint8);o=np.argsort(V[:,2] if up==1 else -V[:,1]);c[wi[o],ui[o]]=col[o]
    Image.fromarray(np.concatenate([im.astype(np.uint8),c],1)).resize((W,H//2) if W>H else (W,H//2)).save(A.check)
