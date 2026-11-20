# g_e_bath（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_e_bath.glb。25こを1つにならべたモデルを tripo_split.py --wall --keepuv で切りわけた物。形はトリポのまま、色はテクスチャの絵 gf/tex.png から写すときにドットごとに）を写す。
# 設計図：モデル1つ（高さ 0.7 マス、置くマスのまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげと質感はマットキャップ（tools/art/matcap.py、持ち主がきめた）。
from blueprint import Part as P
ID='g_e_bath';BOTTOM=58;GRAD=True
VIEWS=[('g_e_bath',0),('g_e_bath>1',1),('g_e_bath>2',2),('g_e_bath>3',3)]
def PARTS():
    p=P('g_e_bath','model',('tripo/gf/g_e_bath.glb',0.5,0.5,0,0.7,0,0),(255,255,255),on=('ground',),note='地面におく');p.tex=False;p.uvtex='tripo/gf/tex.png'   # 色はトリポのテクスチャの絵（木目をはらない）
    return [p]
MATCAP='clay';SMANGLE=80;PARALLEL=True   # 遠近をかけずに平行に写す（見おろし42度はそのまま。持ち主がきめた）・ マットキャップでかげと質感・スムーズシェード80度（持ち主がきめた）
