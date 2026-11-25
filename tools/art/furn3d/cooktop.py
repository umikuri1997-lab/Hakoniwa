# 料理の家具（調理台・かまど・たき火）の上にかさねる絵を、3Dから写す（スキル model3d-pixel）。
# 使い方：python3 tools/art/furn3d/cooktop.py <出力フォルダ> [--chips] [--dish ck126,ck127]（--dish：足した料理の絵だけ作る）
#   道具（cktool_<家具>_<道具>、調理台は >1・>2 の向きも）：家具の3Dにのせて写し、のせる前の絵とちがうドットだけを切りぬく（家具の絵にぴったりかさなる）。
#   材料（ckin_<材料>.<大きさ>）・できた料理（ckdish_<料理>）：1つずつ写し、足もとの点を (0,0) にした絵。ゲームは、家具の上の場所（js/cook-top-data.js の CKTOP）に描く。
#   大きさ：L 台の上（調理台のおく）・S なべ・フライパン・天板・網の上・K くしにさした形。
#   js/cook-top-data.js（CKTOP：家具・向きごとの道具の名前と、材料・料理を置く場所（g64 のドット、家具を置いたマスのまん中の地面の点から））も書く。
#   見え方は、家具のチップと同じクォータービュー（iso3d.py を読みこむと、写し方がかわる）。道具は iso:1 のチップ（家具と同じ足もと）。
#   料理は、料理の表の材料（i）から：スープ・のみもののもとの色（BASEC）、のせる具の本物の形（topping）、焼き色・たれ・バター・シロップ・焼き目、かざりの葉（herb）。
# 設計図（単位はマス。台の上の面：調理台 0.32・かまどの口の床 0.0・たき火の石の上 0.13）
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
sys.path.insert(0,os.path.join(ART,'iso'));import iso3d   # クォータービューの見え方で写す（iso3d.py が、写し方・まわし方・大きさをかえる。家具のチップと同じ）
from blueprint import Part as P,model_tris
from common import WOOD,METAL,notex,SOFT
from scipy.ndimage import binary_dilation

def MT(p):p.metal=True;return p
def NT(p):p.tex=False;return p
CER=(240,231,214)   # やきもの（クリーム色。白いつやの光が見えるように、白より少しこく）
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
INGC={'tomato':(224,44,24),'apple':(232,96,84),'berry':(150,92,204),'egg':(250,246,236),'milk':(248,246,240),'fish':(236,222,206),'mugi':(232,197,106),
      'imo':(196,120,168),'komugiko':(244,236,216),'kinoko':(214,150,110),'takenoko':(236,214,150)}
INGS=list(INGC)
SHINYING={'tomato','apple','berry','egg','milk'}   # 皮・びんが、つやつやの材料
SHINYN=('うつわ','コップ','のみもの','中身','スープ','もり','具','そえ','おさら','かざり','とって','ボウル','ピッチャー','なべ','フライパン','天板','網','つる','包丁の刃','のせ','きじ')   # つやつやの部品（名前のはじめ）：金属・やきもの・ガラス・たれ・スープ・のみもの
import colorsys
def viv(c):   # 食べ物の色を、あざやかに（あざやかさを上げ、明るさはほとんどそのまま）
    h,s_,v=colorsys.rgb_to_hsv(*[min(255,max(0,q))/255 for q in c])
    if s_<0.08:return tuple(float(q) for q in c)   # 白・クリーム色の物（たまご・ミルク）は、そのまま
    s_=min(1.0,s_*1.45+0.10);v=min(1.0,v*1.02);return tuple(q*255 for q in colorsys.hsv_to_rgb(h,s_,v))
NONFOOD=('うつわ','コップ','グラス','おさら','くし','ストロー','つやの光','ホイル','サラダ2','なべ','フライパン')   # 食べ物でない部品（あざやかにしない）
def vivid(L):
    for p in L:
        if p.name.startswith(NONFOOD) or p.name=='サラダ2':continue
        if getattr(p,'novivid',False):p.vivid=lambda c:c;continue
        if p.kind!='model':p.col=viv(p.col)
        elif getattr(p,'recol',None) is not None:p.recol=viv(p.recol);p.vivid=lambda c:c   # 色をかえるモデル：かえる色をあざやかに（白はまぜない）
        else:p.vivid=viv
    return L
def shine(L):
    for p in L:
        if p.name.startswith(SHINYN):p.shiny=True
    return L
