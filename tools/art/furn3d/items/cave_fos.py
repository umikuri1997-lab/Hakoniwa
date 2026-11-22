# 化石のうまった石（cave:fos）：ひくい岩2つのあいだから、うずまき貝の化石（クリーム色の円ばん）が、半分のぞいている。
# 設計図（単位はマス）：左の岩（半径0.26×0.2・高さ0.3）、右の岩（半径0.3×0.22・高さ0.42）。地面におく。
#   貝：立てた円ばん（半径0.15・あつさ0.06）。まん中の高さ0.2。右の岩の前の面に、半分うまる。面に、うずまきの線。
from blueprint import Part as P
from common import *
from natcommon import hullrock
import math
ID='cave_fos';TONE5=True;DITHER=0;BOTTOM=60
VIEWS=[('cave:fos',0)]
PAL=[(182,166,148),(160,144,128),(138,123,110),(116,102,92),(96,84,76)]   # 洞窟の岩の色（明るい→暗い）
SHELL=(240,230,208);LINE=(196,176,150)
def PARTS():
    p=P('貝','wheel',(0.47,0.70,0.20,0.15,0.06),SHELL,detail=28,note='右の岩の前に、半分うまる');p.tex=False
    def sp(x,y,z):
        dx,dz=x-0.47,z-0.20;r=math.hypot(dx,dz);a=math.atan2(dz,dx)
        return LINE if ((r/0.15*2.6-a/(2*math.pi))%1.0)<0.22 and r>0.02 else None
    p.decal=sp
    return [p]
def EXTRA(sc):
    hullrock(sc,(0.30,0.62),(0.26,0.20),0.30,PAL,seed=21,gi='r1')
    hullrock(sc,(0.64,0.56),(0.30,0.22),0.42,PAL,seed=22,gi='r2')
