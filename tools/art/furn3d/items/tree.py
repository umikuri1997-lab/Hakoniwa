# 木（tree：植えた木・ntree：森の木。同じ絵）。ドラゴンクエストビルダーズのような、自然な構造とかわいいデフォルメの広葉樹（持ち主の指示）。
# 前の枝・根の形は引き継がず、作りなおした（幹 → 根 → 主枝 → 側枝 → 小枝 → 葉群、が1本の木としてつながる）。
# 設計図（単位はマス。地面 z=0。根もと (0.5, 0.62)）：
#   樹冠：大きなふくらみ LOBES をつなげた、かさの形（お手本：ビルダーズの木）。枝は、幹 → 主枝（ふくらみの中） → 側枝（中の何か所か） → 細枝（外へのび、面に出たら重さで下へたれる）。葉は細枝のたれた先だけ。
#   葉：細枝の左右に、たがいちがいに、細枝から同じ角度（45度）でひらき、面にそってねかせる。上の葉ほど少し外がわ（かわらのように重なり、交差しない）。
#   幹：根もとから TRUNK まで、ゆるくまがる。半径 0.13 → 0.085。根もとは、角度ごとにちがう大きさのなめらかなふくらみ（4〜6本）で、
#     なだらかに太くなり、地面へ広がる（幹と1つづきの面。板・台座にしない：trunkmesh）。
#   主枝 MAIN：幹の上のほうから、ななめ上へ（向き・立ち上がり・長さ・つけ根の高さはまちまち）。半径 0.060 → 0.030。
#   側枝：主枝の 0.40〜0.85 の所から2〜3本（長さ 0.28〜0.40、半径 0.030 → 0.016）。小枝：側枝の先のほうから1〜2本（長さ 0.14〜0.20、半径 0.015 → 0.007）。
#   どの枝も、曲がりがだんだんかわる曲線（curve3）：太い枝はゆるく上へ、細い枝の先は葉の重さで少し下がる。子の枝は親より細く、つけ根にえり。
#   枝先（主枝・側枝・小枝の先）には、かならず葉群（葉のない枝先を作らない）。
#   葉：もらった葉1まいのモデル（tripo/kit_leaf.glb）。葉柄の立ち上がりを面へもどし、葉ごとにしなり（裏がわへ曲げる）をつける（持ち主の指示：形をかえてよい）。大きさは1つ。枝先のまわりに、枝の先の6割にそって、左右たがいちがいに、細い枝は14〜20まい・主枝は10〜14まい。
#     向きは枝ののびる向きを基本に外へ、重さで少し下へ。表は上へ（裏が上を向かない）。葉先が樹冠の形の外へ出る葉は置かない（外がわがなめらか）。
#   骨格は1回だけ作って tree_skel.json に固定する（python3 tools/art/furn3d/items/tree.py --skel）。葉つきは読んで葉をたすだけ。SKEL=True で骨格だけ。
import math,json,os
import numpy as np
import natcommon as N
ID='tree';GRAD=True;PARALLEL=True;BOTTOM=56
VIEWS=[('tree',0),('ntree',0)]
CX,CY=0.5,0.62;SEED=4;SKEL=False
CROWN=((0.50,0.60,1.25),0.74,0.64,0.60)
LEAFL=0.19   # 葉の長さ（マス。どの葉も同じ。お手本の絵では、樹冠のはばに7〜8まい）
SKELF=os.path.join(os.path.dirname(os.path.abspath(__file__)),'tree_skel.json')
UP=np.array([0,0,1.0])
def curve3(p,d,L,bend_up,droop,rs,n=8,wob=0.04):
    """曲がりがだんだんかわる曲線：はじめは d、なかほどまで上へ（bend_up）、先は下へ（droop）。かえす：点の一覧"""
    pts=[np.array(p,float)];dd=np.array(d,float)/np.linalg.norm(d)
    for k in range(n):
        t=(k+0.5)/n;dd=dd+UP*(bend_up*(1-t)-droop*t*t)/n*4+rs.normal(0,wob,3)/n*2;dd/=np.linalg.norm(dd)
        pts.append(pts[-1]+dd*L/n)
    return pts
