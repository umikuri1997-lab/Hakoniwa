# 洞窟の植物（cave:plant#35）：氷のほらあなの植物：霜のロゼット（地面をおおう、白い葉）。1まいずつの葉・枝から組む（cave_flora.py）。光る物の光はゲームでつける。
# 設計図（単位はマス）：はば約1マス・高さ0.3〜0.7マス。木と同じ5色のかげ（TONE5、あみかけなし）。
from cave_flora import *
ID='cave_plant35';TONE5=True;DITHER=0;BOTTOM=58
VIEWS=[('cave:plant#35',0)]
def PARTS():return[]
def EXTRA(sc):rosette(sc,(0.4,0.58),0.22,(214,236,248),n=9,seed=51);rosette(sc,(0.7,0.72),0.15,(190,222,242),n=7,seed=52,gi="q")
POST=clean   # ぽつんとした1ドットをけす
