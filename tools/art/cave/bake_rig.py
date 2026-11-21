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
# からだの形ごとの骨。数は、モデルの高さ H でわった数（z：足もとからの高さ・x：まん中からの横）。
#  ひと形（hum）：足2本（hip より下、左右で分ける。もものつけねを支点に前後へふる）・うで2本（sh より下で、まん中から armx より外。かたを支点に前後へふる）・頭（neck より上。首を支点にうなずく）
#  ふわふわ（float）：下の足（tent より下）を、場所ごとにずれた波でゆらす　かたまり（blob）：上の面を波うたせる
#  うさぎ（hop）：耳（ear より上。耳のつけねを支点に前後へ）・あご（口のまん中 mouth より下の前のほう。下へひらく）
#  手（te）：手首（wrist より上を前へまげる）・指（knuckle より上を、先ほど大きくまげる）
BONE={'kui':dict(t='hum',hip=.30,sh=.60,armx=.19,neck=.62),
 'tame':dict(t='hum',hip=.36,sh=.66,armx=.16,neck=.70),
 'hone':dict(t='hum',hip=.42,sh=.68,armx=.18,neck=.72),
 'ro':dict(t='hum',hip=.16,sh=.50,armx=.19,neck=.56),
 'mi':dict(t='hum',hip=.40,sh=.76,armx=.11,neck=.79),
 'sui':dict(t='float',tent=.45),'yoru':dict(t='blob'),'esa':dict(t='hop',ear=.70,mouth=.40),'te':dict(t='te',wrist=.42,knuckle=.70)}
def rotx(P,c,deg):
    """東西の軸（x）のまわりに、点 c を支点にまわす（+ は、上の物が前＝手前 y+ へたおれる）"""
    a=math.radians(deg);y=P[:,1]-c[1];z=P[:,2]-c[2];Q=P.copy();Q[:,1]=c[1]+y*math.cos(a)+z*math.sin(a);Q[:,2]=c[2]-y*math.sin(a)+z*math.cos(a);return Q
def roty(P,c,deg):
    """南北の軸（y）のまわり（+ は、上の物が東 x+ へ）"""
    a=math.radians(deg);x=P[:,0]-c[0];z=P[:,2]-c[2];Q=P.copy();Q[:,0]=c[0]+x*math.cos(a)+z*math.sin(a);Q[:,2]=c[2]-x*math.sin(a)+z*math.cos(a);return Q
def mix(V,Q,w):return V*(1-w[:,None])+Q*w[:,None]
def bones(name,V):
    """骨の重み（休んでいる形で1回だけ）"""
    B=BONE[name];H=max(V[:,2].max(),1e-6);cx=(V[:,0].max()+V[:,0].min())/2;cy=(V[:,1].max()+V[:,1].min())/2;z=V[:,2]/H;x=(V[:,0]-cx)/H;y=(V[:,1]-cy)/H;W=dict(H=H,cx=cx,cy=cy)
    if B['t']=='hum':
        arm=sm(B['armx']-.03,B['armx']+.02,np.abs(x))*sm(B['sh']+.02,B['sh']-.04,z)*sm(B['hip']-.06,B['hip']+.02,z)
        W['legL']=sm(B['hip']+.02,B['hip']-.06,z)*(x<0)*(1-arm);W['legR']=sm(B['hip']+.02,B['hip']-.06,z)*(x>=0)*(1-arm)
        W['armL']=arm*(x<0);W['armR']=arm*(x>=0);W['head']=sm(B['neck']-.03,B['neck']+.04,z)*(1-arm)
        W['hipL']=np.array([cx-.08*H,cy,B['hip']*H]);W['hipR']=np.array([cx+.08*H,cy,B['hip']*H])
        W['shL']=np.array([cx-B['armx']*H,cy,B['sh']*H]);W['shR']=np.array([cx+B['armx']*H,cy,B['sh']*H]);W['neck']=np.array([cx,cy,B['neck']*H])
    elif B['t']=='float':W['tent']=sm(B['tent'],.05,z)**1.5;W['x']=x;W['y']=y
    elif B['t']=='blob':W['top']=sm(.1,1,z);W['x']=x;W['y']=y
    elif B['t']=='hop':
        W['ear']=sm(B['ear']-.02,B['ear']+.06,z);W['jaw']=sm(B['mouth']+.02,B['mouth']-.06,z)*sm(.02,.12,y)*sm(.06,.16,z);W['earc']=np.array([cx,cy,B['ear']*H]);W['jawc']=np.array([cx,cy-.05*H,B['mouth']*H])
    elif B['t']=='te':
        W['wr']=sm(B['wrist'],B['wrist']+.15,z);W['fg']=np.clip((z-B['knuckle'])/(1-B['knuckle']),0,1);W['wc']=np.array([cx,cy,B['wrist']*H]);W['kc']=np.array([cx,cy,B['knuckle']*H])
    return W
