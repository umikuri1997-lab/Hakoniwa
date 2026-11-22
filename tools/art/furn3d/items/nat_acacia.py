# 風の木（tree~k・deadtree~k）：トリポのアカシア（nat_acacia.glb、tools/art/nature3d/acacia_prep.py で作る）。幹は木の皮のテクスチャ（barktexdecal）、葉は小さな葉の部品（natcommon.leafballs）。
# かさのように平らにひろがる、風の島の木。植えた木も自然の木も、この絵（火山のとんがりの木と同じ形）。見おろしは4度（ほぼ正面）。かげはうすいトゥーン。
from natcommon import nat,deep,flat,leafballs,post_clean,barktexdecal,tone5,sunscreen
ID='tree~k';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=4;WIDE=1.0;BOTTOM=112;SCALE=2
VIEWS=[('tree~k',0),('deadtree~k',2)]   # 自然の木は、うしろからの向き（ちがう形に見える）
BARK=deep((190,128,90));H=1.8
TONES=[(204,228,118),(186,218,108),(162,204,100),(136,188,98),(112,172,98)]   # アカシアの葉（すこし黄みの明るい緑）
# かげは枯れ木・草原の木と同じ（持ち主がきめた）：5色（かげ2色・もとの色・ハイライト2色）と輪郭、さかいめは市松もようのあみかけ（natcommon.tone5）。
LEAF=lambda a:a[...,1].astype(int)>a[...,0].astype(int)   # 緑（葉）
POST=lambda im:tone5(tone5(post_clean(im),(196,134,94),mask=lambda a:~LEAF(a),under=(LEAF,14,3.0),light=sunscreen(ELEV)),TONES[2],mask=LEAF,mix=0.85,blur=0.6,streak=(0,0),pal=TONES[::-1],olc=(92,146,88),light=sunscreen(ELEV))
def PARTS():return[flat(barktexdecal(nat('幹','nat_acacia.glb',H,BARK,'bark',wide=WIDE),[(203,140,98),(196,134,94),(188,128,90),(178,121,86)],axis='screen'))]
def EXTRA(sc):leafballs(sc,'nat_acacia.glb',H,TONES,(96,154,92),gap=0.05,L=0.09,W=0.055,wide=WIDE)