def ing(k,x,y,z,s,nm='材料'):
    L=[]
    if k=='tomato':
        L.append(model(nm,K+'tomato.glb',x,y,z,s,col=(224,44,24),k=0.25));t=L[-1].dims[4]
        st=[(x+(0.2*s if q%2==0 else 0.09*s)*math.cos(math.radians(q*36)),y+(0.2*s if q%2==0 else 0.09*s)*math.sin(math.radians(q*36))) for q in range(10)]
        L.append(NT(P(nm+'へた','prism',(st,z+t-0.004,z+t+0.006,'z'),(118,178,74))))
    elif k=='apple':L.append(model(nm,K+'apple.glb',x,y,z,s))
    elif k=='egg':L.append(model(nm,K+'egg.glb',x-s*0.2,y,z,s*0.55,tilt=90,col=(250,244,226),k=0.4));L.append(model(nm+'2',K+'egg.glb',x+s*0.22,y+s*0.12,z,s*0.52,rot=40,tilt=90,col=(250,244,226),k=0.4))
    elif k=='fish':L.append(model(nm,K+'fish.glb',x,y,z,s*1.3,rot=90,tilt=90));L[-1].novivid=True   # さかなは、ぎん色とひれの色のまま（あざやかにすると、赤い魚になった）
    elif k=='berry':L+=model2(nm,'tripo/ck_berry.glb',x,y,z,s,lambda u,dx,dy:u>0.55 and dy<0.0,(150,204,104),(146,84,196))   # ベリー（紫）：上のおくの葉は緑
    elif k=='mugi':L.append(model(nm,'tripo/ck_mugi.glb',x,y,z,s*1.2,rot=-60,col=(226,180,88),k=0.6))
    elif k=='imo':L.append(model(nm,'tripo/ck_imo.glb',x,y,z,s,rot=-20,col=(196,112,164),k=0.35))
    elif k=='milk':L+=model2(nm,'tripo/ck_milk.glb',x,y,z,s*0.6,lambda u,dx,dy:u>0.78,(232,212,176),(248,247,242))   # ミルクのびん：上の紙のふた
    elif k=='komugiko':L.append(model(nm,'tripo/sack.glb',x,y,z,s,col=(244,236,216),k=0.5))
    elif k=='kinoko':L.append(model(nm,'tripo/nat_kinoko0.glb',x,y,z,s))
    elif k=='takenoko':L.append(model(nm,'tripo/takenoko.glb',x,y,z,s*0.8))
    L=vivid([p for p in L if p])
    if k in SHINYING:
        for p in L:
            if not (k=='berry' and p.name==nm) and not p.name.endswith('へた') and not (k=='milk' and p.name==nm):p.shiny=True   # ベリーの葉・トマトのへた・ミルクのびんの紙のふたは、つやなし
    return L
def piece(k,x,y,z,r,nm):   # くしにさす1切れ（材料の色）
    c=INGC[k]
    if k in('fish','komugiko','takenoko','mugi','milk','imo'):return NT(P(nm,'box',(x-r,y-r*0.8,z-r*0.8,x+r,y+r*0.8,z+r*0.8),c,bevel=0))
    return NT(P(nm,'ball',(x,y,z,r),c))
def skewer(k,x,y,z,s):   # くし：灰にさして、火のほうへ少したおす。3切れ
    L=[];top=(x,y-0.12*s,z+1.15*s)
    L.append(NT(P('くし','rope',((x,y,z),top,0.03*s),(214,176,120))))
    for q,u in enumerate((0.45,0.65,0.85)):
        L.append(piece(k,x,y-0.12*s*u,z+1.15*s*u,0.11*s,'きれ%d'%q))
        if k in SHINYING:L[-1].shiny=True
    vivid(L)
    return L

# ---- できた料理（足もとのまん中が (x,y,z)。s：大きさ）。色は料理の表の ic（[しゅるい, 色A, 色B, 色C]）
ORIG={'soup':['bowl','#e8845a','#c9a0d0'],'bread':['bread','#e8b878'],'yakizakana':['plate','#d9b48a','#e8845a'],'yakiimo':['plate','#c478a8','#f2d68a'],'marine':['plate','#a9bccb','#e05040'],
      'kushiyaki':['skewer','#d9b48a','#d9b48a','#d9b48a'],'foil':['plate','#d8dce4','#e8c56a'],'fishsoup':['bowl','#f0d8a0','#a9bccb'],'kabayaki':['plate','#c8884a','#f2e2bc'],
      'berryjuice':['cup','#8a7ae0'],'applejuice':['cup','#f2c86a'],'salad':['salad','#9fd46c','#e05040'],'dango':['dango','#f2e2bc','#f2e2bc','#f2e2bc'],'tamasand':['sand','#f6d860','#f2e2bc'],
      'milkshake':['cup','#f8f4ea','#f6d860'],'berrymilk':['cup','#c8b8f0','#8a7ae0'],'pancake':['cake','#e8b878','#f6d860'],'fsg':['plate','#9c8cb0','#8aa07c','#b09070']}
FISHY=('yakizakana','marine','kabayaki','kushiyaki')
def bowlshape(nm,x,y,z,r,h,col):return NT(P(nm,'lathe',(x,y,[(0,z),(r*0.55,z),(r*0.9,z+h*0.45),(r,z+h),(r*0.9,z+h),(r*0.8,z+h*0.55),(r*0.5,z+h*0.25),(0,z+h*0.22)]),col,detail=32))
def glint(x,y,z,r):   # たいらな水面（スープ・のみもの・たれ）のつや：左上に、白い光のだ円（かげをつけない）
    p=NT(P('つやの光','egg',(x-0.35*r,y-0.3*r,z+0.002,0.32*r,0.16*r,0.003,-25),(255,253,244)));p.flat=True;return p
