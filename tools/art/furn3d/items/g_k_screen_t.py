# g_k_screen（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_k_screen.glb。25こを1つにならべたモデルを tripo_split.py --wall --keepuv で切りわけ、gf_level.py・gf_edit.py で直した物。色は、デザインの絵を焼いたテクスチャ gf/tex2.png（gf_bake.py）から写すときにドットごとに）を写す。
# 設計図：モデル1つ（高さ 1.3 マス、置くマス2×1のまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげと質感はマットキャップ（tools/art/matcap.py）。見おろし30度・平行に写す（持ち主がきめた）。
import numpy as np,gfh
from blueprint import Part as P
ID='g_k_screen';BOTTOM=58;GRAD=True;SZ=(2, 1);SIZE=1.3
VIEWS=[('g_k_screen',0),('g_k_screen>1',1),('g_k_screen>2',2),('g_k_screen>3',3)]

def PARTS():
    p=P('g_k_screen','model',('tripo/gf/g_k_screen.glb',1.0,0.5,0,SIZE,0,0),(255,255,255),on=('ground',),note='地面におく');p.tex=False;p.uvtex='tripo/gf/tex2.png'   # 色はトリポのテクスチャの絵（木目をはらない）
    return [p]
MATCAP='clay';SMANGLE=80;PARALLEL=True;ELEV=30   # マットキャップ・スムーズシェード80度・遠近なし・見おろし30度（持ち主がきめた）
