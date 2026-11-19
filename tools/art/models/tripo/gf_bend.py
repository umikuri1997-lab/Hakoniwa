# トリポの限定の家具で、背もたれ・鏡などがうしろへたおれている物を、ちょうつがいのように前へおこす（モデルそのものを直す）。
# 使い方：python3 tools/art/models/tripo/gf_bend.py <名前> <軸の高さ> <軸のおく行き> <角度> [ぼかし]
#   高さ・おく行きは、わりあい（高さ 0 下〜1 上・おく行き 0 おく〜1 手前）。軸より上で、軸よりおくの点を、前へ <角度> 度おこす。
#   軸の高さから「ぼかし」（わりあい、はじめ 0.06）のあいだは、少しずつまわす（つなぎ目がさけないように）。角度が負なら、うしろへ。
#   軸の高さが 0 なら、ぜんたいをまわす（たおれた物をおこす）。そのあと、いちばん下を床にもどす。
import sys,os,numpy as np,trimesh
D=os.path.join(os.path.dirname(__file__),'gf')
n=sys.argv[1];yf,zf,ang=map(float,sys.argv[2:5]);bd=float(sys.argv[5]) if len(sys.argv)>5 else 0.06
f=os.path.join(D,n+'.glb');m=trimesh.load(f,force='mesh');v=m.vertices.copy()
lo,hi=v.min(0),v.max(0);ext=hi-lo;hy=lo[1]+yf*ext[1];hz=lo[2]+zf*ext[2]
ty=(v[:,1]-hy)/max(1e-9,bd*ext[1]);w=np.clip(ty,0,1) if yf>0 else np.ones(len(v))
if yf>0:w[v[:,2]>hz+0.02*ext[2]]=0
th=np.radians(ang)*w;dy=v[:,1]-hy;dz=v[:,2]-hz
v[:,1]=hy+dy*np.cos(th)-dz*np.sin(th);v[:,2]=hz+dz*np.cos(th)+dy*np.sin(th)
v[:,1]-=v[:,1].min();v[:,2]-=(v[:,2].min()+v[:,2].max())/2
m.vertices=v;m.export(f);print(n,'おこした',ang,'度')
