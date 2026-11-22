# 洞窟の植物（cave:plant#14）：光るきのこの小さなむれ（青みどり）。持ち主のたのみで、1まいずつの葉から組んだ植物（cave_flora.py）。光る物の光はゲームでつける。
# 設計図（単位はマス）：はば約1マス・高さ0.2〜0.7マス。葉は平らなリボン（両面）、くきは管、光る実・花のまん中だけ玉。木と同じ5色のかげ（TONE5、あみかけなし）。
from cave_flora import *
ID='cave_plant14';TONE5=True;DITHER=0;BOTTOM=58;ELEV=16   # よこから近く見て、かさの形を見せる（玉に見えないように）
VIEWS=[('cave:plant#14',0)]
def PARTS():return[]
def EXTRA(sc):glowcaps(sc,(0.5,0.6),0.28,(200,236,226),(110,240,220),n=8,seed=17)
POST=clean   # ぽつんとした1ドットをけす
