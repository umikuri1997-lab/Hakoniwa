# 枝（drop:eda、落ちている枝）：いまのチップ（はば63・下のはし60、g64）に合わせる。
# 設計図：太い枝（丸太 log、半径0.08、長さ0.98マス）を地面にねかせ、まん中から細い枝（半径0.05）がななめ上へわかれる。わかれた枝の先に葉が1まい（だ円の玉をうすくつぶした形）。
#   太い枝の左のはしは切り口（年輪）。光は自然の物の太陽（natcommon.SUN）。
# 木の皮の色とかげは、草原の木（nat_tree.py）の幹と同じ（持ち主のたのみ）：もとの色 (194,124,84) の5色（natcommon.tone5）と輪郭。切り口・葉はそのまま。
from blueprint import Part as P
from natcommon import flat,SUN,tone5,deep,sunscreen
ID='eda';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=30;BOTTOM=60
LIGHT=SUN
VIEWS=[('drop:eda',0)]
BARK=deep((196,124,84));LEAF=(112,178,58)
TREEBARK=(194,124,84)   # 草原の木の幹の、もとの色（nat_tree.py の tone5）
def _bark(a):   # 皮のドット：赤みの茶色（切り口のうすい黄土色・葉の緑はのぞく）
    r,g,b=(a[...,i].astype(int) for i in range(3));return (r>g+45)&(g>b+12)
POST=lambda im:tone5(im,TREEBARK,mask=_bark,streak=(0.08,0.04),light=sunscreen(ELEV))
def PARTS():
    a=P('太い枝','log',((0.05,0.84,0.08),(0.95,0.44,0.08),0.08),BARK,on=('ground',),note='地面にねかせる')
    b=P('細い枝','log',((0.50,0.64,0.11),(0.68,0.30,0.17),0.05),BARK,on=('太い枝',),note='太い枝からわかれる')
    c=P('葉','egg',(0.80,0.28,0.21,0.12,0.07,0.028,-20),LEAF,on=('細い枝',),note='枝の先')
    c.tex=False
    return[flat(a),flat(b),flat(c)]
