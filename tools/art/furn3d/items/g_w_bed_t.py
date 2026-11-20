# g_w_bed（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_w_bed.glb。25こを1つにならべたモデルを tripo_split.py --wall --sub で切りわけた物。形も色も、トリポのまま）を写す。
# 設計図：モデル1つ（高さ 0.94 マス、置くマスのまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげと質感はマットキャップ（tools/art/matcap.py、持ち主がきめた）。
from blueprint import Part as P
ID='g_w_bed';BOTTOM=58;GRAD=True
VIEWS=[('g_w_bed',0),('g_w_bed>1',1),('g_w_bed>2',2),('g_w_bed>3',3)]
def PARTS():
    p=P('g_w_bed','model',('tripo/gf/g_w_bed.glb',0.5,0.5,0,0.94,0,0),(255,255,255),on=('ground',),note='地面におく');p.tex=False   # 色はモデルの色（木目をはらない）
    return [p]
MATCAP='clay'   # マットキャップでかげと質感（持ち主がきめた）
