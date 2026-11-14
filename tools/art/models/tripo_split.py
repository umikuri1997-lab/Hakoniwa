# トリポからもらった1つのモデル（FBX と色の絵）に、物がいくつも入っているとき、1つずつの glb に切りわける。
# 使い方：python3 tools/art/models/tripo_split.py <FBX> <色の絵(jpg)> <出力フォルダ>
#   1) assimp で FBX → glb（コマンド assimp）。2) つながった部品ごとにわけ、上から見て重なる部品を1つの物にまとめる。
#   3) 物ごとに、足もとを原点・正面（もとの −y）を glTF の +Z にして、点ごとの色（色の絵から）つきの glb にする（obj00.glb …）。
#   4) ならべた絵（grid.png）を出す。名前は、絵を見てから、ファイル名をかえてきめる。2つの物がくっついたときは、x のすきまで分けなおす。
import sys,os,subprocess,numpy as np,trimesh
from PIL import Image,ImageDraw
fbx,jpg,out=sys.argv[1:4];os.makedirs(out,exist_ok=True)
glb=os.path.join(out,'_all.glb');subprocess.run(['assimp','export',fbx,glb],check=True,capture_output=True)
g=list(trimesh.load(glb,force='scene').geometry.values())[0];V=np.asarray(g.vertices);F=np.asarray(g.faces);uv=np.asarray(g.visual.uv)
tex=np.asarray(Image.open(jpg).convert('RGB'));H,W=tex.shape[:2]
vcol=tex[np.clip((1-uv[:,1]%1)*H,0,H-1).astype(int),np.clip((uv[:,0]%1)*W,0,W-1).astype(int)]
comps=trimesh.graph.connected_components(g.face_adjacency,min_len=1,nodes=np.arange(len(F)))
bbs=np.array([np.r_[V[np.unique(F[c])].min(0),V[np.unique(F[c])].max(0)] for c in comps]);n=len(bbs);par=list(range(n))
def f(i):
    while par[i]!=i:par[i]=par[par[i]];i=par[i]
    return i
for i in range(n):
    a=bbs[i]
    for j in range(i+1,n):
        b=bbs[j]
        if a[0]-0.004<=b[3] and b[0]-0.004<=a[3] and a[1]-0.004<=b[4] and b[1]-0.004<=a[4]:par[f(i)]=f(j)
grp={}
for i in range(n):grp.setdefault(f(i),[]).append(i)
objs=[np.concatenate([comps[i] for i in ids]) for ids in grp.values()];objs=[o for o in objs if len(o)>30]
objs.sort(key=lambda fi:(-round(V[np.unique(F[fi])][:,1].min()*6),V[np.unique(F[fi])][:,0].min()))
for k,fi in enumerate(objs):
    vi=np.unique(F[fi]);mp=-np.ones(len(V),int);mp[vi]=np.arange(len(vi));v=V[vi].copy();b0,b1=v.min(0),v.max(0)
    v[:,0]-=(b0[0]+b1[0])/2;v[:,1]-=(b0[1]+b1[1])/2;v[:,2]-=b0[2];v=v[:,[0,2,1]];v[:,2]*=-1
    trimesh.Trimesh(v,mp[F[fi]],vertex_colors=np.c_[vcol[vi],np.full(len(vi),255)],process=False).export(os.path.join(out,'obj%02d.glb'%k))
print(len(objs),'こ')
