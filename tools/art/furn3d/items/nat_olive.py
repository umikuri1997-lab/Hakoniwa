# 土のステージの木（tree~t、オリーブ）：トリポのオリーブ（olive.glb、tools/art/tsuchi/tsuchi_prep.py）。ねじれた幹と枝は木の皮のテクスチャ、葉はモデルの1まいずつの葉（銀色がかった、うすい緑）、オリーブの実。
# 高さはモデルのまま、よこ・おくゆきは1.3倍（草原の木と同じ）。見おろしは4度（ほぼ正面）。かげは草原の木と同じ5色（tone5）。
# 葉：モデルの葉は1まいずつが大きく（カエデのような形）、そのままだと、すかすかの樹冠になった。モデルの樹冠の葉の場所を、かたまり（14こ）にまとめ、
#   その形（つつむ形）を、細い小さな葉の部品でおおう（ほかの木の leafballs と同じ、sacred_tripo.leafparts）。実は、モデルの実のまま。
# クォータービューでは、草原の木と同じに、樹冠（葉・枝・実）を上げて幹の根もとを見せる（LIFT。枝も同じだけ上がるので、葉は枝からはなれない）。
import natcommon
from natcommon import nat,deep,flat,post_clean,barktexdecal,tone5,sunscreen,lift
ID='tree~t';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=4;WIDE=1.3;BOTTOM=56
VIEWS=[('tree~t',0)]
F='olive.glb';H=1.75
LIFT=lift(0.62,0.42) if natcommon.ISO else None
BARK=deep((178,150,122))
TONES=[(206,220,170),(190,208,156),(172,194,142),(156,180,132),(140,166,124)]   # オリーブの葉（銀色がかった、うすい緑。明るい→暗い）
FRUIT=(166,172,104)   # オリーブの実（うすい黄緑）
LEAF=lambda a:a[...,1].astype(int)>a[...,0].astype(int)   # 緑（葉・実）
POST=lambda im:tone5(tone5(post_clean(im),(178,150,122),mask=lambda a:~LEAF(a),under=(LEAF,14,3.0),light=sunscreen(ELEV)),TONES[2],mask=LEAF,mix=0.85,blur=0.6,streak=(0,0),pal=TONES[::-1],olc=(118,140,104),light=sunscreen(ELEV))
def PARTS():return[flat(barktexdecal(nat('幹と枝',F,H,BARK,'bark',wide=WIDE,warp=LIFT),[(188,160,132),(178,150,122),(168,141,115),(156,131,107)],axis='screen')),
    flat(nat('実',F,H,FRUIT,'cap',wide=WIDE,warp=LIFT))]
NCL=14   # 葉のかたまりの数
ZMIN=0.42   # この高さ（木の高さの割合）より下の葉は、かたまりにしない（幹が見えるように。下にたれた葉は、モデルでは枝のまわりの少しだけ）
def EXTRA(sc):
    import sys,os,numpy as np
    sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','sacred-tree'))
    import sacred_tripo as ST
    from blueprint import model_tris
    from natcommon import widen,kind
    from scipy.spatial import ConvexHull
    from scipy.cluster.vq import kmeans2
    ST.LEAFTONES=[tuple(t) for t in TONES];ST.LEAFIN=(132,158,118);ST.LEAFGAP=0.045;ST.LEAFL,ST.LEAFW=0.075,0.03   # オリーブの葉は細い
    V,Fc,C=model_tris('tripo/'+F,0.5,0.5,0,H,0,0);V=widen(0.5,0.5,WIDE)(V.copy());V=LIFT(V) if LIFT else V;sel=np.array([kind(c)=='leaf' for c in C]);P=V[Fc[sel]].reshape(-1,3);P=P[P[:,2]>ZMIN*H]
    np.random.seed(5);_,lab=kmeans2(P,NCL,minit='++',seed=5)
    for g in range(NCL):
        q=P[lab==g]
        if len(q)<12:continue
        c0=q.mean(0)   # かたまりの形は、葉のある所をつつむ形のまま（ふくらませると、1つの大きな山になった）
        h=ConvexHull(q);t=q[h.simplices];n=np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0]);bad=((t.mean(1)-c0)*n).sum(1)<0;t[bad]=t[bad][:,[0,2,1]]
        ST.leafparts(sc,t,g)
