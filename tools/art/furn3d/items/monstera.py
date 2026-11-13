# かんようしょくぶつ（monstera）：いまの絵と同じデザイン・同じ大きさ。クリーム色のはちに、大きな葉の観葉植物。
# 設計図：トリポで作ったモデル（models/tripo/plant.glb：クリーム色のはちと、大きな葉）を、地面に置く（高さ0.74）。
from blueprint import Part as P
from common import *
ID='monstera';BOTTOM=64
VIEWS=[('monstera',0)]
def PARTS():
    return [notex(P('はち植え','model',('tripo/plant.glb',0.50,0.62,0,0.74,20,0),on=('ground',),note='地面に置く'))]
