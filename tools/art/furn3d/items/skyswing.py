# 空中ブランコ（skyswing）：クォータービューの3D。設計図は tools/art/handoff3d/rides.py の swing（2×2マス）。
# 円い板張りの床（半径1.30マス）・まん中の太い柱・円すいの屋根（しま・波形の幕板・旗・ちょうちん2つ）・屋根の腕から、座席6つを、張った2本のひもで吊るす。
# 座席は、床の角度のまわりを回る（半径1.35マス・高さ1.07）。せいれいは、1つおきの3つにのる。
# 動く絵：床の角度 phase が 0〜60度の16コマ（座席6つなので、60度で、もとの絵にもどる）。ゲームでは、動かない所 skyswing:s に、動く所 skyswing:m<コマ> をかさねる。
from ride_common import *
ID='skyswing';GRAD=True;TONE5=True;DITHER=0;STREAK=(.22,.13);MERGE=0;SZ=(2,2)
VIEWS=[('skyswing',0)]
CX,CY=1.0,1.0;PERIOD=math.tau/6;PF=6   # PF：床の角度1まわり（2π）あたりのくりかえし（2π÷60度＝6）
CENTER=(CX,CY,1.2);PBOX=box(CX,CY,1.65,1.65,4.25)
def PARTS():return []
def EXTRA(sc):
    ph=PERIOD*(globals().get('FR') or 0)/FRAMES
    put(sc,RD.swing,CX,CY,ph)
