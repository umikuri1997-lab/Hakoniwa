# 火山の木（tree~v）：トリポのとんがりの木（nat_cedar.glb）。幹は木の皮のテクスチャ（barktexdecal）、葉は小さな葉の部品（natcommon.leafballs）。
# 高さはモデルのまま、よこ・おくゆきは1.3倍。見おろしは4度（ほぼ正面）。かげはうすいトゥーン。
from natcommon import nat,deep,flat,leafballs,post_clean,barktexdecal,tone5,sunscreen
ID='tree~v';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=4;WIDE=1.3;BOTTOM=124;SCALE=2
VIEWS=[('tree~v',0)]
BARK=deep((176,110,80));H=2.0
TONES=[(168,206,120),(150,194,110),(134,182,102),(120,170,96),(108,158,90)]   # とんがりの木の葉（すこし青い緑）
# かげは枯れ木・草原の木と同じ（持ち主がきめた）：5色（かげ2色・もとの色・ハイライト2色）と輪郭、さかいめは市松もようのあみかけ（natcommon.tone5）。
LEAF=lambda a:a[...,1].astype(int)>a[...,0].astype(int)   # 緑（葉）
POST=lambda im:tone5(tone5(post_clean(im),(212, 152, 120),mask=lambda a:~LEAF(a),under=(LEAF,14,3.0),light=sunscreen(ELEV)),TONES[2],mask=LEAF,mix=0.85,blur=0.6,streak=(0,0),pal=TONES[::-1],olc=(96,142,84),light=sunscreen(ELEV))
def PARTS():return[flat(barktexdecal(nat('幹','nat_cedar.glb',H,BARK,'bark',wide=WIDE),[(219,161,129),(212,152,120),(204,145,114),(194,137,108)],axis='z'))]
def EXTRA(sc):leafballs(sc,'nat_cedar.glb',H,TONES,(96,142,84),gap=0.05,L=0.09,W=0.05,wide=WIDE)
