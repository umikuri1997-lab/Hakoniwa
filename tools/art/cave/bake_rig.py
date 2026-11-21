"""洞窟のバケモノ（js/cave-bake.js）の3Dから写すドット絵：トリポのモデル（tools/art/models/cave/bk_*.glb。色がないモデル）に、
場所で色をぬり（paint）、骨（BONE：足・うで・頭・耳・あご・指など）でポーズ（warp）をつけて、コマごとに写す。bake_build.py が設計図を作って写す。
座標：model_tris のあと（x 東・y 南＝手前・z 上、足もとのまん中が (0.5,0.5,0)）。モデルの高さ H でわった数 xn・yn・zn で色をきめる。
コマ：'0'・'1' 止まる（息）・'w0'〜'w3' 歩く・'a0'・'a1' たたく（ためる・ふりおろす）。"""
import math,numpy as np
def sm(a,b,x):t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
TURN=-25   # 正面から右へ（顔が見える、ななめ）
# 名前→(size 高さのマス, 色の関数, ポーズの種類)
def _c(*v):return np.array(v,float)
def P_kui(xn,yn,zn,cf):
    c=np.tile(_c(118,96,72),(len(xn),1))           # 土と根のからだ
    c[zn>.86]=_c(150,90,58)                          # くい（上につき出たさびた鉄）
    c[(zn<.45)&(np.abs(xn)>.12)]=_c(96,80,60)        # たれた根
    return c
PAL={
 'kui':dict(size=.95,base=(118,96,72),eye=(232,216,160),kind='walk'),
 'sui':dict(size=.8,base=(70,56,104),eye=(214,206,255),kind='float'),
 'yoru':dict(size=.55,base=(36,44,62),eye=(127,232,255),kind='blob'),
 'tame':dict(size=1.0,base=(156,188,208),eye=(42,58,78),kind='walk'),
 'hone':dict(size=1.0,base=(226,216,190),eye=(255,138,90),kind='walk'),
 'ro':dict(size=.9,base=(74,44,34),eye=(255,216,96),kind='walk'),
 'mi':dict(size=1.3,base=(92,100,110),eye=(255,224,138),kind='walk'),
 'esa':dict(size=.7,base=(226,214,196),eye=(255,107,138),kind='hop'),
 'te':dict(size=2.2,base=(58,48,56),eye=None,kind='te')}
def norm(V):
    H=max(V[:,2].max(),1e-6);return (V[:,0]-.5)/H,(V[:,1]-.5)/H,V[:,2]/H,H
MODELCOL=True   # True：モデルの色を使う（持ち主が色をつけたモデル）。False：場所で色をぬる（色のないモデルのとき）
def comps(V,F):
    """つながった部品ごとの番号（点の場所が同じなら、つながっているとみる）"""
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import connected_components
    Fm=F;uid=np.arange(len(V))   # 点の番号でつなぐ（目などは、場所が同じでも、べつの点）
    e=np.r_[Fm[:,[0,1]],Fm[:,[1,2]]];n=uid.max()+1;lab=connected_components(coo_matrix((np.ones(len(e)),(e[:,0],e[:,1])),shape=(n,n)),directed=False)[1]
    return lab[Fm[:,0]]
def paint(name):
    D=PAL[name]
    def f(V,F,Cf):
        faces(name,F)   # 骨の重みをならすのに、面（となりの点）を使う
        if MODELCOL:return Cf   # 持ち主が色をつけたモデル（トリポのテクスチャを点の色にした物）：その色のまま
        P=V[F].mean(1);xn,yn,zn,H=norm(P);c=np.tile(np.array(D['base'],float),(len(F),1))
        g=COLOR.get(name)
        if g:c=g(xn,yn,zn,c)
        lab=comps(V,F);cnt=np.bincount(lab);big=cnt.argmax()
        for k in np.unique(lab):   # 小さな部品：目（・歯など）
            m=lab==k;n=cnt[k]
            if k==big or n>D.get('small',160):continue
            z=zn[m].mean();y=yn[m].mean();x=xn[m].mean()
            r=SMALL.get(name,lambda x,y,z,n:'eye' if y>.08 else None)(x,y,z,n)
            if isinstance(r,str):c[m]=D['eye']
            elif r is not None:c[m]=r
        for ex,ez,er,col in EYEP.get(name,()):   # 目の場所（部品にわかれていない目）：前の面の、その場所
            m=(np.hypot(xn-ex,zn-ez)<er)&(yn>.08);c[m]=col if col is not None else D['eye']
        return c
    return f
