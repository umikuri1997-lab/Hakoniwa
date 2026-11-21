# 洞窟のバケモノ（kui）のチップ bkkui#a0：トリポのモデル（models/cave/bk_kui.glb）に色をぬり、ポーズをつけて写す（tools/art/cave/bake_rig.py。bake_build.py が作る）。
import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','cave'))
import bake_rig
from blueprint import Part as P
from natcommon import notex,flat
ID='bkkui#a0';GRAD=True;ELEV=20;BOTTOM=58
VIEWS=[('bkkui#a0',0)]
def PARTS():
    p=P('kui','model',('cave/bk_kui.glb',0.5,0.5,0,0.95,0,0),(255,255,255),on=('ground',),note='地面に立つ');p.warp=bake_rig.warp('kui','a0');p.fsel=bake_rig.tear('kui');p.remesh=bake_rig.remesh('kui');p.paint=bake_rig.paint('kui')
    return[flat(notex(p))]
