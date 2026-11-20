# 洞窟の坂（cave:steps）：低い床から、北の高い床へのぼる、自然の岩の段（持ち主が「階段」とよぶ所）。がけの正面に切りこむ。
# 設計図（単位はマス）：はば0.8の、上の平らな岩（hullrock）を4つ、手前（南）からおく（北）へ、少しずつ高くならべる（高さ0.12・0.27・0.42・0.57。いちばん上が、がけの正面の上のはしにとどく）。
#   どの岩も角がかけた形で、直角を出さない（持ち主のきまり）。両わきは、少しせまくなる。色はこさの番号（5だんの灰色）で写し、ゲームで階の岩の色にぬりかえる。
import numpy as np
from natcommon import hullrock
ID='cave_steps';GRAD=False;SHADE=[(9,-2.5),(18,-5)];BOTTOM=60;PARALLEL=True
VIEWS=[('cave_steps',0)]
PAL=[(235,235,235),(200,200,200),(160,160,160),(120,120,120),(85,85,85)]
SLAB=((0,1.0,7),(0.85,1.0,7),(1.0,0.86,7))
def PARTS():return[]
def EXTRA(sc):
    for i in range(4):
        rs=np.random.RandomState(500+i)
        hullrock(sc,(0.5+rs.uniform(-.03,.03),0.80-i*0.22),(0.40-i*0.015,0.15),0.12+i*0.15,PAL,seed=600+i,ring=SLAB,gi='s%d'%i)
