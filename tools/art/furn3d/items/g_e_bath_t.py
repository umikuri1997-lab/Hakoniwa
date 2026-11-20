# g_e_bath（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_e_bath.glb。25こを1つにならべたモデルを tripo_split.py --wall --keepuv で切りわけ、gf_level.py・gf_edit.py で直した物。色は、デザインの絵を焼いたテクスチャ gf/tex2.png（gf_bake.py）から写すときにドットごとに）を写す。
# 設計図：モデル1つ（高さ 0.7 マス、置くマス1×1のまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげと質感はマットキャップ（tools/art/matcap.py）。見おろし30度・平行に写す（持ち主がきめた）。
import numpy as np,gfh
from blueprint import Part as P
ID='g_e_bath';BOTTOM=58;GRAD=True;SIZE=0.7
VIEWS=[('g_e_bath',0),('g_e_bath>1',1),('g_e_bath>2',2),('g_e_bath>3',3)]
W,K,E=gfh.frame('g_e_bath',0.5,0.5,SIZE)
def fix(x,y,z,c):   # 湯ぶねの中を水に（持ち主：中身がオレンジ→水）。トリポのテクスチャは中がオレンジで、デザインの水の色は焼けない（色がちがいすぎる）ので、ここでぬる
    r=np.hypot(x-0.5,y-0.5)
    if z>E[1]*0.8 and r<min(E[0],E[2])/2*0.86:
        return np.array([150,206,228.])   # 水の底（水の面はすけるので、底の色が見える）
    return c
import math
from common import hfield
WATER=(120,192,236);SKY=(220,240,252)
def EXTRA(sc):   # 水（持ち主：みずがめと同じ作り）：はちの中、ふちの0.035下。すけて見える・つやがある（'clear'、水飲み鳥と同じ）
    zw=0.665;r=0.40;CX,CY=0.505,0.518
    def col(x,y):t=max(0,min(1,(CY-y)/(r*1.4)+0.3))**1.4;return tuple(WATER[k]*(1-t)+SKY[k]*t for k in range(3))
    def disk(u,v):U,V=2*u-1,2*v-1;return (CX+r*U*math.sqrt(max(0,1-V*V/2)),CY+r*V*math.sqrt(max(0,1-U*U/2)))
    top=lambda x,y:zw+0.003*math.sin(x*25+y*8)
    sc.material('clear');hfield(sc,CX-r,CY-r,CX+r,CY+r,top,lambda x,y:col(*disk((x-(CX-r))/(2*r),(y-(CY-r))/(2*r))),n=(40,40),shape=disk);sc.material(None)
def PARTS():
    p=P('g_e_bath','model',('tripo/gf/g_e_bath.glb',0.5,0.5,0,SIZE,0,0),(255,255,255),on=('ground',),note='地面におく');p.tex=False;p.uvtex='tripo/gf/tex2.png';p.uvfix=fix   # 色はトリポのテクスチャの絵（木目をはらない）
    return [p]
MATCAP='clay';SMANGLE=80;PARALLEL=True;ELEV=30   # マットキャップ・スムーズシェード80度・遠近なし・見おろし30度（持ち主がきめた）