def rot(v,ax,a):
    ax=ax/np.linalg.norm(ax);return v*math.cos(a)+np.cross(ax,v)*math.sin(a)+ax*(ax@v)*(1-math.cos(a))
def child_dir(d,ang,az):
    u=np.cross(d,UP);u=u/np.linalg.norm(u) if np.linalg.norm(u)>1e-6 else np.array([1.0,0,0]);v=np.cross(d,u)
    s=u*math.cos(az)+v*math.sin(az);c=d*math.cos(math.radians(ang))+s*math.sin(math.radians(ang));return c/np.linalg.norm(c)
def at(pts,t):
    f=t*(len(pts)-1);i=min(len(pts)-2,int(f));return pts[i]+(pts[i+1]-pts[i])*(f-i),(pts[i+1]-pts[i])/np.linalg.norm(pts[i+1]-pts[i]),i
def inside(p):
    c,rx,ry,rz=CROWN;return ((p[0]-c[0])/rx)**2+((p[1]-c[1])/ry)**2+((p[2]-c[2])/rz)**2<1
def clip(pts):
    """樹冠の形の外へ出る所で枝を止める（いちどでも中に入ったあと）"""
    out=[pts[0]];was=inside(pts[0])
    for q in pts[1:]:
        if was and not inside(q):break
        out.append(q);was=was or inside(q)
    return out
# ---- かさの樹冠（持ち主のお手本の絵：ビルダーズの木）：ふちがたれた、きのこのかさのようなドーム ----
# ---- 骨格：Y字に分かれる、ふつうの広葉樹（TREE_RULES.md の「骨格」） ----
# 樹冠の形 ENV：横に広いドーム（お手本：ビルダーズの木）。底 ZB より上はだ円、ふちは少し下までたれる。枝はこの中でとまる。
ENV=dict(cx=0.50,cy=0.60,R=0.98,zb=0.70,H=0.95)   # 高さは低め（持ち主の指示）
LUMP=0.30   # 樹冠の形のでこぼこの強さ（持ち主の指示：樹形をくずす）
def lump(p):
    """樹冠の形の、向きでかわる大きなでこぼこ（1±LUMP）。左（x の小さいほう）を少し大きく（左右の差）"""
    dx,dy,dz=p[0]-ENV['cx'],p[1]-ENV['cy'],p[2]-ENV['zb'];n=math.sqrt(dx*dx+dy*dy+dz*dz)+1e-9
    u=(dx/n,dy/n,dz/n);v=N.ST.vnoise(u[0]*1.3+7.1,u[1]*1.3+2.3,u[2]*1.3+5.5)*0.75+N.ST.vnoise(u[0]*2.6+1.7,u[1]*2.6,u[2]*2.6+3.1)*0.25
    return 1+LUMP*(v-0.5)*2+0.08*(-u[0])
def envin(p,sh=1.0):
    if p[2]>ENV['zb']:sh=sh*lump(p)   # でこぼこは底より上だけ（幹がかくれない）
    r=math.hypot(p[0]-ENV['cx'],(p[1]-ENV['cy'])/0.9)/(ENV['R']*sh);z=(p[2]-ENV['zb'])/(ENV['H']*sh)
    if z<0:return r<1 and z>-0.28*max(0,(r-0.35))/0.65   # 底：まん中は平ら、ふちは少し下まで（たれる）
    return r*r+z*z<1
def envnorm(p):
    """樹冠の形の、その場所の外向き（表の向き）"""
    v=np.array([(p[0]-ENV['cx'])/ENV['R']**2,(p[1]-ENV['cy'])/(0.81*ENV['R']**2),max(0.0,p[2]-ENV['zb'])/ENV['H']**2+0.15]);return v/np.linalg.norm(v)
