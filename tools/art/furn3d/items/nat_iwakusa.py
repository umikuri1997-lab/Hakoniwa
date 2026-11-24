# 土のステージの雑草（weed2g、いわ草）：トリポのいわ草（iwakusa.glb）。みじかいかたい葉の、ひくい株。葉は、あかるい緑。高さはモデルの0.75倍（たのんだ形より葉が長いので、ひくく）。
from natcommon import nat,flat,SUN
ID='weed2g';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=25;BOTTOM=60
LIGHT=SUN
VIEWS=[('weed2g',0)]
def PARTS():
    p=flat(nat('葉','iwakusa.glb',0.42,(150,198,108),'leaf'));p.dims=tuple(p.dims)+(0.75,);return[p]   # zs：高さだけ0.75倍
