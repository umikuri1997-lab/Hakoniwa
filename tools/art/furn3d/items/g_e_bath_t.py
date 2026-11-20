# g_e_bath（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_e_bath.glb。25こを1つにならべたモデルを tripo_split.py --wall --keepuv で切りわけ、gf_level.py・gf_edit.py で直した物。色は、デザインの絵を焼いたテクスチャ gf/tex2.png（gf_bake.py）から写すときにドットごとに）を写す。
# 設計図：モデル1つ（高さ 0.7 マス、置くマス1×1のまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげと質感はマットキャップ（tools/art/matcap.py）。見おろし35度・平行に写す（持ち主がきめた）。
import numpy as np,gfh
from blueprint import Part as P
ID='g_e_bath';BOTTOM=58;GRAD=True;SIZE=0.7
VIEWS=[('g_e_bath',0),('g_e_bath>1',1),('g_e_bath>2',2),('g_e_bath>3',3)]
W,K,E=gfh.frame('g_e_bath',0.5,0.5,SIZE)
def fix(x,y,z,c):   # 湯ぶねの中を水に（持ち主：中身がオレンジ→水）。トリポのテクスチャは中がオレンジで、デザインの水の色は焼けない（色がちがいすぎる）ので、ここでぬる
    r=np.hypot(x-0.5,y-0.5)
    if z>E[1]*0.8 and r<min(E[0],E[2])/2*0.86:
        w=0.5+0.5*np.sin(r*70);return np.array([176,218,232.])*(0.97+0.05*w)   # 輪の形のさざなみ
    return c
def PARTS():
    p=P('g_e_bath','model',('tripo/gf/g_e_bath.glb',0.5,0.5,0,SIZE,0,0),(255,255,255),on=('ground',),note='地面におく');p.tex=False;p.uvtex='tripo/gf/tex2.png';p.uvfix=fix   # 色はトリポのテクスチャの絵（木目をはらない）
    return [p]
MATCAP='clay';SMANGLE=80;PARALLEL=True;ELEV=35   # マットキャップ・スムーズシェード80度・遠近なし・見おろし35度（持ち主がきめた）
