# 木（tree：植えた木・ntree：森の木。同じ絵）。モデルは使わずに、木の組み立てどおりに組む。
# 葉：ビルダーズ・あつ森のような、大きな葉（natcommon.bigleaf：まん中のすじで折れて左右で明るさがちがう。ぬった色のまま）。
#   葉は、ランダムな場所に置かず、小枝に、つけ根から先へ左右交互・先に1まい（natcommon.twigleaves）。
# 幹・枝：natcommon.limb。木の皮の柄は御神木と同じ。
# 設計図（単位はマス。地面 z=0。根もと (0.5, 0.6)。向きは上から見た角度（0が東・90が手前）と立ち上がり）：
#   幹：高さ FORK=0.62 まで。半径 0.15 → 0.10。根もとに5本の根のふくらみ。
#   大枝：またから5本（向き 90+72×i、立ち上がり 34度、長さ 0.58、半径 0.065 → 0.04）と、まん中の上へ1本（立ち上がり 80度、長さ 0.62）。
#   小枝：大枝の先から4本（大枝の向き ±20度・±55度。立ち上がりは大枝 +18度、長さ 0.34）と、大枝のなかほど（0.55）から外へ2本（±70度、+5度、長さ 0.28）。半径 0.032 → 0.014。
#   葉：小枝1本に、左右交互に4まいと先に1まい（長さ 0.32・はば 0.21、外へ55度ひらく）。
import numpy as np
import natcommon as N
ID='tree';GRAD=True;PARALLEL=True;BOTTOM=56
VIEWS=[('tree',0),('ntree',0)]
CX,CY=0.5,0.6;FORK=0.62
MAIN=[(90+72*i,34,0.58) for i in range(5)]+[(90,80,0.62)]
def PARTS():return []
def EXTRA(sc):
    T=[];top=np.array((CX+0.03,CY,FORK));clusters=[]
    N.limb(T,N.curve((CX,CY,0),tuple(top),(0.02,0,0)),list(np.linspace(0.15,0.10,7)),n=16,flare=0.07)
    for az,el,ln in MAIN:
        d=N.dirv(az,el);a=top-np.array((0,0,0.05));b=a+d*ln
        N.limb(T,N.curve(a,b,(0,0,0.05)),list(np.linspace(0.065,0.04,7)),n=10)
        lv=[]
        tw=[(b,az+da,min(85,el+18),0.34) for da in(-55,-20,20,55)]+([(a+d*ln*0.55,az+da,el+5,0.28) for da in(-70,70)] if el<60 else [])
        for o,a2,e2,l2 in tw:
            d2=N.dirv(a2,e2);e=o+d2*l2
            N.limb(T,[o,o+d2*l2*0.5,e],[0.032,0.022,0.014],n=8)
            lv+=N.twigleaves(o,d2,l2,4,0.32,0.21)
        clusters.append(lv)
    N.barkmesh(sc,T)
    allz=[l[0][2] for c in clusters for l in c];zlo,zhi=min(allz),max(allz)
    for gi,lv in enumerate(sorted(clusters,key=lambda c:np.mean([l[0][1] for l in c]))):N.drawleaves(sc,lv,gi,zlo=zlo,zhi=zhi)
def POST(im):return N.specks(im)