EYEP={'tame':[(.11,.77,.045,None),(-.05,.77,.045,None)],'ro':[(.09,.69,.04,None),(-.09,.69,.04,None)],
      'hone':[(.07,.8,.045,(70,52,44)),(-.07,.8,.045,(70,52,44)),(.07,.8,.018,(255,138,90))]}
def band(zn,a,b):return (zn>a)&(zn<b)
COLOR={   # からだの色（場所で）
 'kui':lambda x,y,z,c:np.where((band(z,.78,2)&(np.abs(x)<.07))[:,None],_c(150,86,56),np.where((band(z,-1,.42)&(np.abs(x)>.09))[:,None],_c(92,74,54),c)),
 'sui':lambda x,y,z,c:np.where(band(z,-1,.28)[:,None],_c(130,110,200),c),
 'yoru':lambda x,y,z,c:np.where(band(z,.75,2)[:,None],_c(58,72,96),c),
 'tame':lambda x,y,z,c:np.where(band(z,.6,.72)[:,None],_c(214,234,246),c),
 'hone':lambda x,y,z,c:np.where(band(z,.66,2)[:,None],_c(236,228,206),c),
 'ro':lambda x,y,z,c:np.where(((np.abs((x*7+z*4+.3*np.sin(z*23))%1-.5)<.05)&(y>.02)&band(z,.08,.6))[:,None],_c(255,138,48),c),   # 光るひび
 'mi':lambda x,y,z,c:np.where((np.abs(z*7-np.round(z*7))<.08)[:,None],_c(140,96,62),c),
 'esa':lambda x,y,z,c:np.where((band(z,.12,.66)&(np.abs(x)<.34)&(y>.12))[:,None],_c(84,30,40),c),   # 大きな口の中
 'te':lambda x,y,z,c:np.where(band(z,-1,.22)[:,None],_c(96,78,62),c)}
SMALL={   # 小さな部品：'eye'・色・None（からだのまま）
 'sui':lambda x,y,z,n:'eye' if y>.08 and n>50 else _c(170,150,240),   # 目と、ささった水晶
 'esa':lambda x,y,z,n:(_c(240,232,216) if z<.55 else 'eye') if y>.2 else None,   # 歯と、上の目
 'hone':lambda x,y,z,n:None,
 'mi':lambda x,y,z,n:'eye' if z>.8 and y>.02 else None,
 'ro':lambda x,y,z,n:'eye' if z>.6 and y>.1 else None,
 'te':lambda x,y,z,n:None}
# ---------- 骨（ボーン） ----------
# リギングのスキル（arjun988/blender-skills の rigging・davincidreams/agent-team-plugins の rigging、どちらも MIT）の決まりで組む：
#  ・骨は親子のならび（root → 背骨 → 頭、背骨 → 上うで → 下うで、root → もも → すね）。関節は、からだがまがる所（かた・ひじ・また・ひざ・首）に置く
#  ・重み：骨（線分）までのきょりで決め、1つの点は4本まで・合計1（normalize）。メッシュのとなりの点どうしでならす（smooth）。関節のまん中に 1/0 のさかいを作らない
#  ・ポーズは、骨ごとに関節のまわりの回転（FK）。子は親の動きについていく。点は、骨の動きを重みでまぜる（線形のスキニング）
# 場所の数は、モデルの高さ H でわった数（x：まん中からの横・y：まん中からの前（手前が+）・z：足もとからの高さ）。断面をしらべてきめた
def _hum(sh,elb,hand,hip,knee,foot,sp,neck,top=1.0,rigid=False):
    """ひと形の骨。sh・elb・hand・hip・knee・foot は左がわ（x がマイナス）の (x,y,z)。右は x をうらがえす。断面をはかって、その骨のまん中に置く"""
    B=[('root',None,(0,0,hip[2]),(0,0,sp)),('spine','root',(0,0,sp),(0,0,neck)),('head','spine',(0,0,neck),(0,0,top))]
    m=lambda p,k:(p[0]*k,p[1],p[2])
    for s_,k in(('L',1),('R',-1)):
        B+=[('clav%s'%s_,'spine',(0,sh[1],sh[2]+.03),m(sh,k)),('arm%s_u'%s_,'clav%s'%s_,m(sh,k),m(elb,k)),('arm%s_l'%s_,'arm%s_u'%s_,m(elb,k),m(hand,k)),
            ('leg%s_u'%s_,'root',m(hip,k),m(knee,k)),('leg%s_l'%s_,'leg%s_u'%s_,m(knee,k),m(foot,k))]
    return B
