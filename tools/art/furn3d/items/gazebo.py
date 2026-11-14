# ガゼボ（gazebo、2×2マス、おそなえの家具）：いまの絵と同じデザイン。白くぬった木の柱4本と方杖、緑の板ぶきの方形の屋根、てっぺんに木の玉のかざり。
# 設計図は canopy.py（礎石のかわりに柱の台座。柱・桁・方杖・鼻かくしは白くぬった木、木目なし）
#   屋根の板：のき先にそって、よこにならべた板（はば0.16。板のさかいに線）。すみむねは屋根と同じ緑の細い板。
#   てっぺんのかざり：台・くびれ・玉（ろくろでけずった木）。
from blueprint import Part as P
from common import *
import canopy as C
ID='gazebo';SZ=(2,2);BOTTOM=136;GRAD=True
VIEWS=[('gazebo',0)]
POST=(250,240,232);ROOF=(160,189,155);SEAM=(130,160,128);RIDGE=(178,204,172)   # お手本の色（屋根 #a0bd9b・柱 #eee2d9）
def roof(x,y,z):
    f,d=C.face(x,y);return SEAM if (d%0.16)<0.018 else ROOF
def fin(az):return [(0.12,az-0.02),(0.12,az+0.05),(0.10,az+0.08),(0.06,az+0.12),(0.05,az+0.17),(0.07,az+0.21),(0.08,az+0.25),(0.05,az+0.28),(0.03,az+0.31),(0.065,az+0.34),(0.075,az+0.39),(0.06,az+0.44),(0.0,az+0.47)]
def PARTS():
    L=C.build([],POST,POST,ROOF,RIDGE,PW=0.13,PH=1.84,FH=0.07,base=(0.12,'wood'),finial=fin,ridge_r=0.03,roof_decal=roof)
    for p in L:
        if p.name.startswith(('柱','台座','桁','貫','方杖','鼻かくし')):p.tex=False;p.soft1=True   # 白くぬった木：木目なし・うすいかげだけ
    return L
