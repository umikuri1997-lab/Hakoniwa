# g_f_lamp（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_f_lamp.glb。25こを1つにならべたモデルを tripo_split.py --wall --keepuv で切りわけ、gf_level.py・gf_edit.py で直した物。色はテクスチャの絵 gf/tex.png から写すときにドットごとに）を写す。
# 設計図：モデル1つ（高さ 1.2 マス、置くマス1×1のまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげと質感はマットキャップ（tools/art/matcap.py）。見おろし35度・平行に写す（持ち主がきめた）。
import numpy as np,gfh
from blueprint import Part as P
ID='g_f_lamp';BOTTOM=58;GRAD=True;SIZE=1.2
VIEWS=[('g_f_lamp',0),('g_f_lamp>1',1),('g_f_lamp>2',2),('g_f_lamp>3',3)]

def PARTS():
    p=P('g_f_lamp','model',('tripo/gf/g_f_lamp.glb',0.5,0.5,0,SIZE,0,0),(255,255,255),on=('ground',),note='地面におく');p.tex=False;p.uvtex='tripo/gf/tex.png'   # 色はトリポのテクスチャの絵（木目をはらない）
    W,K,E=gfh.frame('g_f_lamp',0.5,0.5,SIZE);c0=np.array(W((-0.0109,0.1244,0.0)));r=0.034*K   # ガラスの玉（まん中と半径。モデルの場所から）
    q=P('g_f_lamp_glass','model',p.dims,(255,255,255),on=('ground',));q.tex=False;q.uvtex=p.uvtex;q.glass=True   # ガラスは半透明（持ち主）
    inb=lambda V,F,C:np.linalg.norm(V[F].mean(1)-c0,axis=1)<r
    p.fsel=lambda V,F,C:~inb(V,F,C);q.fsel=inb
    return [p,q]
MATCAP='clay';SMANGLE=80;PARALLEL=True;ELEV=35   # マットキャップ・スムーズシェード80度・遠近なし・見おろし35度（持ち主がきめた）
FRAMES=6   # ガラスの中に粒の火（持ち主）
def _fire():
    W,K,E=gfh.frame('g_f_lamp',0.5,0.5,SIZE);c=W((-0.0109,0.112,0.0));return [(c[0],c[1],c[2],0.16,0.05,40,3,{'smoke':False,'sparks':False})]
PFIRE=_fire();PFIRE_HIDE=lambda n:n!='g_f_lamp_glass'
