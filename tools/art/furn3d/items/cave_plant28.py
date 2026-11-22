# 洞窟の植物（cave:plant#28）：マグマのほらあなの植物：光るおき火の実（黒い葉・赤く光る実）。1まいずつの葉・枝から組む（cave_flora.py）。光る物の光はゲームでつける。
# 設計図（単位はマス）：はば約1マス・高さ0.3〜0.7マス。木と同じ5色のかげ（TONE5、あみかけなし）。
from cave_flora import *
ID='cave_plant28';TONE5=True;DITHER=0;BOTTOM=58
VIEWS=[('cave:plant#28',0)]
def PARTS():return[]
def EXTRA(sc):bulbs(sc,(0.5,0.6),0.5,(80,40,32),(255,96,40),(74,50,46),n=6,seed=44)
POST=clean   # ぽつんとした1ドットをけす