TRUNK=0.70
MAIN=[(25,34,0.44,0.55),(118,30,0.40,0.70),(205,36,0.46,0.48),(300,32,0.42,0.62),(70,48,0.42,1.0),(160,40,0.40,0.34),(340,38,0.38,0.40),(245,52,0.48,0.88),(140,50,0.46,0.93)]   # さいごの2本：高さ方向へ、ななめ上   # 主枝は幹の下のほう（幹の4割5分〜7割）から（持ち主の指示）   # 向き・立ち上がり（水平から、度）・長さ・つけ根の高さ（幹の割合）。さいごは幹のつづき
def branch(B,p,d,L,lv,rs,plane,par):
    """1本の枝：のびる（太い枝はしならず、ほぼまっすぐ。いちばん細い枝だけ、ほんの少したれる）、樹冠の形の外へ出る所でとまる。
    先でY字に2本へ分かれる（角度・長さに差。分かれる面は親の面から90度±まわす）。とちゅうから、ときどき短い横の枝。
    樹冠のふちでとまっても、細い枝に分かれて終わる（太い枝を急に終わらせない）。かえす：この枝の番号"""
    n=6 if lv<=2 else 4;pts=[np.array(p,float)];dd=np.array(d,float)/np.linalg.norm(d);hit=False
    for k in range(n):
        t=(k+1)/n;dd=dd-UP*(0.025*t if lv>=5 else 0.0)+rs.normal(0,0.012 if lv<=3 else 0.02,3);dd/=np.linalg.norm(dd)   # 太い枝はしならない（ほぼまっすぐ）。いちばん細い枝だけ、ほんの少したれる
        q=pts[-1]+dd*L/n
        if not envin(q) and (envin(pts[-1]) or q[2]>ENV['zb'] or math.hypot(q[0]-ENV['cx'],(q[1]-ENV['cy'])/0.9)>ENV['R']*0.85) and len(pts)>1:hit=True;break   # 樹冠の形の外へ出る所でとまる（樹冠の下でも、横へつき出さない）   # 樹冠の形の外へ出る所でとまる（底より上では、かならず）
        pts.append(q)
    if len(pts)<2:return None
    me=len(B);B.append({'pts':pts,'lv':lv,'leaf':False,'par':par,'ch':[]})
    if par is not None:B[par]['ch'].append(me)
    end=pts[-1];ed=pts[-1]-pts[-2];ed/=np.linalg.norm(ed)
    if lv>=5:B[me]['leaf']=True;return me
    if lv<=3 and rs.rand()<0.55:   # 横の枝（とちゅう、ときどき）
        t=rs.uniform(0.35,0.7);i=int(t*(len(pts)-1));q=pts[i];dq=pts[min(i+1,len(pts)-1)]-pts[max(i-1,0)];dq/=np.linalg.norm(dq)
        side=np.cross(dq,plane);side/=max(np.linalg.norm(side),1e-9);side*=rs.choice([-1,1]);cd=dq*math.cos(math.radians(50))+side*math.sin(math.radians(50))
        branch(B,q,cd,L*rs.uniform(0.40,0.55),lv+1,rs,dq,me)
    pl=rot(plane,ed,math.radians(90+rs.uniform(-25,25)));pl-=ed*(pl@ed);pl/=max(np.linalg.norm(pl),1e-9)
    a1,a2=math.radians(rs.uniform(22,32)),math.radians(rs.uniform(38,52))
    if hit:a1,a2=math.radians(rs.uniform(45,60)),math.radians(rs.uniform(55,70))   # ふちでは、横へひらいて分かれる（細い枝で終わる）
    k1,k2=(rs.uniform(0.72,0.86),rs.uniform(0.55,0.70)) if not hit else (0.45,0.38)
    c1=ed*math.cos(a1)+pl*math.sin(a1);c2=ed*math.cos(a2)-pl*math.sin(a2)
    def lean(c,q=end):   # 上へまっすぐ立つ枝は、外がわへかたむける（持ち主の指示：まっすぐ上へのばさない）
        if c[2]<0.88:return c
        out=np.array([q[0]-ENV['cx'],q[1]-ENV['cy'],0.0]);out=out/np.linalg.norm(out) if np.linalg.norm(out)>1e-3 else pl
        c=c+out*(c[2]-0.88)*1.2;return c/np.linalg.norm(c)
    c1,c2=lean(c1),lean(c2)
    r1=branch(B,end,c1,L*k1,lv+1,rs,pl,me);r2=branch(B,end,c2,L*k2,lv+1,rs,pl,me)
    if not B[me]['ch']:B[me]['leaf']=True
    return me