SKEL={
 'kui':_hum(sh=(-.21,.09,.45),elb=(-.24,.11,.25),hand=(-.23,.03,.03),hip=(-.12,.05,.32),knee=(-.13,.09,.15),foot=(-.11,0,.0),sp=.5,neck=.70),   # 根の足・横の根のうで
 'tame':_hum(sh=(-.21,.02,.62),elb=(-.22,-.01,.34),hand=(-.23,.12,.06),hip=(-.12,.0,.3),knee=(-.12,.06,.14),foot=(-.11,.17,.02),sp=.46,neck=.74),
 'hone':_hum(sh=(-.19,-.02,.60),elb=(-.2,-.03,.38),hand=(-.22,-.02,.15),hip=(-.12,-.03,.19),knee=(-.11,-.04,.09),foot=(-.12,-.02,.0),sp=.40,neck=.66),
 'ro':_hum(sh=(-.21,0,.45),elb=(-.22,0,.30),hand=(-.24,0,.15),hip=(-.10,0,.12),knee=(-.10,0,.06),foot=(-.11,0,.0),sp=.30,neck=.57),
 'mi':_hum(sh=(-.10,0,.70),elb=(-.13,0,.46),hand=(-.15,.03,.12),hip=(-.06,0,.47),knee=(-.055,.02,.23),foot=(-.06,0,.0),sp=.58,neck=.77,rigid=True),
 # 光すい（ふわふわ）：かさ（bell）が息をするようにのびちぢみ、下にたれた4本の足は3つのふしで、つけねから先へおくれて波がつたわる
 'sui':[('root',None,(0,0,.3),(0,0,.6)),('bell','root',(0,0,.6),(0,0,1.0))]+[b for k,x in enumerate((-.18,-.08,.03,.13)) for b in (
        ('t%d_a'%k,'root',(x,-.06,.32),(x,-.06,.22)),('t%d_b'%k,'t%d_a'%k,(x,-.06,.22),(x,-.06,.11)),('t%d_c'%k,'t%d_b'%k,(x,-.06,.11),(x,-.06,.0)))],
 # 夜の水のかたまり（ねばねば）：まん中の柱（3つ）がのびちぢみ・ゆれ、下の4つのへり（前・うしろ・左・右）がひろがる・ちぢむ
 'yoru':[('root',None,(0,0,0),(0,0,.35)),('mid','root',(0,0,.35),(0,.1,.7)),('tip','mid',(0,.1,.7),(.1,.3,1.0)),
        ('lobF','root',(0,.45,.15),(0,.9,.05)),('lobB','root',(0,-.45,.15),(0,-.9,.05)),('lobL','root',(-.45,0,.15),(-.9,0,.05)),('lobR','root',(.45,0,.15),(.9,0,.05))],
 'esa':[('root',None,(0,0,.3),(0,.25,.35)),('back','root',(0,0,.3),(0,-.62,.25)),('head','root',(0,.25,.35),(0,.5,.62)),('jaw','head',(0,.42,.38),(0,.62,.2)),
        ('earL_u','head',(-.15,.5,.70),(-.15,.5,.85)),('earL_l','earL_u',(-.15,.5,.85),(-.15,.52,1.0)),('earR_u','head',(.15,.5,.70),(.15,.5,.85)),('earR_l','earR_u',(.15,.5,.85),(.15,.52,1.0))],
 'te':[('root',None,(0,0,0),(0,0,.25)),('arm','root',(0,0,.25),(0,0,.5)),('palm','arm',(0,0,.5),(0,0,.76)),('f1','palm',(0,0,.76),(0,0,.86)),('f2','f1',(0,0,.86),(0,0,.94)),('f3','f2',(0,0,.94),(0,0,1.0))]}
