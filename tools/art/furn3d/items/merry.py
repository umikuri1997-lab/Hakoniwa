# メリーゴーラウンド（merry）：クォータービューの3D。設計図は tools/art/handoff3d/rides.py の carousel（3×3マス）。
# 円い板張りの床（半径1.30マス・2だんの台）・手前に階段・外まわりの柵と布のかざり・まん中の柱とひさし・しまの屋根・旗・
# ちょうちん2つ・馬3頭（柱でつるす）。馬は、まわりながら上下にゆれる（持ち主がきめた）：ふれ0.12マス・馬ごとに30度ずつずらし、1周に4回。
# 動く絵：床の角度 phase が 0〜120度の16コマ（馬3頭なので、120度で、もとの絵にもどる）。ゲームでは、動かない所 merry:s に、動く所 merry:m<コマ> をかさねる。
from ride_common import *
ID='merry';GRAD=True;TONE5=True;DITHER=0;STREAK=(.22,.13);MERGE=0;SZ=(3,3)
VIEWS=[('merry',0)]
CX,CY=1.5,1.5;PERIOD=math.tau/3;BOB=.12;PF=3   # PF：床の角度1まわり（2π）あたりのコマのくりかえし（2π×はやさの倍÷くりかえしの角度。メリーは120度で1まわり＝3）
CENTER=(CX,CY,1.2);PBOX=box(CX,CY,1.55,1.55,3.65)
def PARTS():return []
def EXTRA(sc):
    ph=PERIOD*(globals().get('FR') or 0)/FRAMES
    M=globals();M['SEATS']=put(sc,RD.carousel,CX,CY,ph,bob=BOB)
