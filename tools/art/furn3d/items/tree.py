# 木（tree：植えた木・ntree：森の木。同じ絵）。骨格から育てる（natcommon.growbranch。持ち主の指示：根もと → 幹 → 主枝 → 側枝 → 小枝 → 細枝 → 葉の塊）。
# 設計図（単位はマス。地面 z=0。根もと (0.5, 0.6)）：
#   幹：上へ長さ 0.95（少しかたむき、ゆるくまがる。断面は少しいびつ）。半径 0.18 から上へ細く。幹の 58〜88% の節から主枝3〜4本（ほかの主枝のいない向きへ）。幹の先は、主枝の1本としてのびる。
#   根：根もとから太い根5本（長さ 0.24 くらい、すぐ地面に入る）（幹の延長。向き・長さ・太さはまちまち）、それぞれ側根1本。
#   主枝・側枝・小枝・細枝：natcommon.LV の数・角度・長さで、芽（らせん137.5度）から。子は親より細い。つけ根に枝えり。
#     つけ根はななめ上・なかほどは重さで垂れ・先は上へ。外・上を向く芽ほどよくのび、内・下向きの芽はのびないことが多い。下の（古い）枝ほど長い。
#   枯れ枝の跡：幹・主枝の芽の 12% は、短く折れた枝。
#   葉：細枝の先の半分の節に、1まいずつ互生（137.5度）と、先に2まい（長さ 0.16・はば 0.10 の0.8〜1.2倍、反り・あつみ。かさならない。表は太陽へ）。
#   SEED：形をきめる数（かえると、ちがう木になる）。
import numpy as np
import natcommon as N
ID='tree';GRAD=True;PARALLEL=True;BOTTOM=56
VIEWS=[('tree',0),('ntree',0)]
CX,CY=0.5,0.6;SEED=1
def PARTS():return []
def EXTRA(sc):
    rs=np.random.RandomState(SEED);T=[];clumps=[]
    N.growbranch(T,clumps,(CX,CY,0),np.array([0.05,0,1.0])/np.linalg.norm([0.05,0,1.0]),0.95,0.18,0,rs,(CX,CY))
    N.barkmesh(sc,T)
    N.drawclumps(sc,N.tipleaves(clumps,seed=SEED),axis=(CX,CY))
def POST(im):return N.specks(im)
