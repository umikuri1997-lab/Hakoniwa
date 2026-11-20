# 洞窟の植物（cave:plant#32）：氷のほらあなの植物：霜のシダ（白い葉）。1まいずつの葉・枝から組む（cave_flora.py）。光る物の光はゲームでつける。
# 設計図（単位はマス）：はば約1マス・高さ0.3〜0.7マス。木と同じ5色のかげ（TONE5、あみかけなし）。
from cave_flora import *
ID='cave_plant32';TONE5=True;DITHER=0;BOTTOM=58
VIEWS=[('cave:plant#32',0)]
def PARTS():return[]
def EXTRA(sc):fern(sc,(0.5,0.6),0.36,0.3,(220,240,250),(170,210,232),nf=7,seed=48)
POST=clean   # ぽつんとした1ドットをけす
