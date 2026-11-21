# g_f_sofa（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_f_sofa.glb。25こを1つにならべたモデルを tripo_split.py --wall --keepuv で切りわけ、gf_level.py・gf_edit.py で直した物。色は、デザインの絵を焼いたテクスチャ gf/tex2.png（gf_bake.py）から写すときにドットごとに）を写す。
# 設計図：モデル1つ（持ち主がオブジェクトに分けた。オブジェクトごとにべつの部品 gfh.objparts）（高さ 0.75 マス、置くマス2×1のまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげと質感はマットキャップ（tools/art/matcap.py）。見おろし30度・平行に写す（持ち主がきめた）。
import numpy as np,gfh
from blueprint import Part as P
ID='g_f_sofa';BOTTOM=58;GRAD=True;SZ=(2, 1);SIZE=0.75
VIEWS=[('g_f_sofa',0),('g_f_sofa>1',1),('g_f_sofa>2',2),('g_f_sofa>3',3)]

def PARTS():   # o0 台・o1 わく・o2 ほのおのかざり・o3 クッション・o4 座面と背もたれ
    return gfh.objparts(ID,('tripo/gf/g_f_sofa.glb',1.0,0.5,0,SIZE,0,0))
MATCAP='clay';SMANGLE=80;PARALLEL=True;ELEV=30   # マットキャップ・スムーズシェード80度・遠近なし・見おろし30度（持ち主がきめた）
