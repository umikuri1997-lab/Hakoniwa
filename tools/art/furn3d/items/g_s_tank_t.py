# g_s_tank（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_s_tank.glb。25こを1つにならべたモデルを tripo_split.py --wall --keepuv で切りわけ、gf_level.py・gf_edit.py で直した物。色は、デザインの絵を焼いたテクスチャ gf/tex2.png（gf_bake.py）から写すときにドットごとに）を写す。
# 設計図：モデル1つ（高さ 0.96 マス、置くマス1×1のまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげと質感はマットキャップ（tools/art/matcap.py）。見おろし30度・平行に写す（持ち主がきめた）。
import numpy as np,gfh
from blueprint import Part as P
ID='g_s_tank';BOTTOM=58;GRAD=True;SIZE=0.96
VIEWS=[('g_s_tank',0),('g_s_tank>1',1),('g_s_tank>2',2),('g_s_tank>3',3)]

SAND=np.array([190,214,212.])
def fix(x,y,z,c):   # 水そうの下（持ち主：下の色がおかしい）：トリポのモデルは、ガラスの手前に台の上の面が広く出ていて、そこがこい緑のまだら。台と同じ、デザインの絵のうすい水色の1色にする（砂の色にすると、台の上に大きな板があるように見えた）
    if 0.34<z<0.47 and 0.45<y<0.72 and abs(x-0.5)<0.42 and not min(c)>215:return SAND   # 底の上の面は高さ0.38〜0.46・ガラスの内がわ（白い貝はそのまま）
    return c
def PARTS():
    p=P('g_s_tank','model',('tripo/gf/g_s_tank.glb',0.5,0.5,0,SIZE,0,0),(255,255,255),on=('ground',),note='地面におく');p.tex=False;p.uvtex='tripo/gf/tex2.png';p.uvfix=fix   # 色はトリポのテクスチャの絵（木目をはらない）
    return [p]
MATCAP='clay';SMANGLE=80;PARALLEL=True;ELEV=30   # マットキャップ・スムーズシェード80度・遠近なし・見おろし30度（持ち主がきめた）
