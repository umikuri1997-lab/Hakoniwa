# たおれたオリーブ（tskonoki、土のステージ）：地われの夜に、根ごとたおれた、コノハの家のそばのオリーブ。1マス。
# 設計図（マス。x=東・y=南・z=上。置くマスの左上が(0,0)）
#   幹と枝：オリーブ（tree~t）と同じトリポのモデル（olive.glb の幹と枝、太さ1.4倍）を、1.25の大きさにして、根もとを東（x=1.0）に、こずえを西へ、よこにねかせる（warp）。地面より下へ出る枝は、地面にそわせる。
#   葉：同じモデルの葉（まだのこっている、くすんだ緑の葉）。
#   根の板：根もとに、たてにうきあがった、土のついた根のかたまり（角ばった土のかたまり hullrock：はば0.10・おく0.26・高さ0.42、こい土の色）。そこから、まわりへ根を6本（tube、太さ0.02）。
#   根の穴：根の板の東の地面に、ぬけたあとの、くぼんだ土（egg、ひくい）。
#   色：幹は、かれたオリーブと同じ皮の色（すこしこく）。根の板・穴は、ほった土の色。
import math
from blueprint import Part as P
from natcommon import nat,deep,flat,barktexdecal,post_clean,tone5,sunscreen,hullrock,widen,SUN
ID='ts_konoki';GRAD=True;SHADE4=[(10,-2),(21,-4),(33,-6)];ELEV=25;BOTTOM=60
LIGHT=SUN
VIEWS=[('tskonoki',0)]
BARKC=(160,134,110);BARK=deep(BARKC);SOIL=(150,116,82);SOILD=(120,92,66)
LEAFC=(150,170,120)
LEAF=lambda a:a[...,1].astype(int)>a[...,0].astype(int)
POST=lambda im:tone5(post_clean(im),BARKC,mask=lambda a:~LEAF(a),light=sunscreen(ELEV))
S0=1.25
def lay(V):
    x,y,z=V[:,0].copy(),V[:,1].copy(),V[:,2].copy()
    V[:,0]=1.0-z*0.78;V[:,1]=0.5+(y-0.5)*0.8;V[:,2]=0.12+(x-0.5)*0.7
    V[:,2]=[max(0.02,v) for v in V[:,2]];return V
def PARTS():
    W2=lambda V:lay(widen(0.5,0.5,1.4)(V))
    t=barktexdecal(nat('幹と枝','olive.glb',S0,BARK,'bark',warp=W2),[(170,144,118),(160,134,110),(150,125,102),(138,115,94)],axis='screen')
    lf=flat(nat('葉','olive.glb',S0,LEAFC,'leaf',warp=W2))
    h=P('根の穴','egg',(1.08,0.52,0.0,0.10,0.22,0.03,0),SOILD,on=('ground',),note='ぬけたあとの土');h.tex=False
    L=[t,lf,h]
    for i in range(6):
        a=math.radians(30+i*60);y1=0.50+0.30*math.cos(a);z1=0.20+0.28*math.sin(a)
        r=P('根%d'%i,'tube',([(1.03,0.50+0.12*math.cos(a),0.22+0.14*math.sin(a)),(1.06,0.50+0.22*math.cos(a),0.22+0.22*math.sin(a)),(1.08,y1,max(0.02,z1))],0.02),BARK,on=('幹と枝',));r.tex=False;L.append(r)
    return L
SOILP=[(150,116,82),(138,106,76),(126,96,70),(114,87,64),(102,78,58)]
def EXTRA(sc):hullrock(sc,(1.03,0.50),(0.06,0.26),0.44,SOILP,seed=5,gi='soil',peak=(0,0))   # 根の板（土のついた根のかたまり）
