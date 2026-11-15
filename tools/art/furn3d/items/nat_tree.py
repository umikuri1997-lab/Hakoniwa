# 草原の木（tree・ntree・fruit）：トリポの木（nat_tree.glb）。幹は皮のテクスチャ。葉は、モデルの葉の玉を、御神木と同じ小さな葉の部品でおおう（natcommon.leafballs）。
# 下のはしは、いまのチップ（56、g64）に合わせる。見おろしは4度（ほぼ正面）。高さはモデルのまま、よこ・おくゆきは1.3倍。
from natcommon import nat,deep,flat,leafballs,post_specks,post_clean,barkdecal,barktexdecal
ID='tree';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=4;WIDE=1.3;BOTTOM=56
VIEWS=[('tree',0),('ntree',0),('fruit',0)]   # 植えた木・森の木・りんごの木（実のないとき）は、同じ絵
BARK=(196,124,84);H=1.9
TONES=[(195,227,107),(178,218,100),(151,203,98),(120,188,105),(92,171,108)]   # お手本の木の葉の色（明るい→暗い）
POST=post_clean
def PARTS():return[flat(barktexdecal(nat('幹','nat_tree.glb',H,BARK,'bark',wide=WIDE),[(201,129,86),(194,124,84),(186,120,82),(177,114,79)],axis='z'))]
def EXTRA(sc):leafballs(sc,'nat_tree.glb',H,TONES,(84,152,100),wide=WIDE)
