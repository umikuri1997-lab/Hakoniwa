# 洞窟の植物（cave:plant#34）：氷のほらあなの植物：雪の花（白い花びら・光るまん中）。1まいずつの葉・枝から組む（cave_flora.py）。光る物の光はゲームでつける。
# 設計図（単位はマス）：はば約1マス・高さ0.3〜0.7マス。木と同じ5色のかげ（TONE5、あみかけなし）。
from cave_flora import *
ID='cave_plant34';TONE5=True;DITHER=0;BOTTOM=58
VIEWS=[('cave:plant#34',0)]
def PARTS():return[]
def EXTRA(sc):rosette(sc,(0.5,0.62),0.26,(170,210,230),n=8,seed=61);flowers(sc,(0.5,0.6),0.36,(130,180,200),(250,252,255),(150,230,255),n=10,seed=50)
POST=clean   # ぽつんとした1ドットをけす
