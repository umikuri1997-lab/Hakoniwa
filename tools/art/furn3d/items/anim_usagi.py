# 生き物（うさぎ）：トリポのモデル（tools/art/models/animals/usagi.glb、tools/art/animals/animal_prep.py で色と構造を直した物）。高さ 0.45 マス。かげはうすいトゥーン。見おろしは15度（持ち主がえらんだ）。両方の目が見えるように、−20度まわす（持ち主がえらんだ）。
from blueprint import Part as P
from natcommon import notex,flat
ID='anim:usagi';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=15;BOTTOM=58
VIEWS=[('anim:usagi',0)]
def PARTS():
    p=P('うさぎ','model',('animals/usagi.glb',0.5,0.5,0,0.45,-20,0),(255,255,255),on=('ground',),note='地面に立つ');return[flat(notex(p))]
