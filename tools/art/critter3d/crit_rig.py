"""小さな生き物（js/critters.js）のボーン（骨）とモーション。持ち主のモデル（tools/art/models/animals/*.glb）に骨を入れ、コマごとにポーズをつけて写す（ドット絵のアニメ）。
飼う生き物（tools/art/animals/ani_rig.py）と同じやり方：点ごとの重み（0〜1、なめらか）で骨について行き、骨は支点のまわりにまわる（線形のスキニング）。
しっぽ（tail）は重さがあるように、からだの動きより少しおくれてついてくる：からだが上へ動きだすと、たれる（−）・てっぺんで、ふわっと上がる（＋）・地面につくと、下へゆれる（−）。
座標：モデルの顔の向き（目の位置）を前 u、それと直角の横 v（右が+）、上 z。どれもモデルの高さ H でわった数（0〜1）。
骨（BONES）：k（ポーズの名前）・w（重み：u,v,z,色→0〜1）・p（支点 u,v,z）・ax（まわす軸 's' 横＝うなずく・'f' 前＝ころがる・'z' 上＝ふりむく）・
  mir（左右で逆にまわす：羽のはばたき）・sc（まわさずに、支点から k 倍にふくらむ：のどなど）。
からだ（ポーズの名前）：bob 上へ（H）・sq たてのちぢみ・st 前へののび・pitch 前へかたむく（度）・hop 前へうごく（H、歩くコマのずれをなくすため、ゲームでは使わない）。
向き：前 u を、画面の右・少し手前（TURN 度）へ向ける（モデルごとに顔の向きがちがうので、目の位置からきめる）。"""
import sys,os,math,numpy as np
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','animals'))
from ani_rig import smooth,rotm
TONBOB=-.3   # とんぼの胴体を小さくする（−0.3 で0.7倍）
HOTB,HOTW,HOTMV=-.3,0,.3   # ほたるの胴体を小さく（0.7倍）・羽はモデルの大きさ（はばたくと0.45倍）・羽をお尻のほうへずらす（H。持ち主のきめ）
TURN=20   # 右むきから、手前へ何度（顔が少し見える）
def band(x,a,b,e=.06):return smooth(a-e,a+e,x)*(1-smooth(b-e,b+e,x))   # a〜b のあいだ（ふちはなめらか）
def near(c,col,t=24):return (np.abs(col-np.array(c,float)).max(1)<t).astype(float)   # その色の点
# 生き物ごと：size（高さ、マス）・BONES・コマ（FR）
C={
 'usagi':dict(size=.45,legs=dict(zc=.06,hip=.22,rad=.14,n=100),bones=[
     dict(k='tail',w=lambda u,v,z,c:near((251,245,234),c,8)*smooth(-.3,-.4,u),tail=1),   # しっぽ（まるい玉）
     dict(k='ear',w=lambda u,v,z,c:smooth(.6,.7,z),p=(-.02,0,.64),ax='s'),   # 耳：頭のてっぺんから上。つけねで前後にたおす
     dict(k='earL',w=lambda u,v,z,c:smooth(.6,.7,z)*smooth(-.04,.08,v),p=(-.02,.1,.64),ax='f')],   # 片耳だけ、ぴくっと
   fr={'0':{},'1':dict(sq=.95,ear=-4,tail=6),   # 止まる：息をする
       'w0':dict(sq=.84,ear=-14,legF=-10,legB=-25,tail=14),'w1':dict(st=1.12,sq=.97,ear=18,pitch=-10,legF=-35,legB=50,tail=-28),'w2':dict(st=1.05,ear=8,pitch=6,legF=-25,legB=25,tail=22),'w3':dict(sq=.9,ear=-6,legF=15,legB=-10,tail=-20),   # はねる：かがむ→のびる→まえへ→つく（はねる高さはゲームで）
       'e0':dict(earL=-30),'e1':dict(earL=-30,ear=-14),'e2':dict(earL=8,ear=10)}),   # 耳をぴくぴく
 'risu':dict(size=.45,legs=dict(zc=.06,hip=.22,rad=.15,col=(242,211,171),back=1),bones=[   # 足：うしろ足のうら（うすい色）の2本。前足は、むねの前
     dict(k='tail',w=lambda u,v,z,c:near((222,136,51),c,10)*smooth(-.02,-.15,u),tail=1,bend=1),   # しっぽ（大きなふさ）：先ほどしなる
     dict(k='head',w=lambda u,v,z,c:smooth(.45,.56,z)*smooth(-.1,.1,u),p=(.12,0,.48),ax='s')],
   prop=lambda fr:[('ball',(.64,0,.4),.08,(196,134,74))] if fr[0]=='e' else [],   # 木の実（両手のあいだ）
   fr={'0':{},'1':dict(sq=.95,tail=-4),'w0':dict(sq=.86,tail=-12,legF=-10,legB=-25),'w1':dict(st=1.1,pitch=-8,tail=24,legF=-35,legB=50),'w2':dict(st=1.04,pitch=5,tail=-18,legF=-25,legB=25),'w3':dict(sq=.92,tail=16,legF=15,legB=-10),
       'e0':dict(pitch=-10,head=10,tail=6),'e1':dict(pitch=-10,head=20,sq=.97,tail=10),'e2':dict(pitch=-10,head=12,tail=4)}),   # 木の実をかじる：すこしおきあがって、もぐもぐ
 'harinezumi':dict(size=.35,legs=dict(zc=.06,hip=.16,rad=.14),bones=[
     dict(k='nose',w=lambda u,v,z,c:smooth(.4,.62,u)*(1-smooth(.55,.7,z)),p=(.4,0,.3),ax='s')],
   fr={'0':{},'1':dict(sq=.96),'w0':dict(swing=35,st=1.03),'w1':dict(sq=.96),'w2':dict(swing=-35,st=1.03),'w3':dict(sq=.96),
       'e0':dict(nose=14),'e1':dict(nose=-8,st=1.04),'e2':dict(nose=14)}),   # 鼻をくんくん
 'nezumi':dict(size=.32,rot=0,legs=dict(zc=.06,hip=.2,rad=.14,pts=[(.04,-.47),(.18,-.11),(-.09,.03),(-.2,-.31)]),bones=[   # 足：ピンクの足のうら3つと、ピンクがぬられていない4つめ（からだの色の出っぱり。4本が四角のかどにならぶ）
        # rot：まわさない（顔は右手前、しっぽの白い玉が左。横にすると玉が顔の前にくる）
     dict(k='tail',w=lambda u,v,z,c:np.maximum(near((222,156,91),c,8),near((251,248,242),c,8)*smooth(.4,.5,z)),tail=1,bend=1),   # しっぽと、先の白いわた毛（いっしょに動く）
     dict(k='head',w=lambda u,v,z,c:smooth(.0,.25,u)*smooth(.3,.5,z),p=(.0,0,.4),ax='s')],
   fr={'0':{},'1':dict(sq=.95,tail=6),'w0':dict(swing=40,st=1.06,sq=.95,tail=12),'w1':dict(st=.97,tail=-10),'w2':dict(swing=-40,st=1.06,sq=.95,tail=12),'w3':dict(st=.97,tail=-10),
       'e0':dict(pitch=-8,tail=-8),'e1':dict(pitch=-6,head=3,tail=-4),'e2':dict(pitch=-8,head=-2,tail=-10)}),   # おきあがって、鼻をひくひく（たねの玉は、持ち主のきめで、けした）
 'mogura':dict(size=.32,legs=dict(zc=.06,hip=.18,rad=.16,merge=.28,n=100,ring=.25),bones=[
     dict(k='head',w=lambda u,v,z,c:smooth(.2,.55,u),p=(.25,0,.3),ax='s')],
   fr={'0':{},'1':dict(sq=.96),'w0':dict(swing=35,st=1.04),'w1':dict(sq=.96),'w2':dict(swing=-35,st=1.04),'w3':dict(sq=.96),
       'e0':dict(head=16),'e1':dict(head=26,sq=.95),'e2':dict(head=10)}),   # 土をほる
 'katatsumuri':dict(size=.3,bones=[
     dict(k='horn',w=lambda u,v,z,c:near((248,205,48),c,30)+smooth(.82,.88,z)*smooth(.4,.5,u),p=(.62,0,.78),ax='s'),
     dict(k='hide',w=lambda u,v,z,c:(1-near((239,162,174),c,12)*(1-smooth(.5,.62,u)))*smooth(.15,.4,u),p=(.05,0,.4),sc=1)],   # から（ピンク）いがい：からのほうへちぢむ（前のピンクの点は、からだの色のほっぺ。いっしょにちぢむ）
   fr={'0':{},'1':dict(horn=-8),'w0':dict(st=1.08,sq=.97),'w1':dict(st=1.03),'w2':dict(st=.96,sq=1.0),'w3':dict(st=1.0),
       'e0':dict(horn=30,hide=-.25),'e1':dict(horn=50,hide=-.45),'e2':dict(horn=30,hide=-.25)}),   # からにひっこむ
 'tentoumushi':dict(size=.22,legs=dict(zc=.12,hip=.25,rad=.14,n=100),bones=[
     dict(k='wing',w=lambda u,v,z,c:np.maximum(near((216,31,16),c,40),near((242,222,176),c,10)*smooth(.38,.45,z)*(1-smooth(.4,.5,u))),p=(-.1,0,.95),ax='f',mir=1)],   # 赤いはね：左右にひらく。はねの上の白い点（足・おなかと同じクリーム色の、高い所の部品）もいっしょに（ないと、ひらいたとき点がからだの中にのこる）
   fr={'0':{},'1':dict(sq=.96),'w0':dict(swing=35),'w1':dict(sq=.97),'w2':dict(swing=-35),'w3':dict(sq=.97),
       'e0':dict(wing=22),'e1':dict(wing=40),'e2':dict(wing=22)}),
 'mitsubachi':dict(size=.3,fly=1,legs=dict(zc=.06,hip=.2,rad=.12,col=(171,105,48)),bones=[
     dict(k='wing',w=lambda u,v,z,c:near((242,245,248),c,20),p=(-.1,0,.66),sc=1,root=1)],   # 羽：つけねへちぢむ（はばたいて見える。まわすと、うすい羽がとがった線になった）
   fr={'w0':dict(wing=0,dangle=12),'w1':dict(wing=-.55,dangle=-4),'e0':dict(wing=-.2,pitch=10,legF=-15,legB=15),'e1':dict(wing=0,pitch=10,legF=-15,legB=15)}),   # はばたく・花にとまる
 'hotaru':dict(size=.25,fly=1,legs=dict(zc=.12,hip=.22,rad=.14,col=(171,108,51)),bones=[
     dict(k='wing',w=lambda u,v,z,c:near((242,245,248),c,20),p=(-.05,0,.6),sc=1,root=1),   # 羽：つけねへちぢむ（はばたいて見える。まわすと、うすい羽がとがった線になった）
     dict(k='body',w=lambda u,v,z,c:1-near((242,245,248),c,20),p=(-.05,0,.6),sc=1),   # 胴体（羽いがい）：羽のつけねを中心に小さく（持ち主のきめ）
     dict(k='wmv',w=lambda u,v,z,c:near((242,245,248),c,20),mv=1,d=(0,-1,-.3))],   # 羽をお尻（−v）のほうへ、少し下げてずらす
   rot=-169,   # からだは横（v）にのび、顔（目）は u を向くので、目からきめると、からだが奥へのびて羽が上につき出た。お尻（黄色、モデルの色 hotaru_tail.py）が左
   fr={'w0':dict(body=HOTB,wing=HOTW,wmv=HOTMV,dangle=12),'w1':dict(body=HOTB,wing=HOTW*.45-.55,wmv=HOTMV,dangle=-4)}),
 'tonbo':dict(size=.3,fly=1,fdeg=-101,bones=[   # 目の色がないので、からだののびる向き（頭は目の青いほう）
     dict(k='wing',w=lambda u,v,z,c:near((208,234,214),c,24),p=(0,0,.62),ax='f',mir=1),
     dict(k='body',w=lambda u,v,z,c:1-near((208,234,214),c,24),p=(0,0,.62),sc=1)],   # 胴体と頭（羽いがい）：羽のつけねを中心に小さく（持ち主のきめ）
   fr={'w0':dict(body=TONBOB,wing=-12),'w1':dict(body=TONBOB,wing=10),'e0':dict(body=TONBOB,wing=-4),'e1':dict(body=TONBOB,wing=4)}),   # はばたく・ホバリング
 'kaeru':dict(size=.3,legs=dict(zc=.06,hip=.25,rad=.18,merge=.34,n=100),bones=[   # 足：ゆびの出っぱりを、足ごとにまとめる
     
     dict(k='puff',w=lambda u,v,z,c:smooth(.25,.45,u)*smooth(.5,.3,z)*smooth(.05,.15,z),p=(.3,0,.25),sc=1)],   # のど
   fr={'0':{},'1':dict(sq=.96),'w0':dict(sq=.84,legF=-10,legB=-20),'w1':dict(st=1.14,sq=1.0,pitch=-12,legF=-35,legB=55),'w2':dict(st=1.06,pitch=6,legF=-25,legB=25),'w3':dict(sq=.88,legF=15,legB=-10),
       'e0':dict(puff=.4),'e1':dict(puff=.9),'e2':dict(puff=.25)}),   # のどをふくらませる
}
VIEWD={'d':1,'u':-1}   # 正面（d：手前へ歩く）・うしろ（u：奥へ歩く）
FRONT={'usagi':(70,-80),'risu':(53,-95),'harinezumi':(57,-110),'nezumi':(-12,132),'mogura':(65,-110),'katatsumuri':(57,-93),'tentoumushi':(55,-95),'kaeru':(50,-100)}
# 横の絵から何度まわすと、正面（d）・うしろ（u）か。まっすぐより少し右（顔が見える、少しななめ。ゲームで左右反転する）。生き物ごとに絵を見てきめた（ねずみは、しっぽの玉が顔の前にくるので、横に近い）
def vturn(name,vw):return FRONT[name][0 if vw=='d' else 1] if vw else 0
GROUND=tuple(FRONT)   # 地面を歩く・はねる物：正面・うしろの絵もある（上下へ動くとき、横を向いたまますべらないように）
def frames(name):
    f=list(C[name]['fr']);return f+[v+x for v in VIEWD for x in f] if name in GROUND else f
