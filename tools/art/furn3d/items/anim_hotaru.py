# 生き物（ほたる）：トリポのモデル（tools/art/models/animals/hotaru.glb、tools/art/animals/animal_prep.py で色と構造を直した物）。高さ 0.25 マス。かげはうすいトゥーン。見おろしは15度（持ち主がえらんだ）。
from blueprint import Part as P
from natcommon import notex,flat
ID='anim:hotaru';GRAD=False;SHADE=[(4.5,-1.2),(9,-2.5)];ELEV=15;BOTTOM=58
VIEWS=[('anim:hotaru',0)]
def PARTS():
    p=P('ほたる','model',('animals/hotaru.glb',0.5,0.5,0,0.25,0,0),(255,255,255),on=('ground',),note='地面に立つ');return[flat(notex(p))]
