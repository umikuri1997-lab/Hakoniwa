# 洞窟のバケモノ（hone）のチップ bkhone#w2：トリポのモデル（models/cave/bk_hone.glb）に色をぬり、ポーズをつけて写す（tools/art/cave/bake_rig.py。bake_build.py が作る）。
import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','cave'))
import bake_rig
from blueprint import Part as P
from natcommon import notex,flat
ID='bkhone#w2';GRAD=True;ELEV=20;BOTTOM=58
VIEWS=[('bkhone#w2',0)]
def PARTS():
    p=P('hone','model',('cave/bk_hone.glb',0.5,0.5,0,1.0,0,0),(255,255,255),on=('ground',),note='地面に立つ');p.warp=bake_rig.warp('hone','w2');p.fsel=bake_rig.tear('hone');p.remesh=bake_rig.remesh('hone');p.paint=bake_rig.paint('hone')
    return[flat(notex(p))]
