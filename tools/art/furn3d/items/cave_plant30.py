# 洞窟の植物（cave:plant#30）：マグマのほらあなの植物：ほのおのきのこのむれ（赤く光るかさ）。1まいずつの葉・枝から組む（cave_flora.py）。光る物の光はゲームでつける。
# 設計図（単位はマス）：はば約1マス・高さ0.3〜0.7マス。木と同じ5色のかげ（TONE5、あみかけなし）。
from cave_flora import *
ID='cave_plant30';TONE5=True;DITHER=0;BOTTOM=58
VIEWS=[('cave:plant#30',0)]
def PARTS():return[]
def EXTRA(sc):glowcaps(sc,(0.5,0.6),0.3,(120,60,48),(255,90,40),n=8,seed=46)
POST=clean   # ぽつんとした1ドットをけす
