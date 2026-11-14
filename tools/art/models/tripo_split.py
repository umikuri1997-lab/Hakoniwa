# トリポからもらった1つのモデルに、物がいくつも入っているとき、1つずつの glb に切りわける。
# 使い方：python3 tools/art/models/tripo_split.py <モデル（.fbx・.glb・.obj）> <出力フォルダ> [--tex 色の絵.jpg] [--up auto|y|z] [--names 名前1,名前2,...] [--faces 3000]
#   1) FBX は assimp で glb にする（コマンド assimp。なければ apt-get install assimp-utils）。
#   2) つながった部品ごとにわけ、上から見て重なる部品を1つの物にまとめる（小さすぎる部品は、すてる）。
#   3) 物ごとに、面の向きをそろえ、足もとを原点・正面を glTF の +Z（y が上）にして、glb にする（obj00.glb …、--names があればその名前）。
#      色：--tex の色の絵（UV から）・モデルの点ごとの色・どちらもなければ白（色は設計図の p.recol でつける）。
#      面が --faces（3000）より多い物は、へらす（fast_simplification。写すのが重くなるため）。
#   4) ならべた絵（grid.png。正面から見た形と番号）を出す。名前は、絵を見てきめ、--names でもう1回切りわける。
#   上の向き（--up auto）：ほかの2つの向きのまん中が0に近く、その向きのいちばん下が0に近い向き（トリポの FBX は y、前のは z）。
#   ならびは、手前の列から、左から右（トリポの3×3のならびなら、プロンプトの1・2・3…の順にならないことがあるので、絵で見てたしかめる）。
import sys,os,subprocess,argparse,numpy as np,trimesh
from PIL import Image,ImageDraw
ap=argparse.ArgumentParser();ap.add_argument('model');ap.add_argument('out');ap.add_argument('--tex');ap.add_argument('--up',default='auto');ap.add_argument('--names');ap.add_argument('--faces',type=int,default=3000)
A=ap.parse_args();os.makedirs(A.out,exist_ok=True)
src=A.model
if src.lower().endswith('.fbx'):src=os.path.join(A.out,'_all.glb');subprocess.run(['assimp','export',A.model,src],check=True,capture_output=True)
gs=list(trimesh.load(src,force='scene').dump()) if not src.lower().endswith('.obj') else [trimesh.load(src,force='mesh')]
g=trimesh.util.concatenate(gs) if len(gs)>1 else gs[0]
V=np.asarray(g.vertices,float);F=np.asarray(g.faces);vis=g.visual;vcol=None
if A.tex and getattr(vis,'uv',None) is not None:
    tex=np.asarray(Image.open(A.tex).convert('RGB'));H,W=tex.shape[:2];uv=np.asarray(vis.uv)
    vcol=tex[np.clip((1-uv[:,1]%1)*H,0,H-1).astype(int),np.clip((uv[:,0]%1)*W,0,W-1).astype(int)]
elif getattr(vis,'kind',None)=='vertex':vcol=np.asarray(vis.vertex_colors)[:,:3]
if vcol is None:vcol=np.full((len(V),3),255,np.uint8);print('色なし：白にする（設計図の p.recol で色をつける）')
lo,hi=V.min(0),V.max(0);ext=hi-lo
if A.up=='auto':
    sc=[abs(lo[i])/ext[i]+sum(abs(lo[j]+hi[j])/2/ext[j] for j in range(3) if j!=i) for i in range(3)];up=int(np.argmin(sc))
else:up={'y':1,'z':2}[A.up]
print('上の向き','xyz'[up])
# ゲームの向き（x 右・y おく・z 上）にそろえる：y が上（glTF）なら、おく＝−z。z が上なら、おく＝+y
G=np.c_[V[:,0],-V[:,2],V[:,1]] if up==1 else V.copy()
comps=trimesh.graph.connected_components(g.face_adjacency,min_len=1,nodes=np.arange(len(F)))
bbs=np.array([np.r_[G[np.unique(F[c])].min(0),G[np.unique(F[c])].max(0)] for c in comps]);n=len(bbs);par=list(range(n))
def f(i):
    while par[i]!=i:par[i]=par[par[i]];i=par[i]
    return i
