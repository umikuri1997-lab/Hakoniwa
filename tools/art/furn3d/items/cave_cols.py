# 洞窟の柱の岩のがけ（cave:cols のもと）：上が平らな、太さ・高さのちがう柱の岩を、よこにすきまなくならべたがけ（参考画像のがけ）。4マスでくりかえす。
# 設計図（単位はマス）：おくの列（高さ0.70〜0.95・はば0.54〜0.7、となりとかさなる）と、ところどころ手前の列（高さ0.30〜0.52・はば0.44〜0.56）。どの岩も、角ばった柱（hullrock）で、てっぺんは平ら・ふちが少しかける。
#   ならびは0.5マスごと・4マスでくりかえす（seed を8こでくりかえす）。色はこさの番号（5だんの灰色）で写し、ゲームで階ごとの色にぬりかえる。
import numpy as np
from natcommon import hullrock
ID='cave_cols';GRAD=False;SHADE=[(9,-2.5),(18,-5)];BOTTOM=60;PARALLEL=True;SZ=(8,1)
VIEWS=[('cave_cols',0)]
PAL=[(235,235,235),(200,200,200),(160,160,160),(120,120,120),(85,85,85)]
COL=((0,1.0,6),(0.9,1.0,6),(1.0,0.82,6))   # 柱：まっすぐ立って、てっぺんのふちだけ少しかける
def PARTS():return[]
def EXTRA(sc):
    for i in range(-4,22):
        k=i%8;rs=np.random.RandomState(70+k);x=i*0.5+0.25+rs.uniform(-.05,.05)
        hullrock(sc,(x,0.42),(0.27+rs.uniform(0,.08),0.17),0.70+rs.uniform(0,.25),PAL,seed=170+k,ring=COL,gi='b%d'%i)
    for i in range(-4,22):
        k=i%8;rs=np.random.RandomState(270+k)
        if rs.uniform()<0.45:continue
        x=i*0.5+rs.uniform(0,.2)
        hullrock(sc,(x,0.66),(0.22+rs.uniform(0,.06),0.14),0.30+rs.uniform(0,.22),PAL,seed=370+k,ring=COL,gi='f%d'%i)
