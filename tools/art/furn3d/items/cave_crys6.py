# 洞窟の水晶（cave:crys#6 のもと）：3本の水晶が、おうぎのように開く。外のフリーの3Dモデル（Kenney「Tower Defense Kit」の detail-crystal、CC0。tools/art/models/kenney/space）。持ち主のたのみで、形と大きさのちがう水晶をふやした。
# 1本ずつ輪郭線を出し、面ごとに5だんの灰色（natcommon.modelfacets）。ゲームで、こさの番号から階ごとの色にぬりかえる。
from natcommon import modelfacets
ID='cave_crys6';GRAD=False;SHADE=[(9,-2.5),(18,-5)];BOTTOM=58;ELEV=24
VIEWS=[('cave_crys6',0)]
PAL=[(235,235,235),(200,200,200),(160,160,160),(120,120,120),(85,85,85)]
def PARTS():return[]
def EXTRA(sc):modelfacets(sc,'kenney/space/td_crystal.glb',(0.32,0.58),0.34,PAL,zs=2.0,rot=10,tilt=-24,view=24,gi='a');modelfacets(sc,'kenney/space/td_crystal.glb',(0.5,0.52),0.42,PAL,zs=2.2,rot=70,view=24,gi='b');modelfacets(sc,'kenney/space/td_crystal.glb',(0.68,0.6),0.3,PAL,zs=1.9,rot=140,tilt=22,view=24,gi='c')
