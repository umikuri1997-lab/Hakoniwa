# 木（tree：植えた木・ntree：森の木。同じ絵）。持ち主の指示（自然な樹形の法則）：
#   樹冠は、主枝ごとの大きな葉群（4〜5こ）の組み合わせ。葉群は部分的にかさなるが1つにとけない。葉群のあいだにすきま・くぼみ。
#   葉は葉群の外がわの層だけ（内がわは空いて、太い枝が見える）。幹から主枝への分かれ目は、葉で全部はかくさない。
# 設計図（単位はマス。地面 z=0。根もと (0.5, 0.62)）：
#   幹：まっすぐ上へ 0.70（少しかたむき、ゆるくまがる）。太さはパイプモデル（幹は 0.16 まで）。根張り（太い根5本、側根つき）。
#   主枝 MAIN：幹の 0.50〜0.70 の高さから、(向き（上から見た角度）, 立ち上がり, 長さ, 葉群の半径 (よこ, おく, たて), 葉のこさ)。
#     主枝は、つけ根はななめ上・先は上へ。先のあたりが葉群のまん中。
#   葉群：主枝の先のまわりの、でこぼこのあるだ円体（natcommon.envelope）。目じるしは葉群の外がわの層（まん中から 0.55〜1.0）にまく。
#   枝：主枝の点から、目じるしへ 0.05 ずつのばす（natcommon.colonize と同じやり方）。
#   葉：葉群の外がわの層にある、細い枝の節と枝先に（長さ 0.16・はば 0.10 の0.8〜1.2倍、反り・あつみ、表は太陽へ）。
#     葉群ごとに、葉のこさがちがう（上はこく、下はうすい）。葉群ごとに線でかこみ、葉群ごとにかげ（まん中から見て、光の向きが明るい）をつける（1つにとけない）。
import math
import numpy as np
import natcommon as N
ID='tree';GRAD=True;PARALLEL=True;BOTTOM=56
VIEWS=[('tree',0),('ntree',0)]
CX,CY=0.5,0.62;SEED=2;TRUNK=0.70
MAIN=[   # 向き・立ち上がり・長さ・葉群の半径・こさ・つけ根の高さ
    (195,32,0.80,(0.36,0.30,0.26),1.0,0.50),   # 左
    (325,28,0.84,(0.40,0.32,0.26),0.9,0.60),   # 右おく
    (15,40,0.70,(0.30,0.27,0.24),0.8,0.55),    # 右
    (100,30,0.55,(0.26,0.22,0.20),0.6,0.66),   # 手前（小さく、うすい：幹が見える）
    (255,70,0.78,(0.38,0.33,0.28),1.1,0.70),   # 上（幹の先）
]
def PARTS():return []
def EXTRA(sc):
    rs=np.random.RandomState(SEED);up=np.array([0,0,1.0])
    # 幹と主枝の骨（点の列）
    P=[np.array((CX,CY,0.0))];par=[-1];D=0.05;z=0
    while z<TRUNK:z+=D;P.append(P[-1]+np.array([rs.normal(0,0.006)+0.003,rs.normal(0,0.005),D]));par.append(len(P)-2)
    lobes=[];A=[];owner=[]
    for k,(az,el,ln,(rx,ry,rz),dens,h0) in enumerate(MAIN):
        j=int(round(h0/D));j=min(j,len(P)-1);d=N.dirv(az,el);q=P[j].copy();last=j;n=int(ln/D)
        for i in range(n):
            t=i/n;d=N._bendto(d,up,0.05 if t>0.5 else 0.0);d=d+rs.normal(0,0.06,3);d/=np.linalg.norm(d)
            q=q+d*D;P.append(q.copy());par.append(last);last=len(P)-1
        c=q+np.array([0,0,rz*0.25]);env=N.envelope(c,rx,ry,rz,SEED*7+k);lobes.append((c,(rx,ry,rz),dens,env))
        m=int(260*rx*ry*rz/0.04)   # 目じるしの数は、葉群の大きさに合わせる
        cnt=0
        while cnt<m:   # 外がわの層だけ
            p=c+np.array([rx,ry,rz])*rs.uniform(-1.25,1.25,3)
            if not env(p):continue
            e=np.linalg.norm((p-c)/np.array([rx,ry,rz]))
            if e<0.55:continue
            A.append(p);owner.append(k);cnt+=1
    A=np.array(A);alive=np.ones(len(A),bool);di,dk=0.40,0.08
    for it in range(200):
        if not alive.any():break
        Pn=np.array(P);acc={}
        for ai in np.flatnonzero(alive):
            dd=np.linalg.norm(Pn-A[ai],axis=1)
            dd[:TRUNK and int(TRUNK/D)]=9   # 幹からは直接のばさない（主枝から）
            j=int(dd.argmin())
            if dd[j]<dk:alive[ai]=False;continue
            if dd[j]<di:acc.setdefault(j,[]).append((A[ai]-Pn[j])/dd[j])
        if not acc:break
        for j,vs in acc.items():
            v=np.sum(vs,0);v/=np.linalg.norm(v);v=v+up*0.10+rs.normal(0,0.10,3);v/=np.linalg.norm(v)
            P.append(P[j]+v*D);par.append(j)
    P=np.array(P);par=np.array(par)
    r,ch=N.radii(par,rtip=0.006,E=1.5,rmax=0.16)
    T=[]
    for c in N.chains(par,ch):
        if len(c)<2:continue
        pts=P[c];rr=list(r[c])
        if c[0]!=0 and len(ch[c[0]])>1:rr[1]=rr[1]*1.25   # えり
        mr=max(rr);N.limb(T,pts,rr,n=14 if mr>0.08 else 8 if mr>0.03 else 5,flare=0.07 if c[0]==0 else 0.0,fh=0.2,wob=0.07 if mr>0.06 else 0.0,seed=len(T)%17)
    N.roots(T,(CX,CY,0),0.19,rs,L=0.15)
    N.barkmesh(sc,T)
    # 葉：葉群の外がわの層の、細い枝の節・枝先
    L,W=0.16,0.10;put=[];groups=[[] for _ in lobes]
    for i in range(1,len(P)):
        if r[i]>0.022:continue
        es=[np.linalg.norm((P[i]-c)/np.array(rr_)) for c,rr_,_,_ in lobes];k=int(np.argmin(es));e=es[k]
        if e<0.5:continue
        c,_,dens,_=lobes[k];hz=(P[i][2]-c[2])/lobes[k][1][2]   # 葉群の中の高さ（上ほどこく）
        nl=int(round((2.2 if not ch[i] else 1.0)*dens*(0.75+0.35*hz)+rs.uniform(-0.5,0.5)))
        d=P[i]-P[par[i]];d/=np.linalg.norm(d)
        for _ in range(max(0,nl)):
            a=rs.uniform(0,6.28);u=np.cross(d,up);u=u/np.linalg.norm(u) if np.linalg.norm(u)>1e-6 else np.array([1.0,0,0]);v=np.cross(d,u)
            o=d*0.4+(u*math.cos(a)+v*math.sin(a))*0.9+up*0.1;o/=np.linalg.norm(o)
            nn=N.SUN*0.55+up*0.15+o*0.35+rs.normal(0,0.12,3);nn/=np.linalg.norm(nn)
            ld=o-nn*(o@nn);ld/=np.linalg.norm(ld);sd=np.cross(nn,ld);f=rs.uniform(0.8,1.2);b=P[i]+rs.normal(0,0.012,3)
            c_=b+ld*L*f*0.5
            if put and np.min(np.linalg.norm(np.array(put)-c_,axis=1))<0.55*L:continue
            put.append(c_);groups[k].append((b,ld,sd,nn,L*f,W*f,0.0))
    def tonef(k,b,nn):   # 葉群ごとのかげ：葉群のまん中から見た向きが光に向くほど明るい（左上が明るく、右下が暗い）。下の葉群は1段暗い
        c,rr_,_,_=lobes[k];o=(b-c)/np.array(rr_);o/=max(np.linalg.norm(o),1e-6);lt=float(o@N.LIGHTV)*0.7+float(nn@N.LIGHTV)*0.3
        return int(np.clip(round((1-lt)*1.9-0.3+(0.6 if c[2]<1.05 else 0.0)),0,len(N.LEAFB)-2))
    N.drawclumps(sc,groups,axis=(CX,CY),tonef=tonef)
def POST(im):return N.specks(im)
