# 生き物（りす）：トリポのモデル（tools/art/models/animals/risu.glb、tools/art/animals/animal_prep.py で色と構造を直した物）。高さ 0.45 マス。かげはうすいトゥーン。見おろしは15度（持ち主がえらんだ）。
from blueprint import Part as P
from natcommon import notex,flat
ID='anim:risu';GRAD=False;SHADE=[(4.5,-1.2),(9,-2.5)];ELEV=15;BOTTOM=58
VIEWS=[('anim:risu',0)]
def PARTS():
    p=P('りす','model',('animals/risu.glb',0.5,0.5,0,0.45,0,0),(255,255,255),on=('ground',),note='地面に立つ');return[flat(notex(p))]
