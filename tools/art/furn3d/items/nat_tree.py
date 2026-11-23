# 草原の木（tree・ntree・fruit）：トリポの木（nat_tree.glb）。幹は皮のテクスチャ。葉は、モデルの葉の玉を、御神木と同じ小さな葉の部品でおおう（natcommon.leafballs）。
# 下のはしは、いまのチップ（56、g64）に合わせる。見おろしは4度（ほぼ正面）。高さはモデルのまま、よこ・おくゆきは1.3倍。
import natcommon
from natcommon import lift,nat,deep,flat,leafballs,post_specks,post_clean,barkdecal,barktexdecal,tone5,sunscreen
ID='tree';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=4;WIDE=1.3;BOTTOM=56
VIEWS=[('tree',0),('ntree',0),('fruit',0)]   # 植えた木・森の木・りんごの木（実のないとき）は、同じ絵
BARK=(196,124,84);H=1.9
LIFT=lift(0.45,0.9) if natcommon.ISO else None   # クォータービュー：見おろし48度だと葉が幹をかくし、地面にうまって見える。葉を上げて、幹の根もとを見せる（持ち主がえらんだ）
TONES=[(195,227,107),(178,218,100),(151,203,98),(120,188,105),(92,171,108)]   # お手本の木の葉の色（明るい→暗い）
# かげは枯れ木と同じ（持ち主がきめた）：幹も葉も、5色（かげ2色・もとの色・ハイライト2色）と輪郭、さかいめは市松もようのあみかけ。
# 幹の皮のすじは少しだけ。葉は、葉の部品のさかいめ（こい所）を1だん暗くして、つぶつぶの形をのこす。
LEAF=lambda a:a[...,1].astype(int)>a[...,0].astype(int)   # 緑（葉）
POST=lambda im:tone5(tone5(post_clean(im),(194,124,84),mask=lambda a:~LEAF(a),under=(LEAF,14,3.0),light=sunscreen(ELEV)),TONES[2],mask=LEAF,mix=0.85,blur=0.6,streak=(0,0),pal=TONES[::-1],olc=(74,140,96),light=sunscreen(ELEV))
def PARTS():return[flat(barktexdecal(nat('幹','nat_tree.glb',H,BARK,'bark',wide=WIDE,warp=LIFT),[(201,129,86),(194,124,84),(186,120,82),(177,114,79)],axis='z'))]
def EXTRA(sc):leafballs(sc,'nat_tree.glb',H,TONES,(84,152,100),wide=WIDE,warp=LIFT)
