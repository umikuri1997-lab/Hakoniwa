# 生き物（てんとう虫）：トリポのモデル（tools/art/models/animals/tentoumushi.glb、tools/art/animals/animal_prep.py で色と構造を直した物）。高さ 0.22 マス。かげはうすいトゥーン。見おろしは15度（持ち主がえらんだ）。
from blueprint import Part as P
from natcommon import notex,flat
ID='anim:tentoumushi';GRAD=False;SHADE=[(4.5,-1.2),(9,-2.5)];ELEV=15;BOTTOM=58
VIEWS=[('anim:tentoumushi',0)]
def PARTS():
    p=P('てんとう虫','model',('animals/tentoumushi.glb',0.5,0.5,0,0.22,0,0),(255,255,255),on=('ground',),note='地面に立つ');return[flat(notex(p))]