def bits(nm,x,y,z,r,cols,n=5,seed=1):
    import random;R=random.Random(seed);L=[]
    for q in range(n):
        a=R.uniform(-0.6,2.6);d=R.uniform(0.15,0.7)*r;c=cols[q%len(cols)]   # 左おく（つやの光の所）にはのせない
        L.append(NT(P(nm+str(q),'ball',(x+d*math.cos(a),y+d*math.sin(a)*0.8,z,0.17*r,0.7),c)))
    return L
# ---- おいしそうに：料理の材料（料理の表の i）から、もとの色と、のせる具の形をきめる
FISHK=('fish','unagi','ayu','koi','namazu','yumasu')
def ik(k):return 'fish' if k in FISHK else k
BASEC={'milk':(248,242,228),'tomato':(234,104,66),'berry':(178,128,214),'apple':(246,202,112),'imo':(244,206,118),'mugi':(238,208,142),'egg':(250,214,104),
       'fish':(242,224,186),'kinoko':(210,164,120),'takenoko':(240,224,172),'komugiko':(248,238,214)}   # スープ・のみもの・たれのもとの色
SOUPP=['tomato','milk','imo','berry','egg','kinoko','apple','fish','mugi','takenoko','komugiko']   # スープのもとになる、えらぶ順
HERB=(126,192,92)   # かざりの葉
GRILLC={'fish':(214,140,80),'kinoko':(186,118,74),'imo':(200,110,150),'tomato':(214,80,50),'takenoko':(220,188,110),'berry':(130,96,190),'apple':(220,110,80),'egg':(240,196,90)}   # 焼いた具の色
def topping(k,x,y,z,s,nm,seed=0):   # のせる具（本物の形）。s：料理の大きさ。足もとが z
    k=ik(k);L=[];P_=lambda n,kind,d,c:NT(P(nm+n,kind,d,c))
    if k=='tomato':L+=[P_('','ball',(x,y,z+0.07*s,0.075*s,0.85),(228,66,46)),P_('へた','ball',(x,y,z+0.13*s,0.025*s,0.4),(110,176,72))]
    elif k=='berry':L+=[P_(str(q),'ball',(x+dx*s,y+dy*s,z+0.045*s,0.048*s),(112,108,212)) for q,(dx,dy) in enumerate(((-0.04,0),(0.04,0.01),(0,-0.04)))]
    elif k=='apple':L+=[P_('かわ','egg',(x,y-0.01*s,z+0.03*s,0.1*s,0.045*s,0.03*s,-20),(222,72,60)),P_('み','egg',(x+0.005*s,y+0.008*s,z+0.035*s,0.088*s,0.032*s,0.028*s,-20),(250,234,190))]
    elif k=='egg':L+=[P_('しろみ','cyl',(x,y,0.085*s,z,z+0.02*s),(252,250,242)),P_('きみ','ball',(x,y,z+0.025*s,0.045*s,0.6),(250,190,52))]
    elif k=='fish':L+=[P_('','egg',(x,y,z+0.03*s,0.11*s,0.055*s,0.032*s,-15),(242,150,118)),P_('すじ','egg',(x,y,z+0.058*s,0.09*s,0.012*s,0.006*s,-15),(252,214,196))]
    elif k=='mugi':L+=[P_(str(q),'egg',(x+dx*s,y+dy*s,z+0.02*s,0.035*s,0.02*s,0.018*s,a),(232,186,96)) for q,(dx,dy,a) in enumerate(((-0.04,0,20),(0.03,0.02,-30),(0,-0.03,60),(0.04,-0.03,10)))]
    elif k=='imo':L+=[P_('かわ','egg',(x,y,z+0.04*s,0.09*s,0.07*s,0.04*s,10),(186,96,152)),P_('み','cyl',(x,y,0.06*s,z+0.06*s,z+0.075*s),(246,212,112))]
    elif k=='milk':L+=[P_('','ball',(x,y,z+0.04*s,0.07*s,0.7),(253,250,242)),P_('2','ball',(x,y,z+0.09*s,0.045*s,0.8),(253,250,242))]
    elif k=='komugiko':L+=[P_('','ball',(x,y,z+0.05*s,0.065*s,0.85),(246,232,200))]
    elif k=='kinoko':L+=[P_('じく','cyl',(x,y,0.028*s,z,z+0.06*s),(246,236,214)),P_('かさ','ball',(x,y,z+0.065*s,0.07*s,0.55),(200,118,78))]
    elif k=='takenoko':L+=[P_('','cone',(x,y,0.055*s,z,z+0.13*s),(238,212,136))]
    return L
