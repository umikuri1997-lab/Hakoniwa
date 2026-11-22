# 洞窟の植物（cave:plant#3）：光る実の草（むらさき）。持ち主のたのみで、1まいずつの葉から組んだ植物（cave_flora.py）。光る物の光はゲームでつける。
# 設計図（単位はマス）：はば約1マス・高さ0.2〜0.7マス。葉は平らなリボン（両面）、くきは管、光る実・花のまん中だけ玉。木と同じ5色のかげ（TONE5、あみかけなし）。
from cave_flora import *
ID='cave_plant3';TONE5=True;DITHER=0;BOTTOM=58
VIEWS=[('cave:plant#3',0)]
def PARTS():return[]
def EXTRA(sc):bulbs(sc,(0.5,0.6),0.60,(90,80,130),(214,170,255),(90,110,140),n=6,seed=4)
POST=clean   # ぽつんとした1ドットをけす