def skeleton():
    rs=np.random.RandomState(SEED);B=[]
    tr=curve3((CX,CY,0),(0.03,0.0,1.0),TRUNK,0.0,0.0,rs,n=10,wob=0.02);B.append({'pts':tr,'lv':0,'leaf':False,'par':None,'ch':[]})
    for az,el,L,h in MAIN:
        p,_,_=at(tr,min(h,0.999));d=N.dirv(az+rs.uniform(-22,22),el+rs.uniform(-10,10));L=L*rs.uniform(0.75,1.3)   # 向き・長さのばらつきを大きく（樹形をくずす）
        branch(B,p,d,L,1,rs,np.array([math.cos(math.radians(az+90)),math.sin(math.radians(az+90)),0.0]),0)
    pipe(B);return B
def pipe(B,rtip=0.005,E=2.3):
    """太さ（パイプモデル）：先の枝は rtip。親の先の太さは、子のつけ根の太さの r^E の和の E 乗根。つけ根は先の1.18倍（なめらかに細くなる）"""
    for i in range(len(B)-1,-1,-1):
        b=B[i]
        if not b['ch']:b['r1']=rtip
        else:b['r1']=sum(B[c]['r0']**E for c in b['ch'])**(1/E)
        b['r0']=b['r1']*(1.18 if b['lv']>0 else 1.0)
    for b in B:b['r0']=min(b['r0'],0.09 if b['lv']>0 else 9);b['r1']=min(b['r1'],0.075 if b['lv']>0 else 9)   # 主枝の太さの上限
    t=B[0];t['r1']=0.13;t['r0']=0.18   # 幹：太め（持ち主の指示）。根もとがいちばん太い
NODE=0.036   # 葉のつく節の間かく（マス）。左右たがいちがいなので、同じがわの葉の間かくは、その2倍（葉のはばくらい）
def zigzag(B):
    """葉をつける小枝（先の細枝と、その1つ手前の枝の先のほう）：節ごとに、葉のつく面の中で少しジグザグに折れる（お手本の写真）。
    葉のつく面（光のほう＝上と外のあいだ）の向き pn も、ここで決めて骨格にのこす"""
    for b in B:
        if not (b['leaf'] or b['lv']>=2):continue   # 葉をつける枝：先の細枝・その手前の枝・小枝・側枝（の先のほう）
        P=np.array(b['pts']);Ls=np.cumsum([0]+[np.linalg.norm(P[i+1]-P[i]) for i in range(len(P)-1)]);tot=Ls[-1]
        d=P[-1]-P[0];d/=np.linalg.norm(d);pn=UP*0.7+envnorm(P[-1])*0.3;pn-=d*(pn@d);pn/=np.linalg.norm(pn);sd=np.cross(pn,d)
        s0=0.0 if b['leaf'] else tot*(0.35 if b['lv']>=4 else 0.45 if b['lv']==3 else 0.6);ns=max(1,int((tot-s0)/NODE));nodes=[];side=1
        q0=P[0].copy();pts=[P[i] for i in range(len(P)) if Ls[i]<=s0]
        for k in range(ns+1):
            sd_=s0+(tot-s0)*k/ns;j=max(0,min(len(P)-2,int(np.searchsorted(Ls,sd_))-1));t=(sd_-Ls[j])/max(Ls[j+1]-Ls[j],1e-9)
            q=P[j]+(P[j+1]-P[j])*t+sd*side*0.006*(0 if k in(0,ns) else 1);side=-side
            if pts and np.linalg.norm(q-pts[-1])<1e-4:nodes.append(len(pts)-1);continue   # 同じ点を2回入れない
            pts.append(q);nodes.append(len(pts)-1)
        b['pts']=pts;b['nodes']=nodes;b['pn']=list(map(float,pn))
