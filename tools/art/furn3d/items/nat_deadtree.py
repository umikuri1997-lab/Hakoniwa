# 枯れ木（deadtree）：トリポの枯れ木（nat_deadtree.glb）。皮のテクスチャ。いまのチップ（はば100・下のはし56、g64）に合わせる。
# かげはコワイノの絵と同じ付け方（持ち主がきめた）：明るさを多いだんにして、左上が明るく、右下とふちの内がわが暗い（POST の rimshade）。
from natcommon import nat,deep,flat,barktexdecal,post_clean,rimshade
POST=lambda im:rimshade(post_clean(im))
ID='deadtree';GRAD=True;SHADE4=[(10,-2),(21,-4),(33,-6)];ELEV=4;WIDE=1.3;BOTTOM=56
LIGHT=(-0.6,0.5,0.8)   # 光は左上・手前から（コワイノの絵と同じ）
VIEWS=[('deadtree',0)]
BARK=deep((200,138,104))
def PARTS():return[barktexdecal(nat('枯れ木','nat_deadtree.glb',1.4,BARK,'bark',wide=WIDE),[(212,150,113),(198,138,103),(186,127,96),(170,114,86)],axis='screen')]
