#!/usr/bin/env python3
"""水・闇のステージの木：トリポの木（oak.glb・maple.glb・oak_dead.glb、点に色のついた1つの形）を、自然物のチップ用の glb（nat_oak・nat_maple・nat_deadoak）にする（acacia_prep.py と同じやり方）。
  python3 tools/art/nature3d/tree_prep.py
つながった部品ごとに、緑かあざやかな色（メープルの赤い葉）なら葉・茶なら幹の、目じるしの色（nature_prep.MK）をつける。"""
import os,numpy as np,trimesh
from nature_prep import comps,MK,OUT
def one(src,dst):
    g=list(trimesh.load(os.path.join(OUT,src)).geometry.values())[0]
    V=np.asarray(g.vertices);F=np.asarray(g.faces);col=g.visual.vertex_colors[:,:3].astype(int);fc=col[F].mean(1);lab=comps(g)
    C=np.zeros((len(F),3));keep=np.zeros(len(F),bool)
    for c in np.unique(lab):
        fi=lab==c;vv=V[np.unique(F[fi])];ex=vv.max(0)-vv.min(0)
        if ex.max()<0.004:continue
        if ex[1]<0.004 and max(ex[0],ex[2])>0.05:continue
        m=fc[fi].mean(0);leaf=m[1]>m[0] or m.max()-m.min()>140;keep|=fi;C[fi]=MK['leaf' if leaf else 'bark']
    F2=F[keep];C2=C[keep];vi=np.unique(F2);mp=-np.ones(len(V),int);mp[vi]=np.arange(len(vi))
    VV=V[vi][mp[F2]].reshape(-1,3);FF=np.arange(len(VV)).reshape(-1,3);CC=np.repeat(C2,3,0)
    trimesh.Trimesh(VV,FF,vertex_colors=np.c_[CC,np.full(len(CC),255)].astype(np.uint8),process=False).export(os.path.join(OUT,dst))
    print(dst,len(FF),'面',int((C2==MK['leaf']).all(1).sum()),'葉の面')
if __name__=='__main__':
    for s,d in(('oak.glb','nat_oak.glb'),('maple.glb','nat_maple.glb'),('oak_dead.glb','nat_deadoak.glb')):one(s,d)
