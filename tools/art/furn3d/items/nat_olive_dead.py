# 土のステージの枯れ木（deadtree~t、かれたオリーブ）：オリーブ（olive.glb）の幹と枝だけ。皮のテクスチャ。かげは草原の枯れ木と同じ（tone5）。
from natcommon import nat,deep,barktexdecal,post_clean,tone5,sunscreen,SUN
POST=lambda im:tone5(post_clean(im),(176,150,124),light=sunscreen(ELEV))
ID='deadtree~t';GRAD=True;SHADE4=[(10,-2),(21,-4),(33,-6)];ELEV=4;WIDE=1.3;BOTTOM=56
LIGHT=SUN
VIEWS=[('deadtree~t',0)]
BARK=deep((176,150,124))
def PARTS():return[barktexdecal(nat('かれた幹と枝','olive.glb',1.75,BARK,'bark',wide=WIDE),[(188,162,136),(176,150,124),(164,139,115),(150,127,106)],axis='screen')]
