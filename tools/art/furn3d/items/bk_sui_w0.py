# 洞窟のバケモノ（sui）のチップ bksui#w0：トリポのモデル（models/cave/bk_sui.glb）に色をぬり、ポーズをつけて写す（tools/art/cave/bake_rig.py。bake_build.py が作る）。
import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','cave'))
import bake_rig
from blueprint import Part as P
from natcommon import notex,flat
ID='bksui#w0';GRAD=True;ELEV=20;BOTTOM=58
VIEWS=[('bksui#w0',0)]
def PARTS():
    p=P('sui','model',('cave/bk_sui.glb',0.5,0.5,0,0.8,0,0),(255,255,255),on=('ground',),note='地面に立つ');p.warp=bake_rig.warp('sui','w0');p.fsel=bake_rig.tear('sui');p.remesh=bake_rig.remesh('sui');p.paint=bake_rig.paint('sui')
    return[flat(notex(p))]
