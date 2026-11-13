# かべかけのふくろ（kabebukuro）：いまの絵と同じデザイン・同じ大きさ。家の壁のくぎに、ひもの輪でかけた、あさのふくろ。
# 設計図：
#   くぎ：壁の正面（y=0.50）から手前へ0.05出る、まるい木のくぎ（太さ0.035）。高さ0.86。
#   ひもの輪：くぎにかけた輪から、ふくろの口の左右へ、2本のひも（ふくろの口でむすぶ）。
#   ふくろ：トリポで作ったモデル（models/tripo/sack.glb）を、ひもでつるす（高さ0.44、下のはしは高さ0.32）。色は あさの色（SACKW）・ひもは茶色（TIE）。
from blueprint import Part as P
from common import *
ID='kabebukuro';BOTTOM=46
VIEWS=[('kabebukuro',0)]
TIE=(196,124,64);SACKW=(240,206,162)
YW=0.50;ZB=0.32;HS=0.44;ZP=0.86
def PARTS():
    s=P('ふくろ','model',('tripo/sack.glb',0.50,YW+0.13,ZB,HS,0,0),on=('ひも（左）',),note='ひもでつるす',deco=True);s.recol2=(0.965,TIE,SACKW);s.recolk=0.3
    top=ZB+HS-0.06
    return [notex(P('くぎ','beam',((0.50,YW,ZP),(0.50,YW+0.05,ZP),0.0175),WOOD,on=(),note='壁にうちこむ')),
            notex(P('ひも（左）','rope',((0.50,YW+0.04,ZP+0.005),(0.465,YW+0.10,top),0.007),TIE,on=('くぎ',),note='くぎにかけた輪から、ふくろの口へ')),
            notex(P('ひも（右）','rope',((0.50,YW+0.04,ZP+0.005),(0.535,YW+0.10,top),0.007),TIE,on=('くぎ',),note='くぎにかけた輪から、ふくろの口へ')),notex(s)]
