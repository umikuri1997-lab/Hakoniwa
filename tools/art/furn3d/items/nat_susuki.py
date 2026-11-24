# 土のステージの雑草（weed2k、かれすすき）：トリポのすすき（susuki.glb）。わらの色の細い葉の株と、うすいクリーム色の穂3本。
from natcommon import nat,flat,SUN
ID='weed2k';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=25;BOTTOM=60
LIGHT=SUN
VIEWS=[('weed2k',0)]
F='susuki.glb';H=0.85
def PARTS():return[flat(nat('葉',F,H,(214,190,138),'leaf')),flat(nat('穂',F,H,(240,228,196),'under'))]