def herb(x,y,z,s):return [NT(P('葉%d'%q,'egg',(x+dx*s,y+dy*s,z+0.012*s,0.05*s,0.022*s,0.01*s,a),HERB)) for q,(dx,dy,a) in enumerate(((0,0,30),(0.04,0.02,-40)))]
def spots(r,n):   # 具をのせる場所（左おくは、つやの光のためあける）
    P0=[(0.35,0.25),(-0.25,0.35),(0.4,-0.2),(0.05,0.0),(-0.4,0.05),(0.15,0.45)];return [(u*r,v*r) for u,v in P0[:n]]
def mixc(cs):return tuple(int(sum(c[i] for c in cs)/len(cs)) for i in range(3))
def dish(out,ic,ins,x,y,z,s):
    t=ic[0];C=[H(c) for c in ic[1:]] or [(230,200,150)];A=C[0];ks=[ik(k) for k in ins] or ['fsg'];L=[]
    tops=lambda pts,zz,keys:[q for i,(dx,dy) in enumerate(pts) for q in topping(keys[i%len(keys)],x+dx,y+dy,zz,s,'具%d'%i)]
    if t=='salad':
        L+=model2('サラダ','tripo/ck_salad.glb',x,y,z,s,lambda u,dx,dy:u>0.55 and (dx*dx+dy*dy)<0.16,(150,206,96),(214,170,112))
        kk=[k for k in ks if k!='tomato' or len(ks)==1] or ['tomato'];L+=tops(spots(0.22*s,4),z+0.3*s,kk)
    elif t=='bowl':   # スープ・シリアル：もとの色（ミルクとむぎはシリアル）・具・葉・つや
        r=0.5*s;h=0.42*s;L.append(bowlshape('うつわ',x,y,z,r,h,CER))
        base=('milk' if 'milk' in ks else next((k for k in SOUPP if k in ks),None)) if 'mugi' in ks else next((k for k in SOUPP if k in ks),None)
        L.append(NT(P('中身','cyl',(x,y,r*0.86,z+h*0.6,z+h*0.86),BASEC.get(base,A))));L.append(glint(x,y,z+h*0.86,r*0.86))
        kk=[k for k in ks if k!=base] or ks;L+=tops(spots(r*0.62,4 if len(kk)>1 else 3),z+h*0.82,kk)
        if 'mugi' not in ks:L+=herb(x-0.12*s,y+0.2*s,z+h*0.86,s)
    elif t=='cup':   # のみもの：すけたグラス・まぜた色・ふちの具（ミルクとたまごはクリーム）
        r=0.27*s;h=0.9*s;liq=[BASEC[k] for k in ks if k in ('milk','berry','apple','tomato','egg')] or [A];col=mixc(liq)
        if 'milk' in ks and len(liq)>1:col=mixc([col,col,BASEC['milk']])
        L.append(NT(P('のみもの','cyl',(x,y,r*0.92,z,z+h*0.82),col)));L.append(glint(x,y,z+h*0.82,r*0.84))   # グラスは、うすい ふちの輪だけ（すけたかべは灰色に見えた）
        L.append(NT(P('グラスのふち','ring',(x,y,r*0.86,r,z+h*0.82,z+h*0.86),(236,246,250))));L.append(NT(P('グラスのそこ','cyl',(x,y,r,z,z+0.03*s),(236,246,250))))
        if 'egg' in ks or ('milk' in ks and len(ks)>1):L+=[NT(P('クリーム','ball',(x,y,z+h*0.86,r*0.7,0.6),(253,250,242))),NT(P('クリーム2','ball',(x,y,z+h*1.0,r*0.4,0.8),(253,250,242)))]
        fr=[k for k in ks if k in ('berry','apple','tomato')]
        if fr:L+=topping(fr[0],x+r*0.75,y+r*0.3,z+h*0.86,s,'ふち')
        L.append(NT(P('ストロー','rope',((x-r*0.2,y,z+0.2*s),(x-r*0.65,y-r*0.2,z+h*1.25),0.018*s),(240,128,120))))
    elif t=='plate':
        r=0.55*s;zp=z+0.05*s;L.append(NT(P('おさら','cyl',(x,y,r,z,zp),CER)))
        if out=='ck12':L.append(model('さしみ','tripo/ck_sashimi.glb',x,y,zp,s*0.85,rot=10,col=(244,150,130),k=0.4));L+=herb(x-0.25*s,y+0.15*s,zp,s)
        elif out=='foil':
            f=MT(NT(P('ホイル','egg',(x,y,zp+0.04*s,0.36*s,0.28*s,0.07*s),(222,226,234))));L.append(f);L+=tops(spots(0.15*s,3),zp+0.08*s,['fish','imo'])
        elif any(k=='fish' for k in ks):   # 焼き魚：こんがりの色、たれのつや、焼き目
            gl=out=='kabayaki' or 'unagi' in ins
            f=model('さかな',K+'fish.glb',x,y,zp,s*0.95,rot=90,tilt=90,col=(160,78,28) if gl else (196,118,52),k=0.12);L.append(f)
            if gl:L.append(glint(x+0.02*s,y-0.02*s,zp+0.1*s,0.2*s))   # たれのつや（魚の平らな面がぜんぶ光らないよう、光は小さく）
            for q in range(3):L.append(NT(P('焼き目%d'%q,'box',(x-0.14*s+q*0.1*s,y-0.06*s,zp+0.055*s,x-0.125*s+q*0.1*s,y+0.04*s,zp+0.062*s),(150,92,48),bevel=0)))
            kk=[k for k in ks if k!='fish'];L+=tops([(0.3*s,0.2*s),(-0.3*s,0.22*s)],zp,kk or ['tomato']) if kk else [];L+=herb(x+0.25*s,y-0.15*s,zp,s)
        elif 'egg' in ks:   # 目玉やき
            L+=[NT(P('しろみ','egg',(x-0.05*s,y,zp+0.012*s,0.26*s,0.22*s,0.015*s,10),(252,250,242))),NT(P('きみ','ball',(x-0.05*s,y,zp+0.03*s,0.09*s,0.55),(250,184,44)))]
            kk=[k for k in ks if k!='egg'];L+=tops([(0.3*s,0.18*s),(0.28*s,-0.12*s)],zp,kk) if kk else herb(x+0.28*s,y+0.15*s,zp,s)
        elif out=='fsg':L+=[NT(P('もり','egg',(x,y,zp+0.07*s,0.36*s,0.28*s,0.1*s),(156,140,176))),NT(P('あわ','ball',(x+0.1*s,y-0.05*s,zp+0.15*s,0.05*s),(186,176,200))),NT(P('あわ2','ball',(x-0.12*s,y+0.06*s,zp+0.14*s,0.035*s),(186,176,200)))]
        else:   # 焼いた具をならべ、たれをかける
            L.append(NT(P('たれ','egg',(x,y,zp+0.004*s,0.32*s,0.25*s,0.006*s),mixc([BASEC.get(k,A) for k in ks]+[(200,130,70)]))))
            L+=tops(spots(0.3*s,5),zp,ks);L+=herb(x-0.3*s,y+0.2*s,zp,s)
    elif t=='bread':   # パン：こんがりの焼き色。具を上に
        L.append(NT(P('おさら','cyl',(x,y,0.55*s,z,z+0.05*s),CER)));L.append(model('パン',K+'loaf.glb',x,y,z+0.05*s,s*0.78,rot=20,col=(196,116,50),k=0.5))
        kk=[k for k in ks if k!='komugiko'];L+=tops([(-0.08*s,-0.02*s),(0.08*s,0.02*s)],z+0.36*s,kk) if kk else []
    elif t=='cake':   # パンケーキ：やき色の面とクリームのよこ・バター・シロップ・具
        r=0.4*s;L.append(NT(P('おさら','cyl',(x,y,0.55*s,z,z+0.05*s),CER)));zz=z+0.05*s
        for q in range(3):L+=[NT(P('きじ%d'%q,'cyl',(x,y,r,zz,zz+0.075*s),(246,214,150))),NT(P('やき色%d'%q,'cyl',(x,y,r*0.97,zz+0.075*s,zz+0.09*s),(206,136,66)))];zz+=0.09*s
        sy=NT(P('シロップ','egg',(x,y,zz+0.005*s,r*0.8,r*0.75,0.012*s),(196,112,40)));sy.shiny=True;L.append(sy)
        L.append(NT(P('バター','box',(x-0.06*s,y-0.05*s,zz,x+0.06*s,y+0.05*s,zz+0.07*s),(252,232,140),bevel=0)))
        kk=[k for k in ks if k not in ('komugiko','egg','milk')];L+=tops([(0.2*s,0.12*s),(-0.18*s,0.15*s)],zz,kk) if kk else []
    elif t=='dango':   # だんご：やいたおもちの色に、材料のたれ（むぎは きなこ、ほかはみたらし）
        r=0.55*s;L.append(NT(P('おさら','cyl',(x,y,r,z,z+0.05*s),CER)))
        a=(x-0.48*s,y+0.06*s,z+0.14*s);b=(x+0.48*s,y-0.06*s,z+0.14*s);L.append(NT(P('くし','rope',(a,b,0.025*s),(214,176,120))))
        sauce=[k for k in ks if k in ('berry','apple','milk','mugi','tomato')]
        for q in range(3):
            u=0.28+0.24*q;px,py=a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u;k=sauce[q%len(sauce)] if sauce else None
            L.append(NT(P('たま%d'%q,'ball',(px,py,z+0.15*s,0.15*s),(244,228,196))))
            gc={'berry':(150,104,200),'apple':(236,128,112),'milk':(253,250,242),'mugi':(222,186,110),'tomato':(228,96,70)}.get(k,(196,124,52))
            g=NT(P('たれ%d'%q,'ball',(px,py,z+0.185*s,0.152*s,0.9),gc));g.shiny=k!='mugi';L.append(g)
    elif t=='skewer':   # くしやき：材料を焼き色にして、焼き目
        r=0.55*s;L.append(NT(P('おさら','cyl',(x,y,r,z,z+0.05*s),CER)))
        a=(x-0.5*s,y+0.06*s,z+0.14*s);b=(x+0.5*s,y-0.06*s,z+0.14*s);L.append(NT(P('くし','rope',(a,b,0.025*s),(214,176,120))))
        for q in range(3):
            u=0.25+0.25*q;px,py=a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u;k=ks[q%len(ks)]
            c=GRILLC.get(k) or tuple(int(v*0.82) for v in BASEC.get(k,A));L.append(NT(P('きれ%d'%q,'egg',(px,py,z+0.15*s,0.13*s,0.11*s,0.11*s),c)))
            L.append(NT(P('焼き目%d'%q,'box',(px-0.012*s,py-0.07*s,z+0.235*s,px+0.012*s,py+0.07*s,z+0.243*s),(150,92,48),bevel=0)))
    elif t=='sand':   # サンド：耳のある食パン・レタス・材料の具
        w,d=0.42*s,0.3*s;L.append(NT(P('おさら','cyl',(x,y,0.55*s,z,z+0.05*s),CER)));zz=z+0.05*s
        def bread(n,zb):return [NT(P(n+'耳','box',(x-w,y-d,zb,x+w,y+d,zb+0.07*s),(218,170,104),bevel=0)),NT(P(n,'box',(x-w+0.02*s,y-d+0.02*s,zb+0.069*s,x+w-0.02*s,y+d-0.02*s,zb+0.075*s),(248,232,196),bevel=0))]
        L+=bread('パン1',zz);zz+=0.075*s
        L.append(NT(P('レタス','box',(x-w-0.03*s,y-d-0.03*s,zz,x+w+0.03*s,y+d+0.03*s,zz+0.03*s),(150,206,96),bevel=0)));zz+=0.03*s
        for k in [k for k in ks if k!='komugiko'] or ['egg']:L.append(NT(P('具'+k,'box',(x-w+0.01*s,y-d+0.01*s,zz,x+w-0.01*s,y+d-0.01*s,zz+0.045*s),{'egg':(250,220,110),'tomato':(228,80,58)}.get(k,BASEC.get(k,A)),bevel=0)));zz+=0.045*s
        L+=bread('パン2',zz)
    return shine(vivid(L))

