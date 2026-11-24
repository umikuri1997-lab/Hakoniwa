# 砂岩（素材のアイコンだけ。tools/art/tsuchi/earth_mat_icons.py）：トリポの砂岩のかけら（sagan.glb）。横のしまの、すなの岩。チップには入れない。
from natcommon import nat,flat,SUN
import math
ID='sagan_icon';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=25;BOTTOM=60
LIGHT=SUN
VIEWS=[('sagan_icon',0)]
BAND=[(234,200,166),(206,166,134),(242,214,180),(218,180,146)]
def PARTS():
    p=flat(nat('砂岩','sagan.glb',0.5,BAND[0],'dot'))
    p.decal=lambda x,y,z:BAND[int((z+0.02*math.sin(x*11+y*7))/0.07)%4]   # 横のしま
    return[p]
