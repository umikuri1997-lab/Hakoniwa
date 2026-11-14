# 小さな生き物（ちょう・小鳥・かえる。js/critters.js）を、3Dから写したドット絵にする（スキル model3d-pixel）。
# 使い方：python3 tools/art/critter3d/critter3d.py <出力フォルダ> [--chips]
#   見え方は家具と同じ（見おろし42度・奥行きだけ遠近、furn3d.shot）。1マス64ドットで、ちぢめずに写す。どれも右（東）を向く。左はゲームで反転。
#   チップの ax・ay は、生き物の足もと（地面の点、3Dの (0,0,0)）からのずれ（g64のドット）。ゲームは足もとの点から描く（drawCritter）。
# 設計図（単位はマス。大きさは、前のコードの絵（はば0.5マスくらい）に合わせた）
#   ちょう：羽だけ（からだはつけない。持ち主がきめた）。蝶の羽（前羽は外のふちがまるい三角、後ろ羽はまるいひだ）を、まん中の線を軸に左右に。
#     羽の角度（水平から）：ひらいた 16度（#0）・とじかけ 64度（#1）。羽の色は、うすい色に、ふちと前羽の点がこい色（色は4しゅるい、前のコードの絵と同じ色）。
#   小鳥：トリポのモデル（tools/art/models/tripo/bird.glb。立つ小鳥・高さ0.24）。色は場所でぬる（せなか・羽は茶色、おなか・ほおはクリーム色、くちばしは黄色、目）。
#     とぶ絵（#f0 羽を上・#f1 羽を下）は、足をからだへたたみ、せなかから羽（うすい板、長さ0.15）を出す。
#   かえる：まるいおしりと、ひらたい頭（口の線）・目（上の前に2つ、白目と黒目）・せなかの点・前足（うでと手）・うしろ足（もも・すね・足先を折りたたむ）。
#     とぶ絵（#1）は、からだを前へ持ち上げ、うしろ足をうしろへのばす。
import sys,os,math,types
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(HERE,'..');ROOT=os.path.join(ART,'..','..')
sys.path.insert(0,ART);sys.path.insert(0,os.path.join(ART,'furn3d'));sys.path.insert(0,os.path.join(ART,'furn3d','items'))
import numpy as np
from PIL import Image
import oblique3d as O,furn3d as F
from blueprint import Part as P,model_tris
O.GRAD=True
ELEV=42   # 家具と同じ見おろしの角度（持ち主がきめた）

def NT(p,**kw):   # 木目なし
    p.tex=False
    for k,v in kw.items():setattr(p,k,v)
    return p
def poly(sc,pts,col):   # 平らな多角形（羽）。うら・おもては描くときにそろう
    for i in range(1,len(pts)-1):sc.tri(pts[0],pts[i],pts[i+1],col)

# ---------- ちょう ----------
FLYC=[((246,191,214),(228,143,178)),((255,224,138),(233,184,74)),((191,227,255),(134,189,232)),((255,255,255),(215,210,198))]   # 前のコードの絵（js/critters.js）と同じ色
FZ=0.0   # 羽のつけねの高さ（足もとの点。とぶ高さはゲームで足す）
def spline(C,n=8):   # とじた点のならびを、なめらかな線に（カトマル・ロム）
    out=[];m=len(C)
    for i in range(m):
        p0,p1,p2,p3=[np.array(C[(i+k)%m],float) for k in(-1,0,1,2)]
        for t in np.linspace(0,1,n,endpoint=False):out.append(tuple(0.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t**3)))
    return out
# 蝶の羽（u：前、v：外へ）。前羽は、つけねからさきへ広がる三角で、外のふちがまるい。後ろ羽は、まるいひだ
FORE=spline([(0.0,0.0),(0.045,0.03),(0.085,0.085),(0.11,0.15),(0.09,0.185),(0.04,0.18),(0.0,0.12),(-0.01,0.05)])
HIND=spline([(0.0,0.0),(-0.002,0.06),(-0.02,0.115),(-0.055,0.14),(-0.09,0.125),(-0.105,0.08),(-0.08,0.035),(-0.035,0.008)])
FK=1.35;FHD=-90   # 大きさ（上の寸法にかける）・からだの向き（おく。羽が左右にひろがって見える）
def fly(ci,fr):
    a,b=FLYC[ci];th=math.radians(16 if fr==0 else 64);z0=FZ+0.03*FK;hd=math.radians(FHD);ch,sh=math.cos(hd),math.sin(hd)
    R=lambda u,v,z:(FK*(u*ch-v*sh),FK*(u*sh+v*ch),z)   # からだの向き（u：前・v：右がわ）→ せかい
    def PARTS():return []   # 羽だけ（持ち主がきめた。からだ・頭・しょっかくはつけない）
    def wcol(x,y,z):   # 羽のもよう：ふちと前羽のさきの点は、こい色。ほかはうすい色
        u=(x*ch+y*sh)/FK;w=(-x*sh+y*ch)/FK;v=math.hypot(w,(z-z0)/FK)
        if u>-0.003:   # 前羽
            if v>0.155 or (u-0.07)**2+(v-0.155)**2<0.03**2:return b
            if (u-0.045)**2+(v-0.105)**2<0.016**2:return b
        elif (u+0.055)**2+(v-0.075)**2>0.052**2:return b   # 後ろ羽のふち
        return a
    def EXTRA(sc):
        sc.material('soft1');sc.decal(wcol)
        for s in(1,-1):
            for W in(FORE,HIND):
                sc.part();poly(sc,[R(u,s*v*math.cos(th),z0+FK*v*math.sin(th)) for u,v in W],a)
        sc.decal(None);sc.material(None)
    return types.SimpleNamespace(PARTS=PARTS,EXTRA=EXTRA,ELEV=ELEV)

