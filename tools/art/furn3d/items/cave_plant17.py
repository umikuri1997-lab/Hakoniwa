# 洞窟の植物（cave:plant#17）：小さな光る花（水色）。持ち主のたのみで、1まいずつの葉から組んだ植物（cave_flora.py）。光る物の光はゲームでつける。
# 設計図（単位はマス）：はば約1マス・高さ0.2〜0.7マス。葉は平らなリボン（両面）、くきは管、光る実・花のまん中だけ玉。木と同じ5色のかげ（TONE5、あみかけなし）。
from cave_flora import *
ID='cave_plant17';TONE5=True;DITHER=0;BOTTOM=58
VIEWS=[('cave:plant#17',0)]
def PARTS():return[]
def EXTRA(sc):flowers(sc,(0.5,0.6),0.30,(80,150,140),(170,240,255),(255,255,255),n=7,seed=20)
POST=clean   # ぽつんとした1ドットをけす