SHOOT=0.32   # 葉をつける小枝（先の細枝）の長さ（マス）。お手本の写真のように、1本に何まいも葉がつく長さ
def lengthen(B):
    """先の細枝を、ゆるくたれながら SHOOT までのばす（樹冠の形の外へは出さない）。骨格の一部（葉なしの絵にも出る）"""
    rs=np.random.RandomState(SEED+7)
    for b in B:
        if not b['leaf']:continue
        P=[np.array(p) for p in b['pts']];L=sum(np.linalg.norm(P[i+1]-P[i]) for i in range(len(P)-1));d=P[-1]-P[-2];d/=np.linalg.norm(d)
        while L<SHOOT:
            d=d-UP*0.012+rs.normal(0,0.015,3);d/=np.linalg.norm(d);q=P[-1]+d*0.04   # いちばん細い枝：ほんの少したれる
            if not envin(q,1.02):break
            P.append(q);L+=0.04
        b['pts']=P
SPRIGGAP=0.07   # 太い枝から出す短い細枝の間かく（マス）
def sprigs(B):
    """太い枝（主枝・側枝・小枝）の、樹冠の中にある所にそって、短い細枝を出す（持ち主の指示：枝が見えている所を、細枝と葉でかくす）。
    外がわ・少し上へ。長さ 0.12〜0.2。左右たがいちがい（らせん）。骨格の一部"""
    rs=np.random.RandomState(SEED+11);az=0.0;new=[]
    for b in B:
        if not 1<=b['lv']<=3:continue
        P=[np.array(p) for p in b['pts']];Ls=np.cumsum([0]+[np.linalg.norm(P[i+1]-P[i]) for i in range(len(P)-1)]);tot=Ls[-1]
        for sd_ in np.arange(SPRIGGAP*0.6,tot-0.03,SPRIGGAP*rs.uniform(0.8,1.2)):
            j=max(0,min(len(P)-2,int(np.searchsorted(Ls,sd_))-1));t=(sd_-Ls[j])/max(Ls[j+1]-Ls[j],1e-9);q=P[j]+(P[j+1]-P[j])*t
            if q[2]<0.45 or math.hypot(q[0]-ENV['cx'],(q[1]-ENV['cy'])/0.9)>ENV['R']*0.95:continue   # 樹冠の下の、見えている太い枝にも
            d=P[j+1]-P[j];d/=np.linalg.norm(d);u=np.cross(d,UP);u=u/np.linalg.norm(u) if np.linalg.norm(u)>1e-6 else np.array([1.0,0,0]);v=np.cross(d,u)
            az+=N.GOLD;side=u*math.cos(az)+v*math.sin(az);out=np.array([q[0]-ENV['cx'],q[1]-ENV['cy'],0.0]);out=out/np.linalg.norm(out) if np.linalg.norm(out)>1e-3 else side
            c=d*0.4+side*0.7+out*0.5+UP*0.35;c/=np.linalg.norm(c);L=rs.uniform(0.12,0.20)
            pts=[q];dd=c
            for k in range(4):
                dd=dd-UP*0.02+rs.normal(0,0.02,3);dd/=np.linalg.norm(dd);qq=pts[-1]+dd*L/4
                if not envin(qq,1.02) and (qq[2]>ENV['zb'] or math.hypot(qq[0]-ENV['cx'],(qq[1]-ENV['cy'])/0.9)>ENV['R']):break
                pts.append(qq)
            if len(pts)<3:continue
            r0=min(0.014,b['r1']*0.5);new.append({'pts':pts,'lv':5,'leaf':True,'r0':r0,'r1':r0*0.55,'sprig':True})
    B+=new
