# 木（tree：植えた木・ntree：森の木。同じ絵）。持ち主の指示（自然な樹形の法則）：先に樹冠の大きな形をきめ、その中に枝を分岐させて葉群を置く。
# 設計図（単位はマス。地面 z=0。根もと (0.5, 0.62)）：
#   樹冠の形：まん中 (0.48, 0.56, 1.22)、横の半径 0.98・おくの半径 0.72・たての半径 0.52 のだ円体に、ゆっくりかわるでこぼこ（natcommon.envelope）。下は少しすぼまる。
#   幹：根もとから、まっすぐ上へ 0.62（少しかたむき、ゆるくまがる）。根張り（太い根5本・長さ 0.15 くらい、側根つき）。
#   枝：樹冠の中に目じるしを520まき、幹の先から 0.055 ずつ、近くの目じるしへのばす（natcommon.colonize）。上へ少し・むらあり。
#   太さ：先 0.006、親は子の太さの合わせ（パイプモデル r^1.5 の和、幹は 0.19 まで）。分かれた子のつけ根に、えり（1.25倍）。
#   葉群：枝先と、太さ 0.022 より細い枝の節に。葉のこさは場所でかわる（ゆっくりかわるむら）。外ほど多い。
#     葉は長さ 0.16・はば 0.10（0.8〜1.2倍）、反り・あつみ、表は太陽へ。まん中が 0.55×長さ より近い葉は置かない。
#   SEED：形をきめる数。
import math
import numpy as np
import natcommon as N
ID='tree';GRAD=True;PARALLEL=True;BOTTOM=56
VIEWS=[('tree',0),('ntree',0)]
CX,CY=0.5,0.62;SEED=1
C0=(0.48,0.56,1.22);RX,RY,RZ=0.98,0.72,0.52
def PARTS():return []
def EXTRA(sc):
    rs=np.random.RandomState(SEED);env=N.envelope(C0,RX,RY,RZ,SEED)
    P,par=N.colonize((CX,CY,0),0.62,env,((C0[0]-RX*1.3,C0[1]-RY*1.3,C0[2]-RZ*1.3),(C0[0]+RX*1.3,C0[1]+RY*1.3,C0[2]+RZ*1.3)),seed=SEED)
    r,ch=N.radii(par,rtip=0.006,E=1.5,rmax=0.19)
    T=[]
    for c in N.chains(par,ch):
        pts=P[c];rr=list(r[c])
        if len(c)>1 and par[c[1]]==c[0] and c[0]!=0 and len(ch[c[0]])>1:rr[1]=rr[1]*1.25   # えり
        if len(pts)<2:continue
        mr=max(rr);N.limb(T,pts,rr,n=14 if mr>0.08 else 8 if mr>0.03 else 5,flare=0.07 if c[0]==0 else 0.0,fh=0.2,wob=0.07 if mr>0.06 else 0.0,seed=len(T)%17)
    N.roots(T,(CX,CY,0),0.19,rs,L=0.15)
    N.barkmesh(sc,T)
    # 葉群：枝先と細い枝の節
    L,W=0.16,0.10;up=np.array([0,0,1.0]);put=[];leaves=[]
    for i in range(1,len(P)):
        if r[i]>0.022:continue
        dens=0.35+0.9*ST_noise(P[i])   # 葉のこさのむら
        out=P[i]-np.array(C0);ro=np.linalg.norm(out/np.array([RX,RY,RZ]))
        nl=int(round((2.4 if not ch[i] else 1.2)*dens*(0.6+0.8*min(1,ro))+rs.uniform(-0.4,0.6)))
        d=P[i]-P[par[i]];d/=np.linalg.norm(d)
        for k in range(nl):
            a=rs.uniform(0,6.28);u=np.cross(d,up);u=u/np.linalg.norm(u) if np.linalg.norm(u)>1e-6 else np.array([1.0,0,0]);v=np.cross(d,u)
            o=d*0.4+(u*math.cos(a)+v*math.sin(a))*0.9+up*0.1;o/=np.linalg.norm(o)
            nn=N.SUN*0.55+up*0.15+o*0.35+rs.normal(0,0.12,3);nn/=np.linalg.norm(nn)
            ld=o-nn*(o@nn);ld/=np.linalg.norm(ld);sd=np.cross(nn,ld);f=rs.uniform(0.8,1.2);b=P[i]+rs.normal(0,0.012,3)
            c_=b+ld*L*f*0.5
            if put and np.min(np.linalg.norm(np.array(put)-c_,axis=1))<0.55*L:continue
            put.append(c_);leaves.append((b,ld,sd,nn,L*f,W*f,0.0))
    # 葉を、場所で葉群にわける（大きさはまちまち）
    Q=np.array([l[0] for l in leaves]);k=max(8,len(leaves)//22);C=Q[rs.choice(len(Q),k,replace=False)]
    for _ in range(10):
        lab=np.argmin(((Q[:,None]-C[None])**2).sum(2),1);C=np.array([Q[lab==j].mean(0) if (lab==j).any() else C[j] for j in range(k)])
    groups=[[leaves[t] for t in np.flatnonzero(lab==j)] for j in range(k)]
    N.drawclumps(sc,groups,axis=(C0[0],C0[1]))
def ST_noise(p):return N.ST.vnoise(p[0]/0.35+11,p[1]/0.35,p[2]/0.35)
def POST(im):return N.specks(im)
