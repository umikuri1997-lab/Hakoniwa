# きのこ（kinoko#1、シイタケ）：トリポのきのこ1本（nat_kinoko1.glb）。茶色のかさ（上ほど明るく、ふちは暗い）に白いひび、うすい色のじく（たてのせんい）、かさのうらのひだ（mushdecal）。
from natcommon import nat,flat,mushdecal,SUN
ID='kinoko1';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=25;BOTTOM=60
LIGHT=SUN   # 光は木と同じ太陽（natcommon.SUN）
VIEWS=[('kinoko#1',0)]
F='nat_kinoko1.glb';H=0.42
def PARTS():return[flat(mushdecal(nat('かさ',F,H,(150,96,62),'cap'),('cap','cracks'),[(170,114,74),(148,94,60),(116,72,48),(236,214,176)])),
    flat(mushdecal(nat('かさのうら',F,H,(236,212,170),'under'),'under',[(238,216,176),(212,186,146)])),
    flat(mushdecal(nat('じく',F,H,(238,220,184),'stem'),'stem',[(246,232,200),(234,216,180),(212,190,152)]))]
