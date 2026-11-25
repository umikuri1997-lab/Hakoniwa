# 花・木のたねを植えた所の、土のもりあがり（mound#0〜#2、マスごとに1つえらぶ）。クォータービューの絵だけ。
# 作り方：python3 tools/art/iso/iso3d.py <出力> seedmound → 下で、てっぺんの高さ top をつけてチップに入れる
#   python3 -c "import sys;sys.path[:0]=['tools/art/iso','tools','tools/art/furn3d/items'];import iso3d as I,seedmound as M;R=I.load_out('<出力>');[c.update(top=M.top(int(k[-1]))) for k,c in R.items()];I.to_chips(R)"
#   top：てっぺんの、マスのまん中の地面からの高さ（ゲームの点）。種をそこに立てる（draw-objects.js の sprout）
# 設計図（1マス＝1、もりあがりのまん中はマスのまん中、すそは地面 z 0）：畑のたねの印（crop.py の mound）と同じ、まるい低い丘（farm.dome）。
#   大きさ（はばは画面で 小0.57・中0.82・大0.95マス。もとの絵の2倍、大は1マスにおさめる）：半径 R・高さ HT。色・かげは畑の土と同じ。
import farm
from natcommon import SUN
ID='seedmound';GRAD=False;LW=1;SHADE=[(9,-2.5),(18,-5)];ELEV=25;BOTTOM=64;LIGHT=SUN
R=(0.375,0.54,0.625);HT=(0.13,0.19,0.22)
VIEWS=[('mound#%d'%n,0,n) for n in range(3)]
VAR=None
def PARTS():
    n=VAR or 0;return [farm.dome('土のもりあがり',0.5,0.5,0.0,R[n],HT[n],False)]
def top(n):return round(HT[n]*36/0.8,1)   # 1だん（0.8マス）＝ゲームの36点（iso.js の IQL）
