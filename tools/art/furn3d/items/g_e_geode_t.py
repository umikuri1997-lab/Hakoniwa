# g_e_geode（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_e_geode.glb。25こを1つにならべたモデルを tripo_split.py --wall --keepuv で切りわけ、gf_level.py・gf_edit.py で直した物。色はテクスチャの絵 gf/tex.png から写すときにドットごとに）を写す。
# 設計図：モデル1つ（高さ 0.9 マス、置くマス2×2のまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげと質感はマットキャップ（tools/art/matcap.py）。見おろし35度・平行に写す（持ち主がきめた）。
import numpy as np,gfh
from blueprint import Part as P
ID='g_e_geode';BOTTOM=58;GRAD=True;SZ=(2, 2);SIZE=0.9
VIEWS=[('g_e_geode',0),('g_e_geode>1',1),('g_e_geode>2',2),('g_e_geode>3',3)]

def PARTS():
    p=P('g_e_geode','model',('tripo/gf/g_e_geode.glb',1.0,1.0,0,SIZE,0,0),(255,255,255),on=('ground',),note='地面におく');p.tex=False;p.uvtex='tripo/gf/tex.png'   # 色はトリポのテクスチャの絵（木目をはらない）
    return [p]
MATCAP='clay';SMANGLE=80;PARALLEL=True;ELEV=35   # マットキャップ・スムーズシェード80度・遠近なし・見おろし35度（持ち主がきめた）
