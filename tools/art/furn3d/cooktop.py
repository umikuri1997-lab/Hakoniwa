# 料理の家具（調理台・かまど・たき火）の上にかさねる絵を、3Dから写す（スキル model3d-pixel）。
# 使い方：python3 tools/art/furn3d/cooktop.py <出力フォルダ> [--chips] [--only tool,ing,dish]
#   道具（cktool_<家具>_<道具>、調理台は >1・>2 の向きも）：家具の3Dにのせて写し、のせる前の絵とちがうドットだけを切りぬく（家具の絵にぴったりかさなる）。
#   材料（ckin_<材料>.<大きさ>）・できた料理（ckdish_<料理>）：1つずつ写し、足もとの点を (0,0) にした絵。ゲームは、家具の上の場所（js/cook-top-data.js の CKTOP）に描く。
#   大きさ：L 台の上（調理台のおく）・S なべ・フライパン・天板・網の上・K くしにさした形。
#   js/cook-top-data.js（CKTOP：家具・向きごとの道具の名前と、材料・料理を置く場所（g64 のドット、マスの左上から））も書く。
# 設計図（単位はマス。台の上の面：調理台 0.60・かまどの口の床 0.0・たき火の石の上 0.13）
#   調理台：まな板（0.60×0.30・あつさ0.03、ななめ14度）・ボウル（半径0.15・高さ0.09、うすいクリーム色のやきもの）・ピッチャー（半径0.08・高さ0.22、取っ手）・こねばち（木、半径0.17・高さ0.07）とめんぼう（長さ0.40・半径0.025）。
#     材料は、台のおく（y 0.40）に3つ（x 0.20・0.80・0.50 の順）。できた料理は、台のまん中（0.50, 0.62）。
#   かまど：口の床（y 0.86）に、なべ（半径0.12・高さ0.12、中にスープ）・フライパン（半径0.11・あつさ0.03、柄は右手前）・天板（0.28×0.16・ふち0.02）。できた料理は口の前（y 0.95）。
#   たき火：三脚（3本の枝、地面から高さ0.88でまとまる）につるしたなべ（半径0.12・高さ0.12、底は高さ0.30）・石にのせた網（0.46×0.34、高さ0.13）。くしは、灰の手前に3本（材料の K の絵）。できた料理は、手前の石の上。
import sys,os,math,json,importlib
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(HERE,'..');ROOT=os.path.abspath(os.path.join(ART,'..','..'))
sys.path.insert(0,HERE);sys.path.insert(0,os.path.join(HERE,'items'));sys.path.insert(0,ART)
import numpy as np
from PIL import Image
import furn3d as F
import oblique3d as O
from blueprint import Part as P,model_tris
from common import WOOD,METAL,notex,SOFT
from scipy.ndimage import binary_dilation

def MT(p):p.metal=True;return p
def NT(p):p.tex=False;return p
CER=(246,240,228)   # やきもの（白にちかいクリーム色）
POTM=(176,182,194)  # なべ・フライパンの金属（明るい灰青）
K='kenney/food/'
def H(h):h=h.lstrip('#');return tuple(int(h[i:i+2],16) for i in(0,2,4))

# ---- モデルの大きさ：よこの長いほうを w にする（model の size はモデルの高さなので、高さとはばの比をしらべる）
_AS={}
def msize(path,w,rot=0,tilt=0,up=None):
    k=(path,rot,tilt,up)
    if k not in _AS:V,_,_=model_tris(path,0,0,0,1.0,rot,tilt,1.0,up);_AS[k]=max(V[:,0].max()-V[:,0].min(),V[:,1].max()-V[:,1].min())/(V[:,2].max()-V[:,2].min())
    return w/_AS[k]
def model2(nm,path,x,y,z,w,pred,colA,colB,rot=0,tilt=0,k=0.3):   # 色のないモデルを2つの色にぬりわける：pred(面のまん中の点の、足もとからの高さのわりあい u・まん中からのよこ dx・おく dy) が真なら colA
    def sel(want):
        def f(V,F,C):
            c=V[F].mean(1);z0,z1=V[:,2].min(),V[:,2].max();cx,cy=(V[:,0].min()+V[:,0].max())/2,(V[:,1].min()+V[:,1].max())/2;sz=max(V[:,0].max()-V[:,0].min(),V[:,1].max()-V[:,1].min())
            m=np.array([bool(pred((q[2]-z0)/(z1-z0),(q[0]-cx)/sz,(q[1]-cy)/sz)) for q in c]);return m if want else ~m
        return f
    a=model(nm,path,x,y,z,w,rot,tilt,colA,k);a.fsel=sel(True);b=model(nm+'2',path,x,y,z,w,rot,tilt,colB,k);b.fsel=sel(False);return [a,b]
