# 洞窟の植物（cave:plant#22）：オレンジの地衣（ひくい）。化石の大ひろまだけの植物（持ち主のたのみ：かれた植物と大むかしの植物）。1まいずつの葉・枝から組む（cave_flora.py）。
# 設計図（単位はマス）：はば約1マス・高さ0.3〜0.95マス。木と同じ5色のかげ（TONE5、あみかけなし）。
from cave_flora import *
ID='cave_plant22';TONE5=True;DITHER=0;BOTTOM=58
VIEWS=[('cave:plant#22',0)]
def PARTS():return[]
def EXTRA(sc):rosette(sc,(0.38,0.56),0.2,(222,138,62),n=8,seed=34);rosette(sc,(0.7,0.7),0.15,(240,170,80),n=7,seed=35,gi='q');rosette(sc,(0.56,0.82),0.1,(206,120,56),n=6,seed=36,gi='u')
POST=clean   # ぽつんとした1ドットをけす
