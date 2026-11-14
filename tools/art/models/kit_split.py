# 持ち主からもらった植物のセット（tripo_src/plant_kit.glb：色なし。36こが、正面から見た1まいの絵のように、たて・よこにならんでいる）を、1こずつの glb に切りわける。
# 使い方：python3 tools/art/models/kit_split.py
#   1) つながった部品ごとにわけ、正面（x・y）から見てかさなる部品を1つの物にまとめる。
#   2) 上の行から、左から右へならべ、NAMES の名前で tripo/kit_<名前>.glb に書く（足もとを原点、正面は +Z、y が上。面は3000まで、へらす）。
#   色はない（設計図の p.recol でつける）。一覧は tripo_catalog.py。
import os,sys,numpy as np,trimesh,scipy.sparse as sp
from scipy.sparse.csgraph import connected_components as cc
HERE=os.path.dirname(os.path.abspath(__file__));SRC=os.path.join(HERE,'tripo_src','plant_kit.glb');OUT=os.path.join(HERE,'tripo')
NAMES=['leaf','leaf_pair','leaf_oak','leaf_trio','stem','leaf_fan','leaf_spray','tree_round2','tree_conifer',
       'vine_hang','vine_trail','leaf_long','leaf_wide','grass_blades','clover_bush','tulip_buds','leaf_round2','leaf_round2b',
       'rose_bush','daisy_clump','fern_bush','bud_stem','grass_tall','leaf_curl','leaf_round','flower_bush',
       'rose_pair','poppy','tulip','lily2','flower_bush2','anemone','cosmos','peony','daisy','pansy']
def main():
    m=trimesh.load(SRC,force='mesh');v=np.asarray(m.vertices);F=np.asarray(m.faces)
    _,inv=np.unique(np.round(v,6),axis=0,return_inverse=True);inv=inv.reshape(-1);F2=inv[F];n=inv.max()+1
    e=np.concatenate([F2[:,[0,1]],F2[:,[1,2]]]);_,lab=cc(sp.coo_matrix((np.ones(len(e)),(e[:,0],e[:,1])),shape=(n,n)),directed=False);fl=lab[F2[:,0]];ids=np.unique(fl)
    bb=[];par=list(range(len(ids)))
    for i in ids:P=v[F[fl==i]].reshape(-1,3);bb.append((P[:,0].min(),P[:,1].min(),P[:,0].max(),P[:,1].max()))
    def f(a):
        while par[a]!=a:par[a]=par[par[a]];a=par[a]
        return a
    for a in range(len(bb)):
        for b in range(a+1,len(bb)):
            A,B=bb[a],bb[b]
            if A[0]<B[2]-0.002 and B[0]<A[2]-0.002 and A[1]<B[3]-0.002 and B[1]<A[3]-0.002:par[f(a)]=f(b)
    G={}
    for a in range(len(bb)):G.setdefault(f(a),[]).append(a)
    objs=[]
    for g in G.values():
        sel=np.isin(fl,ids[g]);P=v[F[sel]].reshape(-1,3);objs.append((P[:,1].min(),P[:,0].min(),sel))
    objs.sort(key=lambda o:(-round(o[0]*8),o[1]))
    assert len(objs)==len(NAMES),len(objs)
    for nm,(_,_,sel) in zip(NAMES,objs):
        sub=trimesh.Trimesh(v,F[sel],process=True);sub.remove_unreferenced_vertices()
        lo,hi=sub.bounds;sub.apply_translation([-(lo[0]+hi[0])/2,-lo[1],-(lo[2]+hi[2])/2])
        if len(sub.faces)>3000:sub=sub.simplify_quadric_decimation(face_count=3000)
        sub.export(os.path.join(OUT,'kit_'+nm+'.glb'));print(nm,len(sub.faces))
if __name__=='__main__':main()
