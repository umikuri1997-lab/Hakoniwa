# 彫り絵1の大きな1まい（carve:big#0）：洞窟のかべの彫り絵（cave_carve0.py）と同じ浮き彫りを、2.4倍の大きさで、まっすぐ正面から写す（巣穴・坂でひらく絵）。
from cave_carve0 import relief,SLAB
ID='carve_big0';TONE5=True;DITHER=0;BOTTOM=40;PARALLEL=True;ELEV=6
VIEWS=[('carve:big#0',0)]
def PARTS():return relief(2.4,-0.70,0.0)
