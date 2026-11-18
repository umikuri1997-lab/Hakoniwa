# 飼う生き物（モコダマ）のチップ ani:moko#w3（歩く4）：持ち主のモデル（animals/hitsuji.glb）にボーンを入れて、ポーズをつけて写す（tools/art/animals/ani_rig.py）。うしろ（ani_rig.VROT。ani_build.py が作る）。
import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','animals'))
import ani_rig
from blueprint import Part as P
from natcommon import notex,flat
ID='ani:moko#uw3';GRAD=False;SHADE=[(4.5,-1.2),(9,-2.5)];ELEV=15;BOTTOM=58
VIEWS=[('ani:moko#uw3',0)]
def PARTS():
    ani_rig.load('hitsuji',0.75)
    p=P('モコダマ','model',('animals/hitsuji.glb',0.5,0.5,0,0.75,0,0),(255,255,255),on=('ground',),note='地面に立つ');p.warp=ani_rig.warp('hitsuji','w3',rot=ani_rig.VROT['u']);return[flat(notex(p))]
