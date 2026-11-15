# 飼う生き物（ハネマリ）のチップ ani:hane#w0：別に作った生き物のモデル（animals/niwatori.glb、anim_niwatori.py と同じ）を、右ななめ前（rot −45度）に向けて写す。歩く（前後に5度ゆらす）。
from blueprint import Part as P
from natcommon import notex,flat
ID='ani:hane#w0';GRAD=False;SHADE=[(4.5,-1.2),(9,-2.5)];ELEV=15;BOTTOM=58
VIEWS=[('ani:hane#w0',0)]
def PARTS():
    p=P('ハネマリ','model',('animals/niwatori.glb',0.5,0.5,0,0.5,-45,5),(255,255,255),on=('ground',),note='地面に立つ');return[flat(notex(p))]
