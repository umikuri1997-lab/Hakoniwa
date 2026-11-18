# 枯れ木（deadtree）：トリポの枯れ木（nat_deadtree.glb）。皮のテクスチャ。いまのチップ（はば100・下のはし56、g64）に合わせる。
# かげはコワイノの絵と同じ付け方（持ち主がきめた）：左上から光。幹の色は5つだけ（かげ2色・base・ハイライト2色）で、さかいめは市松もようのあみかけ。皮のすじは少しだけ（POST の tone5）。
from natcommon import nat,deep,barktexdecal,post_clean,tone5,sunscreen,SUN
POST=lambda im:tone5(post_clean(im),(198,138,103),light=sunscreen(ELEV))
ID='deadtree';GRAD=True;SHADE4=[(10,-2),(21,-4),(33,-6)];ELEV=4;WIDE=1.3;BOTTOM=56
LIGHT=SUN   # 光は自然の物の太陽（natcommon.SUN）
VIEWS=[('deadtree',0,0),('deadtree#1',0,45),('deadtree#2',0,180)]   # 3つ目は、同じ木をまわした角度（マスごとにえらんで、ならんだ木が同じ形に見えないように）
BARK=deep((200,138,104))
VAR=0
def PARTS():return[barktexdecal(nat('枯れ木','nat_deadtree.glb',1.4,BARK,'bark',rot=VAR or 0,wide=WIDE),[(212,150,113),(198,138,103),(186,127,96),(170,114,86)],axis='screen')]
