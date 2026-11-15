# 生き物（とんぼ）：トリポのモデル（tools/art/models/animals/tonbo.glb、tools/art/animals/animal_prep.py で色と構造を直した物）。高さ 0.3 マス。かげはうすいトゥーン。見おろしは15度（持ち主がえらんだ）。
from blueprint import Part as P
from natcommon import notex,flat
ID='anim:tonbo';GRAD=False;SHADE=[(4.5,-1.2),(9,-2.5)];ELEV=15;BOTTOM=58
VIEWS=[('anim:tonbo',0)]
def PARTS():
    p=P('とんぼ','model',('animals/tonbo.glb',0.5,0.5,0,0.3,0,0),(255,255,255),on=('ground',),note='地面に立つ');return[flat(notex(p))]
