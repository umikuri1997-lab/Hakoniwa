# 洞窟の植物（cave:plant#24）：ソテツ（大むかしの植物）。化石の大ひろまだけの植物（持ち主のたのみ：かれた植物と大むかしの植物）。1まいずつの葉・枝から組む（cave_flora.py）。
# 設計図（単位はマス）：はば約1マス・高さ0.3〜0.95マス。木と同じ5色のかげ（TONE5、あみかけなし）。
from cave_flora import *
ID='cave_plant24';TONE5=True;DITHER=0;BOTTOM=58
VIEWS=[('cave:plant#24',0)]
def PARTS():return[]
def EXTRA(sc):cycad(sc,(0.5,0.6),0.75,(120,96,70),(90,140,70),(70,110,56),nf=11,seed=38)
POST=clean   # ぽつんとした1ドットをけす
