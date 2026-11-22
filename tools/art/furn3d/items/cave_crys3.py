# 洞窟の水晶（cave:crys#3 のもと）：細長い1本の水晶（少しかたむく）。外のフリーの3Dモデル（Kenney「Tower Defense Kit」の detail-crystal、CC0。tools/art/models/kenney/space）。持ち主のたのみで、形と大きさのちがう水晶をふやした。
# 1本ずつ輪郭線を出し、面ごとに5だんの灰色（natcommon.modelfacets）。ゲームで、こさの番号から階ごとの色にぬりかえる。
from natcommon import modelfacets
ID='cave_crys3';GRAD=False;SHADE=[(9,-2.5),(18,-5)];BOTTOM=58;ELEV=24
VIEWS=[('cave_crys3',0)]
PAL=[(235,235,235),(200,200,200),(160,160,160),(120,120,120),(85,85,85)]
def PARTS():return[]
def EXTRA(sc):modelfacets(sc,'kenney/space/td_crystal.glb',(0.5,0.55),0.42,PAL,zs=2.3,rot=30,tilt=12,view=24,gi='c')