# ---- 道具（家具の場所で）
def tools_cooktable():
    zt=0.32;bc=(0.52,0.70);BA=math.radians(-14);ux,uy=math.cos(BA),math.sin(BA);A=(bc[0]-ux*0.30,bc[1]-uy*0.30,zt+0.015);B=(bc[0]+ux*0.30,bc[1]+uy*0.30,zt+0.015)
    board=[P('まな板','plate',(A,B,0.30,0.03),WOOD,grp='まな板'),P('まな板の取っ手','plate',((A[0]-ux*0.08,A[1]-uy*0.08,A[2]),A,0.12,0.03),WOOD,grp='まな板')]
    bx,by=0.75,0.67;tx,ty=0.53,0.82;Lb=math.hypot(tx-bx,ty-by);du,dv=(tx-bx)/Lb,(ty-by)/Lb;nu,nv=-dv,du;h=0.038
    shape=[(0,h),(0.62,h),(0.86,0.55*h),(1.0,0.25*h),(0.92,-0.25*h),(0.72,-0.75*h),(0.45,-h),(0,-h)]
    knife=[MT(NT(P('包丁の刃','prism',([(bx+du*Lb*u+nu*v,by+dv*Lb*u+nv*v) for u,v in shape],zt+0.03,zt+0.042,'z'),METAL))),NT(P('包丁の柄','plate',((bx,by,zt+0.041),(bx-du*0.13,by-dv*0.13,zt+0.041),0.05,0.022),(176,118,72)))]
    bowl=[bowlshape('ボウル',0.50,0.68,zt,0.15,0.09,CER)]
    pr,ph=0.08,0.22;pit=[NT(P('ピッチャー','lathe',(0.50,0.68,[(0,zt),(pr*0.9,zt),(pr,zt+ph*0.5),(pr*0.8,zt+ph*0.9),(pr*0.86,zt+ph),(pr*0.72,zt+ph),(pr*0.66,zt+0.02),(0,zt+0.02)]),CER,detail=28)),
        NT(P('ピッチャーの取っ手','tube',([(0.50+pr*0.9,0.68,zt+ph*0.8),(0.50+pr*1.6,0.68,zt+ph*0.7),(0.50+pr*1.6,0.68,zt+ph*0.3),(0.50+pr*0.95,0.68,zt+ph*0.22)],0.014),CER))]
    knead=[bowlshape('こねばち',0.46,0.66,zt,0.17,0.07,(214,170,112)),NT(P('めんぼう','log',((0.62,0.84,zt+0.025),(0.95,0.72,zt+0.025),0.025),(230,196,140)))]
    return {k_:shine(v) for k_,v in {'board':board,'boardk':board+knife,'bowl':bowl,'pitcher':pit,'knead':knead}.items()}
