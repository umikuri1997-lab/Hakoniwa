# g_k_screen（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_k_screen.glb。25こを1つにならべたモデルを tripo_split.py --wall で切りわけ、かたむき・ぬけを gf_level.py・gf_bend.py・gf_post.py で直した物）を写す。
# 設計図：モデル1つ（高さ 1.3 マス、置くマス2つのまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげは3だん・あみなし。
from blueprint import Part as P
ID='g_k_screen';BOTTOM=58;GRAD=True;SZ=(2,1)
VIEWS=[('g_k_screen',0),('g_k_screen>1',1),('g_k_screen>2',2),('g_k_screen>3',3)]
def PARTS():
    return [P('g_k_screen','model',('tripo/gf/g_k_screen.glb',1.0,0.5,0,1.3,0,0),(255,255,255),on=('ground',),note='地面におく')]
TONE5=True;TONE3=True   # かげは3だん・あみなし（特別な家具。持ち主がきめた）
