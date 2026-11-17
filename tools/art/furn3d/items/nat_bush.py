# ベリーの茂み（berry）：トリポの茂み（nat_bush.glb）。葉の玉を、小さな葉の部品でおおう（natcommon.leafballs）。いまのチップ（はば90・下のはし64、g64）に合わせる。
from natcommon import leafballs,post_specks,tone5,sunscreen
ID='berry';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=25;WIDE=1.6;BOTTOM=64
VIEWS=[('berry',0)]
H=0.62
TONES=[(181,218,99),(160,206,98),(136,196,97),(92,169,103),(78,156,107)]   # お手本のベリーの茂みの色
# かげは枯れ木・草原の木と同じ（持ち主がきめた）：5色（かげ2色・もとの色・ハイライト2色）と輪郭、さかいめは市松もようのあみかけ（natcommon.tone5）。
POST=lambda im:tone5(post_specks(im),TONES[2],mix=0.85,blur=0.6,streak=(0,0),pal=TONES[::-1],olc=(70,136,100),light=sunscreen(ELEV))   # 光は木と同じ太陽（natcommon.SUN）を、このカメラの向きで
def PARTS():return[]
def EXTRA(sc):leafballs(sc,'nat_bush.glb',H,TONES,(70,136,100),gap=0.05,L=0.085,W=0.055,wide=WIDE)
