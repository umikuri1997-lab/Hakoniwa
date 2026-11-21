# 水の木（メープル maple~m）：トリポのメープル（nat_maple.glb、tools/art/nature3d/tree_prep.py で作る）。ゆうやけ色の葉。作り方は風の木（nat_acacia.py）と同じ。
from natcommon import nat,deep,flat,leafballs,post_clean,barktexdecal,tone5,sunscreen
ID='maple~m';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=4;WIDE=1.0;BOTTOM=56
VIEWS=[('maple~m',0)]
BARK=deep((170,120,92));H=1.8
TONES=[(252,206,104),(248,180,92),(240,154,84),(226,130,78),(208,110,74)]   # メープルの葉（ゆうやけ色）
LEAF=lambda a:a[...,0].astype(int)-a[...,2].astype(int)>125   # だいだい（葉）。幹の茶は、これより小さい
POST=lambda im:tone5(tone5(post_clean(im),(176,124,94),mask=lambda a:~LEAF(a),under=(LEAF,14,3.0),light=sunscreen(ELEV)),TONES[2],mask=LEAF,mix=0.85,blur=0.6,streak=(0,0),pal=TONES[::-1],olc=(176,98,70),light=sunscreen(ELEV))
def PARTS():return[flat(barktexdecal(nat('幹','nat_maple.glb',H,BARK,'bark',wide=WIDE),[(184,130,98),(176,124,94),(168,118,90),(158,111,86)],axis='screen'))]
def EXTRA(sc):leafballs(sc,'nat_maple.glb',H,TONES,(196,104,72),gap=0.05,L=0.09,W=0.055,wide=WIDE)