def view(frame):return (frame[0],frame[1:]) if frame[0] in VIEWD else ('',frame)   # 'dw0' → ('d','w0')
class Rig:
    def __init__(s,name,V,F,Cf):
        D=C[name];s.D=D;s.name=name
        col=np.zeros((len(V),3));n=np.zeros(len(V))
        for k in range(3):np.add.at(col,F[:,k],Cf);np.add.at(n,F[:,k],1)
        col/=np.maximum(n,1)[:,None];s.col=col
        H=V[:,2].max();s.H=H;c=np.array([(V[:,0].max()+V[:,0].min())/2,(V[:,1].max()+V[:,1].min())/2]);s.c=c
        if 'fdeg' in D:a=math.radians(D['fdeg']);f=np.array([math.cos(a),math.sin(a)])
        else:
            eye=col.mean(1)<30;f=V[eye][:,:2].mean(0)-c;f/=np.linalg.norm(f)
        s.f=np.array([f[0],f[1],0.]);s.s=np.array([-f[1],f[0],0.]);s.z=np.array([0,0,1.])
        s.u=(V[:,:2]-c)@f/H;s.v=(V[:,:2]-c)@s.s[:2]/H;s.zz=V[:,2]/H
        s.W=[np.clip(b['w'](s.u,s.v,s.zz,col),0,1) for b in D['bones']]
        s.legs=[];s.wl=np.zeros(len(V));s.li=np.zeros(len(V),int)
        if D.get('legs'):s._legs(V,F,D['legs'])
        s.tax={}
        for i,b in enumerate(D['bones']):   # しっぽ（tail）：つけね＝からだのまん中にいちばん近い点・先＝いちばん遠い点。軸は、上とつけね→先の向きに直角（＋で先が上へ）。bend：先ほど大きく動く（しなる）
            if not b.get('tail'):continue
            m=s.W[i]>0;P=V[m];bc=np.array([c[0],c[1],H*.4]);r0=P[np.linalg.norm(P-bc,axis=1).argmin()];dd=np.linalg.norm(P-r0,axis=1);tip=P[dd.argmax()]
            dh=tip-r0;dh[2]=0;dh/=np.linalg.norm(dh)+1e-9;ax_=np.cross([0,0,1.],dh);s.tax[i]=ax_/np.linalg.norm(ax_);s.root_t=getattr(s,'root_t',{});s.root_t[i]=r0
            if b.get('bend'):w=s.W[i].copy();w[m]*=np.clip(np.linalg.norm(V[m]-r0,axis=1)/dd.max(),0,1)**.6;s.W[i]=w
        s.root={i:V[w>.5][np.linalg.norm(V[w>.5][:,:2]-c,axis=1).argmin()] for i,(b,w) in enumerate(zip(D['bones'],s.W)) if b.get('root') and (w>.5).any()}   # root：支点は、からだのまん中にいちばん近い点（羽のつけね）
    def _legs(s,V,F,L):
        """足：からだの下のはし（高さ zc より下）で、べつべつにわかれた出っぱり（点の場所が同じなら、つながっているとみる）を、足のさきとする。
        近い出っぱり（merge より近い）は1本に。支点は、足のさきの真上の hip の高さ。重み：hip より下ほど足について行き、足のさきから rad までの点だけ"""
        from scipy.sparse import coo_matrix
        from scipy.sparse.csgraph import connected_components
        uid=np.unique(np.round(V/s.H*400).astype(int),axis=0,return_inverse=True)[1].ravel()
        low=s.zz<L['zc'];sel=low[F].all(1)
        if L.get('col') is not None:sel&=(np.abs(s.col[F].mean(1)-np.array(L['col'],float)).max(1)<L.get('ct',24))
        Fm=uid[F[sel]];e=np.r_[Fm[:,[0,1]],Fm[:,[1,2]]];lab=connected_components(coo_matrix((np.ones(len(e)),(e[:,0],e[:,1])),shape=(uid.max()+1,)*2),directed=False)[1]
        used=np.unique(F[sel]);ls=lab[uid[used]];pts=[]
        for b in np.unique(ls):
            m=used[ls==b]
            if len(m)>=L.get('n',60):pts.append([s.u[m].mean(),s.v[m].mean(),len(m)])
        out=[]
        pts=[p for p in pts if math.hypot(p[0],p[1])>=L.get('ring',0)]   # ring：まん中のおなかの出っぱりは、足にしない
        for p in sorted(pts,key=lambda q:-q[2]):   # 近い出っぱりは、まとめる（大きいほうへ）
            if all(math.hypot(p[0]-q[0],p[1]-q[1])>L.get('merge',.12) for q in out):out.append(p)
        s.legs=[(u,v) for u,v,_ in out] if 'pts' not in L else list(L['pts'])   # pts：足の場所を書く（色ではさがせない足があるとき）
        if not s.legs:return
        d=np.stack([np.hypot(s.u-u,s.v-v) for u,v in s.legs],1);s.li=d.argmin(1);dm=d.min(1);R=L.get('rad',.16)
        s.wl=smooth(L['hip'],L['hip']*.35,s.zz)*(1-smooth(R*.6,R,dm))
        s.hip=L['hip'];um=np.mean([u for u,_ in s.legs])   # 前足・うしろ足のさかい：足のまん中（back：みんな、うしろ足）
        s.front=[(not L.get('back')) and u>um for u,_ in s.legs]
        s.right=[]   # 右・左：前足どうし・うしろ足どうしのまん中より右か（モデルのまん中は、しっぽなどでずれる）
        for i,(u,v) in enumerate(s.legs):g=[vv for j,(_,vv) in enumerate(s.legs) if s.front[j]==s.front[i]];s.right.append(v>np.mean(g) if len(g)>1 else v>0)
    def P(s,p):return np.array([s.c[0],s.c[1],0.])+(s.f*p[0]+s.s*p[1]+s.z*p[2])*s.H
    def pose(s,V,bob=0.,sq=1.,st=1.,pitch=0.,hop=0.,**kw):
        V=V.copy();ax={'s':s.s,'f':s.f,'z':s.z}
        for i,(b,w) in enumerate(zip(s.D['bones'],s.W)):
            a=kw.get(b['k'],0)
            if not a or not w.any():continue
            m=w>0
            if i in s.tax:q=s.root_t[i];P=(V[m]-q)@rotm(s.tax[i],a).T+q;V[m]=V[m]*(1-w[m][:,None])+P*w[m][:,None];continue
            if b.get('mv'):V[m]+=np.outer(w[m]*a,s.f*b['d'][0]+s.s*b['d'][1]+s.z*b['d'][2])*s.H;continue   # mv：まわさずに、d の向きへ a（H）だけずらす
            q=s.root[i] if i in s.root else s.P(b['p']);P0=V[m]-q
            if False:pass
            elif b.get('sc'):P=P0*(1+a)+q
            elif b.get('mir'):
                sg=np.sign(s.v[m]+1e-9)[:,None];P=np.where(sg>0,P0@rotm(ax[b['ax']],a).T,P0@rotm(ax[b['ax']],-a).T)+q
            else:P=P0@rotm(ax[b['ax']],a).T+q
            V[m]=V[m]*(1-w[m][:,None])+P*w[m][:,None]
        sw,lf,lb,dg=kw.get('swing',0),kw.get('legF',0),kw.get('legB',0),kw.get('dangle',0)
        if s.legs and (sw or lf or lb or dg):   # 足：つけね（足のさきの真上、hip の高さ）を支点に、横の軸のまわりにふる（＋で足のさきが、うしろへ）。歩く：ななめの組で逆（swing）。はねる：前足 legF・うしろ足 legB。とぶ：みんな同じ（dangle）
            for i,(u,v) in enumerate(s.legs):
                a=sw*(1 if s.front[i]==s.right[i] else -1)+(lf if s.front[i] else lb)+dg;m=(s.li==i)&(s.wl>0)
                if not a or not m.any():continue
                q=s.P((u,v,s.hip));P=(V[m]-q)@rotm(s.s,a).T+q;w=s.wl[m][:,None];V[m]=V[m]*(1-w)+P*w
        base=np.array([s.c[0],s.c[1],0.])
        V[:,2]*=sq
        if st!=1:d=(V-base)@s.f;V+=np.outer(d*(st-1),s.f)
        if pitch:V=(V-base)@rotm(s.s,pitch).T+base
        V[:,2]+=bob*s.H;V+=s.f*hop*s.H
        V[:,2]-=min(0,V[:,2].min())
        return V
