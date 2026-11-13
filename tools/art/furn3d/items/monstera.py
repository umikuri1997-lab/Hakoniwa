# かんようしょくぶつ（monstera）：いまの絵と同じデザイン・同じ大きさ。クリーム色のはちに、大きな葉の観葉植物。
# 設計図：トリポで作ったはち植え（models/tripo/plant.glb）の、はちと葉（7まい）を、そのままの場所で使う（高さ0.74・上から見て20度まわす）。
#   くき：トリポのくきはつかわず、土のまん中（はちの口のまん中）から、葉ごとに1本ずつ、葉の根もと（もとのくきのさき）まで、まっすぐ上へのびてからひらく管（太さ0.014）。
#   葉の色：葉ごとに、根もととまん中のすじほど、こい緑。ふちとさきほど、明るい緑（くろっぽくしない）。
#   はちの色：クリーム色（POT）。もとの絵の明るさのちがいは少しだけのこす。
from blueprint import Part as P
from common import *
import math,os
import numpy as np
ID='monstera';BOTTOM=64;GRAD=True
VIEWS=[('monstera',0)]
CX,CY=0.50,0.62;H=0.74;ROT=20
POT=(236,214,186);STEM=(132,178,88);DARK=(88,148,66);LIGHT=(172,218,114)
def PARTS():return []
def load():
    import trimesh,scipy.sparse as sp
    from scipy.sparse.csgraph import connected_components as cc
    m=trimesh.load(os.path.join(os.path.dirname(__file__),'..','..','models','tripo','plant.glb'),force='mesh')
    v=np.asarray(m.vertices,float);F=np.asarray(m.faces);C=np.asarray(m.visual.vertex_colors)[:,:3].astype(float)
    _,inv=np.unique(np.round(v,5),axis=0,return_inverse=True);inv=inv.reshape(-1);F2=inv[F];n=inv.max()+1
    e=np.concatenate([F2[:,[0,1]],F2[:,[1,2]]]);_,lab=cc(sp.coo_matrix((np.ones(len(e)),(e[:,0],e[:,1])),shape=(n,n)),directed=False);fl=lab[F2[:,0]]
    V=np.stack([v[:,0],v[:,2],v[:,1]],1)   # glTF（y上・z手前）→ x・y南・z上
    a=math.radians(ROT);R=np.array([[math.cos(a),-math.sin(a),0],[math.sin(a),math.cos(a),0],[0,0,1]]);V=V@R.T
    k=H/(V[:,2].max()-V[:,2].min());V=(V-[(V[:,0].max()+V[:,0].min())/2,(V[:,1].max()+V[:,1].min())/2,V[:,2].min()])*k+[CX,CY,0]
    parts=[]
    for i in np.unique(fl):
        s=np.where(fl==i)[0];c=C[F[s]].reshape(-1,3).mean(0);kind='pot' if c[0]>180 else 'stem' if len(s)<130 else 'leaf'
        parts.append((kind,F[s]))
    return V,C,parts
def EXTRA(sc):
    V,C,parts=load()
    pot=[f for k_,f in parts if k_=='pot'][0];pv=V[np.unique(pot)];rim=pv[:,2].max()   # はちの口の高さ
    soil=rim-0.03;top=pv[pv[:,2]>rim-0.02];rr=np.hypot(top[:,0]-CX,top[:,1]-CY).max()   # はちの口の半径
    stems=[f for k_,f in parts if k_=='stem'];leaves=[f for k_,f in parts if k_=='leaf']
    sc.smooth(True)
    sc.part()   # はち
    L_=C.mean(1)
    for f in pot:
        lt=L_[f].mean()/max(1.0,L_[np.unique(pot)].mean());cc=tuple(np.clip(np.array(POT)*(1+(lt-1)*0.3),0,255))
        sc.tri(V[f[0]],V[f[1]],V[f[2]],cc)
    sc.part();sc.texture(None)   # 土
    import blueprint as B
    B.build(sc,[P('土','cyl',(CX,CY,rr*0.88,soil-0.01,soil),(160,118,84),detail=32)])
    tops=[]
    for f in stems:   # もとのくきの、いちばん上の点（葉の根もと）
        p=V[np.unique(f)];tops.append(p[p[:,2].argmax()])
    for f in leaves:   # 葉：根もと（いちばん近いくきのさき）からの長さと、まん中のすじからのはなれで、ドットごとに色をきめる（もよう。面ごとの色だと、すじが出る）
        p=V[np.unique(f)];ctr=p.mean(0)
        b=min(tops,key=lambda t:np.linalg.norm(t-ctr)) if tops else p[p[:,2].argmin()]
        ax=p[np.linalg.norm(p-b,axis=1).argmax()]-b;Ln=np.linalg.norm(ax);ax=ax/max(Ln,1e-9)
        wv=[np.linalg.norm((q-b)-ax*np.dot(q-b,ax)) for q in p];Wd=max(wv) or 1
        def lcol(x,y,z,b=b,ax=ax,Ln=Ln,Wd=Wd):
            q=np.array([x,y,z]);u=max(0,min(1,np.dot(q-b,ax)/Ln));w=min(1,np.linalg.norm((q-b)-ax*np.dot(q-b,ax))/Wd)
            t=min(1,w*0.8+u*0.45);return tuple(DARK[k]+(LIGHT[k]-DARK[k])*t for k in range(3))
        sc.decal(lcol);sc.part()
        for tri in f:sc.tri(V[tri[0]],V[tri[1]],V[tri[2]],DARK)
        sc.decal(None)
    for t in tops:   # くき：土のまん中から、まっすぐ上へのびてから、葉の根もとへひらく
        mid=np.array([CX+(t[0]-CX)*0.25,CY+(t[1]-CY)*0.25,soil+(t[2]-soil)*0.55])
        sc.part();sc.tube([(CX+(t[0]-CX)*0.08,CY+(t[1]-CY)*0.08,soil),tuple(mid),tuple(t)],0.014,STEM,n=6)
    sc.smooth(False)
