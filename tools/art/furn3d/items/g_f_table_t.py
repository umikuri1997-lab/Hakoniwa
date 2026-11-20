# g_f_table（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_f_table.glb。25こを1つにならべたモデルを tripo_split.py --wall --keepuv で切りわけ、gf_level.py・gf_edit.py で直した物。色はテクスチャの絵 gf/tex.png から写すときにドットごとに）を写す。
# 設計図：モデル1つ（高さ 0.73 マス、置くマス1×1のまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげと質感はマットキャップ（tools/art/matcap.py）。見おろし35度・平行に写す（持ち主がきめた）。
import numpy as np,gfh
from blueprint import Part as P
ID='g_f_table';BOTTOM=58;GRAD=True;SIZE=0.73
VIEWS=[('g_f_table',0),('g_f_table>1',1),('g_f_table>2',2),('g_f_table>3',3)]
W,K,E=gfh.frame('g_f_table',0.5,0.5,SIZE)
def fix(x,y,z,c):   # 天板のよごれ（白っぽい所・暗い点）を、天板の色に（持ち主：色おかしいとこ）
    if z>E[1]*0.9 and (c.sum()>660 or c.sum()<450):return np.array([238,192,140.])
    return c
def PARTS():
    p=P('g_f_table','model',('tripo/gf/g_f_table.glb',0.5,0.5,0,SIZE,0,0),(255,255,255),on=('ground',),note='地面におく');p.tex=False;p.uvtex='tripo/gf/tex.png';p.uvfix=fix   # 色はトリポのテクスチャの絵（木目をはらない）
    return [p]
MATCAP='clay';SMANGLE=80;PARALLEL=True;ELEV=35   # マットキャップ・スムーズシェード80度・遠近なし・見おろし35度（持ち主がきめた）