_BW={}
# ポーズ（コマごと）。hum：leg 足をふる度（左が+なら右は−）・arm うでをふる度（足と逆）・armU 両うでを前へあげる度・head うなずく度・lean からだを前へ・bob 上へ・sq たて
#  float：ph 波の位置（0〜1）・amp ゆれのはば　blob：ph・amp　hop：ear 耳の度・jaw あごの度　te：wr 手首の度・fg 指の度
FR={'hum':{'0':dict(),'1':dict(sq=.97,head=4,arm=3),'w0':dict(leg=26,arm=-22,bob=.03,head=3),'w1':dict(leg=0,sq=.97),'w2':dict(leg=-26,arm=22,bob=.03,head=3),'w3':dict(leg=0,sq=.97),
      'a0':dict(armU=-115,lean=-8,head=-10,sq=1.02),'a1':dict(armU=-20,lean=16,head=14,sq=.95)},
    'float':{'0':dict(ph=0,amp=.05,bob=.06),'1':dict(ph=.5,amp=.05,bob=.03),'w0':dict(ph=0,amp=.09,bob=.06,lean=8),'w1':dict(ph=.25,amp=.09,bob=.08,lean=8),'w2':dict(ph=.5,amp=.09,bob=.06,lean=8),'w3':dict(ph=.75,amp=.09,bob=.04,lean=8),
      'a0':dict(ph=.1,amp=.04,bob=.1,sq=1.06,lean=-6),'a1':dict(ph=.6,amp=.14,bob=.02,lean=16,sq=.92)},
    'blob':{'0':dict(ph=0,amp=.04),'1':dict(ph=.5,amp=.04,sq=.94,wid=1.03),'w0':dict(ph=0,amp=.1,sq=.88,wid=1.08),'w1':dict(ph=.25,amp=.1,sq=1.05,wid=.96,lean=6),'w2':dict(ph=.5,amp=.1,sq=.9,wid=1.06),'w3':dict(ph=.75,amp=.1,sq=1.04,wid=.97,lean=-4),
      'a0':dict(ph=.2,amp=.06,sq=.8,wid=1.12),'a1':dict(ph=.7,amp=.14,sq=1.18,wid=.9,lean=14)},
    'hop':{'0':dict(),'1':dict(sq=.96,ear=-8),'w0':dict(sq=.85,wid=1.06,ear=14),'w1':dict(sq=1.08,lean=8,ear=-22),'w2':dict(sq=1.02,lean=4,ear=-10),'w3':dict(sq=.9,ear=10),
      'a0':dict(sq=.9,lean=-6,ear=-25,jaw=25),'a1':dict(sq=1.1,lean=14,wid=1.06,ear=20,jaw=45)},
    'te':{'0':dict(fg=10),'1':dict(fg=22,wr=3),'w0':dict(fg=8,wr=8,sw=3),'w1':dict(fg=30,wr=4),'w2':dict(fg=8,wr=8,sw=-3),'w3':dict(fg=30,wr=4),'a0':dict(fg=-15,wr=-18,sq=1.04),'a1':dict(fg=75,wr=30,sq=.92)}}
def frames(name):return list(FR[BONE[name]['t']])
def warp(name,fr):
    q=FR[BONE[name]['t']][fr];t=BONE[name]['t']
    def f(V):
        V=V.copy();W=_BW.get(name)
        if W is None or len(W.get('_n',[]))!=len(V):W=bones(name,V);W['_n']=V[:,0];_BW[name]=W
        H=W['H'];c=np.array([W['cx'],W['cy'],0.])
        if t=='hum':
            for s_,k in(('L',1),('R',-1)):
                if q.get('leg'):V=mix(V,rotx(V,W['hip'+s_],q['leg']*k),W['leg'+s_])
                a=q.get('arm',0)*k+q.get('armU',0)
                if a:V=mix(V,rotx(V,W['sh'+s_],a),W['arm'+s_])
            if q.get('head'):V=mix(V,rotx(V,W['neck'],q['head']),W['head'])
        elif t=='float':
            ph=q.get('ph',0)*2*math.pi;a=q.get('amp',0)*H;w=W['tent'];V[:,0]+=a*w*np.sin(ph+W['x']*14);V[:,1]+=a*w*np.cos(ph+W['y']*14)*.6
        elif t=='blob':
            ph=q.get('ph',0)*2*math.pi;a=q.get('amp',0);V[:,2]*=1+a*W['top']*np.sin(ph+W['x']*9+W['y']*5)
        elif t=='hop':
            if q.get('ear'):V=mix(V,rotx(V,W['earc'],q['ear']),W['ear'])
            if q.get('jaw'):V=mix(V,rotx(V,W['jawc'],-q['jaw']),W['jaw'])
        elif t=='te':
            if q.get('fg'):   # 指：先ほど大きくまげる（つけねからの長さで、角度をわける）
                g=W['fg']
                for k in range(1,5):   # 4つのふしに分けて、少しずつまげる
                    m=sm((k-1)/4,(k-.5)/4,g);kc=W['kc'].copy();kc[2]+=(k-1)/4*(H-kc[2]);V=mix(V,rotx(V,kc,q['fg']/4),m)
            if q.get('wr'):V=mix(V,rotx(V,W['wc'],q['wr']),W['wr'])
            if q.get('sw'):V=mix(V,roty(V,np.array([W['cx'],W['cy'],0.]),q['sw']),np.clip(V[:,2]/H,0,1))
        le=math.radians(q.get('lean',0))
        if le:y0=V[:,1]-c[1];zz=V[:,2].copy();V[:,1]=c[1]+y0*np.cos(le)+zz*np.sin(le);V[:,2]=-y0*np.sin(le)+zz*np.cos(le)
        V[:,2]*=q.get('sq',1);w=q.get('wid',1);V[:,0]=c[0]+(V[:,0]-c[0])*w;V[:,1]=c[1]+(V[:,1]-c[1])*w
        V[:,2]+=q.get('bob',0)*H;V[:,2]-=min(0,V[:,2].min())
        a=math.radians(TURN);x0=V[:,0]-c[0];y0=V[:,1]-c[1];V[:,0]=c[0]+x0*math.cos(a)-y0*math.sin(a);V[:,1]=c[1]+x0*math.sin(a)+y0*math.cos(a)
        return V
    return f