for i in range(n):   # 上から見て重なる部品は、同じ物
    a=bbs[i]
    for j in range(i+1,n):
        b=bbs[j]
        if a[0]-0.004<=b[3] and b[0]-0.004<=a[3] and a[1]-0.004<=b[4] and b[1]-0.004<=a[4]:par[f(i)]=f(j)
grp={}
for i in range(n):grp.setdefault(f(i),[]).append(i)
objs=[np.concatenate([comps[i] for i in ids]) for ids in grp.values()];objs=[o for o in objs if len(o)>30]
rowh=max(0.05,ext.max()/12)
objs.sort(key=lambda fi:(-round(G[np.unique(F[fi])][:,1].max()/rowh),G[np.unique(F[fi])][:,0].min()))   # 手前の列から、左から右
names=A.names.split(',') if A.names else None
if names and len(names)!=len(objs):print('名前の数',len(names),'と、物の数',len(objs),'がちがう');names=None
ims=[]
for k,fi in enumerate(objs):
    vi=np.unique(F[fi]);mp=-np.ones(len(V),int);mp[vi]=np.arange(len(vi));v=G[vi].copy();b0,b1=v.min(0),v.max(0)
    v[:,0]-=(b0[0]+b1[0])/2;v[:,1]-=(b0[1]+b1[1])/2;v[:,2]-=b0[2]
    out=np.c_[v[:,0],v[:,2],-v[:,1]]   # glTF：x 右・y 上・+z 手前
    nm=(names[k] if names else 'obj%02d'%k)
    tm=trimesh.Trimesh(out,mp[F[fi]],vertex_colors=np.c_[vcol[vi],np.full(len(vi),255)],process=False)
    if len(tm.faces)>A.faces:   # 面がおおすぎる物は、へらす（写すのが重く、メモリがたりなくなる）。色は、いちばん近いもとの点から
        from scipy.spatial import cKDTree
        sm=tm.simplify_quadric_decimation(face_count=A.faces);_,ni=cKDTree(out).query(sm.vertices)
        tm=trimesh.Trimesh(sm.vertices,sm.faces,vertex_colors=np.c_[vcol[vi][ni],np.full(len(ni),255)],process=False)
    trimesh.repair.fix_winding(tm);trimesh.repair.fix_normals(tm,multibody=True)   # 面の向き（表うら）をそろえ、外がわへ向ける（そろっていないと、かげがつかず平らに見える）
    if ((tm.triangles_center-tm.vertices.mean(0))*tm.face_normals).sum(1)@tm.area_faces<0:tm.invert()   # とじていない形でも、面がだいたい外を向くように（内がわ向きなら、ひっくりかえす）
    tm.export(os.path.join(A.out,nm+'.glb'))
    # 正面からの形（たしかめ用）：手前・上から、面の向きで明るさ（面の表うらは見ない）。おくの面から描く
    t=v[mp[F[fi]]];nrm=np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0]);nrm/=np.linalg.norm(nrm,axis=1,keepdims=True)+1e-9
    L=np.abs(nrm@np.array([-0.4,-0.45,0.8]))*0.7+0.3;sy=v[:,2]*0.8+v[:,1]*0.6;S_=150/max(b1[0]-b0[0],sy.max()-sy.min())
    im=Image.new('RGB',(180,180),(150,190,120));d=ImageDraw.Draw(im);pj=lambda p:(90+p[0]*S_,165-(p[2]*0.8+p[1]*0.6-sy.min())*S_)
    for q in np.argsort(-(t[:,:,1].mean(1)*0.8-t[:,:,2].mean(1)*0.6)):
        c=int(235*L[q]);d.polygon([pj(p) for p in t[q]],fill=(c,c,c))
    d.text((4,4),'%d %s'%(k,nm),fill=(0,0,0));ims.append(im)
cols=min(5,len(ims));grid=Image.new('RGB',(180*cols,180*((len(ims)+cols-1)//cols)),(150,190,120))
for k,im in enumerate(ims):grid.paste(im,((k%cols)*180,(k//cols)*180))
grid.save(os.path.join(A.out,'grid.png'));print(len(objs),'こ',os.path.join(A.out,'grid.png'))