def saveskel(B):json.dump([{'pts':[list(map(float,p)) for p in b['pts']],'r0':b['r0'],'r1':b['r1'],'lv':b['lv'],'leaf':b['leaf'],'nodes':b.get('nodes'),'pn':b.get('pn')} for b in B],open(SKELF,'w'))
def makeskel():
    """骨格を作り、葉の置き方を1回ためして、葉が1まいもつかない細枝（緑の細枝）は骨格からのぞく（持ち主の指示：葉のない細枝を作らない）。
    のぞくと、まわりの葉が置けるようになることがあるので、かわらなくなるまでくりかえす。さいごの骨格を固定する"""
    import oblique3d as O
    B=skeleton();lengthen(B);sprigs(B);zigzag(B)
    for it in range(4):
        saveskel(B);O.GRAD=True;sc=O.Scene();EXTRA(sc);ln=EXTRA.leafn
        keep=[b for b,n in zip(B,ln) if not (b['leaf'] and n==0)]
        print('のぞいた葉のない細枝',len(B)-len(keep))
        if len(keep)==len(B):break
        B=keep
    saveskel(B)
def loadskel():
    return [{'pts':np.array(b['pts']),'r0':b['r0'],'r1':b['r1'],'lv':b['lv'],'leaf':b['leaf'],'nodes':b.get('nodes'),'pn':b.get('pn')} for b in json.load(open(SKELF))]
def trunkmesh(T,pts,r0,r1,rs,n=28):
    """幹：根もとは、角度ごとにちがう大きさのなめらかなふくらみ（根）で、なだらかに太くなり、地面へ広がる（1つづきの面）"""
    lobes=[(rs.uniform(0,6.28),rs.uniform(0.06,0.16),rs.uniform(0.35,0.6)) for _ in range(rs.randint(4,7))]   # 向き・大きさ・はば（ラジアン）
    P=[np.array(p) for p in pts];P=[P[0]-np.array([0,0,0.03])]+P;m=len(P);R=[]
    for i,c in enumerate(P):
        d=P[min(i+1,m-1)]-P[max(i-1,0)];d/=np.linalg.norm(d);u=np.cross(d,[0,1.0,0]);u/=np.linalg.norm(u);v=np.cross(d,u)
        z=max(0.0,c[2]);t=min(1,i/(m-1));ring=[]
        for j in range(n):
            a=2*math.pi*j/n;r=r0+(r1-r0)*t
            for la,amp,wd in lobes:
                da=(a-la+math.pi)%(2*math.pi)-math.pi;r+=amp*math.exp(-(da/wd)**2)*math.exp(-z/0.09)   # 根：下ほど大きく、なめらかに
            r*=1+0.03*math.sin(3*a+i)   # 断面は少しいびつ
            ring.append(c+r*(math.cos(a)*u+math.sin(a)*v))
        R.append(ring)
    for i in range(m-1):
        for j in range(n):
            a,b,c,e=R[i][j],R[i+1][j],R[i+1][(j+1)%n],R[i][(j+1)%n];T+=[(a,b,c),(a,c,e)]
