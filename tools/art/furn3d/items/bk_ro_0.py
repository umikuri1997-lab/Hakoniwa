# 洞窟のバケモノ（ro）のチップ bkro#0：トリポのモデル（models/cave/bk_ro.glb）に色をぬり、ポーズをつけて写す（tools/art/cave/bake_rig.py。bake_build.py が作る）。
import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','cave'))
import bake_rig
from blueprint import Part as P
from natcommon import notex,flat
ID='bkro#0';GRAD=True;ELEV=20;BOTTOM=58
VIEWS=[('bkro#0',0)]
def PARTS():
    p=P('ro','model',('cave/bk_ro.glb',0.5,0.5,0,0.9,0,0),(255,255,255),on=('ground',),note='地面に立つ');p.warp=bake_rig.warp('ro','0');p.fsel=bake_rig.tear('ro');p.remesh=bake_rig.remesh('ro');p.paint=bake_rig.paint('ro')
    return[flat(notex(p))]
