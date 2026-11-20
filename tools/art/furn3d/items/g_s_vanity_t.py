# g_s_vanity（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_s_vanity.glb。25こを1つにならべたモデルを tripo_split.py --wall --keepuv で切りわけ、gf_level.py・gf_edit.py で直した物。色は、デザインの絵を焼いたテクスチャ gf/tex2.png（gf_bake.py）から写すときにドットごとに）を写す。
# 設計図：モデル1つ（高さ 0.95 マス、置くマス1×1のまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげと質感はマットキャップ（tools/art/matcap.py）。見おろし30度・平行に写す（持ち主がきめた）。
import numpy as np,gfh
from blueprint import Part as P
ID='g_s_vanity';BOTTOM=58;GRAD=True;SIZE=0.95
VIEWS=[('g_s_vanity',0),('g_s_vanity>1',1),('g_s_vanity>2',2),('g_s_vanity>3',3)]
W,K,E=gfh.frame('g_s_vanity',0.5,0.5,SIZE)
def fix(x,y,z,c):   # 鏡（持ち主：鏡のとこを鏡に）：うすい水色に、ななめのうつりこみの白いすじ
    if abs(c[0]-203)+abs(c[1]-230)+abs(c[2]-237)<30:
        t=(x-0.5)*1.0+(E[1]*0.66-z)*0.8
        return np.array([255,255,255.]) if abs(t+0.05)<0.03 or abs(t-0.04)<0.012 else np.array([196,224,236.])*(1.02-0.15*(z/E[1]))
    return c
def PARTS():
    p=P('g_s_vanity','model',('tripo/gf/g_s_vanity.glb',0.5,0.5,0,SIZE,0,0),(255,255,255),on=('ground',),note='地面におく');p.tex=False;p.uvtex='tripo/gf/tex2.png';p.uvfix=fix   # 色はトリポのテクスチャの絵（木目をはらない）
    return [p]
MATCAP='clay';SMANGLE=80;PARALLEL=True;ELEV=30   # マットキャップ・スムーズシェード80度・遠近なし・見おろし30度（持ち主がきめた）
