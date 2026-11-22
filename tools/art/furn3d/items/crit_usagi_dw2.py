# 小さな生き物（usagi）のチップ critusagi#dw2：持ち主のモデル（animals/usagi.glb）にボーンを入れて、ポーズをつけて写す（tools/art/critter3d/crit_rig.py。crit_build.py が作る）。
import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','critter3d'))
import crit_rig
from blueprint import Part as P
from natcommon import notex,flat
ID='critusagi#dw2';PX=32;LW=1;GRAD=False;SHADE=[(4.5,-1.2),(9,-2.5)];ELEV=15;BOTTOM=58
VIEWS=[('critusagi#dw2',0)]
def PARTS():
    p=P('usagi','model',('animals/usagi.glb',0.5,0.5,0,0.45,0,0),(255,255,255),on=('ground',),note='地面に立つ');p.warp=crit_rig.warp('usagi','dw2');p.paint=crit_rig.paint('usagi')
    return[flat(notex(p))]+[notex(P('小物',k,d,c,on=('ground',),note='手にもつ')) for k,d,c in crit_rig.props('usagi','dw2')]
