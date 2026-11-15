# 生き物（はりねずみ）：トリポのモデル（tools/art/models/animals/harinezumi.glb、tools/art/animals/animal_prep.py で色と構造を直した物）。高さ 0.35 マス。かげはうすいトゥーン。
from blueprint import Part as P
from natcommon import notex,flat
ID='anim:harinezumi';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=25;BOTTOM=58
VIEWS=[('anim:harinezumi',0)]
def PARTS():
    p=P('はりねずみ','model',('animals/harinezumi.glb',0.5,0.5,0,0.35,0,0),(255,255,255),on=('ground',),note='地面に立つ');return[flat(notex(p))]