def model(nm,path,x,y,z,w,rot=0,tilt=0,col=None,k=0.3,up=None):   # up：モデルの中で上にする向き（トリポのモデルには、正面を向いて立った形の物がある：ねかせるときは (0,1,0)）
    p=NT(P(nm,'model',(path,x,y,z,msize(path,w,rot,tilt,up),rot,tilt,1.0,up),(200,200,200),deco=True))
    if col:p.recol=col;p.recolk=k
    return p

# ---- 材料（足もとのまん中が (x,y,z)。s：大きさ（よこのはば、マス））
INGC={'tomato':(224,44,24),'apple':(232,96,84),'berry':(138,122,224),'egg':(250,246,236),'milk':(248,246,240),'fish':(236,222,206),'mugi':(232,197,106),
      'imo':(196,120,168),'komugiko':(244,236,216),'kinoko':(214,150,110),'takenoko':(236,214,150)}
INGS=list(INGC)
def ing(k,x,y,z,s,nm='材料'):
    L=[]
    if k=='tomato':
        L.append(model(nm,K+'tomato.glb',x,y,z,s,col=(224,44,24),k=0.25));t=L[-1].dims[4]
        st=[(x+(0.2*s if q%2==0 else 0.09*s)*math.cos(math.radians(q*36)),y+(0.2*s if q%2==0 else 0.09*s)*math.sin(math.radians(q*36))) for q in range(10)]
        L.append(NT(P(nm+'へた','prism',(st,z+t-0.004,z+t+0.006,'z'),(118,178,74))))
    elif k=='apple':L.append(model(nm,K+'apple.glb',x,y,z,s))
    elif k=='egg':L.append(model(nm,K+'egg.glb',x-s*0.2,y,z,s*0.55,tilt=90,col=(250,244,226),k=0.4));L.append(model(nm+'2',K+'egg.glb',x+s*0.22,y+s*0.12,z,s*0.52,rot=40,tilt=90,col=(250,244,226),k=0.4))
    elif k=='fish':L.append(model(nm,K+'fish.glb',x,y,z,s*1.3,rot=90,tilt=90))
    elif k=='berry':L+=model2(nm,'tripo/ck_berry.glb',x,y,z,s,lambda u,dx,dy:u>0.55 and dy<0.0,(150,204,104),(124,128,214))   # ブルーベリー：上のおくの葉は緑
    elif k=='mugi':L.append(model(nm,'tripo/ck_mugi.glb',x,y,z,s*1.2,rot=-60,col=(226,180,88),k=0.6))
    elif k=='imo':L.append(model(nm,'tripo/ck_imo.glb',x,y,z,s,rot=-20,col=(196,112,164),k=0.35))
    elif k=='milk':L+=model2(nm,'tripo/ck_milk.glb',x,y,z,s*0.6,lambda u,dx,dy:u>0.78,(232,212,176),(248,247,242))   # ミルクのびん：上の紙のふた
    elif k=='komugiko':L.append(model(nm,'tripo/sack.glb',x,y,z,s,col=(244,236,216),k=0.5))
    elif k=='kinoko':L.append(model(nm,'tripo/nat_kinoko0.glb',x,y,z,s))
    elif k=='takenoko':L.append(model(nm,'tripo/takenoko.glb',x,y,z,s*0.8))
    return [p for p in L if p]
def piece(k,x,y,z,r,nm):   # くしにさす1切れ（材料の色）
    c=INGC[k]
    if k in('fish','komugiko','takenoko','mugi','milk','imo'):return NT(P(nm,'box',(x-r,y-r*0.8,z-r*0.8,x+r,y+r*0.8,z+r*0.8),c,bevel=0))
    return NT(P(nm,'ball',(x,y,z,r),c))
def skewer(k,x,y,z,s):   # くし：灰にさして、火のほうへ少したおす。3切れ
    L=[];top=(x,y-0.12*s,z+1.15*s)
    L.append(NT(P('くし','rope',((x,y,z),top,0.03*s),(214,176,120))))
    for q,u in enumerate((0.45,0.65,0.85)):
        L.append(piece(k,x,y-0.12*s*u,z+1.15*s*u,0.11*s,'きれ%d'%q))
    return L

