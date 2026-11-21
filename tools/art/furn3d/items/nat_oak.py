# 水の木（tree~m・deadtree~m）：トリポのオーク（nat_oak.glb、tools/art/nature3d/tree_prep.py で作る）。作り方は風の木（nat_acacia.py）と同じ。
# まるく大きくひろがる、水べの村の木。植えた木も自然の木も、この形（自然の木は、うしろからの向き）。
from natcommon import nat,deep,flat,leafballs,post_clean,barktexdecal,tone5,sunscreen
ID='tree~m';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=4;WIDE=1.0;BOTTOM=56
VIEWS=[('tree~m',0),('deadtree~m',2)]
BARK=deep((176,124,92));H=1.9
TONES=[(178,222,128),(156,208,112),(130,192,104),(108,174,100),(90,156,98)]   # オークの葉（ふかい緑）
LEAF=lambda a:a[...,1].astype(int)>a[...,0].astype(int)
POST=lambda im:tone5(tone5(post_clean(im),(182,128,94),mask=lambda a:~LEAF(a),under=(LEAF,14,3.0),light=sunscreen(ELEV)),TONES[2],mask=LEAF,mix=0.85,blur=0.6,streak=(0,0),pal=TONES[::-1],olc=(80,136,86),light=sunscreen(ELEV))
def PARTS():return[flat(barktexdecal(nat('幹','nat_oak.glb',H,BARK,'bark',wide=WIDE),[(190,134,98),(182,128,94),(174,122,90),(164,115,86)],axis='screen'))]
def EXTRA(sc):leafballs(sc,'nat_oak.glb',H,TONES,(84,140,88),gap=0.05,L=0.09,W=0.055,wide=WIDE)
