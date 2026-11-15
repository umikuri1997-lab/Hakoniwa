# ベリーの茂み（berry）：トリポの茂み（nat_bush.glb）。葉の玉を、小さな葉の部品でおおう（natcommon.leafballs）。いまのチップ（はば90・下のはし64、g64）に合わせる。
from natcommon import leafballs,post_specks
ID='berry';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=25;WIDE=1.6;BOTTOM=64
VIEWS=[('berry',0)]
H=0.62;POST=post_specks
TONES=[(181,218,99),(160,206,98),(136,196,97),(92,169,103),(78,156,107)]   # お手本のベリーの茂みの色
def PARTS():return[]
def EXTRA(sc):leafballs(sc,'nat_bush.glb',H,TONES,(70,136,100),gap=0.05,L=0.085,W=0.055,wide=WIDE)
