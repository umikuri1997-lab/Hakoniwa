# 土のステージの花（iwakagami、いわかがみ）：トリポのいわかがみ（iwakagami.glb）。つやのあるまるい葉のロゼット、赤いじく、うすいピンクのつりがねの花。
from natcommon import nat,flat,SUN
ID='iwakagami';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=25;BOTTOM=60
LIGHT=SUN
VIEWS=[('iwakagami',0)]
F='iwakagami.glb';H=0.5
def PARTS():return[flat(nat('葉',F,H,(128,182,110),'leaf')),flat(nat('じく',F,H,(196,108,98),'stem')),flat(nat('花',F,H,(244,170,184),'cap'))]
