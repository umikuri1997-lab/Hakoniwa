# 大岩（boulder）：お手本（いまの絵）と同じ、まるい大きな岩に、ひびの線。形は点をつつむ形（hullrock、まるく）。色はお手本の大岩の色（5だん）。
# 大きさは、いまのチップ（30×29・g32 → 60×58・下のはし64、g64）に合わせる。
from natcommon import hullrock,SUN
ID='boulder';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=25;BOTTOM=128;SCALE=2
LIGHT=SUN   # 光は木と同じ太陽（natcommon.SUN）
VIEWS=[('boulder',0)]
PAL=[(149,133,121),(134,119,108),(118,104,95),(110,96,88),(104,89,81)]   # お手本の大岩：明るい→暗い
def PARTS():return[]
def EXTRA(sc):hullrock(sc,(0.5,0.5),(0.48,0.38),0.52,PAL,seed=11,gi='b',ring=((0,1.0,14),(0.3,0.98,14),(0.6,0.86,12),(0.85,0.55,10),(1.0,0.12,4)),crack=(86,74,64))
