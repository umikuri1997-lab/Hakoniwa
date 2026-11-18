# 飼う生き物（ツノクサ）のチップ ani:tsuno#e2（食べる3）：持ち主のモデル（animals/yagi.glb）にボーンを入れて、ポーズをつけて写す（tools/art/animals/ani_rig.py）。正面（ani_rig.VROT。ani_build.py が作る）。
import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','animals'))
import ani_rig
from blueprint import Part as P
from natcommon import notex,flat
ID='ani:tsuno#de2';GRAD=False;SHADE=[(4.5,-1.2),(9,-2.5)];ELEV=15;BOTTOM=58
VIEWS=[('ani:tsuno#de2',0)]
def PARTS():
    ani_rig.load('yagi',0.8)
    p=P('ツノクサ','model',('animals/yagi.glb',0.5,0.5,0,0.8,0,0),(255,255,255),on=('ground',),note='地面に立つ');p.warp=ani_rig.warp('yagi','e2',rot=ani_rig.VROT['d']);return[flat(notex(p))]
