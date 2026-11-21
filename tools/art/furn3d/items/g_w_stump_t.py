# g_w_stump（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_w_stump.glb。25こを1つにならべたモデルを tripo_split.py --wall --keepuv で切りわけ、gf_level.py・gf_edit.py で直した物。色は、デザインの絵を焼いたテクスチャ gf/tex2.png（gf_bake.py）から写すときにドットごとに）を写す。
# 設計図：モデル1つ（持ち主がオブジェクトに分けた。オブジェクトごとにべつの部品 gfh.objparts）（高さ 0.72 マス、置くマス1×1のまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげと質感はマットキャップ（tools/art/matcap.py）。見おろし30度・平行に写す（持ち主がきめた）。
import numpy as np,gfh
from blueprint import Part as P
ID='g_w_stump';BOTTOM=58;GRAD=True;SIZE=0.72
VIEWS=[('g_w_stump',0),('g_w_stump>1',1),('g_w_stump>2',2),('g_w_stump>3',3)]

def PARTS():   # o0 葉・o1 切り株・o2 こけのざぶとん・o3 きのこ・芽のじく・花
    return gfh.objparts(ID,('tripo/gf/g_w_stump.glb',0.5,0.5,0,SIZE,0,0))
MATCAP='clay';SMANGLE=80;PARALLEL=True;ELEV=30   # マットキャップ・スムーズシェード80度・遠近なし・見おろし30度（持ち主がきめた）
