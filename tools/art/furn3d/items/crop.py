# 畑の土のもりあがり・芽・作物（麦・いも・キャベツの3だん）。クォータービューの絵だけ（python3 tools/art/iso/iso3d.py <出力> crop --chips）。
# 設計図（1マス＝1、もりあがりのまん中はマスのまん中）：
#   土のもりあがり：まるい低い丘（lathe）。半径 MR・高さ MH。地面（畑の土の面）に置く。ぬれた畑（<名前>w）は土の色だけこい。
#   作物：トリポのモデル（tools/art/models/tripo/crop_<作物><だん>.glb、tools/art/crop3d/crop_prep.py で色わけ）を、もりあがりのまん中に立てる。
#     根もとは、もりあがりの上から SINK だけ土にうめる（うかないように）。大きさは、どれもモデルの高さ×K（作物どうしの大きさのちがいは、モデルのまま）。
#   芽（farm.sprout）：キャベツ1（ふた葉）を小さくした物。まいた所の小さな芽（どの作物でも同じ）。
# 色：目じるし（葉・茎・実・花びら・花のまん中）ごとに recol。かげは自然の物と同じ太陽（natcommon.SUN）・2だん（flat）。
from blueprint import Part as P
from natcommon import nat,flat,SUN
ID='crop';GRAD=False;SHADE=[(9,-2.5),(18,-5)];ELEV=25;BOTTOM=64;LIGHT=SUN
MR=0.34;MH=0.10;SINK=0.03;K=2.2   # もりあがりの半径・高さ、作物を土にうめる深さ（マス）、モデルの大きさ→マス
SOIL=(170,104,58);SOILW=(122,80,52)   # 土（いまの土のもりあがりの絵の色）・ぬれた土
H={'mugi1':0.229,'mugi2':0.331,'mugi3':0.335,'imo1':0.223,'imo2':0.277,'imo3':0.318,'cab1':0.171,'cab2':0.174,'cab3':0.248}   # モデルの高さ（crop_prep.py が出す）
COL={'mugi':{'leaf':(150,200,92),'stem':(232,192,100),'cap':(226,162,56)},   # 麦：若い葉はうすい緑、実ると茎も穂も金色
     'imo':{'leaf':(122,172,64),'dot':(246,242,232),'under':(242,212,96)},   # いも：葉・白い花びら・花のまん中の黄色
     'cab':{'leaf':(132,180,80),'cap':(198,224,142)}}   # キャベツ：外の葉・うすい緑の玉
MARKS={'mugi3':('stem','cap'),'imo3':('leaf','dot','under'),'cab3':('leaf','cap')}   # その絵にある目じるし（ほかは葉だけ）
GAME={'mugi':'mugi','imo':'imo','cab':'tomato'}   # ゲームの作物の id（キャベツは tomato）
VIEWS=[('farm.mound',0,(None,0,False)),('farm.moundw',0,(None,0,True)),('farm.sprout',0,('sprout',0,False)),('farm.sproutw',0,('sprout',0,True))]
VIEWS+=[('crop:%s%d%s'%(GAME[c],s,'w' if w else ''),0,(c,s,w)) for c in('mugi','imo','cab') for s in(1,2,3) for w in(False,True)]
VAR=None
def mound(wet):
    pr=[(0.0,0.0)]+[(MR*(1-(i/8)**2)**0.5,MH*(i/8)**0.9) for i in range(9)]   # すそが広く、てっぺんがまるい（だ円の丘）
    p=P('土のもりあがり','lathe',(0.5,0.5,pr),SOILW if wet else SOIL,detail=48,on=('ground',),note='畑の土の上');p.tex=False;p.soft=True;p.curve=True;return p
def lift(dz):
    def f(V):V[:,2]+=dz;return V
    return f
def plant(c,s,size):
    f='crop_%s%d.glb'%(c,s);L=[]
    for mk in MARKS.get('%s%d'%(c,s),('leaf',)):
        col=COL[c][mk]
        p=flat(nat('%s%d %s'%(c,s,mk),f,size,col,mk,warp=lift(MH-SINK)));p.on=('土のもりあがり',);L.append(p)
    return L
def PARTS():
    c,s,w=VAR or (None,0,False);L=[mound(w)]
    if c=='sprout':
        for p in plant('cab',1,0.24):p.name='芽 '+p.name.split()[-1];L.append(p)
    elif c:L+=plant(c,s,H['%s%d'%(c,s)]*K)
    return L
