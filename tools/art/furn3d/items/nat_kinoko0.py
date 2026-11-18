# きのこ（kinoko#0、ベニテングタケ）：トリポのきのこ2本（nat_kinoko0.glb）。赤いかさ（上ほど明るく、ふちは暗い）に白いいぼ、白いじく（たてのせんい）、かさのうらのひだ（mushdecal）。
from natcommon import nat,flat,mushdecal,SUN
ID='kinoko0';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=25;BOTTOM=60
LIGHT=SUN   # 光は木と同じ太陽（natcommon.SUN）
VIEWS=[('kinoko#0',0)]
F='nat_kinoko0.glb';H=0.55
def PARTS():return[flat(mushdecal(nat('かさ',F,H,(226,72,58),'cap'),('cap','warts'),[(240,96,74),(222,68,56),(184,48,44),(252,246,236)],seed=2)),
    flat(mushdecal(nat('かさのうら',F,H,(240,222,190),'under'),'under',[(242,226,196),(214,192,160)])),
    flat(mushdecal(nat('じく',F,H,(244,232,204),'stem'),'stem',[(250,244,226),(240,228,200),(218,202,172)]))]