def pot(cx,cy,z0,r=0.12,h=0.12,soup=(226,196,150)):
    return [MT(NT(P('なべ','lathe',(cx,cy,[(0,z0),(r*0.9,z0),(r,z0+0.02),(r,z0+h),(r*0.92,z0+h),(r*0.92,z0+0.03),(0,z0+0.03)]),POTM,detail=32))),
            NT(P('スープ','cyl',(cx,cy,r*0.9,z0+0.03,z0+h*0.78),soup)),glint(cx,cy,z0+h*0.78,r*0.9),
            MT(NT(P('なべの耳1','box',(cx-r-0.03,cy-0.02,z0+h*0.8,cx-r+0.005,cy+0.02,z0+h*0.9),POTM,bevel=0))),MT(NT(P('なべの耳2','box',(cx+r-0.005,cy-0.02,z0+h*0.8,cx+r+0.03,cy+0.02,z0+h*0.9),POTM,bevel=0)))]
def pan(cx,cy,z0,r=0.11):
    return [MT(NT(P('フライパン','lathe',(cx,cy,[(0,z0),(r*0.85,z0),(r,z0+0.03),(r*0.92,z0+0.03),(r*0.8,z0+0.008),(0,z0+0.008)]),POTM,detail=32))),
            NT(P('フライパンの柄','plate',((cx+r*0.9,cy+r*0.3,z0+0.025),(cx+r*0.9+0.16,cy+r*0.3+0.06,z0+0.035),0.03,0.02),(176,118,72)))]
