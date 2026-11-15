# 生き物（かたつむり）：トリポのモデル（tools/art/models/animals/katatsumuri.glb、tools/art/animals/animal_prep.py で色と構造を直した物）。高さ 0.3 マス。かげはうすいトゥーン。見おろしは15度（持ち主がえらんだ）。
from blueprint import Part as P
from natcommon import notex,flat
ID='anim:katatsumuri';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=15;BOTTOM=58
VIEWS=[('anim:katatsumuri',0)]
def PARTS():
    p=P('かたつむり','model',('animals/katatsumuri.glb',0.5,0.5,0,0.3,0,0),(255,255,255),on=('ground',),note='地面に立つ');return[flat(notex(p))]