# ---- できた料理（足もとのまん中が (x,y,z)。s：大きさ）。色は料理の表の ic（[しゅるい, 色A, 色B, 色C]）
ORIG={'soup':['bowl','#e8845a','#c9a0d0'],'bread':['bread','#e8b878'],'yakizakana':['plate','#d9b48a','#e8845a'],'yakiimo':['plate','#c478a8','#f2d68a'],'marine':['plate','#a9bccb','#e05040'],
      'kushiyaki':['skewer','#d9b48a','#d9b48a','#d9b48a'],'foil':['plate','#d8dce4','#e8c56a'],'fishsoup':['bowl','#f0d8a0','#a9bccb'],'kabayaki':['plate','#c8884a','#f2e2bc'],
      'berryjuice':['cup','#8a7ae0'],'applejuice':['cup','#f2c86a'],'salad':['salad','#9fd46c','#e05040'],'dango':['dango','#f2e2bc','#f2e2bc','#f2e2bc'],'tamasand':['sand','#f6d860','#f2e2bc'],
      'milkshake':['cup','#f8f4ea','#f6d860'],'berrymilk':['cup','#c8b8f0','#8a7ae0'],'pancake':['cake','#e8b878','#f6d860'],'fsg':['plate','#9c8cb0','#8aa07c','#b09070']}
FISHY=('yakizakana','marine','kabayaki','kushiyaki')
def bowlshape(nm,x,y,z,r,h,col):return NT(P(nm,'lathe',(x,y,[(0,z),(r*0.55,z),(r*0.9,z+h*0.45),(r,z+h),(r*0.9,z+h),(r*0.8,z+h*0.55),(r*0.5,z+h*0.25),(0,z+h*0.22)]),col,detail=32))
def bits(nm,x,y,z,r,cols,n=5,seed=1):
    import random;R=random.Random(seed);L=[]
    for q in range(n):
        a=R.uniform(0,6.28);d=R.uniform(0.15,0.7)*r;c=cols[q%len(cols)]
        L.append(NT(P(nm+str(q),'ball',(x+d*math.cos(a),y+d*math.sin(a)*0.8,z,0.17*r,0.7),c)))
    return L
