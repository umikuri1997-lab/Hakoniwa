# 洞窟の水晶（cave:crys#5 のもと）：ひくく広いかたまり。外のフリーの3Dモデル（Kenney「Tower Defense Kit」の detail-crystal、CC0。tools/art/models/kenney/space）。持ち主のたのみで、形と大きさのちがう水晶をふやした。
# 1本ずつ輪郭線を出し、面ごとに5だんの灰色（natcommon.modelfacets）。ゲームで、こさの番号から階ごとの色にぬりかえる。
from natcommon import modelfacets
ID='cave_crys5';GRAD=False;SHADE=[(9,-2.5),(18,-5)];BOTTOM=58;ELEV=24
VIEWS=[('cave_crys5',0)]
PAL=[(235,235,235),(200,200,200),(160,160,160),(120,120,120),(85,85,85)]
def PARTS():return[]
def EXTRA(sc):modelfacets(sc,'kenney/space/td_crystal_large.glb',(0.5,0.6),0.55,PAL,zs=0.85,rot=130,view=24,gi='c')
