# トリポの限定の家具の色を、デザインの絵の色に、くっきりぬりなおす（モデルの点の色そのものを直す）。
# 使い方：python3 tools/art/models/tripo/gf_recolor.py <名前> <デザインの絵（その家具だけを切りぬいた透過PNG）> [--k 12] [--pk 14]
#   モデルの点の色を、色の平均とはばをデザインに合わせてから k 色にまとめる（トリポの色むら・にじみをなくし、くっきりした色に）。
#   --snap：さらに、デザインの絵の色（pk 色にまとめた物）のいちばん近い色におきかえる（うすい色によりやすい）。
#   くらべるときは、明るさのずれ（トリポの色は、くらく・うすい）をそろえてから（色の平均と明るさのはばを、デザインに合わせる）。
import sys,os,argparse,numpy as np,trimesh
from PIL import Image
from scipy.cluster.vq import kmeans2
ap=argparse.ArgumentParser();ap.add_argument('name');ap.add_argument('img');ap.add_argument('--k',type=int,default=12);ap.add_argument('--pk',type=int,default=14);ap.add_argument('--snap',action='store_true');ap.add_argument('--sat',type=float,default=1.3);ap.add_argument('--val',type=float,default=0.94)
A=ap.parse_args();D=os.path.join(os.path.dirname(__file__),'gf');f=os.path.join(D,A.name+'.glb')
m=trimesh.load(f,force='mesh');C=np.asarray(m.visual.vertex_colors)[:,:3].astype(float)
im=np.asarray(Image.open(A.img).convert('RGBA')).reshape(-1,4);px=im[im[:,3]>200][:,:3].astype(float)
px=px[(px.max(1)<250)|(px.min(1)<235)]   # 白い光のつやは、色に入れない
P,_=kmeans2(px,A.pk,minit='++',seed=1)
def lab(x):   # かんたんな見た目の近さ（明るさ・赤み・黄み）
    x=x/255.0;L=x@[.3,.59,.11];return np.c_[L*2,(x[:,0]-x[:,1])*1.2,(x[:,1]+x[:,0])/2-x[:,2]]
Cn=(C-C.mean(0))*(px.std(0)/(C.std(0)+1e-6))+px.mean(0)   # 色の平均とはばを、デザインに合わせる
cb,lb=kmeans2(Cn,A.k,minit='++',seed=1)
lp=lab(P);out=np.zeros_like(C)
for i in range(A.k):
    if not (lb==i).any():continue
    j=np.argmin(((lp-lab(cb[i:i+1]))**2).sum(1));out[lb==i]=P[j] if A.snap else cb[i]
import colorsys   # --sat・--val：あざやかさ・明るさ（トゥーンでかげをつけると、うすく見えるので、少しこく）
out=np.array([colorsys.hsv_to_rgb(h,min(1,s_*A.sat),v*A.val) for h,s_,v in (colorsys.rgb_to_hsv(*(c/255)) for c in np.clip(out,0,255))])*255
m.visual=trimesh.visual.ColorVisuals(m,vertex_colors=np.c_[np.clip(out,0,255).astype(np.uint8),np.full(len(out),255,np.uint8)])
m.export(f);print(A.name,'ぬりなおした',A.k,'色 →',len(np.unique(out,axis=0)),'色')
