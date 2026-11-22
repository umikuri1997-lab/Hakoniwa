# 草原の木の秋（紅葉）：nat_tree と同じ3D・同じかげ。葉の5色と輪郭の色だけを秋の色にする（持ち主がきめた：ほの暮しの庭のような紅葉）。
# 2しゅるい（VIEWS の3つめ VAR）：r 赤・オレンジ（もみじのような）・y 黄色（いちょうのような）。ゲームは秋だけ、マスごとにどちらかをえらぶ（plantChip の AKITREE）。
# 葉の見分けは nat_tree と同じ（写したときは緑の葉。色をかえるのは tone5 の pal・olc だけ）。落ち影は castshadow.py で同じように作る（tree~aki0:sh など）。
from nat_tree import nat,deep,flat,leafballs,post_specks,post_clean,barkdecal,barktexdecal,tone5,sunscreen,GRAD,SHADE,ELEV,WIDE,BOTTOM,BARK,H,TONES,LEAF,PARTS,EXTRA
ID='tree_aki'
VIEWS=[('tree~aki0',0,'r'),('tree~aki1',0,'y')]
VAR='r'
AKI={'r':([(140,40,52),(192,58,58),(226,88,66),(244,136,84),(255,190,124)],(122,44,50)),   # 暗い→明るい・輪郭
     'y':([(168,98,48),(212,140,56),(236,188,76),(248,218,106),(255,240,160)],(140,94,50))}
def POST(im):
    pal,olc=AKI[VAR]
    return tone5(tone5(post_clean(im),(194,124,84),mask=lambda a:~LEAF(a),under=(LEAF,14,3.0),light=sunscreen(ELEV)),pal[2],mask=LEAF,mix=0.85,blur=0.6,streak=(0,0),pal=pal,olc=olc,light=sunscreen(ELEV))
