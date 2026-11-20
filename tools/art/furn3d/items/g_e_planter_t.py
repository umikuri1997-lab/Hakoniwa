# g_e_planter（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_e_planter.glb。25こを1つにならべたモデルを tripo_split.py --wall --keepuv で切りわけ、gf_level.py・gf_edit.py で直した物。色は、デザインの絵を焼いたテクスチャ gf/tex2.png（gf_bake.py）から写すときにドットごとに）を写す。
# 設計図：モデル1つ（高さ 0.6 マス、置くマス1×1のまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげと質感はマットキャップ（tools/art/matcap.py）。見おろし30度・平行に写す（持ち主がきめた）。
import numpy as np,gfh
from blueprint import Part as P
ID='g_e_planter';BOTTOM=58;GRAD=True;SIZE=0.6
VIEWS=[('g_e_planter',0),('g_e_planter>1',1),('g_e_planter>2',2),('g_e_planter>3',3)]
W,K,E=gfh.frame('g_e_planter',0.5,0.5,SIZE)
def fix(x,y,z,c):   # 花のあざやかさを上げる（持ち主）：鉢のふちより上の、クリーム色でない所
    if z>E[1]*0.55 and not (abs(c[0]-222)+abs(c[1]-190)+abs(c[2]-158)<70):return gfh.sat(c,1.25,1.0)
    return c
def PARTS():
    p=P('g_e_planter','model',('tripo/gf/g_e_planter.glb',0.5,0.5,0,SIZE,0,0),(255,255,255),on=('ground',),note='地面におく');p.tex=False;p.uvtex='tripo/gf/tex2.png';p.uvfix=fix   # 色はトリポのテクスチャの絵（木目をはらない）
    return [p]
MATCAP='clay';SMANGLE=80;PARALLEL=True;ELEV=30   # マットキャップ・スムーズシェード80度・遠近なし・見おろし30度（持ち主がきめた）
