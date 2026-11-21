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
def _hum(hip,legx,knee,sp,sh,armx,elb,hand,neck,legy=0.0,top=1.0):
    B=[('root',None,(0,0,hip),(0,0,sp)),('spine','root',(0,0,sp),(0,0,sh)),('head','spine',(0,0,neck),(0,0,top))]
    for s_,k in(('L',-1),('R',1)):
        B+=[('arm%s_u'%s_,'spine',(k*armx,0,sh),(k*armx*1.08,0,elb)),('arm%s_l'%s_,'arm%s_u'%s_,(k*armx*1.08,0,elb),(k*armx*1.1,0,hand)),
            ('leg%s_u'%s_,'root',(k*legx,legy,hip),(k*legx,legy,knee)),('leg%s_l'%s_,'leg%s_u'%s_,(k*legx,legy,knee),(k*legx,legy,0.0))]
    return B
SKEL={
 'kui':_hum(hip=.36,legx=.15,knee=.18,sp=.5,sh=.56,armx=.25,elb=.32,hand=.06,neck=.70),   # 根の足・横の根のうで
 'tame':_hum(hip=.27,legx=.13,knee=.13,sp=.46,sh=.66,armx=.20,elb=.50,hand=.33,neck=.72),
 'hone':_hum(hip=.19,legx=.10,knee=.09,sp=.40,sh=.60,armx=.21,elb=.40,hand=.15,neck=.66),
 'ro':_hum(hip=.12,legx=.10,knee=.06,sp=.30,sh=.46,armx=.23,elb=.31,hand=.15,neck=.57),
 'mi':_hum(hip=.34,legx=.05,knee=.17,sp=.50,sh=.72,armx=.14,elb=.45,hand=.12,neck=.76),
 'sui':[('root',None,(0,0,.45),(0,0,1.0))]+[b for k,x in enumerate((-.12,0,.12)) for b in (('t%d_u'%k,'root',(x,0,.45),(x,0,.25)),('t%d_l'%k,'t%d_u'%k,(x,0,.25),(x,0,.02)))],
 'yoru':[('root',None,(0,0,0),(0,0,.45)),('top','root',(0,0,.45),(0,0,1.0)),('lobL','root',(-.25,0,.2),(-.6,0,.08)),('lobR','root',(.25,0,.2),(.6,0,.08))],
 'esa':[('root',None,(0,0,.3),(0,.25,.35)),('back','root',(0,0,.3),(0,-.62,.25)),('head','root',(0,.25,.35),(0,.5,.62)),('jaw','head',(0,.42,.38),(0,.62,.2)),
        ('earL_u','head',(-.15,.5,.70),(-.15,.5,.85)),('earL_l','earL_u',(-.15,.5,.85),(-.15,.52,1.0)),('earR_u','head',(.15,.5,.70),(.15,.5,.85)),('earR_l','earR_u',(.15,.5,.85),(.15,.52,1.0))],
 'te':[('root',None,(0,0,0),(0,0,.25)),('arm','root',(0,0,.25),(0,0,.5)),('palm','arm',(0,0,.5),(0,0,.76)),('f1','palm',(0,0,.76),(0,0,.86)),('f2','f1',(0,0,.86),(0,0,.94)),('f3','f2',(0,0,.94),(0,0,1.0))]}
KIND={'kui':'hum','tame':'hum','hone':'hum','ro':'hum','mi':'hum','sui':'float','yoru':'blob','esa':'hop','te':'te'}
def _segd(P,a,b):
    a=np.array(a,float);b=np.array(b,float);d=b-a;t=np.clip(((P-a)@d)/max(d@d,1e-9),0,1);return np.linalg.norm(P-(a+t[:,None]*d),axis=1)
def _norm(name,V):
    H=max(V[:,2].max(),1e-6);cx=(V[:,0].max()+V[:,0].min())/2;cy=(V[:,1].max()+V[:,1].min())/2
    if name=='yoru':pass
    return H,cx,cy
def weights(name,V,F):
    """骨の重み（点ごと。4本まで・合計1・メッシュのとなりでならす）"""
    B=SKEL[name];H,cx,cy=_norm(name,V);P=np.c_[(V[:,0]-cx)/H,(V[:,1]-cy)/H,V[:,2]/H]
    if name=='yoru':   # 横に広いかたまり：横はばに合わせて、ふくらみの骨を外へ
        xm=np.abs(P[:,0]).max();B=[(n,p,(h[0]*xm/.6,h[1],h[2]),(t[0]*xm/.6,t[1],t[2])) for n,p,h,t in B]
    # 同じ場所の点（UV のつなぎ目で2つにわかれた点）は1つにまとめる：べつの重みだと、まげたとき、つなぎ目がひらく
    _,uid=np.unique(np.round(V,5),axis=0,return_inverse=True);uid=uid.ravel();n=uid.max()+1
    Pu=np.zeros((n,3));np.add.at(Pu,uid,P);Pu/=np.bincount(uid,minlength=n)[:,None]
    D=np.stack([_segd(Pu,h,t) for _,_,h,t in B],1);W=1/(D*D+.0004)**2
    # メッシュのとなりの点（面の辺）でならす：関節のまわりの重みがなだらかになる
    Fu=uid[F];e=np.r_[Fu[:,[0,1]],Fu[:,[1,2]],Fu[:,[2,0]]]
    from scipy.sparse import coo_matrix
    A=coo_matrix((np.ones(len(e)*2),(np.r_[e[:,0],e[:,1]],np.r_[e[:,1],e[:,0]])),shape=(n,n)).tocsr();deg=np.maximum(np.asarray(A.sum(1)).ravel(),1)
    W=W/W.sum(1,keepdims=True)
    for _ in range(6):W=.5*W+.5*(A@W)/deg[:,None]
    k=np.argsort(-W,1)[:,4:];np.put_along_axis(W,k,0,1);W/=W.sum(1,keepdims=True)   # 4本まで
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
        rx,ry=pose.get(n,(0,0)) if isinstance(pose.get(n,0),tuple) else (pose.get(n,0),0)
        R=_R(rx,ry);h=np.array(h,float);L=np.eye(4);L[:3,:3]=R;L[:3,3]=h-R@h
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
def _wave(chains,ph,amp):
    o={}
    for k in range(chains):
        a=2*math.pi*ph+k*1.7;o['t%d_u'%k]=(amp*math.sin(a),amp*.7*math.cos(a));o['t%d_l'%k]=(amp*1.5*math.sin(a+.9),amp*math.cos(a+.9))
    return o
