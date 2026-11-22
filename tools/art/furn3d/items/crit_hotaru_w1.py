# 小さな生き物（hotaru）のチップ crithotaru#w1：持ち主のモデル（animals/hotaru.glb）にボーンを入れて、ポーズをつけて写す（tools/art/critter3d/crit_rig.py。crit_build.py が作る）。
import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','critter3d'))
import crit_rig
from blueprint import Part as P
from natcommon import notex,flat
ID='crithotaru#w1';PX=32;LW=1;GRAD=False;SHADE=[(4.5,-1.2),(9,-2.5)];ELEV=15;BOTTOM=58
VIEWS=[('crithotaru#w1',0)]
def PARTS():
    p=P('hotaru','model',('animals/hotaru.glb',0.5,0.5,0,0.25,0,0),(255,255,255),on=('ground',),note='地面に立つ');p.warp=crit_rig.warp('hotaru','w1');p.paint=crit_rig.paint('hotaru')
    return[flat(notex(p))]+[notex(P('小物',k,d,c,on=('ground',),note='手にもつ')) for k,d,c in crit_rig.props('hotaru','w1')]
