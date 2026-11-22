# 洞窟の水晶（cave:crys#7 のもと）：小さな水晶のかけらが、ちらばる。外のフリーの3Dモデル（Kenney「Tower Defense Kit」の detail-crystal、CC0。tools/art/models/kenney/space）。持ち主のたのみで、形と大きさのちがう水晶をふやした。
# 1本ずつ輪郭線を出し、面ごとに5だんの灰色（natcommon.modelfacets）。ゲームで、こさの番号から階ごとの色にぬりかえる。
from natcommon import modelfacets
ID='cave_crys7';GRAD=False;SHADE=[(9,-2.5),(18,-5)];BOTTOM=58;ELEV=24
VIEWS=[('cave_crys7',0)]
PAL=[(235,235,235),(200,200,200),(160,160,160),(120,120,120),(85,85,85)]
def PARTS():return[]
def EXTRA(sc):modelfacets(sc,'kenney/space/td_crystal.glb',(0.25,0.5),0.2,PAL,zs=1.6,rot=10,tilt=-15,view=24,gi='a');modelfacets(sc,'kenney/space/td_crystal.glb',(0.55,0.42),0.26,PAL,zs=1.8,rot=80,tilt=8,view=24,gi='b');modelfacets(sc,'kenney/space/td_crystal.glb',(0.75,0.68),0.18,PAL,zs=1.5,rot=150,tilt=20,view=24,gi='c');modelfacets(sc,'kenney/space/td_crystal.glb',(0.42,0.78),0.14,PAL,zs=1.4,rot=200,view=24,gi='d')
