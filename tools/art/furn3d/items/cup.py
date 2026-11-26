# コーヒーカップ（cup）：クォータービューの3D。設計図は tools/art/handoff3d/rides.py の cups（2×2マス）。
# 円い板張りの床（半径1.34マス）・手前に階段・外まわりの柵と布のかざり・うしろの門形のアーチ（看板とちょうちん・旗）・受け皿つきのカップ3つ（軌道の半径0.71）。
# カップは、中心のまわりを回りながら、自分でも回る（持ち主がきめた）：自分の回りは軌道の3倍（取っ手のむきがかわる）。せいれいは、カップ2つ（1・2ばん）にのる。
# 動く絵：床の角度 phase が 0〜120度の16コマ（カップ3つ・自分の回りが3倍なので、120度で、もとの絵にもどる）。ゲームでは、動かない所 cup:s に、動く所 cup:m<コマ> をかさねる。
from ride_common import *
ID='cup';GRAD=True;TONE5=True;DITHER=0;STREAK=(.22,.13);MERGE=0;SZ=(2,2)
VIEWS=[('cup',0)]
CX,CY=1.0,1.0;PERIOD=math.tau/3;SPIN=3;PF=3.9   # PF：床の角度1まわり（2π）あたりのくりかえし（2π×はやさ1.3倍÷120度＝3.9）
CENTER=(CX,CY,1.2);PBOX=box(CX,CY,1.55,1.55,3.2)
def PARTS():return []
def EXTRA(sc):
    ph=PERIOD*(globals().get('FR') or 0)/FRAMES
    put(sc,RD.cups,CX,CY,ph,spin=SPIN)
