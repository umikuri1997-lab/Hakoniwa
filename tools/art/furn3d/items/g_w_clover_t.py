# g_w_clover（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_w_clover.glb。25こを1つにならべたモデルを tripo_split.py --wall --keepuv で切りわけた物。形はトリポのまま、色はテクスチャの絵 gf/tex.png から写すときにドットごとに）を写す。
# 設計図：モデル1つ（高さ 0.79 マス、置くマスのまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげと質感はマットキャップ（tools/art/matcap.py、持ち主がきめた）。
from blueprint import Part as P
ID='g_w_clover';BOTTOM=58;GRAD=True
VIEWS=[('g_w_clover',0),('g_w_clover>1',1),('g_w_clover>2',2),('g_w_clover>3',3)]
def PARTS():
    p=P('g_w_clover','model',('tripo/gf/g_w_clover.glb',0.5,0.5,0,0.79,0,0),(255,255,255),on=('ground',),note='地面におく');p.tex=False;p.uvtex='tripo/gf/tex.png'   # 色はトリポのテクスチャの絵（木目をはらない）
    return [p]
MATCAP='clay';SMANGLE=80   # マットキャップでかげと質感・スムーズシェード80度（持ち主がきめた）
