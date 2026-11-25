# 材料置き場（matyard）：作業台・建てる所のとなりに出る、すのこの台。運んだ素材の合計のわりあいで、のっている物がふえる（4まい）。
# 設計図（じっさいに作れる組み方。単位はマス。x=東・y=南・z=上）
#   けた3本：0.08角・高さ0.07。おく向き（y 0〜0.64。うしろの面はマスのうしろのふち：作業台と同じく壁にそう。持ち主がきめた）に、左・まん中・右へ地面に置く。
#   すのこ板5まい：はば0.12・あつさ0.025、よこ向き（x 0.06〜0.94）。けたの上にのせて、くぎでとめる（すきま0.02、どれも同じはば）。
#   のせる物（すのこの上。素材の種類ではわけない、まざった山）：
#     丸太：太さ0.15（半径0.075）・長さ0.46、おく向きにねかせる。左に下の列を3本、上の列は下の2本のあいだにのせる（下の2本にふれる高さ）。
#     石：まるい石・中くらいの石・切り出した石・かけら（トリポのモデル）を右手前にまとめる（どの石も、すのこのふちから0.03内がわにおさめる。落ちそうに見えないように）。ふくろ（あさのふくろ、トリポのモデル）を右おくに。
#   0 空：すのこだけ／1 少し：丸太2本・石2こ／2 半分：丸太3本＋上に1本・石4こ・小さいふくろ／3 いっぱい：丸太3＋2＋1本・石7こ（下4こ・2だんめ2こ・てっぺん1こ）と小石・大きいふくろ。
from blueprint import Part as P,model_tris
from common import *
ID='matyard';GRAD=True;BOTTOM=56
VIEWS=[('matyard#0',0,0),('matyard#1',0,1),('matyard#2',0,2),('matyard#3',0,3)]
CENTER=(0.5,0.32,0.42)   # 4まいとも、台の写り方を同じにする
PBOX=[(x,y,z) for x in(0.0,1.0) for y in(-0.06,0.70) for z in(0.0,0.86)]   # 絵のわくも4まい同じ（中身がふえても、台のドットがずれない）
X0,X1,Y0,Y1=0.06,0.94,0.0,0.64;RH=0.07;RW=0.08;BT=0.025;BW=0.12;BG=0.02
ZT=RH+BT   # すのこの上の面
STONE=(192,178,166);TIE=(196,124,64);SACKW=(240,206,162);T='tripo/'
def rock(nm,f,x,y,h,rot,z0=ZT,on=('すのこ板3',)):
    V=model_tris(T+f,x,y,z0,h,rot,0)[0];M_=0.03   # 台からはみ出さない：石のはしが、すのこのふちから0.03内がわにおさまるように、よせる
    x+=max(0,X0+M_-V[:,0].min())-max(0,V[:,0].max()-(X1-M_));y+=max(0,Y0+M_-V[:,1].min())-max(0,V[:,1].max()-(Y1-M_))
    d=(T+f,x,y,z0,h,rot,0);p=P(nm,'model',d,STONE,on=on,note='すのこの上に置く');p.recol=STONE;p.recolk=0.9;p.stone=True;return p
def sack(nm,x,y,h,rot):
    p=P(nm,'model',(T+'sack.glb',x,y,ZT,h,rot,0),on=('すのこ板2',),note='すのこの上に置く');p.recol2=(0.965,TIE,SACKW);p.recolk=0.3;return notex(p)
def logs(rows):
    """rows：下の列から、それぞれの列の本数（上の列は、下の列の左から2本のあいだにのせる）"""
    L=[];R=0.075;xa=0.11+R;ya,yb=0.12,0.58
    for r_,n in enumerate(rows):
        zc=ZT+R+r_*R*1.732
        for k in range(n):
            x=xa+(k+r_*0.5)*2*R;yf=yb-((k*7+r_*3)%4)*0.01   # 手前のはしを少しずつずらす
            on=('すのこ板3',) if r_==0 else tuple('丸太（%d列%d）'%(r_,q+1) for q in(k,k+1))
            L.append(notex(P('丸太（%d列%d）'%(r_+1,k+1),'maki',(x,ya,yf,zc,R,'round',(k*53+r_*91)%360,1.0),LOG,on=on,grp='丸太%d%d'%(r_,k))))
    return L
def PARTS():
    L=[]
    for nm,x in(('左',X0),('まん中',(X0+X1)/2-RW/2),('右',X1-RW)):L.append(P('けた（%s）'%nm,'box',(x,Y0,0,x+RW,Y1,RH),WOOD,bevel=0,note='地面に置く'))
    for k in range(5):
        y=Y0+k*(BW+BG);L.append(P('すのこ板%d'%(k+1),'box',(X0,y,RH,X1,y+BW,ZT),WOOD,on=('けた（左）','けた（まん中）','けた（右）'),bevel=0,note='けたの上にのせて、くぎでとめる'))
    st=globals().get('VAR') or 0   # VIEWS の3つめ（furn3d が M.VAR に入れる）：0 空〜3 いっぱい
    if st>=1:L+=logs([2] if st==1 else [3,1] if st==2 else [3,2,1])
    # 石：右手前に山につむ。下に4こ（少し：手前の2こ・半分：4こ）、いっぱいは、その上に2こ・てっぺんに1こ（下の石のいちばん上にのせる）
    BASE=[('石（手前左）','stone_round.glb',0.64,0.54,0.13,-30),('石（手前右）','stone_mid.glb',0.82,0.54,0.13,70),
          ('石（おく左）','stone_big.glb',0.64,0.36,0.13,15),('石（おく右）','stone_round.glb',0.82,0.36,0.12,40)]
    n=2 if st==1 else 4 if st>=2 else 0
    for a in BASE[:n]:L.append(rock(*a))
    if st>=3:
        top=lambda names:max(float(model_tris(T+a[1],*a[2:4],ZT,a[4],a[5],0)[0][:,2].max()) for a in BASE if a[0] in names)-0.035
        L.append(rock('石（2だん手前）','stone_chunk.glb',0.73,0.52,0.11,-20,z0=top(('石（手前左）','石（手前右）')),on=('石（手前左）','石（手前右）')))
        L.append(rock('石（2だんおく）','stone_mid.glb',0.73,0.36,0.11,30,z0=top(('石（おく左）','石（おく右）')),on=('石（おく左）','石（おく右）')))
        L.append(rock('石（てっぺん）','stone_round.glb',0.73,0.44,0.09,10,z0=top(BASE[i][0] for i in range(4))+0.06,on=('石（2だん手前）','石（2だんおく）')))
        L.append(rock('小石','pebbles3a.glb',0.52,0.60,0.05,10))
    if st>=2:L.append(sack('ふくろ',0.72,0.12,0.30 if st==2 else 0.40,20))
    return L

TONE5=True   # かげは木と同じ5色（furntone。持ち主がきめた）