def tools_oven():
    y=0.86
    tray=[MT(NT(P('天板','box',(0.36,y-0.08,0.0,0.64,y+0.08,0.012),POTM,bevel=0)))]+[MT(NT(P('天板のふち%d'%q,'box',b,POTM,bevel=0))) for q,b in enumerate(((0.36,y-0.08,0.012,0.64,y-0.065,0.03),(0.36,y+0.065,0.012,0.64,y+0.08,0.03),(0.36,y-0.065,0.012,0.375,y+0.065,0.03),(0.625,y-0.065,0.012,0.64,y+0.065,0.03)))]
    return {k_:shine(v) for k_,v in {'pot':pot(0.50,y,0.0),'pan':pan(0.48,y,0.0),'tray':tray}.items()}
def tools_campfire():
    CX,CY=0.50,0.52;ap=(CX,CY,0.88);L=[]
    for q,a in enumerate((math.radians(205),math.radians(335),math.radians(90))):L.append(NT(P('三脚%d'%q,'rope',((CX+0.40*math.cos(a),CY+0.36*math.sin(a),0.0),ap,0.018),(196,150,104))))
    L.append(NT(P('つるすひも','rope',(ap,(CX,CY,0.47),0.008),(214,190,150))))
    L+=pot(CX,CY,0.33);L.append(MT(NT(P('つる','tube',([(CX-0.13,CY,0.44),(CX-0.08,CY,0.47),(CX+0.08,CY,0.47),(CX+0.13,CY,0.44)],0.008),POTM))))
    net=[]
    for q in range(7):net.append(MT(NT(P('網のよこ%d'%q,'box',(CX-0.24,CY-0.17+q*0.055,0.125,CX+0.24,CY-0.17+q*0.055+0.012,0.135),POTM,bevel=0))))
    for q in range(9):net.append(MT(NT(P('網のたて%d'%q,'box',(CX-0.24+q*0.058,CY-0.17,0.135,CX-0.24+q*0.058+0.012,CY+0.17,0.145),POTM,bevel=0))))
    return {'pot':shine(L),'net':shine(net)}
TOOLS={'cooktable':tools_cooktable,'oven':tools_oven,'campfire':tools_campfire}
# 材料・料理を置く場所（家具の3Dの中の点）。材料は3つ（入れた順）。L/S/K は材料の絵の大きさ
SLOTS={'cooktable':{'L':[(0.20,0.42,0.32),(0.80,0.42,0.32),(0.50,0.38,0.32)],'D':[(0.50,0.62,0.32)]},
       'oven':{'pot':[(0.45,0.85,0.09),(0.55,0.86,0.09),(0.50,0.89,0.09)],'pan':[(0.44,0.85,0.012),(0.53,0.86,0.012),(0.49,0.89,0.012)],'tray':[(0.43,0.85,0.012),(0.57,0.86,0.012),(0.50,0.89,0.012)],'D':[(0.50,0.95,0.0)]},
       'campfire':{'pot':[(0.45,0.51,0.42),(0.55,0.52,0.42),(0.50,0.55,0.42)],'net':[(0.38,0.50,0.145),(0.62,0.50,0.145),(0.50,0.58,0.145)],'K':[(0.32,0.72,0.02),(0.68,0.72,0.02),(0.50,0.78,0.02)],'D':[(0.50,0.87,0.13)]}}