def dish(out,ic,x,y,z,s):
    t=ic[0];C=[H(c) for c in ic[1:]] or [(230,200,150)];A=C[0];B=C[1] if len(C)>1 else A;Cc=C[2] if len(C)>2 else B;L=[]
    if t=='salad':
        GR=(159,212,108);tp=[c for c in C if c!=GR] or [(224,80,64)]   # 葉はいつも緑。ほかの色は、のせる具
        L+=model2('サラダ','tripo/ck_salad.glb',x,y,z,s,lambda u,dx,dy:u>0.55 and (dx*dx+dy*dy)<0.16,GR,(214,170,112));L+=bits('具',x,y,z+0.36*s,0.3*s,tp,4,3)
    elif t=='bowl':
        r=0.5*s;h=0.42*s;L.append(bowlshape('うつわ',x,y,z,r,h,CER))
        L.append(NT(P('中身','cyl',(x,y,r*0.86,z+h*0.6,z+h*0.86),A)));L+=bits('具',x,y,z+h*0.9,r*0.75,[B,Cc],5,2)
    elif t=='cup':
        r=0.3*s;h=0.85*s;L.append(NT(P('コップ','lathe',(x,y,[(0,z),(r*0.92,z),(r,z+h),(r*0.86,z+h),(r*0.8,z+0.06*s),(0,z+0.06*s)]),CER,detail=28)))
        L.append(NT(P('のみもの','cyl',(x,y,r*0.84,z+0.06*s,z+h*0.86),A)))
        L.append(NT(P('とって','tube',([(x+r*0.95,y,z+h*0.75),(x+r*1.5,y,z+h*0.6),(x+r*1.5,y,z+h*0.3),(x+r*0.95,y,z+h*0.2)],0.035*s),CER)))
        if B!=A:L.append(NT(P('かざり','ball',(x-r*0.3,y,z+h*0.9,0.2*r),B)))
    elif t in('plate',):
        r=0.55*s;L.append(NT(P('おさら','cyl',(x,y,r,z,z+0.05*s),CER)))
        if out=='ck12':L.append(model('さしみ','tripo/ck_sashimi.glb',x,y,z+0.05*s,s*0.85,rot=10,col=(244,150,130),k=0.4))
        elif out in FISHY:L.append(model('さかな',K+'fish.glb',x,y,z+0.05*s,s*0.9,rot=90,tilt=90,col=A,k=0.35));L+=bits('そえ',x+0.25*s,y+0.15*s,z+0.1*s,r*0.4,[B],2,4)
        else:L.append(NT(P('もり','egg',(x,y,z+0.12*s,0.38*s,0.3*s,0.14*s),A)));L+=bits('具',x,y,z+0.24*s,r*0.55,[B,Cc],4,5)
    elif t=='bread':L.append(NT(P('おさら','cyl',(x,y,0.55*s,z,z+0.05*s),CER)));L.append(model('パン',K+'loaf.glb',x,y,z+0.05*s,s*0.75,rot=20,col=A,k=0.4))
    elif t=='cake':
        r=0.42*s;L.append(NT(P('おさら','cyl',(x,y,0.55*s,z,z+0.05*s),CER)))
        for q in range(3):L.append(NT(P('きじ%d'%q,'cyl',(x,y,r,z+0.05*s+q*0.11*s,z+0.05*s+q*0.11*s+0.09*s),A)))
        L.append(NT(P('のせ','ball',(x,y,z+0.42*s,0.17*s,0.6),B)))
    elif t in('dango','skewer'):
        r=0.55*s;L.append(NT(P('おさら','cyl',(x,y,r,z,z+0.05*s),CER)))
        a=(x-0.48*s,y+0.06*s,z+0.14*s);b=(x+0.48*s,y-0.06*s,z+0.14*s);L.append(NT(P('くし','rope',(a,b,0.025*s),(214,176,120))))
        for q,c in enumerate((A,B,Cc)):
            u=0.28+0.24*q;px,py=a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u
            L.append(NT(P('たま%d'%q,'ball',(px,py,z+0.15*s,0.15*s),c)) if t=='dango' else piece('fish' if out=='kushiyaki' else 'tomato',px,py,z+0.15*s,0.12*s,'きれ%d'%q))
            if t=='skewer':L[-1].col=c
    elif t=='sand':
        w,d=0.42*s,0.3*s;L.append(NT(P('おさら','cyl',(x,y,0.55*s,z,z+0.05*s),CER)));zz=z+0.05*s
        for nm,c,hh in(('パン1',(242,226,188),0.08),('具1',A,0.05),('具2',B if B!=A else A,0.05),('パン2',(242,226,188),0.08)):
            L.append(NT(P(nm,'box',(x-w,y-d,zz,x+w,y+d,zz+hh*s),c,bevel=0)));zz+=hh*s
    return L

# ---- 道具（家具の場所で）
def tools_cooktable():
    zt=0.60;bc=(0.52,0.70);BA=math.radians(-14);ux,uy=math.cos(BA),math.sin(BA);A=(bc[0]-ux*0.30,bc[1]-uy*0.30,zt+0.015);B=(bc[0]+ux*0.30,bc[1]+uy*0.30,zt+0.015)
    board=[P('まな板','plate',(A,B,0.30,0.03),WOOD,grp='まな板'),P('まな板の取っ手','plate',((A[0]-ux*0.08,A[1]-uy*0.08,A[2]),A,0.12,0.03),WOOD,grp='まな板')]
    bx,by=0.75,0.67;tx,ty=0.53,0.82;Lb=math.hypot(tx-bx,ty-by);du,dv=(tx-bx)/Lb,(ty-by)/Lb;nu,nv=-dv,du;h=0.038
    shape=[(0,h),(0.62,h),(0.86,0.55*h),(1.0,0.25*h),(0.92,-0.25*h),(0.72,-0.75*h),(0.45,-h),(0,-h)]
    knife=[MT(NT(P('包丁の刃','prism',([(bx+du*Lb*u+nu*v,by+dv*Lb*u+nv*v) for u,v in shape],zt+0.03,zt+0.042,'z'),METAL))),NT(P('包丁の柄','plate',((bx,by,zt+0.041),(bx-du*0.13,by-dv*0.13,zt+0.041),0.05,0.022),(176,118,72)))]
    bowl=[bowlshape('ボウル',0.50,0.68,zt,0.15,0.09,CER)]
    pr,ph=0.08,0.22;pit=[NT(P('ピッチャー','lathe',(0.50,0.68,[(0,zt),(pr*0.9,zt),(pr,zt+ph*0.5),(pr*0.8,zt+ph*0.9),(pr*0.86,zt+ph),(pr*0.72,zt+ph),(pr*0.66,zt+0.02),(0,zt+0.02)]),CER,detail=28)),
        NT(P('ピッチャーの取っ手','tube',([(0.50+pr*0.9,0.68,zt+ph*0.8),(0.50+pr*1.6,0.68,zt+ph*0.7),(0.50+pr*1.6,0.68,zt+ph*0.3),(0.50+pr*0.95,0.68,zt+ph*0.22)],0.014),CER))]
    knead=[bowlshape('こねばち',0.46,0.66,zt,0.17,0.07,(214,170,112)),NT(P('めんぼう','log',((0.62,0.84,zt+0.025),(0.95,0.72,zt+0.025),0.025),(230,196,140)))]
    return {'board':board,'boardk':board+knife,'bowl':bowl,'pitcher':pit,'knead':knead}
