# 洞窟の植物（cave:plant#36）：氷のほらあなの植物：光る氷の実（水色に光る実）。1まいずつの葉・枝から組む（cave_flora.py）。光る物の光はゲームでつける。
# 設計図（単位はマス）：はば約1マス・高さ0.3〜0.7マス。木と同じ5色のかげ（TONE5、あみかけなし）。
from cave_flora import *
ID='cave_plant36';TONE5=True;DITHER=0;BOTTOM=58
VIEWS=[('cave:plant#36',0)]
def PARTS():return[]
def EXTRA(sc):bulbs(sc,(0.5,0.6),0.5,(110,150,180),(170,240,255),(150,200,226),n=6,seed=53)
POST=clean   # ぽつんとした1ドットをけす