_KL=[]
def kitleaf():
    """葉のモデルを読み、葉の軸にそろえる：のびる向き e1（葉柄のはしが原点、葉先が +）・はばの向き e2・表の向き e3（もらったセットで、うしろを向いていた面が表）。長さ1"""
    if _KL:return _KL[0]
    import trimesh
    m=trimesh.load(os.path.join(os.path.dirname(N.__file__),'..','..','models','tripo','kit_leaf.glb'),force='mesh')
    V=np.asarray(m.vertices,float)   # glTF のまま
    c=V.mean(0);_,_,vt=np.linalg.svd(V-c,full_matrices=False);e1,e3=vt[0],vt[2]
    if e3[2]>0:e3=-e3   # 表の向き：もらったセットで、うしろ（−Z）を向いていたがわ（持ち主が見て、手前がわは裏だった）
    Q0=(V-c)@e1;a,b=Q0.min(),Q0.max();L_=b-a;w=(V-c)@np.cross(e3,e1)
    if np.abs(w[Q0<a+0.15*L_]).max()>np.abs(w[Q0>b-0.15*L_]).max():e1=-e1   # 細いほう（葉柄）を、−のはしに
    e2=np.cross(e3,e1)   # 右手の向き（e1・e2・e3）：置くときの (o, sd=nn×o, nn) と同じならび
    Q=(V-c)@np.stack([e1,e2,e3],1);Q[:,0]-=Q[:,0].min();Q/=L_
    F_=np.asarray(m.faces)
    # 葉柄の立ち上がりをなおす（持ち主の指示：モデルの形をかえてよい）：つけ根から葉の長さの2割までを、葉の面（その先の葉のまん中の高さ）へ、なだらかにもどす
    zc=float(np.median(Q[(Q[:,0]>0.25)&(Q[:,0]<0.45)&(np.abs(Q[:,1])<0.05),2])) if ((Q[:,0]>0.25)&(Q[:,0]<0.45)&(np.abs(Q[:,1])<0.05)).any() else 0.0
    w=np.clip(1-Q[:,0]/0.22,0,1);w=w*w*(3-2*w);Q[:,2]=Q[:,2]*(1-w)+zc*w+(Q[:,2]-zc)*w*0.25   # 葉柄は面のすぐそばへ（太さは少しのこす）
    base=Q[Q[:,0]<0.06];tip=base.mean(0)   # 葉柄のはし
    _KL.append(Q[F_]);_KL.append(tip);return _KL[0]