def pot(cx,cy,z0,r=0.12,h=0.12,soup=(226,196,150)):
    return [MT(NT(P('なべ','lathe',(cx,cy,[(0,z0),(r*0.9,z0),(r,z0+0.02),(r,z0+h),(r*0.92,z0+h),(r*0.92,z0+0.03),(0,z0+0.03)]),POTM,detail=32))),
            NT(P('スープ','cyl',(cx,cy,r*0.9,z0+0.03,z0+h*0.78),soup)),
            MT(NT(P('なべの耳1','box',(cx-r-0.03,cy-0.02,z0+h*0.8,cx-r+0.005,cy+0.02,z0+h*0.9),POTM,bevel=0))),MT(NT(P('なべの耳2','box',(cx+r-0.005,cy-0.02,z0+h*0.8,cx+r+0.03,cy+0.02,z0+h*0.9),POTM,bevel=0)))]
def pan(cx,cy,z0,r=0.11):
    return [MT(NT(P('フライパン','lathe',(cx,cy,[(0,z0),(r*0.85,z0),(r,z0+0.03),(r*0.92,z0+0.03),(r*0.8,z0+0.008),(0,z0+0.008)]),POTM,detail=32))),
            NT(P('フライパンの柄','plate',((cx+r*0.9,cy+r*0.3,z0+0.025),(cx+r*0.9+0.16,cy+r*0.3+0.06,z0+0.035),0.03,0.02),(176,118,72)))]
def tools_oven():
    y=0.86
    tray=[MT(NT(P('天板','box',(0.36,y-0.08,0.0,0.64,y+0.08,0.012),POTM,bevel=0)))]+[MT(NT(P('天板のふち%d'%q,'box',b,POTM,bevel=0))) for q,b in enumerate(((0.36,y-0.08,0.012,0.64,y-0.065,0.03),(0.36,y+0.065,0.012,0.64,y+0.08,0.03),(0.36,y-0.065,0.012,0.375,y+0.065,0.03),(0.625,y-0.065,0.012,0.64,y+0.065,0.03)))]
    return {'pot':pot(0.50,y,0.0),'pan':pan(0.48,y,0.0),'tray':tray}
def tools_campfire():
    CX,CY=0.50,0.52;ap=(CX,CY,0.88);L=[]
    for q,a in enumerate((math.radians(205),math.radians(335),math.radians(90))):L.append(NT(P('三脚%d'%q,'rope',((CX+0.40*math.cos(a),CY+0.36*math.sin(a),0.0),ap,0.018),(196,150,104))))
    L.append(NT(P('つるすひも','rope',(ap,(CX,CY,0.47),0.008),(214,190,150))))
    L+=pot(CX,CY,0.33);L.append(MT(NT(P('つる','tube',([(CX-0.13,CY,0.44),(CX-0.08,CY,0.47),(CX+0.08,CY,0.47),(CX+0.13,CY,0.44)],0.008),POTM))))
    net=[]
    for q in range(7):net.append(MT(NT(P('網のよこ%d'%q,'box',(CX-0.24,CY-0.17+q*0.055,0.125,CX+0.24,CY-0.17+q*0.055+0.012,0.135),POTM,bevel=0))))
    for q in range(9):net.append(MT(NT(P('網のたて%d'%q,'box',(CX-0.24+q*0.058,CY-0.17,0.135,CX-0.24+q*0.058+0.012,CY+0.17,0.145),POTM,bevel=0))))
    return {'pot':L,'net':net}
