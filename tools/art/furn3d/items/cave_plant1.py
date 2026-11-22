# 洞窟の植物（cave:plant#1）：地面をおおう葉（みどり）。持ち主のたのみで、1まいずつの葉から組んだ植物（cave_flora.py）。光る物の光はゲームでつける。
# 設計図（単位はマス）：はば約1マス・高さ0.2〜0.7マス。葉は平らなリボン（両面）、くきは管、光る実・花のまん中だけ玉。木と同じ5色のかげ（TONE5、あみかけなし）。
from cave_flora import *
ID='cave_plant1';TONE5=True;DITHER=0;BOTTOM=58
VIEWS=[('cave:plant#1',0)]
def PARTS():return[]
def EXTRA(sc):rosette(sc,(0.40,0.55),0.34,(120, 176, 96),n=9,seed=2);rosette(sc,(0.76,0.72),0.22,(96,162,82),n=7,seed=5,gi='q')
POST=clean   # ぽつんとした1ドットをけす
