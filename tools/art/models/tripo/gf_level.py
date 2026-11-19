# トリポの限定の家具で、天板・湯ぶねがかたむいている物を、水平に直す（モデルそのものを直す）。
# 使い方：python3 tools/art/models/tripo/gf_level.py <名前> <下のさかい> <上のさかい>   （さかいは高さのわりあい 0〜1）
#   上のさかいより上の点（天板と、その上の物）で面をあてはめ、かたむきをはかって、そのぶん、脚の柱の上のまん中を軸にもどす。
#   下と上のさかいのあいだの点は、少しずつまわす（つなぎ目がさけないように）。下の点（脚）はそのまま。
import sys,os,numpy as np,trimesh
D=os.path.join(os.path.dirname(__file__),'gf')
n,c0,c1=sys.argv[1],float(sys.argv[2]),float(sys.argv[3]);MAN=float(sys.argv[4]) if len(sys.argv)>4 else None   # 4つめ：手できめた角度（手前へさがった度。天板がまがっていて、面があてはまらない物）
f=os.path.join(D,n+'.glb');m=trimesh.load(f,force='mesh');v=m.vertices.copy();h=v[:,1].max();t=v[:,1]/h
top=v[t>c1];rng=np.random.default_rng(1);best=(0,None);tol=0.004*h/0.14
for _ in range(4000):   # 3点をえらんで面を作り、いちばん多くの点がのる面（天板）をえらぶ（上の物・下の面にまどわされない）
    p=top[rng.choice(len(top),3,replace=False)];q=np.cross(p[1]-p[0],p[2]-p[0]);L=np.linalg.norm(q)
    if L<1e-9 or abs(q[1])/L<0.7:continue
    q/=L;cnt=(np.abs((top-p[0])@q)<tol).sum()
    if cnt>best[0]:best=(cnt,(q,p[0]))
q,p0=best[1];inl=top[np.abs((top-p0)@q)<tol]
k=np.linalg.lstsq(np.c_[inl[:,0],inl[:,2],np.ones(len(inl))],inl[:,1],rcond=None)[0]
a,b,c=k;nrm=np.array([-a,1,-b]);nrm/=np.linalg.norm(nrm)
leg=v[t<c0];px,pz=leg[:,0].mean(),leg[:,2].mean();piv=np.array([px,a*px+b*pz+c,pz])
ax=np.cross(nrm,[0,1,0]);s=np.linalg.norm(ax);ang=np.arcsin(min(1,s))
if MAN is not None:ax=np.array([-1.,0,0]);s=1;ang=np.radians(MAN)
print(n,'かたむき %.1f 度'%np.degrees(ang))
if s>1e-6:
    ax/=s
    w=np.clip((t-c0)/max(1e-6,c1-c0),0,1)
    for i in np.nonzero(w>0)[0]:
        th=ang*w[i];p=v[i]-piv;K=np.array([[0,-ax[2],ax[1]],[ax[2],0,-ax[0]],[-ax[1],ax[0],0]])
        R=np.eye(3)+np.sin(th)*K+(1-np.cos(th))*K@K;v[i]=piv+R@p
    v[:,1]-=v[:,1].min()
    m.vertices=v;m.export(f)
