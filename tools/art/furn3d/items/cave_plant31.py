# 洞窟の植物（cave:plant#31）：マグマのほらあなの植物：赤いアシ（光る穂）。1まいずつの葉・枝から組む（cave_flora.py）。光る物の光はゲームでつける。
# 設計図（単位はマス）：はば約1マス・高さ0.3〜0.7マス。木と同じ5色のかげ（TONE5、あみかけなし）。
from cave_flora import *
ID='cave_plant31';TONE5=True;DITHER=0;BOTTOM=58
VIEWS=[('cave:plant#31',0)]
def PARTS():return[]
def EXTRA(sc):reeds(sc,(0.5,0.62),0.6,(110,40,32),(255,140,50),n=7,seed=47)
POST=clean   # ぽつんとした1ドットをけす
