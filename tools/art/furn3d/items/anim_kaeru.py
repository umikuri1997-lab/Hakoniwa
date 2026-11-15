# 生き物（かえる）：トリポのモデル（tools/art/models/animals/kaeru.glb、tools/art/animals/animal_prep.py で色と構造を直した物）。高さ .3 マス。かげはうすいトゥーン。見おろしは15度（持ち主がえらんだ）。
from blueprint import Part as P
from natcommon import notex,flat
ID='anim:kaeru';GRAD=False;SHADE=[(4.5,-1.2),(9,-2.5)];ELEV=15;BOTTOM=58
VIEWS=[('anim:kaeru',0)]
def PARTS():
    p=P('かえる','model',('animals/kaeru.glb',0.5,0.5,0,.3,0,0),(255,255,255),on=('ground',),note='地面に立つ');return[flat(notex(p))]