FARK=1.5   # 空間で、いちばん近い骨のこの倍よりとおい、木の上ではなれた骨は、まぜない
ARMR={'tame':{'armL_u':.05,'armR_u':.05}}   # 上うでの太さ（モデルの高さを1として）
ISLAND=40   # これより点の少ない、ほかの手足にかこまれた島は、まわりにつける
RIGID={'mi'}   # べつべつの部品でできた体（あやつり人形のよう）：部品ごとに1本の骨にまるごとつける（まぜると部品がのびる）
KIND={'kui':'hum','tame':'hum','hone':'hum','ro':'hum','mi':'hum','sui':'float','yoru':'blob','esa':'hop','te':'te'}
def _segd(P,a,b):
    a=np.array(a,float);b=np.array(b,float);d=b-a;t=np.clip(((P-a)@d)/max(d@d,1e-9),0,1);return np.linalg.norm(P-(a+t[:,None]*d),axis=1)
def _norm(name,V):
    H=max(V[:,2].max(),1e-6);cx=(V[:,0].max()+V[:,0].min())/2;cy=(V[:,1].max()+V[:,1].min())/2
    if name=='yoru':pass
    return H,cx,cy
def weights(name,V,F):
    """骨の重み：メッシュの面の上を通る道のり（はなれた体の所へ、すきまをこえて重みがとばない）で、1つの点は4本まで・合計1。
    骨のたね：その骨にいちばん近く、ほかの骨よりはっきり近い点。部品にたねがなければ、部品ぜんたいを、まん中にいちばん近い骨にまるごとつける。
    べつべつの部品でできた体（RIGID）は、部品ごとに重みのいちばん大きい骨1本にまるごと"""
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import dijkstra,connected_components
    B=SKEL[name];H,cx,cy=_norm(name,V);P=np.c_[(V[:,0]-cx)/H,(V[:,1]-cy)/H,V[:,2]/H]
    _,uid=np.unique(np.round(V,5),axis=0,return_inverse=True);uid=uid.ravel();n=uid.max()+1   # UV のつなぎ目の点は1つに
    Pu=np.zeros((n,3));np.add.at(Pu,uid,P);Pu/=np.bincount(uid,minlength=n)[:,None]
    Fu=uid[F];e=np.r_[Fu[:,[0,1]],Fu[:,[1,2]],Fu[:,[2,0]]];e=e[e[:,0]!=e[:,1]];L=np.linalg.norm(Pu[e[:,0]]-Pu[e[:,1]],axis=1)+1e-6
    G=coo_matrix((np.r_[L,L],(np.r_[e[:,0],e[:,1]],np.r_[e[:,1],e[:,0]])),shape=(n,n)).tocsr()
    D=np.stack([_segd(Pu,h,t) for _,_,h,t in B],1);nb=len(B)
    near=D.argmin(1);ds=np.sort(D,1);clear=ds[:,0]<.7*ds[:,1]
    Gd=np.full((n,nb),np.inf)
    for b in range(nb):
        ok=(near==b)&clear&(D[:,b]<.06)
        if B[b][0].startswith('arm') and B[b][0].endswith('_u'):ok&=Pu[:,2]<B[b][2][2]-.03   # 上うでのたねは、かたの関節より下だけ（かたの肉・かたにのった物は、さこつ clav へ）
        sd=np.where(ok)[0]
        if len(sd)==0:sd=np.argsort(D[:,b])[:4]
        Gd[:,b]=dijkstra(G,indices=sd,min_only=True)   # たねからの、メッシュの上の道のり
    _,comp=connected_components(G,directed=False);W=np.zeros((n,nb))
    for c in np.unique(comp):
        m=comp==c;g=Gd[m]
        if not np.isfinite(g).any():   # たねのない部品：まん中にいちばん近い骨にまるごと
            cen=Pu[m].mean(0)[None];b=int(np.argmin([_segd(cen,h,t)[0] for _,_,h,t in B]));W[m,b]=1;continue
        g=np.where(np.isfinite(g),g,1e9);W[m]=1/(g*g+.0004)**2
    W/=W.sum(1,keepdims=True)
    A=coo_matrix((np.ones(len(e)*2),(np.r_[e[:,0],e[:,1]],np.r_[e[:,1],e[:,0]])),shape=(n,n)).tocsr();deg=np.maximum(np.asarray(A.sum(1)).ravel(),1)
    for _ in range(3):W=.5*W+.5*(A@W)/deg[:,None]   # 関節のさかいを、なだらかに
    if name in RIGID:   # 部品ごとに1本（1本の骨が7わりより多い部品だけ。いくつもの骨にまたがる部品は、なだらかなまま）
        for c in np.unique(comp):
            m=comp==c;sw=W[m].sum(0);b=int(sw.argmax())
            if sw[b]>=.7*sw.sum():W[m]=0;W[m,b]=1
    for nm_,r_ in ARMR.get(name,{}).items():   # かたの氷などの下にある上うで：骨のまわり r_ の中で、かたの関節より下の点は、上うでにつける（さこつにとられて、うでを上げると上うでがのこる）
        b=[i for i in range(nb) if B[i][0]==nm_][0];m=(D[:,b]<r_)&(Pu[:,2]<B[b][2][2]);W[m]=0;W[m,b]=1
        for _ in range(2):W[m]=(.5*W+.5*(A@W)/deg[:,None])[m]
    def limb(b):   # 骨のつながりの先（うで・足・しょく手など）：根もとから2つめの骨までさかのぼる
        p=b
        while B[p][1] and B[ix0[B[p][1]]][1]:p=ix0[B[p][1]]
        return p
    ix0={B[b][0]:b for b in range(nb)};lb=np.array([limb(b) for b in range(nb)])
    par0=[ix0.get(B[b][1],-1) if B[b][1] else -1 for b in range(nb)]
    def anc0(b):
        o=[]
        while b>=0:o.append(b);b=par0[b]
        return o
    TD0=np.zeros((nb,nb),int)
    for a_ in range(nb):
        for b_ in range(nb):
            A_=anc0(a_);B_=anc0(b_);c_=next(x for x in A_ if x in B_);TD0[a_,b_]=A_.index(c_)+B_.index(c_)
    dn=D.argmin(1);far=(TD0[dn]>2)&(D>FARK*D[np.arange(n),dn][:,None])   # 木の上ではなれた骨（うでと足）は、空間でも近いときだけ：モデルで手足がくっついていても、道のりでとばない
    W=np.where(far,0,W);W/=np.maximum(W.sum(1,keepdims=True),1e-12)
    z_=W.sum(1)==0;W[z_,dn[z_]]=1
    for _ in range(3):   # 小さな島：ほかの手足のまん中に、ぽつんとのこった点のかたまり（手が足にくっついていた所）は、まわりの手足につける
        lv=lb[W.argmax(1)];same=lv[e[:,0]]==lv[e[:,1]];es=e[same]
        _,cc=connected_components(coo_matrix((np.ones(len(es)),(es[:,0],es[:,1])),shape=(n,n)),directed=False)
        cnt=np.bincount(cc);small=cnt[cc]<ISLAND
        if not small.any():break
        ed=e[~same];Wn=W.copy()
        for v in np.where(small)[0]:pass
        acc=np.zeros_like(W);k=np.zeros(n)
        for a_,b_ in((0,1),(1,0)):
            m_=small[ed[:,a_]]&~small[ed[:,b_]];np.add.at(acc,ed[m_,a_],W[ed[m_,b_]]);np.add.at(k,ed[m_,a_],1)
        ok=k>0;Wn[ok]=acc[ok]/k[ok,None];W=Wn
    nb_=[{b} for b in range(nb)];ix={B[b][0]:b for b in range(nb)}
    for b in range(nb):
        if B[b][1]:p_=ix[B[b][1]];nb_[b].add(p_);nb_[p_].add(b)
    dm=W.argmax(1);keep=np.zeros_like(W,bool)
    for b in range(nb):keep[np.ix_(dm==b,list(nb_[b]))]=True
    W=np.where(keep,W,0);W/=W.sum(1,keepdims=True)   # まぜるのは、いちばん重い骨と、その親・子だけ（うでと足など、はなれた骨をまぜない）
    k=np.argsort(-W,1)[:,4:];np.put_along_axis(W,k,0,1);W/=W.sum(1,keepdims=True)   # 4本まで
    par=[ix0.get(B[b][1],-1) if B[b][1] else -1 for b in range(nb)]
    def anc(b):
        o=[]
        while b>=0:o.append(b);b=par[b]
        return o
    TD=np.zeros((nb,nb),int)
    for a_ in range(nb):
        A_=anc(a_)
        for b_ in range(nb):
            B_=anc(b_);c_=next(x for x in A_ if x in B_);TD[a_,b_]=A_.index(c_)+B_.index(c_)
    _TD[name]=TD
    dv=W.argmax(1)[uid][F];_CUT[(name,len(V))]=(TD[dv[:,0],dv[:,1]]>2)|(TD[dv[:,1],dv[:,2]]>2)|(TD[dv[:,0],dv[:,2]]>2)   # うでと足など、はなれた骨にまたがる面（モデルでくっついていた所）
    return W[uid],P,B,H,cx,cy
