# 洞窟のバケモノ（mi）のチップ bkmi#1：トリポのモデル（models/cave/bk_mi.glb）に色をぬり、ポーズをつけて写す（tools/art/cave/bake_rig.py。bake_build.py が作る）。
import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','cave'))
import bake_rig
from blueprint import Part as P
from natcommon import notex,flat
ID='bkmi#1';GRAD=True;ELEV=20;BOTTOM=58
VIEWS=[('bkmi#1',0)]
def PARTS():
    p=P('mi','model',('cave/bk_mi.glb',0.5,0.5,0,1.3,0,0),(255,255,255),on=('ground',),note='地面に立つ');p.warp=bake_rig.warp('mi','1');p.paint=bake_rig.paint('mi')
    return[flat(notex(p))]