SIZE={'L':0.26,'S':0.143,'K':0.39,'D':0.39}   # 食べ物の大きさ（よこのはば、マス）
VIEWK={'cooktable':[0,1,2,3],'oven':[0],'campfire':[0]}   # クォータービューは反転しないので、調理台は4つの向き。かまどは口の見える前向きだけ

_scene=F.scene
F.scene=lambda M,k,only=None,filt=None,foot=None:_scene(M,k,only,filt,foot if foot is not None else getattr(M,'FOOT',None))   # まわす中心は、家具だけの床の範囲（道具がはみ出しても、ずれない）
def furn_module(fid):
    M=importlib.import_module(fid);M.FR=0;base=M.PARTS
    if not hasattr(M,'_BASE'):M._BASE=base
    if hasattr(M,'ELEV'):M.ELEV=iso3d.ISOLIGHT   # 家具のチップと同じ（iso3d.py の run_item）
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
            D['Dz']=SLOTS[fid]['D'][0][2]   # できた料理の場所の高さ（だん）。ゲームは、D とこの高さから、せかいの地面の点をもとめる（湯気を出す所）
        M.PARTS=M._BASE

class _Solo:   # 食べ物も、木の幹と同じかげの付け方。小さいので、かげをこく・あみを広く（持ち主がえらんだ）
    GRAD=True;BOTTOM=0;TREESHADE=True
    TREET=([(-0.25,-0.05),(0.20,0.40),(0.58,0.74),(0.82,0.94)],[(-36,12),(-20,6),0,(14,-8),(28,-16)])
def solo(parts):   # 1つだけ写す。足もとの点 (0,0,0) をマスの点にした ax・ay
    M=_Solo();M.PARTS=lambda:parts;O.GRAD=True;inf={};im=F.shot(M,0,info=inf)[0];bb=im.getbbox();u,v=inf['PROJ'](inf['fwd']((0,0,0)))
    px,py=(u-inf['ext'][0])*inf['S'],(v-inf['ext'][2])*inf['S'];return im.crop(bb),round(bb[0]-px),round(bb[1]-py)
def gen_ings(res):
    for k in INGS:
        for sz in('L','S'):im,x,y=solo(ing(k,0,0,0,SIZE[sz]));res['ckin_%s.%s'%(k,sz)]=(im,x,y)
        im,x,y=solo(skewer(k,0,0,0,SIZE['K']));res['ckin_%s.K'%k]=(im,x,y);print('材料',k)
def gen_dishes(res,only=None):   # only：その料理だけ（--dish。料理を足したとき、ほかの絵を写しなおさない）
    js=open(os.path.join(ROOT,'js','cook-table.js'),encoding='utf8').read();L=json.loads('['+js[js.index('['):].split('];')[0].strip()[1:]+']')
    for D in L+[{'id':'fsg'}]:
        if only and D['id'] not in only:continue
        out=D['id'];ic=D.get('ic') or ORIG.get(out)
        im,x,y=solo(dish(out,ic,D.get('i',[]),0,0,0,SIZE['D']));res['ckdish_'+out]=(im,x,y)
    print('料理',len(L)+1)
def write_js(data):
    s='/* 料理の家具の上にかさねる絵の場所（tools/art/furn3d/cooktop.py で書いた）。CKTOP[家具][向き]：L/S/pot/pan/tray/net/K は材料を置く3つの場所、D はできた料理の場所。どれも g64 のドット、家具を置いたマスのまん中の地面の点（クォータービューの絵の足もと）から。Dz は D の高さ（だん） */\nconst CKTOP='+json.dumps(data,separators=(',',':'))+';\n'
    open(os.path.join(ROOT,'js','cook-top-data.js'),'w',encoding='utf8').write(s)
def main():
    out=sys.argv[1];os.makedirs(out,exist_ok=True);chips='--chips' in sys.argv
    sys.path.insert(0,os.path.join(ROOT,'tools'));import chips as CHP
    head,CC=CHP.load_imgs();res={};data={}
    only=sys.argv[sys.argv.index('--dish')+1].split(',') if '--dish' in sys.argv else None
    if only:gen_dishes(res,only)
    else:gen_tools(out,CC,res,data);gen_ings(res);gen_dishes(res);write_js(data)
    for nm,(im,x,y) in res.items():im.save(os.path.join(out,nm.replace('>','_')+'.png'))
    json.dump({nm:[x,y] for nm,(im,x,y) in res.items()},open(os.path.join(out,'meta.json'),'w'))
    # たしかめ：家具ごとに、道具と材料と料理をかさねた絵
    if chips:
        for nm,(im,x,y) in res.items():CC[nm]={'g':64,'ax':x,'ay':y,'w':im.width,'h':im.height,'f':[im]}|({'iso':1} if nm.startswith('cktool_') else {})   # 道具は家具と同じ足もとから（材料・料理は、ゲームが CKTOP の場所に描く）
        CHP.pack_imgs(head,CC);open(os.path.join(ROOT,'.chips_changed'),'w').write('\n'.join(res));print('チップに入れた',len(res))
if __name__=='__main__':main()