def _R(rx,ry):
    a=math.radians(rx);b=math.radians(ry)
    Rx=np.array([[1,0,0],[0,math.cos(a),math.sin(a)],[0,-math.sin(a),math.cos(a)]])   # +rx：上の物が前（y+）へ・下にたれた物はうしろへ
    Ry=np.array([[math.cos(b),0,math.sin(b)],[0,1,0],[-math.sin(b),0,math.cos(b)]])   # +ry：上の物が東（x+）へ
    return Ry@Rx
def skin(B,W,P,pose):
    """FK：骨ごとに、親の動きのあとで、自分の関節（head）のまわりにまわす。点は重みでまぜる"""
    M={};out=np.zeros_like(P)
    for j,(n,par,h,t) in enumerate(B):
        v=pose.get(n,0);sc=(1,1,1)
        if isinstance(v,dict):sc=v.get('s',(1,1,1));v=v.get('r',(0,0))
        rx,ry=v if isinstance(v,tuple) else (v,0)
        R=_R(rx,ry)@np.diag(sc);h=np.array(h,float);L=np.eye(4);L[:3,:3]=R;L[:3,3]=h-R@h   # のびちぢみ（s）も関節を中心に
        M[n]=(M[par]@L) if par else L
        Q=P@M[n][:3,:3].T+M[n][:3,3];out+=W[:,j:j+1]*Q
    return out
