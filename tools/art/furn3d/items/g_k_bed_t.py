# g_k_bed（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_k_bed.glb。25こを1つにならべたモデルを tripo_split.py --wall --keepuv で切りわけ、gf_level.py・gf_edit.py で直した物。色は、デザインの絵を焼いたテクスチャ gf/tex2.png（gf_bake.py）から写すときにドットごとに）を写す。
# 設計図：モデル1つ（持ち主がオブジェクトに分けた。オブジェクトごとにべつの部品 gfh.objparts）（高さ 0.6 マス、置くマス2×1のまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげと質感はマットキャップ（tools/art/matcap.py）。見おろし30度・平行に写す（持ち主がきめた）。
import numpy as np,gfh
from blueprint import Part as P
ID='g_k_bed';BOTTOM=58;GRAD=True;SZ=(2, 1);SIZE=0.512   # 頭のわくを低くした（gf_edit.py の HEADK）ので、ほかの所が前と同じ大きさになる高さ
VIEWS=[('g_k_bed',0),('g_k_bed>1',1),('g_k_bed>2',2),('g_k_bed>3',3)]

QUILT=np.array([186,198,228.]);STITCH=np.array([168,182,218.]);SHEET=np.array([246,242,236.]);WHITE=np.array([246,240,236.])
def quilt(x,y,z,c):   # かけぶとん（持ち主：色のディテール）：トリポのテクスチャは、むらさき・灰色のまだら。青の1色に、デザインのひし形のぬい目を入れる。まくら（白い所）と、下の台は、もとの色
    if z<0.12:return c
    if min(c)>222:return c
    u,v=(x+y)/0.11,(x-y)/0.11;d=min(abs(u-round(u)),abs(v-round(v)))
    return STITCH if d<0.07 else QUILT
def sheet(x,y,z,c):   # かけぶとんの上の、おりかえしたシーツ（持ち主：青になっている）：白
    return SHEET
def PARTS():   # o0 おりかえしたシーツ・o1 わく・o2 かけぶとん・まくら
    return gfh.objparts(ID,('tripo/gf/g_k_bed.glb',1.0,0.5,0,SIZE,0,0),{'o0':sheet,'o2':quilt})   # o1 のわくは、テクスチャの色のまま（雲のうずのもよう）
MATCAP='clay';SMANGLE=80;PARALLEL=True;ELEV=30   # マットキャップ・スムーズシェード80度・遠近なし・見おろし30度（持ち主がきめた）
