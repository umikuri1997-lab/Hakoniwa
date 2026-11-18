# ゆれる草むら（kdkusa、もりのこだまの見つかる所）：ベリーの茂みと同じ作り（nat_bush.glb の葉の玉を、小さな葉の部品でおおう）で、ひくく小さく（高さ0.40マス・よこ1.3倍）。実はない。ゆれるのはゲームでつける。
from natcommon import leafballs,post_specks,tone5,sunscreen
ID='kdkusa';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=25;WIDE=1.3;BOTTOM=60
VIEWS=[('kdkusa',0)]
H=0.40
TONES=[(190,224,104),(166,210,100),(140,198,98),(96,172,104),(80,158,108)]   # ベリーの茂みより少し明るい草の色
POST=lambda im:tone5(post_specks(im),TONES[2],mix=0.85,blur=0.6,streak=(0,0),pal=TONES[::-1],olc=(72,138,100),light=sunscreen(ELEV))
def PARTS():return[]
def EXTRA(sc):leafballs(sc,'nat_bush.glb',H,TONES,(72,138,100),gap=0.05,L=0.075,W=0.05,wide=WIDE)
