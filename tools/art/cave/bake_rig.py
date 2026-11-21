"""洞窟のバケモノ（js/cave-bake.js）の3Dから写すドット絵：トリポのモデル（tools/art/models/cave/bk_*.glb。色がないモデル）に、
場所で色をぬり（paint）、からだ全体のかんたんなポーズ（warp）をつけて、コマごとに写す。bake_build.py が設計図を作って写す。
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
# ポーズ
FR={'walk':{'0':{},'1':dict(sq=.97),'w0':dict(sw=6,bob=.02),'w1':dict(sq=.96),'w2':dict(sw=-6,bob=.02),'w3':dict(sq=.96),'a0':dict(lean=-10,sq=1.02),'a1':dict(lean=16,sq=.95)},
    'float':{'0':dict(bob=.06),'1':dict(bob=.03,sq=.97),'w0':dict(bob=.06,lean=6),'w1':dict(bob=.08,lean=6),'w2':dict(bob=.06,lean=6),'w3':dict(bob=.04,lean=6),'a0':dict(bob=.1,sq=1.05),'a1':dict(bob=.02,lean=14,sq=.92)},
    'blob':{'0':{},'1':dict(sq=.92,wid=1.04),'w0':dict(sq=.88,wid=1.08),'w1':dict(sq=1.05,wid=.96,lean=6),'w2':dict(sq=.9,wid=1.06),'w3':dict(sq=1.04,wid=.97,lean=-4),'a0':dict(sq=.8,wid=1.12),'a1':dict(sq=1.15,wid=.9,lean=12)},
    'hop':{'0':{},'1':dict(sq=.96),'w0':dict(sq=.85,wid=1.06),'w1':dict(sq=1.08,lean=8),'w2':dict(sq=1.02,lean=4),'w3':dict(sq=.9),'a0':dict(sq=.9,lean=-6),'a1':dict(sq=1.1,lean=14,wid=1.06)},
    'te':{'0':{},'1':dict(sq=.98,curl=4),'w0':dict(sw=3),'w1':dict(curl=8),'w2':dict(sw=-3),'w3':dict(curl=4),'a0':dict(sq=1.04,curl=-10,lean=-6),'a1':dict(sq=.9,curl=20,lean=18)}}
def frames(name):return list(FR[PAL[name]['kind']])
def warp(name,fr):
    q=FR[PAL[name]['kind']][fr]
    def f(V):
        V=V.copy();H=max(V[:,2].max(),1e-6);c=np.array([.5,.5,0.]);z=V[:,2]/H
        sw=math.radians(q.get('sw',0));
        if sw:   # 歩く：左右にゆれる（上ほど大きく）
            a=sw*z;x0=V[:,0]-c[0];V[:,0]=c[0]+x0*np.cos(a)-(V[:,2])*np.sin(a)*.25
        cu=math.radians(q.get('curl',0))
        if cu:   # 手：上のほうを前へまげる
            m=sm(.55,1,z);a=cu*m;y0=V[:,1]-c[1];zz=V[:,2]-.55*H;V[:,1]=np.where(m>0,c[1]+y0*np.cos(a)+zz*np.sin(a),V[:,1]);V[:,2]=np.where(m>0,.55*H-y0*np.sin(a)+zz*np.cos(a),V[:,2])
        le=math.radians(q.get('lean',0))
        if le:   # 前へたおれる（足もとを支点に、上ほど）
            y0=V[:,1]-c[1];zz=V[:,2];V[:,1]=c[1]+y0*np.cos(le)+zz*np.sin(le);V[:,2]=-y0*np.sin(le)+zz*np.cos(le)
        V[:,2]*=q.get('sq',1);w=q.get('wid',1);V[:,0]=c[0]+(V[:,0]-c[0])*w;V[:,1]=c[1]+(V[:,1]-c[1])*w
        V[:,2]+=q.get('bob',0)*H;V[:,2]-=min(0,V[:,2].min())
        a=math.radians(TURN);x0=V[:,0]-c[0];y0=V[:,1]-c[1];V[:,0]=c[0]+x0*math.cos(a)-y0*math.sin(a);V[:,1]=c[1]+x0*math.sin(a)+y0*math.cos(a)
        return V
    return f
