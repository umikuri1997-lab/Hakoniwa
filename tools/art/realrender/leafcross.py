# 木の葉どうしが交差していないかを、葉の三角形どうしで、たしかめる（fcl の当たり判定）。使い方：python3 tools/art/realrender/leafcross.py
import sys;sys.path[:0]=['tools/art/furn3d','tools/art/furn3d/items','tools/art']
import numpy as np,trimesh,furn3d as F,oblique3d as O,tree
O.GRAD=True;sc,_=F.scene(tree,0)
PL=tree.EXTRA.placed;Q=tree.kitleaf()
ms=[]
for base,M,bend in PL:
    Qb=Q.copy();Qb[...,2]+=tree.bendz(Qb[...,0],bend) if hasattr(tree,'bendz') else -bend*np.clip(Qb[...,0]-0.25,0,None)**2
    W=(Qb@M*tree.LEAFL+base).reshape(-1,3);n=len(W)//3;ms.append(trimesh.Trimesh(W,np.arange(n*3).reshape(n,3),process=False))
cm=trimesh.collision.CollisionManager();cb=trimesh.collision.CollisionManager()
import furn3d

for i,m in enumerate(ms):cm.add_object(str(i),m)
hit,names=cm.in_collision_internal(return_names=True)
print('葉',len(ms),'まい・交差する組',len(names) if hit else 0)
# 枝が葉にささっていないか：枝・幹の三角形と、葉（葉柄のはしの近くはのぞく）
bark=[t for t in sc.t if t[4] not in getattr(tree.EXTRA,'leafpids',set())]
V=[];leafV=[]
for a,b,c,col,pid in sc.t:
    (leafV if col[1]>col[0]+8 and tuple(np.round(col).astype(int))!=tuple(tree.TWIG) else V).append((a,b,c))   # 細枝（緑）は枝に入れる
V=np.array(V).reshape(-1,3);n=len(V)//3;cb.add_object('bark',trimesh.Trimesh(V,np.arange(n*3).reshape(n,3),process=False))
k=0
for base,M,bend in PL:
    Qb=Q[Q[...,0].min(1)>0.12].copy();Qb[...,2]+=-bend*np.clip(Qb[...,0]-0.25,0,None)**2
    W=(Qb@M*tree.LEAFL+base).reshape(-1,3);m=len(W)//3
    if cb.in_collision_single(trimesh.Trimesh(W,np.arange(m*3).reshape(m,3),process=False)):k+=1
print('枝がささっている葉',k)
