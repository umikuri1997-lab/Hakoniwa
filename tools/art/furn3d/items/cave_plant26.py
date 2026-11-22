# 洞窟の植物（cave:plant#26）：マグマのほらあなの植物：すすけた草（黒い葉に、赤く光る先）。1まいずつの葉・枝から組む（cave_flora.py）。光る物の光はゲームでつける。
# 設計図（単位はマス）：はば約1マス・高さ0.3〜0.7マス。木と同じ5色のかげ（TONE5、あみかけなし）。
from cave_flora import *
ID='cave_plant26';TONE5=True;DITHER=0;BOTTOM=58
VIEWS=[('cave:plant#26',0)]
def PARTS():return[]
def EXTRA(sc):blades(sc,(0.5,0.6),0.48,(92,74,70),n=26,spread=0.3,seed=41,bend=0.7);blades(sc,(0.52,0.62),0.32,(255,110,40),n=9,spread=0.2,seed=42,gi="k",bend=0.5)
POST=clean   # ぽつんとした1ドットをけす
