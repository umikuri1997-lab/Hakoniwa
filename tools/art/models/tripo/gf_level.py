# トリポの限定の家具で、天板がかたむいている物（テーブル・ジオードの湯ぶね）を、部品（つながった形）ごと、ゆがめずにまるごと回して水平にする（モデルそのものを直す。持ち主がたのんだのは天板だけ）。
# 使い方：python3 tools/art/models/tripo/gf_level.py <名前> top <さかい>   … いちばん下がさかい（高さのわりあい 0〜1）より上の部品（天板と、その上の物）を、天板が水平になるまで回す。軸は、脚のまん中の上
#         … 5つめに角度（度）を書くと、面をさがさずに、手前がさがった分だけ、その角度でおこす（天板がまがっていて、面がうまく見つからない物）
#   部品の中の点は、どれも同じだけ回すので、形はかわらない（さかいの所をすこしずつ回すと、形がゆがむ）。UV・テクスチャはそのまま。さいごに、いちばん下を床にもどす。
import sys,os,numpy as np,trimesh
D=os.path.join(os.path.dirname(__file__),'gf')
n,mode=sys.argv[1],sys.argv[2];f=os.path.join(D,n+'.glb')
m=trimesh.load(f,force='mesh');v=m.vertices.copy();F=m.faces;h=v[:,1].max();lo,hi=v.min(0),v.max(0)
lab=trimesh.graph.connected_component_labels(m.face_adjacency,node_count=len(F))
vl=np.full(len(v),-1);vl[F.ravel()]=np.repeat(lab,3)
comps=[np.unique(F[lab==k]) for k in range(lab.max()+1)]
def rot(ax,ang):
    ax=np.asarray(ax,float);ax/=np.linalg.norm(ax);K=np.array([[0,-ax[2],ax[1]],[ax[2],0,-ax[0]],[-ax[1],ax[0],0]]);return np.eye(3)+np.sin(ang)*K+(1-np.cos(ang))*K@K
if mode=='top':
    c=float(sys.argv[3]);sel=np.zeros(len(v),bool)
    for vi in comps:
        if v[vi,1].min()>=c*h:sel[vi]=True
    top=v[sel];rng=np.random.default_rng(1);best=(0,None);tol=0.004*h/0.14
    for _ in range(4000):   # 3点をえらんで面を作り、いちばん多くの点がのる面（天板）をえらぶ
        p=top[rng.choice(len(top),3,replace=False)];q=np.cross(p[1]-p[0],p[2]-p[0]);L=np.linalg.norm(q)
        if L<1e-9 or abs(q[1])/L<0.7:continue
        q/=L;cnt=(np.abs((top-p[0])@q)<tol).sum()
        if cnt>best[0]:best=(cnt,(q*np.sign(q[1]),p[0]))
    nrm,p0=best[1]
    if len(sys.argv)>4:a_=np.radians(float(sys.argv[4]));nrm=np.array([0,np.cos(a_),np.sin(a_)])   # 手前（+z）がさがった天板の向き
    leg=v[~sel];px,pz=leg[:,0].mean(),leg[:,2].mean();piv=np.array([px,leg[:,1].max(),pz])
    ax=np.cross(nrm,[0,1,0]);ang=np.arcsin(min(1,np.linalg.norm(ax)))
    print(n,'天板のかたむき %.1f 度'%np.degrees(ang))
    if ang>1e-4:v[sel]=piv+(v[sel]-piv)@rot(ax,ang).T
v[:,1]-=v[:,1].min();m.vertices=v;m.export(f)
