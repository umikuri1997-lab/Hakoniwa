# g_e_lantern（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_e_lantern.glb。25こを1つにならべたモデルを tripo_split.py --wall --keepuv で切りわけ、gf_level.py・gf_edit.py で直した物。色はテクスチャの絵 gf/tex.png から写すときにドットごとに）を写す。
# 設計図：モデル1つ（高さ 1.0 マス、置くマス1×1のまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげと質感はマットキャップ（tools/art/matcap.py）。見おろし35度・平行に写す（持ち主がきめた）。
import numpy as np,gfh
from blueprint import Part as P
ID='g_e_lantern';BOTTOM=58;GRAD=True;SIZE=1.0
VIEWS=[('g_e_lantern',0),('g_e_lantern>1',1),('g_e_lantern>2',2),('g_e_lantern>3',3)]
GLOW=lambda c:(c[...,0]>225)&(c[...,2]<150)&(c[...,0]-c[...,2]>90)   # あかりの黄色・だいだいの所は光る（持ち主：光ってるように）
def PARTS():
    p=P('g_e_lantern','model',('tripo/gf/g_e_lantern.glb',0.5,0.5,0,SIZE,0,0),(255,255,255),on=('ground',),note='地面におく');p.tex=False;p.uvtex='tripo/gf/tex.png'   # 色はトリポのテクスチャの絵（木目をはらない）
    return [p]
MATCAP='clay';SMANGLE=80;PARALLEL=True;ELEV=35   # マットキャップ・スムーズシェード80度・遠近なし・見おろし35度（持ち主がきめた）
