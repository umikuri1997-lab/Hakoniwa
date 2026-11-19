# g_w_clover（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_w_clover.glb。25こを1つにならべたモデルを tripo_split.py --wall で切りわけ、かたむき・ぬけを gf_level.py・gf_bend.py・gf_post.py で直した物）を写す。
# 設計図：モデル1つ（高さ 0.78 マス、置くマスのまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげは3だん・あみなし。
from blueprint import Part as P
ID='g_w_clover';BOTTOM=58;GRAD=True
VIEWS=[('g_w_clover',0),('g_w_clover>1',1),('g_w_clover>2',2),('g_w_clover>3',3)]
def PARTS():
    return [P('g_w_clover','model',('tripo/gf/g_w_clover.glb',0.5,0.5,0,0.78,0,0),(255,255,255),on=('ground',),note='地面におく')]
TONE5=True;TONE3=True   # かげは3だん・あみなし（特別な家具。持ち主がきめた）
