# 木（tree：植えた木・ntree：森の木。同じ絵）。モデルは使わずに、木の組み立てどおりに組む（持ち主の指示とお手本の絵：ビルダーズの木）。
# 枝も葉も、均等にならべない（持ち主の指示）。
# 設計図（単位はマス。地面 z=0。根もと (0.5, 0.6)）：
#   幹：高さ 1.02 まで。下ほど太い（半径 0.21 → 0.12）。根もとに5本の根のふくらみ（0.12、高さ0.25まで）。少し左へかたむく。
#   冠：葉のかたまり CL（まん中・半径 R・ふくらみ H）。大きさも高さも場所も、ばらばらの6つ。
#   枝：幹の先（またの高さは枝ごとにちがう）から、かたまりのまん中の下へ、まがりながら（半径 0.085 → 0.05）。
#   小枝：枝の先から、かたまりの中の2〜4か所へ（向き・長さはばらばら、半径 0.04 → 0.025）。
#   細枝：小枝の先から、葉の5〜9まいの組へ（葉の組のまん中の下 0.09 まで。半径 0.018 → 0.010）。
#   中身：かたまりごとに、葉の面の0.05下に、葉のかげの色の面（葉のすきまから枝が見えない）。
#   葉：長さ 0.16・はば 0.10（0.85〜1.15倍）。かたまりの中に、ばらばらに、かさならず、上から見てすきまなく（natcommon.crownleaves2）。外ほど下がる（重さでたれる）。表は太陽を向く。
import math
import numpy as np
import natcommon as N
ID='tree';GRAD=True;PARALLEL=True;BOTTOM=56
VIEWS=[('tree',0),('ntree',0)]
CX,CY=0.5,0.6
CL=[((0.46,0.52,1.66),0.40,0.20),((0.02,0.66,1.30),0.36,0.16),((0.95,0.70,1.40),0.42,0.19),((0.70,0.22,1.50),0.34,0.17),((0.18,0.25,1.44),0.30,0.15),((0.52,0.98,1.16),0.30,0.14)]
FORKS=[0.98,0.84,0.92,1.00,0.94,0.80]   # 枝ごとの、またの高さ
def PARTS():return []
def EXTRA(sc):
    rs=np.random.RandomState(7);T=[];top=np.array((CX-0.03,CY,1.02))
    N.limb(T,N.curve((CX,CY,0),tuple(top),(0.03,0,0),k=8),[0.21-0.09*t**0.7 for t in np.linspace(0,1,9)],n=18,flare=0.12,fh=0.25)
    groups=N.crownleaves2(CL)
    for (c,R,H),lv,fz in zip(CL,groups,FORKS):
        c=np.array(c);b=c+np.array((rs.uniform(-0.08,0.08),rs.uniform(-0.08,0.08),-0.14));a=np.array((CX-0.02,CY,fz))
        N.limb(T,N.curve(a,b,(rs.uniform(-0.06,0.06),rs.uniform(-0.04,0.04),0.06)),list(np.linspace(0.085,0.05,7)),n=10)
        P=np.array([l[0] for l in lv]);nt=rs.randint(2,5)
        tips=[b+np.array((R*rs.uniform(0.3,0.7)*math.cos(t),R*rs.uniform(0.3,0.7)*math.sin(t),rs.uniform(0.0,0.05))) for t in rs.uniform(0,6.28,nt)]
        for t in tips:N.limb(T,[b,(b+t)/2+np.array((0,0,rs.uniform(0,0.04))),t],[0.04,0.032,0.025],n=8)
        if not len(P):continue
        own=np.argmin(((P[:,None,:2]-np.array(tips)[None,:,:2])**2).sum(2),1)
        for ti,t in enumerate(tips):   # 細枝：その小枝の葉を、5〜9まいの組にわけ、組ごとに1本
            Q=P[own==ti]
            if not len(Q):continue
            k=max(1,len(Q)//rs.randint(5,10));C=Q[rs.choice(len(Q),k,replace=False)]
            for _ in range(8):
                lab=np.argmin(((Q[:,None]-C[None])**2).sum(2),1);C=np.array([Q[lab==j].mean(0) if (lab==j).any() else C[j] for j in range(k)])
            for e in C:N.limb(T,[t,e-np.array((0,0,0.09))],[0.018,0.010],n=6)
    N.barkmesh(sc,T)
    N.drawcrown(sc,groups,cl=CL)
def POST(im):return N.specks(im)