_mc={};_rigs={}
def load(name):
    from blueprint import model_tris
    _mc[name]=model_tris('animals/%s.glb'%name,0.5,0.5,0,C[name]['size'],0,0)
def rig(name):
    if name not in _rigs:
        if name not in _mc:load(name)
        V,F,Cf=_mc[name];_rigs[name]=Rig(name,V,F,Cf)
    return _rigs[name]
def _turn(rg,W,vw=''):
    a=math.radians(rg.D['rot']) if 'rot' in rg.D else math.radians(TURN)-math.atan2(rg.f[1],rg.f[0]);a+=math.radians(vturn(rg.name,vw));Rm=np.array([[math.cos(a),-math.sin(a),0],[math.sin(a),math.cos(a),0],[0,0,1]]);c=np.array([rg.c[0],rg.c[1],0.])
    return (W-c)@Rm.T+c
def props(name,frame):
    """小物（木の実・たね）：[(形,場所 u,v,z,半径 H,色)] → ゲームの向きの [('ball',(x,y,z,r),色)]。からだのかたむき・のびは、骨なしで同じようにつける"""
    pr=C[name].get('prop');out=[]
    if not pr:return out
    vw,frame=view(frame);rg=rig(name);q=C[name]['fr'][frame];base=np.array([rg.c[0],rg.c[1],0.])
    for k,p,r,col in pr(frame):
        V=rg.P(p)[None,:].copy();V[:,2]*=q.get('sq',1);d=(V-base)@rg.f;V+=np.outer(d*(q.get('st',1)-1),rg.f)
        if q.get('pitch'):V=(V-base)@rotm(rg.s,q['pitch']).T+base
        V=_turn(rg,V,vw)[0];out.append((k,(V[0],V[1],V[2],r*rg.H),col))
    return out
def warp(name,frame):
    """blueprint の Part.warp にわたす関数：点 → ポーズをつけて、前を右・少し手前へ向けた点"""
    vw,fr=view(frame)
    def f(V):
        rg=rig(name);return _turn(rg,rg.pose(V,**C[name]['fr'][fr]),vw)
    return f
