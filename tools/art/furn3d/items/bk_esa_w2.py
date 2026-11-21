# 洞窟のバケモノ（esa）のチップ bkesa#w2：トリポのモデル（models/cave/bk_esa.glb）に色をぬり、ポーズをつけて写す（tools/art/cave/bake_rig.py。bake_build.py が作る）。
import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','cave'))
import bake_rig
from blueprint import Part as P
from natcommon import notex,flat
ID='bkesa#w2';GRAD=True;ELEV=20;BOTTOM=58
VIEWS=[('bkesa#w2',0)]
def PARTS():
    p=P('esa','model',('cave/bk_esa.glb',0.5,0.5,0,0.7,0,0),(255,255,255),on=('ground',),note='地面に立つ');p.warp=bake_rig.warp('esa','w2');p.paint=bake_rig.paint('esa')
    return[flat(notex(p))]
