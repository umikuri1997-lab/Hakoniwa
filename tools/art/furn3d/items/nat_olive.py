# 土のステージの木（tree~t、オリーブ）：トリポのオリーブ（olive.glb、tools/art/tsuchi/tsuchi_prep.py）。ねじれた幹と枝は木の皮のテクスチャ、葉はモデルの1まいずつの葉（銀色がかった、うすい緑）、オリーブの実。
# 高さはモデルのまま、よこ・おくゆきは1.3倍（草原の木と同じ）。見おろしは4度（ほぼ正面）。かげは草原の木と同じ5色（tone5）。
# 葉は枝のまわりにはなれてついているので、クォータービューでも葉を上げない（上げると枝からはなれる）。
from natcommon import nat,deep,flat,post_clean,barktexdecal,tone5,sunscreen
ID='tree~t';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=4;WIDE=1.3;BOTTOM=56
VIEWS=[('tree~t',0)]
F='olive.glb';H=1.75
BARK=deep((178,150,122))
TONES=[(206,220,170),(190,208,156),(172,194,142),(156,180,132),(140,166,124)]   # オリーブの葉（銀色がかった、うすい緑。明るい→暗い）
FRUIT=(166,172,104)   # オリーブの実（うすい黄緑）
LEAF=lambda a:a[...,1].astype(int)>a[...,0].astype(int)   # 緑（葉・実）
POST=lambda im:tone5(tone5(post_clean(im),(178,150,122),mask=lambda a:~LEAF(a),under=(LEAF,14,3.0),light=sunscreen(ELEV)),TONES[2],mask=LEAF,mix=0.85,blur=0.6,streak=(0,0),pal=TONES[::-1],olc=(118,140,104),light=sunscreen(ELEV))
def PARTS():return[flat(barktexdecal(nat('幹と枝',F,H,BARK,'bark',wide=WIDE),[(188,160,132),(178,150,122),(168,141,115),(156,131,107)],axis='screen')),
    flat(nat('葉',F,H,TONES[2],'leaf',wide=WIDE)),flat(nat('実',F,H,FRUIT,'cap',wide=WIDE))]
