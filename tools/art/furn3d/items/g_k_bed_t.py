# g_k_bed（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_k_bed.glb。25こを1つにならべたモデルを tripo_split.py --wall --keepuv で切りわけ、gf_level.py・gf_edit.py で直した物。色は、デザインの絵を焼いたテクスチャ gf/tex2.png（gf_bake.py）から写すときにドットごとに）を写す。
# 設計図：モデル1つ（高さ 0.6 マス、置くマス2×1のまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげと質感はマットキャップ（tools/art/matcap.py）。見おろし30度・平行に写す（持ち主がきめた）。
import numpy as np,gfh
from blueprint import Part as P
ID='g_k_bed';BOTTOM=58;GRAD=True;SZ=(2, 1);SIZE=0.6
VIEWS=[('g_k_bed',0),('g_k_bed>1',1),('g_k_bed>2',2),('g_k_bed>3',3)]

QUILT=np.array([186,198,228.]);WHITE=np.array([246,240,236.])
def fix(x,y,z,c):   # 色むら（持ち主：ベッドの色がむらむら）：かけぶとんに、トリポのテクスチャのむらさき・灰色のまだらがある。かけぶとん（まくらより手前・わくの内がわ）は青の1色にする
    # ベッドのわくだけ白（持ち主）。モデルの形から：頭のわくのうしろの板は y 0.085 より前・足もとのわく（雲の形の板）は y 0.875 より手前・
    # かけぶとんの下の台と足は高さ0.12より下。かけぶとんは y 0.30〜0.875・高さ0.12より上（横にたれる所もふくむ）。まくら・頭のわくの前の雲は、もとの色
    if y<0.085 or y>0.875 or z<0.12:return WHITE
    if z<0.42 and abs(x-1.0)<0.58 and 0.30<y and not min(c)>222:return QUILT
    return c
def PARTS():
    p=P('g_k_bed','model',('tripo/gf/g_k_bed.glb',1.0,0.5,0,SIZE,0,0),(255,255,255),on=('ground',),note='地面におく');p.tex=False;p.uvtex='tripo/gf/tex2.png';p.uvfix=fix   # 色はトリポのテクスチャの絵（木目をはらない）
    return [p]
MATCAP='clay';SMANGLE=80;PARALLEL=True;ELEV=30   # マットキャップ・スムーズシェード80度・遠近なし・見おろし30度（持ち主がきめた）