# ---------- 小鳥 ----------
BH=0.28;BROT=210   # モデルの高さ・まわす角度（モデルは右うしろへ30度ななめなので、まっすぐ右を向くように）
BBR=(176,126,96);BWG=(150,104,80);BBEL=(243,225,196);BBEAK=(242,176,74);BEYE=(70,54,44);BLEG=(201,143,74)
def birdgeo():
    V,Fc,C=model_tris('tripo/bird.glb',0,0,0,BH,BROT);l=V[V[:,2]<0.03].mean(0);return l   # 足のまん中を足もとの点に
BL0=None
def bird(fly_=None):
    global BL0
    if BL0 is None:BL0=birdgeo()
    ox,oy=-BL0[0],-BL0[1]
    V,_,_=model_tris('tripo/bird.glb',ox,oy,0,BH,BROT);hm=V[V[:,2]>0.17].mean(0);xmax=V[:,0].max()
    eye=(hm[0]+0.035,0.0,hm[2]+0.012)   # 目（左右に1つずつ。頭の横の面に）
    LEG=0.035   # 足の長さ
    def col(x,y,z):
        if z<LEG and fly_ is None:return BLEG
        if x>xmax-0.03 and z>0.14:return BBEAK
        ey=abs(y);dz=z-eye[2];dx=x-eye[0]
        if dx*dx+dz*dz<0.014**2 and ey>0.02:return BEYE
        if x>hm[0]-0.01 and z<hm[2]+0.005 and z>0.13 and ey>0.025:return BBEL   # ほお
        if z<0.14 and x>-0.04 and z>LEG*0.6:return BBEL   # おなか
        if z>0.07 and x<0.03 and ey>0.03:return BWG   # たたんだ羽
        return BBR
    def warp(V_):   # とぶ絵：足をからだへたたむ
        if fly_ is None:return V_
        m=V_[:,2]<LEG+0.01;V_[m,2]=LEG+0.01-(LEG+0.01-V_[m,2])*0.25;return V_
    def PARTS():
        p=NT(P('小鳥','model',('tripo/bird.glb',ox,oy,0,BH,BROT),BBR),decal=col,warp=warp);return [p]
    def EXTRA(sc):
        if fly_ is None:return
        th=math.radians(60 if fly_==0 else -5);sx=-0.01;sz=0.15   # 羽のつけね（せなか）
        W=[(0.05,0.0),(0.01,0.2),(-0.06,0.17),(-0.07,0.0)]
        def wc(x,y,z):return BWG if math.hypot(y,z-sz)<0.12 else (112,78,62)
        sc.material('soft1');sc.decal(wc)
        for s in(1,-1):sc.part();poly(sc,[(sx+u,s*(0.03+v*math.cos(th)),sz+v*math.sin(th)) for u,v in W],BWG)
        sc.decal(None);sc.material(None)
    return types.SimpleNamespace(PARTS=PARTS,EXTRA=EXTRA,ELEV=ELEV)

