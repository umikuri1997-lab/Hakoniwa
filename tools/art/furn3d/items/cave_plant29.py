# 洞窟の植物（cave:plant#29）：マグマのほらあなの植物：こげた枝のしげみ。1まいずつの葉・枝から組む（cave_flora.py）。光る物の光はゲームでつける。
# 設計図（単位はマス）：はば約1マス・高さ0.3〜0.7マス。木と同じ5色のかげ（TONE5、あみかけなし）。
from cave_flora import *
ID='cave_plant29';TONE5=True;DITHER=0;BOTTOM=58
VIEWS=[('cave:plant#29',0)]
def PARTS():return[]
def EXTRA(sc):twigs(sc,(0.5,0.6),0.55,(64,44,38),depth=3,n=4,seed=45)
POST=clean   # ぽつんとした1ドットをけす
