# 洞窟の植物（cave:plant#33）：氷のほらあなの植物：こおった草（水色の葉）。1まいずつの葉・枝から組む（cave_flora.py）。光る物の光はゲームでつける。
# 設計図（単位はマス）：はば約1マス・高さ0.3〜0.7マス。木と同じ5色のかげ（TONE5、あみかけなし）。
from cave_flora import *
ID='cave_plant33';TONE5=True;DITHER=0;BOTTOM=58
VIEWS=[('cave:plant#33',0)]
def PARTS():return[]
def EXTRA(sc):blades(sc,(0.5,0.6),0.5,(176,224,246),n=18,spread=0.26,seed=49,bend=0.6)
POST=clean   # ぽつんとした1ドットをけす
