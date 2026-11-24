# 土のステージの雑草（weed2k、かれすすき）：トリポのすすき（susuki.glb）。わらの色の細い葉の株と、うすいクリーム色の穂3本。
# 穂：モデルの穂は、ふしのあるかたい形（とうもろこしのよう）だったので、ふわふわの物の決まりどおり、粒（PWATER）にする。
#   モデルの穂の面の上の点を、面の大きさでえらび、少し外へちらす。下ほどこい色、先ほど明るい。じくは、モデルの穂の下のはしから先までの細い管。
import math,random
from natcommon import nat,flat,SUN
ID='weed2k';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=25;BOTTOM=60
LIGHT=SUN
VIEWS=[('weed2k',0)]
F='susuki.glb';H=0.85
PLUME=[(214,196,160),(228,214,182),(240,230,204),(248,242,224)]   # 穂の粒（つけね→先）
def _plume():
    import numpy as np
    from blueprint import model_tris
    from natcommon import kind
    V,Fc,C=model_tris('tripo/'+F,0.5,0.5,0,H,0,0);sel=np.array([kind(c)=='under' for c in C]);T=V[Fc[sel]]
    a=np.linalg.norm(np.cross(T[:,1]-T[:,0],T[:,2]-T[:,0]),axis=1);rd=random.Random(3);out=[]
    z0,z1=T[:,:,2].min(),T[:,:,2].max()
    for i in np.random.RandomState(3).choice(len(T),340,p=a/a.sum()):
        u,v=rd.random(),rd.random()
        if u+v>1:u,v=1-u,1-v
        p=T[i,0]+u*(T[i,1]-T[i,0])+v*(T[i,2]-T[i,0]);c=T[i].mean(0);d=p-[c[0],c[1],p[2]]
        p=p+np.r_[d[:2]*0.6,0]+np.r_[rd.uniform(-0.008,0.008),rd.uniform(-0.008,0.008),0]   # 少し外へ、ふわっと
        t=(p[2]-z0)/max(1e-6,z1-z0);col=PLUME[min(3,int(t*4))]
        out.append((float(p[0]),float(p[1]),float(p[2]),rd.uniform(0.008,0.013),col,-float(p[2])))
    return out
_P=None
def PWATER():
    global _P
    if _P is None:_P=_plume()
    return _P
POUT=0.86
def _box():
    P=PWATER();return [(x,y,z) for x,y,z,*_ in P]
PBOX=None
def PARTS():
    global PBOX
    PBOX=_box()
    q=flat(nat('葉',F,H,(196,164,110),'leaf'))   # 葉は、地面より少しこい、わらの色（うすいと、地面にとけて消えた）
    return[q]
