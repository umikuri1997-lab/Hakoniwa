# 洞窟のバケモノ（yoru）のチップ bkyoru#w0：トリポのモデル（models/cave/bk_yoru.glb）に色をぬり、ポーズをつけて写す（tools/art/cave/bake_rig.py。bake_build.py が作る）。
import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','cave'))
import bake_rig
from blueprint import Part as P
from natcommon import notex,flat
ID='bkyoru#w0';GRAD=True;ELEV=20;BOTTOM=58
VIEWS=[('bkyoru#w0',0)]
def PARTS():
    p=P('yoru','model',('cave/bk_yoru.glb',0.5,0.5,0,0.55,0,0),(255,255,255),on=('ground',),note='地面に立つ');p.warp=bake_rig.warp('yoru','w0');p.fsel=bake_rig.tear('yoru');p.remesh=bake_rig.remesh('yoru');p.paint=bake_rig.paint('yoru')
    return[flat(notex(p))]
