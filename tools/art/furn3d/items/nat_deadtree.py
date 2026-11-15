# 枯れ木（deadtree）：トリポの枯れ木（nat_deadtree.glb）。皮のテクスチャ。いまのチップ（はば100・下のはし56、g64）に合わせる。
from natcommon import nat,deep,dots,flat,barkdecal,barktexdecal,post_clean
POST=post_clean
ID='deadtree';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=4;WIDE=1.3;BOTTOM=56
VIEWS=[('deadtree',0)]
BARK=deep((200,138,104))
def PARTS():return[flat(x) for x in [barktexdecal(nat('枯れ木','nat_deadtree.glb',1.4,BARK,'bark',wide=WIDE),[(204,143,108),(196,136,102),(188,129,99),(179,123,93)],axis='screen')]]