def _mir(p):
    """左右を入れかえたポーズ（歩くの2コマめ）"""
    o={}
    for k,v in p.items():
        k2=k.replace('L_','#').replace('R_','L_').replace('#','R_') if ('L_' in k or 'R_' in k) else k;o[k2]=v
    return o
_W0=dict(legL_u=-24,legL_l=10,legR_u=22,legR_l=34,armL_u=20,armL_l=-12,armR_u=-20,armR_l=-24,spine=2,head=3,bob=.02)
_W1=dict(legL_u=-4,legL_l=4,legR_u=6,legR_l=48,armL_u=4,armR_u=-4,armR_l=-10,bob=.035)
def _wave(ph,amp,lag=.9,lean=0):
    """光すいの足：つけねから先へ、おくれて波がつたわる（ふしごとに lag ずつおくれ、先ほど大きく）。lean：ぜんぶの足を、うしろへたなびかせる"""
    o={}
    for k in range(4):
        a=2*math.pi*ph+k*1.3
        for q,(sg,g) in enumerate((('a',.6),('b',1.0),('c',1.4))):o['t%d_%s'%(k,sg)]=(lean*(q==0)+amp*g*math.sin(a-q*lag),amp*.5*g*math.cos(a-q*lag))
    return o
def _bell(s):return {'bell':{'s':(1/math.sqrt(s),1/math.sqrt(s),s)}}   # かさ：たてにのびるとき横はほそく（体積をたもつ）
def _blob(mid=0,tip=0,sq=1.0,lob=(1,1,1,1),midy=0,tipy=0):
    """夜の水：まん中の柱を、まげ（mid・tip）・たてにのびちぢみ（sq。横は体積をたもつ）、へりを前・うしろ・左・右にのばす（lob）"""
    w=1/math.sqrt(sq);o={'root':{'s':(w,w,sq)},'mid':(mid,midy),'tip':(tip,tipy)}
    for nm,f in zip(('lobF','lobB','lobL','lobR'),lob):o[nm]={'s':(f,f,1/f)}
    return o
