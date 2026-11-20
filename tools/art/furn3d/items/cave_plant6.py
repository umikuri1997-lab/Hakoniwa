# 洞窟の植物（cave:plant#6）：光るシダ。持ち主のたのみで、1まいずつの葉から組んだ植物（cave_flora.py）。光る物の光はゲームでつける。
# 設計図（単位はマス）：はば約1マス・高さ0.2〜0.7マス。葉は平らなリボン（両面）、くきは管、光る実・花のまん中だけ玉。木と同じ5色のかげ（TONE5、あみかけなし）。
from cave_flora import *
ID='cave_plant6';TONE5=True;DITHER=0;BOTTOM=58
VIEWS=[('cave:plant#6',0)]
def PARTS():return[]
def EXTRA(sc):fern(sc,(0.5,0.55),0.55,0.40,(120, 240, 210),(80, 190, 170),nf=8,seed=8)
POST=clean   # ぽつんとした1ドットをけす
