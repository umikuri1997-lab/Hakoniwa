# トリポの限定の家具で、ささえがぬけて浮いている物に、たての柱（幹）をたす（モデルそのものを直す）。
# 使い方：python3 tools/art/models/tripo/gf_post.py <名前> <下の高さ> <上の高さ> <下の半径> <上の半径> <R,G,B>   （高さはわりあい 0〜1、半径はモデルの長さ）
#   まん中は、下の高さのあたりの点のまん中。まわりは少しでこぼこさせた木の幹の形（24角）。
import sys,os,numpy as np,trimesh
D=os.path.join(os.path.dirname(__file__),'gf')
n=sys.argv[1];y0,y1,r0,r1=map(float,sys.argv[2:6]);col=[int(x) for x in sys.argv[6].split(',')]
f=os.path.join(D,n+'.glb');m=trimesh.load(f,force='mesh');v=m.vertices;h=v[:,1].max()
near=v[np.abs(v[:,1]/h-y0)<0.08];cx,cz=near[:,0].mean(),near[:,2].mean()
K=24;R=10;P=[];F=[]
for i in range(R+1):
    u=i/R;y=(y0+(y1-y0)*u)*h;r=r0+(r1-r0)*u
    for k in range(K):
        a=2*np.pi*k/K;rr=r*(1+0.06*np.sin(5*a+u*2))
        P.append([cx+rr*np.cos(a),y,cz+rr*np.sin(a)])
for i in range(R):
    for k in range(K):
        a,b,c,d=i*K+k,i*K+(k+1)%K,(i+1)*K+k,(i+1)*K+(k+1)%K;F+=[[a,c,b],[b,c,d]]
t=trimesh.Trimesh(np.array(P),np.array(F),vertex_colors=np.tile(col+[255],(len(P),1)),process=False)
out=trimesh.util.concatenate([m,t]);out.export(f);print(n,'柱をたした',round(cx,3),round(cz,3))