TOOLS={'cooktable':tools_cooktable,'oven':tools_oven,'campfire':tools_campfire}
# 材料・料理を置く場所（家具の3Dの中の点）。材料は3つ（入れた順）。L/S/K は材料の絵の大きさ
SLOTS={'cooktable':{'L':[(0.20,0.42,0.60),(0.80,0.42,0.60),(0.50,0.38,0.60)],'D':[(0.50,0.62,0.60)]},
       'oven':{'pot':[(0.45,0.85,0.09),(0.55,0.86,0.09),(0.50,0.89,0.09)],'pan':[(0.44,0.85,0.012),(0.53,0.86,0.012),(0.49,0.89,0.012)],'tray':[(0.43,0.85,0.012),(0.57,0.86,0.012),(0.50,0.89,0.012)],'D':[(0.50,0.95,0.0)]},
       'campfire':{'pot':[(0.45,0.51,0.42),(0.55,0.52,0.42),(0.50,0.55,0.42)],'net':[(0.38,0.50,0.145),(0.62,0.50,0.145),(0.50,0.58,0.145)],'K':[(0.32,0.72,0.02),(0.68,0.72,0.02),(0.50,0.78,0.02)],'D':[(0.50,0.87,0.13)]}}
SIZE={'L':0.20,'S':0.11,'K':0.30,'D':0.30}
VIEWK={'cooktable':[0,1,2],'oven':[0],'campfire':[0]}

_scene=F.scene
F.scene=lambda M,k,only=None,filt=None,foot=None:_scene(M,k,only,filt,foot if foot is not None else getattr(M,'FOOT',None))   # まわす中心は、家具だけの床の範囲（道具がはみ出しても、ずれない）
def furn_module(fid):
    M=importlib.import_module(fid);M.FR=0;base=M.PARTS
    if not hasattr(M,'_BASE'):M._BASE=base
    return M
PBOX=[(x,y,z) for x in(-0.3,1.3) for y in(-0.3,1.4) for z in(-0.05,1.6)]   # 写す範囲をきめる点（どの道具をのせても、ドットのますめがずれない）
def shot_parts(M,k,parts,info=None):
    M.PARTS=lambda:M._BASE()+parts;return F.shot(M,k,info=info)
def match(A,B):   # A（いまのチップのコマ）が B（写した絵）のどこにあるか：不透明のかさなりがいちばん多い所
    a=(np.array(A)[...,3]>0).astype(np.int32);b=(np.array(B)[...,3]>0).astype(np.int32);h,w=a.shape;Hh,Ww=b.shape;best=(-1e9,0,0)
    bp=np.pad(b,((h,h),(w,w)))
    for oy in range(0,Hh+h):
        for ox in range(0,Ww+w):
            win=bp[oy:oy+h,ox:ox+w];s=(a&win).sum()*2-(a^win).sum()
            if s>best[0]:best=(s,ox-w,oy-h)
    return best[1],best[2]

