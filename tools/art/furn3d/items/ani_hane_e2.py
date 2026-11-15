# 飼う生き物（ハネマリ）のチップ ani:hane#e2（食べる3）：持ち主のモデル（animals/niwatori.glb）にボーンを入れて、ポーズをつけて写す（tools/art/animals/ani_rig.py）。右むき（ani_rig.ROT）。
import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','animals'))
import ani_rig
from blueprint import Part as P
from natcommon import notex,flat
ID='ani:hane#e2';GRAD=False;SHADE=[(4.5,-1.2),(9,-2.5)];ELEV=15;BOTTOM=58
VIEWS=[('ani:hane#e2',0)]
def PARTS():
    ani_rig.load('niwatori',0.5)
    p=P('ハネマリ','model',('animals/niwatori.glb',0.5,0.5,0,0.5,0,0),(255,255,255),on=('ground',),note='地面に立つ');p.warp=ani_rig.warp('niwatori','e2');return[flat(notex(p))]
