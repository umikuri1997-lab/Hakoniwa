# 闇の木（tree~y・deadtree~y）：トリポの枯れたオーク（nat_deadoak.glb、tools/art/nature3d/tree_prep.py で作る）。葉のない、ねじれた枝の木。幹は木の皮のテクスチャ。
from natcommon import nat,deep,flat,post_clean,barktexdecal,tone5,sunscreen
ID='tree~y';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=4;WIDE=1.0;BOTTOM=112;SCALE=2
VIEWS=[('tree~y',0),('deadtree~y',2)]
BARK=deep((168,140,126));H=1.7
POST=lambda im:tone5(post_clean(im),(170,144,130),light=sunscreen(ELEV))
def PARTS():return[flat(barktexdecal(nat('幹','nat_deadoak.glb',H,BARK,'bark',wide=WIDE),[(180,154,140),(170,144,130),(160,134,122),(148,124,114)],axis='screen'))]