# ---------- かえる ----------
GK=1.7   # かえるの大きさ（下の寸法にかける）
FG=(143,207,106);FGD=(124,190,92);FBEL=(236,240,186);FW=(250,250,236);FPU=(46,58,34);FMO=(84,132,62)
def frog(fr):
    j=fr==1;K=GK;L_=0.045 if j else 0.0   # とぶ絵：前を持ち上げる
    def back(x,y,z):   # おなか・口の線
        if z<0.026+L_*0.5 and x>-0.05:return FBEL
        if x>0.045 and abs(z-(0.047+L_))<0.0045 and abs(y)>0.012:return FMO   # 口の線（よこ）
        return None
    def PARTS():
        L=[]   # からだと頭は、EXTRA で1つの形に
        for s in(1,-1):
            L.append(NT(P('目','ball',(0.058,s*0.032,0.078+L_,0.022),FW,on=('頭',)),soft1=True,decal=lambda x,y,z,s=s:FPU if (x-0.068)**2+(y-s*0.036)**2+(z-0.09-L_)**2<0.011**2 else FG if z<0.068+L_ else None))   # 白い目（下は緑のまぶた）と黒目
            if j:   # 前足：前へのばす。うしろ足：うしろへまっすぐけりだす
                L.append(NT(P('うで','egg',(0.085,s*0.04,0.035+L_*0.6,0.03,0.011,0.011,0),FGD,on=('頭',))))
                L.append(NT(P('もも','egg',(-0.09,s*0.045,0.045,0.04,0.02,0.02,0),FGD,on=('からだ',))))
                L.append(NT(P('すね','egg',(-0.14,s*0.045,0.035,0.035,0.012,0.012,0),FGD,on=('もも',))))
                L.append(NT(P('足先','egg',(-0.185,s*0.045,0.03,0.03,0.02,0.006,0),FGD,on=('すね',))))
            else:   # すわる：前足は立てて、手は前へ。うしろ足は、ももを前へ、すねをうしろへ折りたたみ、足先を前へ
                L.append(NT(P('うで','egg',(0.06,s*0.048,0.018,0.012,0.012,0.022),FGD,on=('頭',))))
                L.append(NT(P('手','egg',(0.072,s*0.054,0.004,0.018,0.016,0.005),FGD,on=('うで',))))
                L.append(NT(P('もも','egg',(-0.04,s*0.06,0.03,0.05,0.022,0.028,15*s),FGD,on=('からだ',))))
                L.append(NT(P('すね','egg',(-0.045,s*0.078,0.016,0.045,0.013,0.014,-10*s),FGD,on=('もも',))))
                L.append(NT(P('足先','egg',(0.0,s*0.085,0.005,0.035,0.022,0.005,10*s),FGD,on=('すね',))))
        for p in L:
            if p.name!='目':p.grp='かえる'   # からだと足のさかいに線を引かない（つながって見えるように）
        for p in L:   # 大きさ GK をかける（もようは、かける前の場所で見る）
            n=6 if p.kind=='egg' else 4;p.dims=tuple(v*K for v in p.dims[:n])+tuple(p.dims[n:])
            f=getattr(p,'decal',None)
            if f:p.decal=lambda x,y,z,f=f:f(x/K,y/K,z/K)
        return L
    # からだと頭：1つのなめらかな形（首のさかい目を作らない）。うしろ（おしり）から鼻さきまで、切り口のだ円（はば ry・高さ rz・中心の高さ zc）をつなぐ
    BX=[-0.100,-0.088,-0.065,-0.030,0.005,0.035,0.062,0.084,0.097,0.100]
    BY=[0.0,0.034,0.054,0.062,0.059,0.055,0.047,0.033,0.016,0.0]
    BZ=[0.0,0.024,0.036,0.041,0.037,0.031,0.026,0.019,0.010,0.0]
    BC=[0.041,0.041,0.042,0.043,0.045,0.048,0.049,0.048,0.047,0.047]
    def EXTRA(sc):
        n=20;xs=np.linspace(BX[0],BX[-1],33);ry=np.interp(xs,BX,BY);rz=np.interp(xs,BX,BZ);zc=np.interp(xs,BX,BC)+L_*(xs-BX[0])/(BX[-1]-BX[0])
        ry=np.maximum(ry,0);rz=np.maximum(rz,0)
        def Q(i,k):
            t=2*math.pi*k/n;c,s_=math.cos(t),math.sin(t);zz=s_*(1.0 if s_>0 else 0.8)   # おなかは少しひらたく
            return (xs[i]*K,ry[i]*c*K,(zc[i]+rz[i]*zz)*K)
        sc.group('かえる');sc.material('soft');sc.smooth(True);sc.decal(lambda x,y,z:back(x/K,y/K,z/K));sc.part()
        for i in range(len(xs)-1):
            for k in range(n):sc.quad(Q(i,k),Q(i+1,k),Q(i+1,(k+1)%n),Q(i,(k+1)%n),FG)
        sc.decal(None);sc.smooth(False);sc.material(None);sc.group(None)
    return types.SimpleNamespace(PARTS=PARTS,EXTRA=EXTRA,ELEV=ELEV)

