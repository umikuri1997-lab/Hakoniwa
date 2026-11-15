# 生き物（にわとり）：トリポのモデル（tools/art/models/animals/niwatori.glb、tools/art/animals/animal_prep.py で色と構造を直した物）。高さ 0.5 マス。かげはうすいトゥーン。見おろしは15度（持ち主がえらんだ）。
from blueprint import Part as P
from natcommon import notex,flat
ID='anim:niwatori';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=15;BOTTOM=58
VIEWS=[('anim:niwatori',0)]
def PARTS():
    p=P('にわとり','model',('animals/niwatori.glb',0.5,0.5,0,0.5,0,0),(255,255,255),on=('ground',),note='地面に立つ');return[flat(notex(p))]