FR={'hum':{'0':{},'1':dict(spine=3,head=5,armL_u=4,armR_u=4,sq=.985),'w0':_W0,'w1':_W1,'w2':_mir(_W0),'w3':_mir(_W1),
       'a0':dict(armL_u=-125,armR_u=-125,armL_l=-25,armR_l=-25,spine=-10,head=-12,legL_u=-8,legR_u=8,legR_l=10),
       'a1':dict(armL_u=-30,armR_u=-30,armL_l=-6,armR_l=-6,spine=18,head=14,legL_u=-14,legR_u=12,legR_l=16)},
    'float':{'0':dict(_wave(3,0,8),bob=.06),'1':dict(_wave(3,.5,8),bob=.03,sq=.97),'w0':dict(_wave(3,0,16),bob=.06,lean=8),'w1':dict(_wave(3,.25,16),bob=.08,lean=8),
       'w2':dict(_wave(3,.5,16),bob=.06,lean=8),'w3':dict(_wave(3,.75,16),bob=.04,lean=8),'a0':dict(_wave(3,.1,-20),bob=.1,sq=1.06,lean=-8),'a1':dict(_wave(3,.6,30),bob=.02,lean=16,sq=.92)},
    'blob':{'0':{},'1':dict(top=(4,3),sq=.95,wid=1.03),'w0':dict(top=(10,-6),lobL=(0,-8),lobR=(0,8),sq=.9,wid=1.06),'w1':dict(top=(-4,4),lobL=(0,6),lobR=(0,-6),sq=1.04,lean=4),
       'w2':dict(top=(10,6),lobL=(0,8),lobR=(0,-8),sq=.9,wid=1.06),'w3':dict(top=(-4,-4),lobL=(0,-6),lobR=(0,6),sq=1.04,lean=-3),'a0':dict(top=(-16,0),lobL=(0,-12),lobR=(0,12),sq=.82,wid=1.1),'a1':dict(top=(28,0),lobL=(0,10),lobR=(0,-10),sq=1.12,wid=.92)},
    'hop':{'0':{},'1':dict(earL_u=-6,earR_u=-6,earL_l=-6,earR_l=-6,sq=.97),'w0':dict(back=10,earL_u=14,earR_u=14,earL_l=10,earR_l=10,sq=.86,wid=1.05),'w1':dict(back=-12,head=-6,earL_u=-20,earR_u=-20,earL_l=-16,earR_l=-16,sq=1.06),
       'w2':dict(back=-4,earL_u=-8,earR_u=-8,sq=1.02),'w3':dict(back=8,earL_u=10,earR_u=10,earL_l=8,earR_l=8,sq=.9),'a0':dict(head=-12,jaw=18,earL_u=-22,earR_u=-22,earL_l=-18,earR_l=-18,sq=.92),'a1':dict(head=14,jaw=40,earL_u=18,earR_u=18,earL_l=14,earR_l=14,sq=1.08,wid=1.04)},
    'te':{'0':dict(f1=8,f2=10,f3=10),'1':dict(f1=14,f2=18,f3=20,palm=3),'w0':dict(arm=(4,5),palm=6,f1=6,f2=8,f3=8),'w1':dict(arm=(2,0),palm=4,f1=16,f2=22,f3=24),'w2':dict(arm=(4,-5),palm=6,f1=6,f2=8,f3=8),'w3':dict(arm=(2,0),palm=4,f1=16,f2=22,f3=24),
       'a0':dict(arm=-6,palm=-16,f1=-12,f2=-10,f3=-8,sq=1.03),'a1':dict(arm=10,palm=24,f1=30,f2=36,f3=40,sq=.93)}}
OVR={'mi':{'a0':dict(armL_u=-95,armR_u=-95)},'kui':{'a0':dict(armL_u=-70,armR_u=-70,armL_l=-15,armR_l=-15)}}   # ポーズを、からだに合わせてかえる（うでの長い物・根のうで）
def frames(name):return list(FR[KIND[name]])
_BW={}
def warp(name,fr):
    q=dict(FR[KIND[name]][fr]);q.update(OVR.get(name,{}).get(fr,{}))
    def f(V):
        key=(name,len(V))
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
_FACES={}
def faces(name,F):_FACES[name]=F
