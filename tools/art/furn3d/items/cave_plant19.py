# 洞窟の植物（cave:plant#19）：細い光る草。持ち主のたのみで、1まいずつの葉から組んだ植物（cave_flora.py）。光る物の光はゲームでつける。
# 設計図（単位はマス）：はば約1マス・高さ0.2〜0.7マス。葉は平らなリボン（両面）、くきは管、光る実・花のまん中だけ玉。木と同じ5色のかげ（TONE5、あみかけなし）。
from cave_flora import *
ID='cave_plant19';TONE5=True;DITHER=0;BOTTOM=58
VIEWS=[('cave:plant#19',0)]
def PARTS():return[]
def EXTRA(sc):blades(sc,(0.5,0.6),0.54,(130,236,214),n=16,spread=0.24,seed=22,bend=0.8)
POST=clean   # ぽつんとした1ドットをけす
