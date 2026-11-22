# 洞窟の植物（cave:plant#21）：とげのある、かわいた草。化石の大ひろまだけの植物（持ち主のたのみ：かれた植物と大むかしの植物）。1まいずつの葉・枝から組む（cave_flora.py）。
# 設計図（単位はマス）：はば約1マス・高さ0.3〜0.95マス。木と同じ5色のかげ（TONE5、あみかけなし）。
from cave_flora import *
ID='cave_plant21';TONE5=True;DITHER=0;BOTTOM=58
VIEWS=[('cave:plant#21',0)]
def PARTS():return[]
def EXTRA(sc):blades(sc,(0.5,0.6),0.42,(196,168,104),n=16,spread=0.24,seed=32,bend=1.0);twigs(sc,(0.5,0.62),0.3,(150,120,84),depth=2,n=3,seed=33)
POST=clean   # ぽつんとした1ドットをけす
