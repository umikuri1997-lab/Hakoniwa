# 木の葉どうしが交差していないかを、葉の三角形どうしで、たしかめる（fcl の当たり判定）。使い方：python3 tools/art/realrender/leafcross.py
import sys;sys.path[:0]=['tools/art/furn3d','tools/art/furn3d/items','tools/art']
import numpy as np,trimesh,furn3d as F,oblique3d as O,tree
O.GRAD=True;sc,_=F.scene(tree,0)
PL=tree.EXTRA.placed;Q=tree.kitleaf()
ms=[]
for base,M,bend in PL:
    Qb=Q.copy();Qb[...,2]+=tree.bendz(Qb[...,0],bend) if hasattr(tree,'bendz') else -bend*np.clip(Qb[...,0]-0.25,0,None)**2
    W=(Qb@M*tree.LEAFL+base).reshape(-1,3);n=len(W)//3;ms.append(trimesh.Trimesh(W,np.arange(n*3).reshape(n,3),process=False))
cm=trimesh.collision.CollisionManager()
for i,m in enumerate(ms):cm.add_object(str(i),m)
hit,names=cm.in_collision_internal(return_names=True)
print('葉',len(ms),'まい・交差する組',len(names) if hit else 0)
