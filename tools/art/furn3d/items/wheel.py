# 観覧車（wheel）：クォータービューの3D。設計図は tools/art/handoff3d/rides.py の wheel（3×2マス）。
# 円い板張りの床（半径1.49マス）・手前に階段・柵・二重の輪を木の支柱と軸で受け、屋根つきの8室をつるす・軸の先に旗。輪は x と高さの面（3マスのはばの向き）に立つ。
# 輪は、軸のまわりを回る。室は、いつもまっすぐつるされたまま（回らない）。せいれいは、1つおきの4室にのる。
# 動く絵：輪の角度 phase が 0〜45度の16コマ（室8つ・輪のスポーク8本なので、45度で、もとの絵にもどる）。ゲームでは、動かない所 wheel:s に、動く所 wheel:m<コマ> をかさねる。
from ride_common import *
ID='wheel';GRAD=True;TONE5=True;DITHER=0;STREAK=(.22,.13);MERGE=0;SZ=(3,2)
VIEWS=[('wheel',0)]
CX,CY=1.5,1.0;PERIOD=math.tau/8;PF=2.8   # PF：床の角度1まわり（2π）あたりのくりかえし（2π×はやさ.35÷45度＝2.8）
CENTER=(CX,CY,1.2);PBOX=box(CX,CY,1.7,1.7,4.3)
def PARTS():return []
def EXTRA(sc):
    ph=PERIOD*(globals().get('FR') or 0)/FRAMES
    put(sc,RD.wheel,CX,CY,ph)