FR={'hum':{'0':{},'1':dict(spine=3,head=5,armL_u=4,armR_u=4,sq=.985),'w0':_W0,'w1':_W1,'w2':_mir(_W0),'w3':_mir(_W1),
       'a0':dict(armL_u=-125,armR_u=-125,armL_l=-25,armR_l=-25,spine=-10,head=-12,legL_u=-8,legR_u=8,legR_l=10),
       'a1':dict(armL_u=-30,armR_u=-30,armL_l=-6,armR_l=-6,spine=18,head=14,legL_u=-14,legR_u=12,legR_l=16)},
    'float':{'0':dict(_wave(0,8),**_bell(1.04),bob=.06),'1':dict(_wave(.5,8),**_bell(.95),bob=.03),
       'w0':dict(_wave(0,14,lean=12),**_bell(1.06),bob=.06,lean=8),'w1':dict(_wave(.25,14,lean=12),**_bell(.94),bob=.08,lean=8),'w2':dict(_wave(.5,14,lean=12),**_bell(1.06),bob=.06,lean=8),'w3':dict(_wave(.75,14,lean=12),**_bell(.94),bob=.04,lean=8),
       'a0':dict(_wave(.1,10,lean=-25),**_bell(.85),bob=.1,lean=-8),'a1':dict(_wave(.6,10,lean=35),**_bell(1.15),bob=.02,lean=16)},
    'blob':{'0':_blob(mid=2,tip=3,sq=1.0),'1':_blob(mid=-2,tip=-4,sq=.94,lob=(1.04,1.04,1.04,1.04)),
       'w0':_blob(mid=-4,tip=-6,sq=.86,lob=(1.12,1.1,1.1,1.1)),'w1':_blob(mid=14,tip=10,sq=1.1,lob=(1.18,.9,.96,.96)),'w2':_blob(mid=8,tip=-6,sq=.94,lob=(1.1,.92,1.0,1.0)),'w3':_blob(mid=-6,tip=8,sq=1.0,lob=(1.0,1.04,1.02,1.02)),
       'a0':_blob(mid=-14,tip=-14,sq=1.22,lob=(.88,.9,.9,.9)),'a1':_blob(mid=26,tip=22,sq=.84,lob=(1.28,1.0,1.15,1.15))},
    'hop':{'0':{},'1':dict(earL_u=-6,earR_u=-6,earL_l=-6,earR_l=-6,sq=.97),'w0':dict(back=10,earL_u=14,earR_u=14,earL_l=10,earR_l=10,sq=.86,wid=1.05),'w1':dict(back=-12,head=-6,earL_u=-20,earR_u=-20,earL_l=-16,earR_l=-16,sq=1.06),
       'w2':dict(back=-4,earL_u=-8,earR_u=-8,sq=1.02),'w3':dict(back=8,earL_u=10,earR_u=10,earL_l=8,earR_l=8,sq=.9),'a0':dict(head=-12,jaw=18,earL_u=-22,earR_u=-22,earL_l=-18,earR_l=-18,sq=.92),'a1':dict(head=14,jaw=40,earL_u=18,earR_u=18,earL_l=14,earR_l=14,sq=1.08,wid=1.04)},
    'te':{'0':dict(f1=8,f2=10,f3=10),'1':dict(f1=14,f2=18,f3=20,palm=3),'w0':dict(arm=(4,5),palm=6,f1=6,f2=8,f3=8),'w1':dict(arm=(2,0),palm=4,f1=16,f2=22,f3=24),'w2':dict(arm=(4,-5),palm=6,f1=6,f2=8,f3=8),'w3':dict(arm=(2,0),palm=4,f1=16,f2=22,f3=24),
       'a0':dict(arm=-6,palm=-16,f1=-12,f2=-10,f3=-8,sq=1.03),'a1':dict(arm=10,palm=24,f1=30,f2=36,f3=40,sq=.93)}}
