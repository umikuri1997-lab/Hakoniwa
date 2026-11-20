# 洞窟の岩はだ（cave:face・cave:cliff のもと）：1まいのつながった岩のかべ。石垣のように石をならべない。
# 設計図（単位はマス）：たてのかべ（x−2〜10・高さ0〜WH）を、大きなます目（1マスに6れつ・たて4だん。ローポリの岩）でつくり、手前（＋y）へ、でこぼこにおし出す。
#   でこぼこ：4マスでくりかえす波の重ね（どこで4マス切ってもつながる）。
#   上のふち：高さが、4マスでくりかえす波でかわる（ぎざぎざ）。
#   色：面の向き（左上の光）で5つの色（洞窟の岩の色。つめたい灰色がかった茶）。
import math
import numpy as np
ID='cave_wall';GRAD=False;SHADE=[(9,-2.5),(18,-5)];BOTTOM=60;PARALLEL=True;SZ=(8,1)
VIEWS=[('cave_wall',0)]
PAL=[(150,138,128),(128,117,109),(108,99,93),(90,82,78),(72,66,63)]
WH=0.92;P=4.0;Y0=0.40
def per(x,ks,seed):
    rs=np.random.RandomState(seed);v=0.0
    for k,a in ks:v+=a*math.sin(2*math.pi*k*x/P+rs.uniform(0,6.28))
    return v
def topz(x):return WH-0.10+per(x,[(1,.04),(3,.035),(7,.025),(13,.015)],5)
def disp(x,z):
    d=per(x,[(1,.06),(2,.05),(3,.04),(5,.03)],1)+per(x+z*1.3,[(2,.05),(4,.03)],2)
    d+=0.05*max(0,1-z/0.3)   # 足もとは、少し前へ出る
    return d
def PARTS():return[]
def EXTRA(sc):
    import oblique3d as O
    nx,nz=12*6,4;X=np.linspace(-2,10,nx+1)   # 大きな面：1マスに6れつ・たて4だん（ローポリの岩）
    rz=lambda i,j:(np.random.RandomState(1000+(i%(nx//3))*7+j).uniform(-.04,.04) if 0<j<nz else 0)   # だんの高さを少しずつずらす（4マスでくりかえす）
    rx=lambda i,j:(np.random.RandomState(2000+(i%(nx//3))*7+j).uniform(-.05,.05) if 0<j<nz else 0)
    def V(i,j):
        x=X[i]+rx(i,j);t=topz(X[i]);z=t*j/nz+rz(i,j)*(1 if j<nz else 0);return (x,Y0+disp(x,z),z)
    tri=[]
    for i in range(nx):
        for j in range(nz):
            a,b,c,d=V(i,j),V(i+1,j),V(i+1,j+1),V(i,j+1)
            tri+=[(a,b,c),(a,c,d)] if (i+j)%2 else [(a,b,d),(b,c,d)]
    T=np.array(tri);n=np.cross(T[:,1]-T[:,0],T[:,2]-T[:,0]);n/=np.linalg.norm(n,axis=1,keepdims=True)+1e-12
    n*=np.where(n[:,1:2]<0,-1,1)*np.where(n[:,2:3]>0.9,1,1);d=n@O.LIGHT
    cut=np.quantile(d,np.linspace(1,0,len(PAL)+1)[1:-1])
    sc.texture(None);sc.material('flat');sc.smooth(False);sc.group('wall');sc.part()
    for tt,dd in zip(T,d):sc.tri(tuple(tt[0]),tuple(tt[1]),tuple(tt[2]),PAL[int((dd<cut).sum())])
    sc.group(None);sc.material(None)
