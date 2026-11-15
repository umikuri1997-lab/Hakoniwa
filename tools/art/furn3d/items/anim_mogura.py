# 生き物（もぐら）：トリポのモデル（tools/art/models/animals/mogura.glb、tools/art/animals/animal_prep.py で色と構造を直した物）。高さ .32 マス。かげはうすいトゥーン。
from blueprint import Part as P
from natcommon import notex,flat
ID='anim:mogura';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=25;BOTTOM=58
VIEWS=[('anim:mogura',0)]
def PARTS():
    p=P('もぐら','model',('animals/mogura.glb',0.5,0.5,0,.32,0,0),(255,255,255),on=('ground',),note='地面に立つ');return[flat(notex(p))]
