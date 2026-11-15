# 生き物（ひつじ）：トリポのモデル（tools/art/models/animals/hitsuji.glb、tools/art/animals/animal_prep.py で色と構造を直した物）。高さ 0.75 マス。かげはうすいトゥーン。見おろしは15度（持ち主がえらんだ）。
from blueprint import Part as P
from natcommon import notex,flat
ID='anim:hitsuji';GRAD=False;SHADE=[(4.5,-1.2),(9,-2.5)];ELEV=15;BOTTOM=58
VIEWS=[('anim:hitsuji',0)]
def PARTS():
    p=P('ひつじ','model',('animals/hitsuji.glb',0.5,0.5,0,0.75,0,0),(255,255,255),on=('ground',),note='地面に立つ');return[flat(notex(p))]
