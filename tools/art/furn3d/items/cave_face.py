# 洞窟の岩の正面（cave:face・cave:cliff のもと）：ごつごつした岩を、よこ一列にならべた、岩はだ。4マスでくりかえす（左右のはしがつながる）。
# 設計図（単位はマス）：角ばった岩（hullrock）を、よこ0.5マスごとに、おく2列（手前は高さ0.5〜0.7、おくは高さ0.8〜0.95）。
#   4マスごとに同じ岩がくる（seed を4マスでくりかえす）ので、どこで4マス切っても、つながる。写したあと tools/art/cave/cave_tex.py で切る。
from natcommon import hullrock
ID='cave_face';GRAD=False;SHADE=[(9,-2.5),(18,-5)];BOTTOM=60;PARALLEL=True;SZ=(8,1)
VIEWS=[('cave_face',0)]
PAL=[(170,154,136),(150,134,118),(130,115,102),(110,96,86),(92,80,72)]
def PARTS():return[]
def EXTRA(sc):
    import numpy as np
    for i in range(-4,22):
        k=i%8;rs=np.random.RandomState(100+k);x=i*0.5+0.25
        hullrock(sc,(x+rs.uniform(-.06,.06),0.52),(0.36,0.2),0.8+rs.uniform(0,.15),PAL,seed=200+k,ring=((0,1.0,7),(0.5,0.95,7),(0.9,0.8,6),(1.0,0.5,4)),gi='b%d'%i)
    for i in range(-4,22):
        k=i%8;rs=np.random.RandomState(300+k);x=i*0.5
        hullrock(sc,(x+rs.uniform(-.08,.08),0.74),(0.3,0.16),0.42+rs.uniform(0,.28),PAL,seed=400+k,ring=((0,1.0,7),(0.5,0.9,6),(1.0,0.45,4)),gi='f%d'%i)
