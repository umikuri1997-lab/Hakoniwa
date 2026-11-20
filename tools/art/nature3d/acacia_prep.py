#!/usr/bin/env python3
"""風のステージの木（アカシア）：トリポのアカシア（tools/art/models/tripo/acacia.glb、点に色のついた1つの形）を、自然物のチップ用の glb（nat_acacia.glb）にする。
  python3 tools/art/nature3d/acacia_prep.py
つながった部品ごとに、色が緑なら葉・茶なら幹の、目じるしの色（nature_prep.MK）をつける。色そのものは設計図（furn3d/items/nat_acacia.py）でつける。
小さすぎるかけら・地面の平たい板は、すてる（nature_prep と同じ）。"""
import os,numpy as np,trimesh
from nature_prep import comps,MK,OUT
def run():
    g=list(trimesh.load(os.path.join(OUT,'acacia.glb')).geometry.values())[0]
    V=np.asarray(g.vertices);F=np.asarray(g.faces);col=g.visual.vertex_colors[:,:3].astype(int);fc=col[F].mean(1);lab=comps(g)
    C=np.zeros((len(F),3));keep=np.zeros(len(F),bool)
    for c in np.unique(lab):
        fi=lab==c;vv=V[np.unique(F[fi])];ex=vv.max(0)-vv.min(0)
        if ex.max()<0.004:continue   # 小さなかけら
        if ex[1]<0.004 and max(ex[0],ex[2])>0.05:continue   # 地面の平たい板
        m=fc[fi].mean(0);keep|=fi;C[fi]=MK['leaf' if m[1]>m[0] else 'bark']
    F2=F[keep];C2=C[keep];vi=np.unique(F2);mp=-np.ones(len(V),int);mp[vi]=np.arange(len(vi))
    VV=V[vi][mp[F2]].reshape(-1,3);FF=np.arange(len(VV)).reshape(-1,3);CC=np.repeat(C2,3,0)
    trimesh.Trimesh(VV,FF,vertex_colors=np.c_[CC,np.full(len(CC),255)].astype(np.uint8),process=False).export(os.path.join(OUT,'nat_acacia.glb'))
    print('nat_acacia',len(FF),'面')
if __name__=='__main__':run()
