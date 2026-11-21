# 洞窟のバケモノ（tame）のチップ bktame#0：トリポのモデル（models/cave/bk_tame.glb）に色をぬり、ポーズをつけて写す（tools/art/cave/bake_rig.py。bake_build.py が作る）。
import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','cave'))
import bake_rig
from blueprint import Part as P
from natcommon import notex,flat
ID='bktame#0';GRAD=True;ELEV=20;BOTTOM=58
VIEWS=[('bktame#0',0)]
def PARTS():
    p=P('tame','model',('cave/bk_tame.glb',0.5,0.5,0,1.0,0,0),(255,255,255),on=('ground',),note='地面に立つ');p.warp=bake_rig.warp('tame','0');p.paint=bake_rig.paint('tame')
    return[flat(notex(p))]
