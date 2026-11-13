# かべ棚（wshelf）：家の壁にかける小さな棚。つる草のはち植えをのせる。
# 設計図（じっさいに作れる組み方。単位はマス）
#   壁につける板（受け木）：はば0.62・高さ0.06・あつさ0.02。壁（y=0.50）にくぎでとめる。
#   ささえ2つ：同じ大きさの板（はば0.04・おく0.20・高さ0.12）。棚板の両はしの下に、たてて、壁にとめる（お手本の絵と同じく、下に見える）。
#   棚板：はば0.70・おく0.20・あつさ0.03。ささえと受け木の上にのせる。
#   つる草：CC0の3Dモデルのはち植えを棚板の上に置く。
from blueprint import Part as P
from common import *
ID='wshelf';BOTTOM=36
VIEWS=[('wshelf',0)]
YW=0.50;X0,X1=0.15,0.85;D=0.20;ZB=0.40;BT=0.03
def PARTS():
    L=[P('受け木','box',(0.19,YW,ZB-0.06,0.81,YW+0.02,ZB-BT),WOOD,on=(),bevel=0,note='壁にくぎでとめる')]
    for nx,x in(('左',0.17),('右',0.79)):
        L.append(P('ささえ（%s）'%nx,'box',(x,YW,ZB-BT-0.12,x+0.04,YW+D,ZB-BT),WOOD,on=(),bevel=0,note='棚板の両はしの下。壁にくぎでとめる'))
    L.append(P('棚板','box',(X0,YW,ZB-BT,X1,YW+D,ZB),WOOD,on=('ささえ（左）','ささえ（右）','受け木'),bevel=0,note='ささえの上'))
    L.append(P('つる草','model',('quaternius/Houseplant_7.obj',0.48,YW+0.10,ZB,0.30,0,0),on=('棚板',),deco=True))
    return L