def ITEMS():
    L=[]
    for ci in range(4):
        for fr in(0,1):L.append(('critfly:%d#%d'%(ci,fr),fly(ci,fr)))
    L+= [('critbird#0',bird()),('critbird#f0',bird(0)),('critbird#f1',bird(1)),('critfrog#0',frog(0)),('critfrog#1',frog(1))]
    return L

def shot(M):
    inf={};im,ex0,base,yb=F.shot(M,0,info=inf);PROJ,E,S_=inf['PROJ'],inf['ext'],inf['S']
    u,v=PROJ(inf['fwd']((0,0,0)));axp,ayp=(u-E[0])*S_,(v-E[2])*S_   # 足もとの点（絵の中のドット）
    bb=im.getbbox();return im.crop(bb),round(bb[0]-axp),round(bb[1]-ayp)

def old(kind,ci=0,fr=0):   # 前のコードの絵（くらべる用。1ドット＝せかいの2＝g64の4ドット）。足もとの点からのずれもかえす
    c=Image.new('RGBA',(80,80),(0,0,0,0));px=c.load();X,Y=40,60
    def R(dx,dy,w,h,col):
        col=tuple(int(col[i:i+2],16) for i in(1,3,5))+(255,)
        for yy in range(dy*4,(dy+h)*4):
            for xx in range(dx*4,(dx+w)*4):px[X+xx,Y+yy]=col
    if kind=='fly':
        a,b=['#%02x%02x%02x'%t for t in FLYC[ci]]
        if fr==0:R(-4,-3,3,3,a);R(1,-3,3,3,a);R(-3,0,2,2,b);R(1,0,2,2,b)
        else:R(-2,-4,2,4,a);R(0,-4,2,4,a)
        R(0,-3,1,4,'#6b5a4a')
    elif kind=='bird':
        R(-3,-4,6,4,'#a8765a');R(-2,-2,4,2,'#f3e1c4');R(3,-3,2,1,'#f2b04a');R(1,-4,1,1,'#3a2c22');R(-4,-4,1,2,'#8d5f47')
        if fr:R(-2,-7,3,3,'#8d5f47')
        else:R(-2,-4,3,1,'#8d5f47');R(-1,0,1,1,'#c98f4a');R(1,0,1,1,'#c98f4a')
    else:
        R(-3,-3,6,3,'#8fcf6a');R(-3,-1,6,1,'#6fae52');R(-2,-5,2,2,'#8fcf6a');R(1,-5,2,2,'#8fcf6a');R(-2,-5,1,1,'#f7f7e8');R(1,-5,1,1,'#f7f7e8');R(-1,-4,1,1,'#2e3a22');R(2,-4,1,1,'#2e3a22');R(-4,-1,1,1,'#6fae52');R(3,-1,1,1,'#6fae52')
    bb=c.getbbox();return c.crop(bb),bb[0]-X,bb[1]-Y

def run(out,chips=False):
    os.makedirs(out,exist_ok=True);CH={}
    for nm,M in ITEMS():
        im,ax,ay=shot(M);CH[nm]=(im,ax,ay);fn=nm.replace(':','_').replace('#','_')
        im.save(os.path.join(out,fn+'.png'));im.resize((im.width*10,im.height*10),Image.NEAREST).save(os.path.join(out,fn+'_x10.png'))
        print('%s %dx%d ax %d ay %d'%(nm,im.width,im.height,ax,ay))
    # 前の絵とならべる（4倍。上の列が前の絵、下の列が3Dの絵。足もとの線をそろえる）
    olds=[old('fly',ci,fr) for ci in range(4) for fr in(0,1)]+[old('bird',0,0),old('bird',0,1),old('bird',0,1),old('frog'),old('frog')]
    news=list(CH.values());cw=max(i.width for i,_,_ in olds+news)+12;top=-min(a for _,_,a in olds+news)+6;HH=top+12
    can=Image.new('RGBA',(cw*len(news),HH*2),(150,190,120,255))
    for r,row in enumerate((olds,news)):
        for k,(im,ax,ay) in enumerate(row):can.alpha_composite(im,(k*cw+cw//2+ax,r*HH+top+ay))
    can.resize((can.width*4,can.height*4),Image.NEAREST).save(os.path.join(out,'cmp_x4.png'))
    if chips:
        sys.path.insert(0,os.path.join(ROOT,'tools'));import chips as CHP
        head,CC=CHP.load_imgs()
        for nm,(im,ax,ay) in CH.items():CC[nm]={'g':64,'ax':ax,'ay':ay,'w':im.width,'h':im.height,'f':[im]}
        CHP.pack_imgs(head,CC);open(os.path.join(ROOT,'.chips_changed'),'w').write('\n'.join(CH));print('チップに入れた',len(CH))
if __name__=='__main__':run(sys.argv[1],'--chips' in sys.argv)
