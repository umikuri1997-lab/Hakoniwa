#!/usr/bin/env python3
"""持ち主のトリポのモデル（自然の物11こ、色なしの FBX）を、自然物のチップ用に、1つずつの glb にする。
  1) python3 tools/art/models/tripo_split.py <FBX> <フォルダ> --faces 20000   → obj00〜obj10.glb（色なし）
  2) python3 tools/art/nature3d/nature_prep.py <そのフォルダ>                → tools/art/models/tripo/nat_*.glb
（岩は、このモデルの岩でなく、お手本の形に組む（furn3d/items/nat_rock.py）。りんごの木は nat_tree.glb に実を足す（nat_fruit.py））
つながった部品ごとに、目じるしの色（幹・葉・かさ・じく など）をつける。色そのものは設計図（furn3d/items/nat_*.py）で recol する。
小さすぎるかけら（地面にちらばった点）・地面の平たい板は、すてる。"""
import sys,os,numpy as np,trimesh
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
HERE=os.path.dirname(os.path.abspath(__file__));OUT=os.path.join(HERE,'..','models','tripo')
MK={'bark':(160,90,50),'leaf':(60,180,60),'rock':(150,150,150),'cap':(220,40,40),'under':(240,220,200),'stem':(250,250,220),'dot':(255,255,255)}   # 目じるしの色
SRC={'nat_tree':'obj00','nat_deadtree':'obj01','nat_bush':'obj02','nat_cedar':'obj06','nat_cedar2':'obj07','nat_kinoko0':'obj05','nat_kinoko1':'obj08','nat_kinoko2':'obj10'}
def comps(m):
    F=m.faces;e=np.r_[F[:,[0,1]],F[:,[1,2]]];g=coo_matrix((np.ones(len(e)),(e[:,0],e[:,1])),shape=(len(m.vertices),)*2)
    return connected_components(g,directed=False)[1][F[:,0]]
def mushroom(V,F,fi,dots):
    """1本のきのこ：じくの太さより外にひろがる高さから上が、かさ。下を向いた面は、かさのうら。dots：かさの上に白い点"""
    vv=V[np.unique(F[fi])];lo=vv[:,1].min();h=vv[:,1].max()-lo;low=vv[vv[:,1]<lo+h*0.25];c=low[:,[0,2]].mean(0)
    r0=np.percentile(np.hypot(*(low[:,[0,2]]-c).T),90);d=np.hypot(*(vv[:,[0,2]]-c).T);ycap=vv[d>r0*1.7,1].min()
    t=V[F[fi]];ctr=t.mean(1);n=np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0]);n/=np.linalg.norm(n,axis=1,keepdims=True)+1e-12
    out=np.empty((len(t),3))
    for i,(p,nn) in enumerate(zip(ctr,n)):
        if p[1]<ycap:out[i]=MK['stem']
        elif nn[1]<-0.15:out[i]=MK['under']
        else:
            out[i]=MK['cap']
            if dots:   # 白い点：かさの上の面に、まばらな丸（方角と高さで場所をきめる）
                q=p-[c[0],0,c[1]];a=np.arctan2(q[2],q[0]);s=(p[1]-ycap)/(vv[:,1].max()-ycap)
                ka=np.round(a/(np.pi/4));kr=np.round(s*3)
                if 0<kr<3 and np.hypot((a-ka*np.pi/4)*np.hypot(q[0],q[2]),(s-kr/3)*h*0.9)<h*0.07 and (ka+kr)%2==0:out[i]=MK['dot']
    return out
def run(src):
    os.makedirs(OUT,exist_ok=True)
    for nm,ob in SRC.items():
        m=trimesh.load(os.path.join(src,ob+'.glb'),force='mesh');V=np.asarray(m.vertices);F=np.asarray(m.faces);lab=comps(m);C=np.zeros((len(F),3));keep=np.zeros(len(F),bool)
        ids=[c for c in np.unique(lab)]
        info={c:(V[np.unique(F[lab==c])].min(0),V[np.unique(F[lab==c])].max(0),(lab==c).sum()) for c in ids}
        big=max(ids,key=lambda c:info[c][2])
        for c in ids:
            a,b,nf=info[c];ex=b-a;fi=lab==c
            if ex.max()<0.012:continue   # 地面にちらばった小さなかけら
            if ex[1]<0.012 and max(ex[0],ex[2])>0.05:continue   # 地面の平たい板
            keep|=fi
            if nm in('nat_tree',):C[fi]=MK['bark' if c==big else 'leaf']
            elif nm=='nat_bush':C[fi]=MK['leaf']
            elif nm=='nat_deadtree':C[fi]=MK['bark']
            elif nm=='nat_rock':C[fi]=MK['rock']
            elif nm.startswith('nat_cedar'):C[fi]=MK['bark' if a[1]<0.004 else 'leaf']   # 幹は、地面からのびる部品だけ（葉の中の小さな枝は葉の色）
            else:C[fi]=mushroom(V,F,fi,False)   # ベニテングタケの白い点は、設計図の decal でつける
        F2=F[keep];C2=C[keep];vi=np.unique(F2);mp=-np.ones(len(V),int);mp[vi]=np.arange(len(vi))
        # 面ごとの色を、点をわけて持たせる（点の色＝面の色）
        Fn=mp[F2];VV=V[vi][Fn].reshape(-1,3);FF=np.arange(len(VV)).reshape(-1,3);CC=np.repeat(C2,3,0)
        tm=trimesh.Trimesh(VV,FF,vertex_colors=np.c_[CC,np.full(len(CC),255)].astype(np.uint8),process=False)
        tm.export(os.path.join(OUT,nm+'.glb'));print(nm,ob,len(FF),'面')
if __name__=='__main__':run(sys.argv[1])
