# g_s_sofa（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_s_sofa.glb。25こを1つにならべたモデルを tripo_split.py --wall --keepuv で切りわけ、gf_level.py・gf_edit.py で直した物。色は、デザインの絵を焼いたテクスチャ gf/tex2.png（gf_bake.py）から写すときにドットごとに）を写す。
# 設計図：モデル1つ（高さ 0.62 マス、置くマス2×1のまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげと質感はマットキャップ（tools/art/matcap.py）。見おろし30度・平行に写す（持ち主がきめた）。
import numpy as np,gfh
from blueprint import Part as P
ID='g_s_sofa';BOTTOM=58;GRAD=True;SZ=(2, 1);SIZE=0.62
VIEWS=[('g_s_sofa',0),('g_s_sofa>1',1),('g_s_sofa>2',2),('g_s_sofa>3',3)]
def fix0(x,y,z,c):   # まん中の黒っぽい所を、ミントの色に（持ち主：真ん中なんか黒い）
    if c.sum()<400:return np.array([150,200,186.])
    return c
PEARL=np.array([246,240,242.]);PINK=np.array([238,220,230.]);LAV=np.array([226,226,240.])
def fix(x,y,z,c):   # 貝がらの背もたれ（持ち主：色のぬり分けがおかしい）：トリポのテクスチャは、うしろがわがくすんだはだ色。前もうしろも、真珠の色（白に、うすいピンクとうす紫のすじ）にする。クッション（水色）はそのまま
    if y<0.32 and z>0.15 and not c[1]>c[0]+5:
        a=np.arctan2(x-1.0,z-0.1);t=0.5+0.5*np.cos(a*9);k=0.5+0.5*np.sin(a*2)
        return PEARL*(1-t*0.6)+(PINK*k+LAV*(1-k))*t*0.6   # 貝のすじ（9本）
    return fix0(x,y,z,c)
def PARTS():
    p=P('g_s_sofa','model',('tripo/gf/g_s_sofa.glb',1.0,0.5,0,SIZE,0,0),(255,255,255),on=('ground',),note='地面におく');p.tex=False;p.uvtex='tripo/gf/tex2.png';p.uvfix=fix   # 色はトリポのテクスチャの絵（木目をはらない）
    return [p]
MATCAP='clay';SMANGLE=80;PARALLEL=True;ELEV=30   # マットキャップ・スムーズシェード80度・遠近なし・見おろし30度（持ち主がきめた）
