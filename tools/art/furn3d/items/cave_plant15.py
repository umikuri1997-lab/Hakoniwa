# 洞窟の植物（cave:plant#15）：光るきのこの小さなむれ（むらさき）。持ち主のたのみで、1まいずつの葉から組んだ植物（cave_flora.py）。光る物の光はゲームでつける。
# 設計図（単位はマス）：はば約1マス・高さ0.2〜0.7マス。葉は平らなリボン（両面）、くきは管、光る実・花のまん中だけ玉。木と同じ5色のかげ（TONE5、あみかけなし）。
from cave_flora import *
ID='cave_plant15';TONE5=True;DITHER=0;BOTTOM=58;ELEV=16   # よこから近く見て、かさの形を見せる（玉に見えないように）
VIEWS=[('cave:plant#15',0)]
def PARTS():return[]
def EXTRA(sc):glowcaps(sc,(0.5,0.6),0.24,(220,214,236),(200,160,255),n=7,seed=18)
POST=clean   # ぽつんとした1ドットをけす
