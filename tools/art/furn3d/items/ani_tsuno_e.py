# 飼う生き物（ツノクサ）のチップ ani:tsuno#e：別に作った生き物のモデル（animals/yagi.glb、anim_yagi.py と同じ）を、右ななめ前（rot −45度）に向けて写す。食べる（前へ18度かたむける）。
from blueprint import Part as P
from natcommon import notex,flat
ID='ani:tsuno#e';GRAD=False;SHADE=[(4.5,-1.2),(9,-2.5)];ELEV=15;BOTTOM=58
VIEWS=[('ani:tsuno#e',0)]
def PARTS():
    p=P('ツノクサ','model',('animals/yagi.glb',0.5,0.5,0,0.8,-45,-18),(255,255,255),on=('ground',),note='地面に立つ');return[flat(notex(p))]
