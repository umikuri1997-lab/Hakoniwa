# 彫り絵2の大きな1まい（carve:big#1）：洞窟のかべの彫り絵（cave_carve1.py）と同じ浮き彫りを、2.4倍の大きさで、まっすぐ正面から写す（坂・巣穴でひらく絵）。
from cave_carve1 import relief
ID='carve_big1';TONE5=True;DITHER=0;BOTTOM=40;PARALLEL=True;ELEV=6
VIEWS=[('carve:big#1',0)]
def PARTS():return relief(2.4,-0.70,0.0)