OVR={'mi':{'a0':dict(armL_u=-95,armR_u=-95)},'tame':{'a0':dict(armL_u=-100,armR_u=-100,armL_l=-35,armR_l=-35)},'kui':{'a0':dict(armL_u=-70,armR_u=-70,armL_l=-15,armR_l=-15)}}   # ポーズを、からだに合わせてかえる（うでの長い物・根のうで）
def frames(name):return list(FR[KIND[name]])
_BW={}
def warp(name,fr):
    q=dict(FR[KIND[name]][fr]);q.update(OVR.get(name,{}).get(fr,{}))
    def f(V):
        key=(name,len(V));_REST[key]=V.copy();_RH[name]=max(V[:,2].max(),1e-6)
        if key not in _BW:_BW[key]=weights(name,V,_FACES[name])
        W,P,B,H,cx,cy=_BW[key];Q=skin(B,W,P,{k:v for k,v in q.items() if k not in('bob','sq','wid','lean')})
        V=np.c_[Q[:,0]*H+cx,Q[:,1]*H+cy,Q[:,2]*H];c=np.array([cx,cy,0.])
        le=math.radians(q.get('lean',0))
        if le:y0=V[:,1]-c[1];zz=V[:,2].copy();V[:,1]=c[1]+y0*np.cos(le)+zz*np.sin(le);V[:,2]=-y0*np.sin(le)+zz*np.cos(le)
        V[:,2]*=q.get('sq',1);w=q.get('wid',1);V[:,0]=c[0]+(V[:,0]-c[0])*w;V[:,1]=c[1]+(V[:,1]-c[1])*w
        V[:,2]+=q.get('bob',0)*H;V[:,2]-=V[:,2].min()   # 足もとを地面に（とびあがる高さは、ゲームで描く位置を上げる）
        a=math.radians(TURN);x0=V[:,0]-c[0];y0=V[:,1]-c[1];V[:,0]=c[0]+x0*math.cos(a)-y0*math.sin(a);V[:,1]=c[1]+x0*math.sin(a)+y0*math.cos(a)
        return V
    return f
_FACES={};_REST={};_CUT={};_TD={}
def faces(name,F):_FACES[name]=F
TEAR=2.5
def tear(name):
    """ポーズでのびた面（うでと足など、モデルでくっついていた所をつなぐ面）を描かない。TEAR 倍よりのびた辺のある面"""
    def f(V,F,C):
        R=_REST.get((name,len(V)))
        if R is None:return np.ones(len(F),bool)
        cut=_CUT.get((name,len(V)));cut=cut if cut is not None and len(cut)==len(F) else np.zeros(len(F),bool)
        l0=np.stack([np.linalg.norm(R[F[:,i]]-R[F[:,(i+1)%3]],axis=1) for i in range(3)],1);l1=np.stack([np.linalg.norm(V[F[:,i]]-V[F[:,(i+1)%3]],axis=1) for i in range(3)],1)
        return ~((l1>TEAR*l0+1e-4*_RH.get(name,1)).any(1)|cut)
    return f
_RH={}

def remesh(name):
    """手足がくっついていた所（はなれた骨にまたがる面）を、手足ごとに1まいずつにふやす。
    ふやした面のはしの点は、同じ場所に点をふやし、その手足の重みにする。うでを上げても、足にもうでにも、あながあかない"""
    def f(V,F,C):
        W,P,B,H,cx,cy=weights(name,V,F);TD=_TD[name];dm=W.argmax(1)
        d3=dm[F];cf=(TD[d3[:,0],d3[:,1]]>2)|(TD[d3[:,1],d3[:,2]]>2)|(TD[d3[:,0],d3[:,2]]>2)
        if not cf.any():return V,F,C
        Vn=[V];Wn=[W];Pn=[P];Fn=[F[~cf]];Cn=[C[~cf]];n=len(V)
        for fi in np.where(cf)[0]:
            f_=F[fi];left=list(range(3))
            while left:
                a=left[0];g=[i for i in left if TD[dm[f_[a]],dm[f_[i]]]<=2];left=[i for i in left if i not in g]
                w_=W[f_[g]].mean(0);nf=[]
                for i in range(3):
                    if i in g:nf.append(f_[i])
                    else:Vn.append(V[f_[i]][None]);Pn.append(P[f_[i]][None]);Wn.append(w_[None]);nf.append(n);n+=1
                Fn.append(np.array([nf]));Cn.append(C[fi][None])
        V2=np.concatenate(Vn);F2=np.concatenate(Fn);C2=np.concatenate(Cn)
        _BW[(name,len(V2))]=(np.concatenate(Wn),np.concatenate(Pn),B,H,cx,cy);_FACES[name]=F2;_CUT[(name,len(V2))]=np.zeros(len(F2),bool)
        return V2,F2,C2
    return f
