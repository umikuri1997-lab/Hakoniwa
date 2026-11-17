# きのこ（kinoko#2、ブナシメジ）：トリポのきのこ2本（nat_kinoko2.glb）。うすい茶色のかさ（上ほど明るく、ふちは暗い）にうすいまだら、白いじく（たてのせんい）、かさのうらのひだ（mushdecal）。
from natcommon import nat,flat,mushdecal,SUN
ID='kinoko2';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=25;BOTTOM=60
LIGHT=SUN   # 光は木と同じ太陽（natcommon.SUN）
VIEWS=[('kinoko#2',0)]
F='nat_kinoko2.glb';H=0.55
def PARTS():return[flat(mushdecal(nat('かさ',F,H,(214,166,108),'cap'),('cap','marble'),[(228,184,126),(210,162,106),(180,134,86),(238,206,160)],seed=4)),
    flat(mushdecal(nat('かさのうら',F,H,(242,224,190),'under'),'under',[(244,228,196),(220,198,162)])),
    flat(mushdecal(nat('じく',F,H,(246,236,212),'stem'),'stem',[(252,246,230),(244,234,210),(222,208,180)]))]