def stemtip():kitleaf();return _KL[1]
TWIG=(150,192,96)   # 細枝の色：葉の色（N.LEAFB）に近い緑
def EXTRA(sc):
    B=loadskel();rs=np.random.RandomState(SEED+50);T=[];TG=[]
    for b in B:
        pts=b['pts'];k=len(pts);rr=[b['r0']+(b['r1']-b['r0'])*(i/(k-1)) for i in range(k)]
        if b['lv']==0:trunkmesh(T,pts,b['r0'],b['r1'],rs);continue
        rr[0]*=1.12   # えり
        if b['leaf']:rr[-1]=min(rr[-1],0.005)   # 葉群の中で細くおわる
        N.limb(TG if b['leaf'] else T,pts,rr,n=10 if b['lv']<=1 else 7 if b['lv']<=3 else 5)
    N.barkmesh(sc,T)
    sc.smooth(True);sc.part()   # 細枝（葉をつける枝）は、葉の色（持ち主の指示）
    for t in TG:sc.tri(t[0],t[1],t[2],TWIG)
    sc.smooth(False);T=T+TG   # 当たり判定には、細枝も入れる
    if SKEL:return
    Q=kitleaf();rs=np.random.RandomState(SEED+100)
    sc.outline(None,0.86);sc.material('flat')
    S=stemtip();ANG=math.radians(52)   # 小枝から斜め前へひらく角度（どの葉も同じくらい）
    Qflat=Q.reshape(-1,3);SAMP=Qflat[::max(1,len(Qflat)//60)]   # 交差しらべ用の、葉の形の点
    xs=np.linspace(0,1,21);HW=np.array([np.abs(Qflat[np.abs(Qflat[:,0]-x)<0.03,1]).max() if (np.abs(Qflat[:,0]-x)<0.03).any() else 0 for x in xs])   # 葉のはば（長さの場所ごと）
    PL=[]   # 置いた葉：(葉柄の点, 向きの行列 M, しなり)
    def bendz(x,bend):return -bend*np.clip(x-0.25,0,None)**2
    import trimesh
    CM=trimesh.collision.CollisionManager()   # 置いた葉の三角形（正確な当たり判定 fcl）
    CMB=trimesh.collision.CollisionManager();TB=np.array(T,float).reshape(-1,3);nb=len(TB)//3;CMB.add_object('bark',trimesh.Trimesh(TB,np.arange(nb*3).reshape(nb,3),process=False))   # 幹・枝も入れる（枝が葉にささらない）
    def leafmesh(base,M,bend,trim=False):
        Qb=Q.copy()
        if trim:Qb=Qb[Qb[...,0].min(1)>0.12]   # 葉柄のはしの近くは、のぞく（枝についてよい所）
        Qb[...,2]+=bendz(Qb[...,0],bend);W=(Qb@M*LEAFL+base).reshape(-1,3);n=len(W)//3
        return trimesh.Trimesh(W,np.arange(n*3).reshape(n,3),process=False)
    def crosses(base,M,bend):
        """ほかの葉・幹・枝と、三角形どうしで交差するか。葉柄のはし（枝につく所）は、枝にふれてよいので、しらべる形からのぞく"""
        return (bool(PL) and CM.in_collision_single(leafmesh(base,M,bend))) or CMB.in_collision_single(leafmesh(base,M,bend,True))   # 葉どうしは葉ぜんぶで、枝とは葉柄のはしをのぞいて
    skipped=0
    LEAFN=[0]*len(B)
    for bi,b in enumerate(B):   # 葉は、小枝の節ごとに、左右たがいちがいに1まい。どの葉も、小枝をふくむ1まいの平らな面（光のほう）の上（お手本の写真：魚の骨の形、交差しない）。小枝の先に1まい
        if not b.get('nodes'):continue
        pts=b['pts'];pn=np.array(b['pn']);nd=b['nodes'];side=1 if (len(pts)%2) else -1
        for k,i in enumerate(nd):
            p=np.array(pts[i]);last=(k==len(nd)-1)
            if k==0 and not last:continue   # 小枝のつけ根の節にはつけない
            d=np.array(pts[min(i+1,len(pts)-1)])-np.array(pts[max(i-1,0)]);d/=np.linalg.norm(d);d-=pn*(d@pn);d/=np.linalg.norm(d)
            sd=np.cross(pn,d);side=-side
            o0=d if last else d*math.cos(ANG)+sd*side*math.sin(ANG)
            if not envin(p+o0*LEAFL,1.08):continue   # 葉先が樹冠の形から出る葉は置かない
            bend=0.10;ok=None
            for dang,lift in ((0,0),(0.18*side,0),(-0.18*side,0),(0,0.02),(0.35*side,0.01),(0,0.04),(-0.35*side,0.02),(0.5*side,0.03)):   # 交差したら、同じ面の中で少しまわす・少しうかせる
                o=o0*math.cos(dang)+np.cross(pn,o0)*math.sin(dang);nn=pn.copy()
                M=np.stack([o,np.cross(nn,o),nn],0);base=p+nn*lift-(S@M)*LEAFL
                if not crosses(base,M,bend):ok=(base,M);break
            if ok is None:skipped+=1;continue   # どうしても交差する葉は置かない
            base,M=ok;PL.append((base,M,bend));LEAFN[bi]+=1;CM.add_object(str(len(PL)),leafmesh(base,M,bend))
            h=(p[2]-ENV['zb'])/ENV['H'];lt=float(M[2]@N.LIGHTV)
            tone=int(np.clip(round((1-lt)*1.6+(1-h)*1.2-0.5),0,len(N.LEAFB)-2))
            Qb=Q.copy();Qb[...,2]+=bendz(Qb[...,0],bend)   # しなり（少し）。ねじらない
            W3=Qb@M*LEAFL+base;sc.part()
            for q in W3:sc.tri(q[0],q[1],q[2],N.LEAFB[tone])
    print('葉',len(PL),'まい。交差するので置かなかった葉',skipped)
    EXTRA.placed=PL;EXTRA.leafn=LEAFN
    sc.material(None);sc.outline()
def PARTS():return []
def POST(im):return N.specks(im)
if __name__=='__main__':
    import sys
    if '--skel' in sys.argv:makeskel();print('骨格を書いた',SKELF)
