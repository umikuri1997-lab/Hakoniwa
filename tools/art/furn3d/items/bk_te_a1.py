# 洞窟のバケモノ（te）のチップ bkte#a1：トリポのモデル（models/cave/bk_te.glb）に色をぬり、ポーズをつけて写す（tools/art/cave/bake_rig.py。bake_build.py が作る）。
import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','cave'))
import bake_rig
from blueprint import Part as P
from natcommon import notex,flat
ID='bkte#a1';GRAD=True;ELEV=20;BOTTOM=58
VIEWS=[('bkte#a1',0)]
def PARTS():
    p=P('te','model',('cave/bk_te.glb',0.5,0.5,0,2.2,0,0),(255,255,255),on=('ground',),note='地面に立つ');p.warp=bake_rig.warp('te','a1');p.fsel=bake_rig.tear('te');p.remesh=bake_rig.remesh('te');p.paint=bake_rig.paint('te')
    return[flat(notex(p))]
