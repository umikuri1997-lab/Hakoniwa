# 洞窟の水晶（cave:crys#1 のもと）：地面から生える、水晶のかたまり。持ち主のたのみで、外のフリーの3Dモデルを使う（Kenney「Tower Defense Kit」の detail-crystal、CC0。tools/art/models/kenney/space）。
# 設計図（単位はマス）：モデル td_crystal_large.glb を、高さ0.85マスに大きくして（たて1.25倍）、20度まわす。地面から生える。
#   1本ずつにわけて、あいだに輪郭線を出し、面ごとに光の向きで5だんの灰色（natcommon.modelfacets）。ゲームで、こさの番号から階ごとの色（むらさき・水色・こはく色）にぬりかえる。
from natcommon import modelfacets
ID='cave_crys1';GRAD=False;SHADE=[(9,-2.5),(18,-5)];BOTTOM=58;ELEV=24
VIEWS=[('cave_crys1',0)]
PAL=[(235,235,235),(200,200,200),(160,160,160),(120,120,120),(85,85,85)]
def PARTS():return[]
def EXTRA(sc):modelfacets(sc,'kenney/space/td_crystal_large.glb',(0.5,0.55),0.85,PAL,zs=1.25,rot=20,gi='c',view=24)
