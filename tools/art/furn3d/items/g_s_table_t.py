# g_s_table（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_s_table.glb。25こを1つにならべたモデルを tripo_split.py --wall --keepuv で切りわけ、gf_level.py・gf_edit.py で直した物。色は、デザインの絵を焼いたテクスチャ gf/tex2.png（gf_bake.py）から写すときにドットごとに）を写す。
# 設計図：モデル1つ（持ち主がオブジェクトに分けた。オブジェクトごとにべつの部品 gfh.objparts）（高さ 0.76 マス、置くマス1×1のまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげと質感はマットキャップ（tools/art/matcap.py）。見おろし30度・平行に写す（持ち主がきめた）。
import numpy as np,gfh
from blueprint import Part as P
ID='g_s_table';BOTTOM=58;GRAD=True;SIZE=0.76
VIEWS=[('g_s_table',0),('g_s_table>1',1),('g_s_table>2',2),('g_s_table>3',3)]

PAD=np.array([184,214,160.]);VEIN=np.array([206,228,186.]);UNDER=np.array([164,198,150.])
def fix(x,y,z,c):   # ハスの葉の天板（持ち主：色のぬり分けがおかしい）：トリポのテクスチャは、すじのまだら。上の面は葉の緑の1色に、まん中から放射に7本のすじ。下の面は少しこい緑
    if 0.30<z<0.47:
        if z<0.38:return UNDER
        dx,dy=x-0.5,y-0.5;r=np.hypot(dx,dy);a=(np.arctan2(dy,dx)/(2*np.pi)*7)%1
        return VEIN if (min(a,1-a)*2*np.pi/7*r<0.008 and r>0.05) else PAD
    return c
def PARTS():   # o0 脚・o1 ハスの葉の天板と花
    return gfh.objparts(ID,('tripo/gf/g_s_table.glb',0.5,0.5,0,SIZE,0,0),{'o1':fix})
MATCAP='clay';SMANGLE=80;PARALLEL=True;ELEV=30   # マットキャップ・スムーズシェード80度・遠近なし・見おろし30度（持ち主がきめた）
