import numpy as np, trimesh
from scipy.spatial import cKDTree
def weld(m, tol=1e-4):
    V=m.vertices;F=m.faces;t=cKDTree(V);p=np.arange(len(V))
    def f(i):
        while p[i]!=i:p[i]=p[p[i]];i=p[i]
        return i
    for a,b in t.query_pairs(tol):
        ra,rb=f(a),f(b)
        if ra!=rb:p[ra]=rb
    r=np.array([f(i) for i in range(len(V))]);u,inv=np.unique(r,return_inverse=True)
    return trimesh.Trimesh(vertices=V[u],faces=inv[F],process=False)
