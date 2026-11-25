# カミサマ（god）：持ち主のモデル（tools/art/models/god/saint_monk.glb、トリポ）に、部品ごとの色をぬった物（god_monk.glb、tools/art/god3d/monk_paint.py）。
# 高さは、輪のてっぺんまで1.27マス（前のカミサマの絵と同じ高さ）。台座の上の面のまん中に立つ。正面（南）を向き、クォータービューでは左下を向く。
from blueprint import Part as P
from common import *
ID='god';BOTTOM=60
VIEWS=[('god',0)]
def PARTS():
    p=P('カミサマ','model',('god/god_monk.glb',0.5,0.5,0,1.27,0,0),(255,255,255),on=('ground',),note='台座の上に立つ');p.vivid=lambda c:c   # モデルの色を白にまぜない（前のカミサマの絵と同じ濃さ。持ち主がきめた）
    return[notex(p)]

TONE5=True   # かげは家具と同じ5色（furntone）
DITHER=0     # あみかけなし（持ち主がきめた）
