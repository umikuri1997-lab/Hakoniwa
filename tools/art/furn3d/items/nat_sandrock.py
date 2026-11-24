# 土のステージの岩（rock~t、砂岩の大岩）：トリポの砂岩の大岩（sandrock.glb）。はばが高さの2倍くらいの、横のしまの岩。はばは1.5マスくらい（草原の岩と同じ）。
# 色は、谷のがけの絵と同じ、すなの岩（横のしまは高さで3色）。
from natcommon import nat,flat,SUN
import math
ID='rock~t';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=25;BOTTOM=60
LIGHT=SUN
VIEWS=[('rock~t',0)]
BAND=[(232,198,164),(194,152,122),(240,212,178),(210,170,138)]
def PARTS():
    p=flat(nat('岩','sandrock.glb',0.78,BAND[0],'dot'))
    p.decal=lambda x,y,z:BAND[int((z+0.015*math.sin(x*9+y*5))/0.05)%4] if z<0.52 else BAND[2]   # 横のしまは横の面だけ（上の面まで入れると、上から見て年輪のような輪になった）
    return[p]