def gen_tools(out,CC,res,data):
    import chips as CHP
    for fid,mk in TOOLS.items():
        M=furn_module(fid);O.GRAD=getattr(M,'GRAD',False);T=mk();M.PBOX=PBOX
        M.PARTS=M._BASE
        M.FOOT=None;sc,_=F.scene(M,0);M.FOOT=sc.foot;VV=np.array([v for t in sc.t for v in t[:3]]);M.CENTER=((VV[:,0].min()+VV[:,0].max())/2,(VV[:,1].min()+VV[:,1].max())/2,VV[:,2].max()/2)
        for vi,k in enumerate(VIEWK[fid]):
            inf={};bare=shot_parts(M,k,[],inf)[0];ids0=O.LAST_IDS.copy();E0=inf['ext']
            cname=fid+('>%d'%k if k else '');ch=CC[cname];ox,oy=match(ch['f'][0].convert('RGBA'),bare)
            def tile(px,py):return (ch['ax']+(px-ox),ch['ay']+(py-oy))   # 写した絵のドット → マスの左上からのドット（g64）
            D=data.setdefault(fid,[{} for _ in VIEWK[fid]])[vi]
            nb=len(M._BASE())
            for tn,tp in T.items():
                i2={};im=shot_parts(M,k,tp,i2)[0];ids=O.LAST_IDS;assert abs(i2['ext'][0]-E0[0])<1e-9 and abs(i2['ext'][2]-E0[2])<1e-9
                a=np.array(im);b=np.array(bare);hh,ww=min(a.shape[0],b.shape[0]),min(a.shape[1],b.shape[1]);a=a[:hh,:ww].copy();b=b[:hh,:ww];ids=ids[:hh,:ww];tid=set(np.unique(ids[ids>=0]))-set(np.unique(ids0[ids0>=0]))
                mk_=binary_dilation(np.isin(ids,list(tid)),iterations=2)&(np.any(a!=b,axis=2))&(a[...,3]>0)
                a[~mk_]=0;oi=Image.fromarray(a);bb=oi.getbbox();oi=oi.crop(bb);x,y=tile(bb[0],bb[1])
                nm='cktool_%s_%s'%(fid,tn)+('>%d'%k if k else '');res[nm]=(oi,x,y);print(nm,oi.size,x,y)
            def proj(p):q=inf['fwd'](p);u,v=inf['PROJ'](q);return tile((u-inf['ext'][0])*inf['S'],(v-inf['ext'][2])*inf['S'])
            for sk,pts in SLOTS[fid].items():D[sk]=[[round(c,1) for c in proj(p)] for p in pts]
        M.PARTS=M._BASE

class _Solo:GRAD=True;BOTTOM=0
def solo(parts):   # 1つだけ写す。足もとの点 (0,0,0) をマスの点にした ax・ay
    M=_Solo();M.PARTS=lambda:parts;O.GRAD=True;inf={};im=F.shot(M,0,info=inf)[0];bb=im.getbbox();u,v=inf['PROJ'](inf['fwd']((0,0,0)))
    px,py=(u-inf['ext'][0])*inf['S'],(v-inf['ext'][2])*inf['S'];return im.crop(bb),round(bb[0]-px),round(bb[1]-py)
def gen_ings(res):
    for k in INGS:
        for sz in('L','S'):im,x,y=solo(ing(k,0,0,0,SIZE[sz]));res['ckin_%s.%s'%(k,sz)]=(im,x,y)
        im,x,y=solo(skewer(k,0,0,0,SIZE['K']));res['ckin_%s.K'%k]=(im,x,y);print('材料',k)
def gen_dishes(res):
    js=open(os.path.join(ROOT,'js','cook-table.js'),encoding='utf8').read();L=json.loads('['+js[js.index('['):].split('];')[0].strip()[1:]+']')
    for D in L+[{'id':'fsg'}]:
        out=D['id'];ic=D.get('ic') or ORIG.get(out)
        im,x,y=solo(dish(out,ic,0,0,0,SIZE['D']));res['ckdish_'+out]=(im,x,y)
    print('料理',len(L)+1)
def write_js(data):
    s='/* 料理の家具の上にかさねる絵の場所（tools/art/furn3d/cooktop.py で書いた）。CKTOP[家具][向き]：L/S/pot/pan/tray/net/K は材料を置く3つの場所、D はできた料理の場所。どれも g64 のドット、マスの左上から */\nconst CKTOP='+json.dumps(data,separators=(',',':'))+';\n'
    open(os.path.join(ROOT,'js','cook-top-data.js'),'w',encoding='utf8').write(s)
def main():
    out=sys.argv[1];os.makedirs(out,exist_ok=True);chips='--chips' in sys.argv
    sys.path.insert(0,os.path.join(ROOT,'tools'));import chips as CHP
    head,CC=CHP.load_imgs();res={};data={}
    gen_tools(out,CC,res,data);gen_ings(res);gen_dishes(res);write_js(data)
    for nm,(im,x,y) in res.items():im.save(os.path.join(out,nm.replace('>','_')+'.png'))
    json.dump({nm:[x,y] for nm,(im,x,y) in res.items()},open(os.path.join(out,'meta.json'),'w'))
    # たしかめ：家具ごとに、道具と材料と料理をかさねた絵
    if chips:
        for nm,(im,x,y) in res.items():CC[nm]={'g':64,'ax':x,'ay':y,'w':im.width,'h':im.height,'f':[im]}
        CHP.pack_imgs(head,CC);open(os.path.join(ROOT,'.chips_changed'),'w').write('\n'.join(res));print('チップに入れた',len(res))
if __name__=='__main__':main()
