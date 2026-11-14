# ベリーの茂み（berry）：モデルは使わずに、組み立てどおりに組む。持ち主の指示：ビルダーズの「薬葉の茂み」を参考に（大きな葉が、根もとから外へ広がる）。
# 葉は木と同じ作り（natcommon.bigleaf・twigleaves：茎に、左右交互の葉と、先に大きな葉）。実はゲームでのせる（berryOn）。
# 設計図（単位はマス。地面 z=0。根もと (0.5, 0.55)）：
#   茎：根もとから、外の輪6本（向き 60きざみ、立ち上がり 30度、長さ 0.36）と、内の輪3本（向き 30+120きざみ、60度、長さ 0.30）。半径 0.022 → 0.012。茎は緑。
#   葉：茎1本に、左右交互に2まいと、先に1まい（長さ 0.30・はば 0.18。先の葉は1.1倍）。外の輪の葉は1段暗い。
import numpy as np
import natcommon as N
ID='berry';GRAD=True;BOTTOM=64
VIEWS=[('berry',0)]
CX,CY=0.5,0.55
STEMS=[(60*i,30,0.36,0.6) for i in range(6)]+[(30+120*i,60,0.30,0.0) for i in range(3)]   # 向き・立ち上がり・長さ・暗さ
def PARTS():return []
def EXTRA(sc):
    T=[];base=np.array((CX,CY,0.02));groups=[]
    for az,el,ln,dk in STEMS:
        d=N.dirv(az,el);e=base+d*ln
        N.limb(T,[base,base+d*ln*0.5+np.array((0,0,0.03)),e],[0.022,0.017,0.012],n=8)
        groups.append((N.twigleaves(base+d*0.04,d,ln,2,0.30,0.18,spread=50),dk))
    sc.part()   # 茎は緑（草の茎）
    for t in T:sc.tri(t[0],t[1],t[2],(120,170,90))
    for gi,(lv,dk) in enumerate(groups):N.drawleaves(sc,lv,gi,dk=dk,zlo=0.0,zhi=0.35)
def POST(im):return N.specks(im)
