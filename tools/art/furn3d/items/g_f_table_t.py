# g_f_table（特別な家具）：持ち主がトリポで作ったモデル（tools/art/models/tripo/gf/g_f_table.glb。25こを1つにならべたモデルを tripo_split.py --wall で切りわけ、かたむき・ぬけを gf_level.py・gf_bend.py・gf_post.py で直した物）を写す。
# 設計図：モデル1つ（高さ 0.73 マス、置くマスのまん中、地面におく）。前・右・うしろ・左の4つの向き（モデルをまわして写す）。かげは3だん・あみなし。
from blueprint import Part as P
ID='g_f_table';BOTTOM=58;GRAD=True
VIEWS=[('g_f_table',0),('g_f_table>1',1),('g_f_table>2',2),('g_f_table>3',3)]
def PARTS():
    return [P('g_f_table','model',('tripo/gf/g_f_table.glb',0.5,0.5,0,0.73,0,0),(255,255,255),on=('ground',),note='地面におく')]
TONE5=True;TONE3=True   # かげは3だん・あみなし（特別な家具。持ち主がきめた）
