# 洞窟の植物（cave:plant#23）：トクサ（大むかしの植物）。化石の大ひろまだけの植物（持ち主のたのみ：かれた植物と大むかしの植物）。1まいずつの葉・枝から組む（cave_flora.py）。
# 設計図（単位はマス）：はば約1マス・高さ0.3〜0.95マス。木と同じ5色のかげ（TONE5、あみかけなし）。
from cave_flora import *
ID='cave_plant23';TONE5=True;DITHER=0;BOTTOM=58
VIEWS=[('cave:plant#23',0)]
def PARTS():return[]
def EXTRA(sc):horsetail(sc,(0.5,0.6),0.62,(110,140,80),(140,170,96),n=7,seed=37)
POST=clean   # ぽつんとした1ドットをけす
