# 洞窟の植物（cave:plant#27）：マグマのほらあなの植物：ほのおの花（赤い花びら・光るまん中）。1まいずつの葉・枝から組む（cave_flora.py）。光る物の光はゲームでつける。
# 設計図（単位はマス）：はば約1マス・高さ0.3〜0.7マス。木と同じ5色のかげ（TONE5、あみかけなし）。
from cave_flora import *
ID='cave_plant27';TONE5=True;DITHER=0;BOTTOM=58
VIEWS=[('cave:plant#27',0)]
def PARTS():return[]
def EXTRA(sc):rosette(sc,(0.5,0.62),0.26,(86,52,44),n=8,seed=60);flowers(sc,(0.5,0.6),0.4,(110,46,34),(240,70,40),(255,220,90),n=10,seed=43)
POST=clean   # ぽつんとした1ドットをけす
