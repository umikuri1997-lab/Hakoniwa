# g_f_table（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_f_table.glb。25こを1つにならべたモデルを tripo_split.py --wall --keepuv で切りわけ、gf_level.py・gf_edit.py で直した物。色は、デザインの絵を焼いたテクスチャ gf/tex2.png（gf_bake.py）から写すときにドットごとに）を写す。
# 設計図：モデル1つ（高さ 0.73 マス、置くマス1×1のまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげと質感はマットキャップ（tools/art/matcap.py）。見おろし30度・平行に写す（持ち主がきめた）。
import numpy as np,gfh
from blueprint import Part as P
ID='g_f_table';BOTTOM=58;GRAD=True;SIZE=0.73
VIEWS=[('g_f_table',0),('g_f_table>1',1),('g_f_table>2',2),('g_f_table>3',3)]
W,K,E=gfh.frame('g_f_table',0.5,0.5,SIZE)
TOP=np.array([248,232,204.]);RIM=np.array([230,174,116.]);SUN=np.array([240,180,96.]);RAY=np.array([242,204,140.])
def fix(x,y,z,c):   # 天板（持ち主：色のぬり分けがおかしい）：トリポのテクスチャの天板は、おひさまのもようがぼやけてまだら。デザインの絵のとおり、クリーム色の天板に、
    # まん中のおひさま（まるい中心と12まいの光）、ふちは あかがね色の帯。高さ0.70より上が天板の上の面、0.62〜0.70 がふちの横
    if z<0.62:return c
    dx,dy=x-0.5,y-0.5;r=np.hypot(dx,dy)
    if z<0.70 or r>0.42:return RIM
    if r<0.09:return SUN
    a=(np.arctan2(dy,dx)/(2*np.pi)*12)%1;tip=0.09+0.19*(1-abs(a-0.5)*2)   # 光は三角（12まい）
    return RAY if r<tip else TOP
def PARTS():
    p=P('g_f_table','model',('tripo/gf/g_f_table.glb',0.5,0.5,0,SIZE,0,0),(255,255,255),on=('ground',),note='地面におく');p.tex=False;p.uvtex='tripo/gf/tex2.png';p.uvfix=fix   # 色はトリポのテクスチャの絵（木目をはらない）
    return [p]
MATCAP='clay';SMANGLE=80;PARALLEL=True;ELEV=30   # マットキャップ・スムーズシェード80度・遠近なし・見おろし30度（持ち主がきめた）
