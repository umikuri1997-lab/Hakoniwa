# クォータービューの家の屋根のタイルセット：屋根の部品を3Dで組んで、マスごとの完成したチップに写す（壁の iso_conn.py と同じ写し方・切り方）。
# 使い方：python3 tools/art/iso/iso_roof.py <出力フォルダ> [--chips]
# ゲーム（js/iso-conn.js）は、マスごとにチップをえらんで、列ごとに奥から順に置くだけ（かさねる計算・色の計算はしない。持ち主がきめた）。
#
# 屋根の作り（持ち主がえらんだ：うでごとの切妻＋谷）
#   家の形（壁と中のマス）を、いちばん大きな長方形（うで）に分け、うでごとに切妻。棟はうでの長いほうの向き（正方形は東西）。
#   2つのうでがかさなって同じ棟の向きになるときは、小さいほうを直角にする（クロスゲーブル）。勾配はどのうでも同じ K。
#   低いほう（同じ高さなら小さいほう）のうでは、高いうでの棟の所で止める（とおすと、棟が外の壁までとび出す）。
#   のき（棟とならぶふち）は、壁のまん中の線から OVR 外（壁の外の面 0.15 ＋ のきの出 0.22）。屋根の下の面は、壁の外の面で壁のてっぺんにのる
#   （屋根の上の面の高さは、壁のまん中の線で Z0）。けらば（妻のがわのふち）も OVR 出す。
#   マスの部品は、うでの中の場所できまり、棟までのきょり×K の高さだけ上にずらして置く。
#   2つのうでがかさなるマスで、両方が見えるとき（谷・棟がぶつかる所）は、2つの部品を3Dでいっしょに組んで写した1まい（谷のチップ）。
#   どの組み合わせが出るかは、この道具が、L字・T字・十字の家をぜんぶためして数える（cells。ゲームの iqRoofCells と同じ）。
#
# チップ（g64。ax・ay はマスのまん中の地面の点。高さ0は、ずらす前の高さ）
#   屋根：iso:roof-<色>:<o>-<t>-<e>（谷は iso:roof-<色>:x-<部品1>+<部品2>、部品は <o>-<t>-<e>-<高さのちがい（K/2 の数）>）
#     色：d もとの色・k 火山・red・blue・green・brown（ゲームの屋根の色 ROOFCOL）
#     o：h 棟が東西（坂は南北）・v 棟が南北（坂は東西。h を、x と y をいれかえて組む）
#     t（h のとき y にそった切り口）：up 0〜1 で K*y（北むき。ずらすのは北のふちの高さ）・dn 0〜1 で K*(1-y)（南むき。南のふちの高さ）・
#       dnc dn の北のふちに棟がわら・tent まん中に棟（ずらすのは、ふちの高さ）・upe 北ののき・dne 南ののき・dnec dne の北のふちに棟がわら・fl 平ら（はば1のうで）
#     e（棟の向きにそって）：m まん中・a 西（北）のはし（けらば）・b 東（南）のはし（けらば）・l はんぶん（0.5〜1）・r はんぶん（0〜0.5）
#   雪：iso:roofsn:<部品>-<a|f>（a 少しつもった雪のかたまり・f つもりきった。屋根の色にかかわらず白。屋根の上にかさねる）
#   妻（三角の壁）：iso:<壁>:gab-<o>-<t>-<p>：h のうでの東のはし（x=0.65 の面、東むき）・v のうでの南のはし（y=0.65、南むき）。
#     t：up・dn・tent・upe・dne・fl（屋根の下の面まで）と blk（高さ K/2 の四角。下につむ）。p：かべの絵のもようの高さのずれ（0・1 → 0・K/2）。
#   瓦の列：のきから 0.2 ごとの線（どの部品も、y=0.1+0.2k）。
import sys,os,math,json
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(HERE,'..');ROOT=os.path.join(ART,'..','..')
for p in(ART,HERE,os.path.join(ROOT,'tools')):sys.path.insert(0,p)
import numpy as np
from PIL import Image
import oblique3d as O
import iso_conn as IC
from blueprint import Part,build
S=IC.S
K=0.5          # 勾配：水平に1マスで、高さ0.5だん（ゲームの IQROOFK）
OVR=0.37       # のき・けらばのふち：壁のまん中の線から（壁の外の面0.15＋のきの出0.22）
TH=0.05        # 屋根のあつみ（だん）
Z0=TH+K*0.15   # 壁のまん中の線での、屋根の上の面の高さ（屋根の下の面が、壁の外の面で、壁のてっぺんにのる）
COLS={'d':'#a86858','k':'#3d3f48','red':'#b0584c','blue':'#5a78a0','green':'#6a9058','brown':'#7a5238'}   # 屋根の色（ゲームの ROOFCOL と、もとの色・火山の色）
TONE={'n':1.06,'s':0.94,'w':1.0,'e':0.82}   # 坂の向きの明るさ（光は左上）
EDGE,LINE,CAP=0.72,0.72,0.66               # のき・けらばのあつみ・瓦の列の線・棟がわら
TYPES=['up','dn','dnc','tent','upe','dne','dnec','fl']
ENDS=['m','a','b','l','r']
GTYPES=['up','dn','tent','upe','dne','fl','blk']
EXT=0.45   # 部品を、となりのマスへのばす長さ（写したあと、マスの中だけのこす。マスのさかいに線を出さない）
def prof(t):
    """切り口：(y0, y1, 上の面の高さ z(y)（Z0 をのぞく）, 棟がわらの y（なければ None）, 折れる所)。マスの外へは、となりのマスの部品と同じ形でのばす"""
    if t=='up':return -EXT,1+EXT,lambda y:K*y,None,()
    if t=='dn':return -EXT,1+EXT,lambda y:K*(1-y),None,()
    if t=='dnc':return -EXT,1+EXT,lambda y:K*(1-abs(y)),0.0,(0.0,)
    if t=='tent':return -EXT,1+EXT,lambda y:K*(0.5-abs(y-0.5)),0.5,(0.5,)
    if t=='upe':return 0.5-OVR,1+EXT,lambda y:K*(y-0.5),None,()
    if t=='dne':return -EXT,0.5+OVR,lambda y:K*(0.5-y),None,()
    if t=='dnec':return -EXT,0.5+OVR,lambda y:K*(0.5-abs(y)),0.0,(0.0,)
    if t=='fl':return 0.5-OVR,0.5+OVR,lambda y:0.0,None,()
def xr(e):
    return{'m':(-EXT,1+EXT),'a':(0.5-OVR,1+EXT),'b':(-EXT,0.5+OVR),'l':(0.5,1+EXT),'r':(-EXT,0.5)}[e]
def frame(px0,py0,wp,hp):
    IC.PX0,IC.PY0,IC.WP,IC.HP,IC.OWN=px0,py0,wp,hp,(0,1,0,1)
    IC.EXTS=(0.5-px0/S,0.5+(wp-px0)/S,0.5-py0/S,0.5+(hp-py0)/S)
def render(parts,key=None,outer=True):
    """parts：[(Part, 色の関数)]。マスの中（0〜1）の面のドットだけのこす（壁と同じ）。key：この色のドットを透明にする（雪の絵）"""
    sc=O.Scene();sc.material('flat')
    for p,f in parts:sc.decal(f);build(sc,[p]);sc.decal(None)
    sc.material(None)
    sc.t=[(IC.rot(a),IC.rot(b),IC.rot(c),col,pid) for a,b,c,col,pid in sc.t]
    sc.dc={pid:(lambda f:(lambda x,y,z:f(*IC.unrot(x,y),z)))(f) for pid,f in sc.dc.items()}
    O.S=S;im=O.render_px(sc,IC.PROJ,IC.EXTS,IC.DEPTH,k=0.86,lw=1,k2=0.93,merge=0,outer=outer)
    im=IC.own_mask(im)
    if key:   # 雪のない所（あざやかな紫）と、そのふちの線を、透明に
        a=np.array(im);r,g,b_=[a[...,i].astype(int) for i in range(3)];m=(r-g>40)&(b_-g>40);a[m]=0;im=Image.fromarray(a)
    return im
def sw(o,x,y,z):return (x,y,z) if o=='h' else (y,x,z)   # v は h の x と y をいれかえる
def hexrgb(h):n=int(h[1:],16);return np.array([n>>16,n>>8&255,n&255],float)
def snowf(x,y,lv,o):
    """雪：a は、少しつもったかたまり（場所のむら）、f はぜんぶ"""
    if lv=='f':return True
    sd=0 if lv=='a' else 7.3
    v=math.sin(x*7.1+sd)*math.sin(y*6.3+sd*0.7)+0.6*math.sin((x+y)*11.7+sd*1.9)+0.4*math.sin((x-y)*9.1+sd*2.3)
    return v>0.55
def roof_parts(o,t,e,col='d',dz=0.0,snow=None):
    """1つの部品（col：屋根の色、dz：上にずらす高さ（だん）、snow：雪の絵（a・b・f））"""
    y0,y1,zf,cap,kink=prof(t);x0,x1=xr(e);base=hexrgb(COLS[col])
    ys=sorted({y0,y1}|set(kink))
    top=[(y,dz+Z0+zf(y)) for y in ys];bot=[(y,z-TH) for y,z in reversed(top)]
    def tone(y):
        if t=='fl':return TONE['n' if o=='h' else 'w']
        up=(zf(min(y1,y+1e-3))-zf(max(y0,y-1e-3)))>0   # y がふえると高くなる＝北（西）むき
        return TONE[('n' if up else 's') if o=='h' else ('w' if up else 'e')]
    KEY=(255,0,255)
    def deco(x,y,z):
        X,Y,_=sw(o,x,y,z)   # h の向きの場所
        zt=dz+Z0+zf(min(y1,max(y0,Y)))
        top_=abs(z-zt)<2e-3 and y0+1e-4<Y<y1-1e-4
        if snow:
            if not top_ or not snowf(x,y,snow,o):return KEY
            k=tone(Y);return tuple(np.clip(np.array([250,252,255])*min(1.0,0.9+0.1*k),0,255))
        if top_:
            k=tone(Y)
            if ((Y-0.1)/0.2)%1<0.12 or ((Y-0.1)/0.2)%1>0.97:k*=LINE/0.94
        else:k=EDGE
        return tuple(np.clip(base*k,0,255))
    pts=[(y,z) for y,z in top]+bot
    P=[(Part('屋根','prism',(pts,x0,x1,'x') if o=='h' else ([(a,b) for a,b in pts],x0,x1,'y'),(200,200,200),grp='r'),deco)]
    if cap is not None:   # 棟がわら：棟の上の、はば0.08・高さ0.04の角材
        zc=dz+Z0+zf(cap)
        d=(x0,cap-0.04,zc-0.01,x1,cap+0.04,zc+0.04) if o=='h' else (cap-0.04,x0,zc-0.01,cap+0.04,x1,zc+0.04)
        cc=(lambda x,y,z:(255,0,255)) if snow and snow!='f' else (lambda x,y,z:(240,244,250)) if snow else (lambda x,y,z:tuple(np.clip(base*CAP,0,255)))
        P.append((Part('棟がわら','box',d,(200,200,200),grp='c'),cc))
    return P
def gable_parts(o,t,p,front,wall):
    """妻：h は x 0.63〜0.65 の板（東むき）、v は y 0.63〜0.65（南むき）。下は0（壁のてっぺん）。板は、となりのマスまでのばして写す（マスのさかいに線を出さない）"""
    ph=p*K/2
    if t=='blk':y0,y1,zt=-EXT,1+EXT,(lambda y:K/2)
    else:
        _,_,zf,_,_=prof(t);zt=lambda y,zf=zf:Z0+zf(y)-TH   # 屋根の下の面まで
        y0,y1={'upe':(0.35,1+EXT),'dne':(-EXT,0.65),'fl':(0.35,0.65)}.get(t,(-EXT,1+EXT))   # のきの行は、壁の外の面まで
    n=96;ys=np.linspace(y0,y1,n+1);top=[(y,max(0.0,zt(y))) for y in ys]
    if max(z for _,z in top)<=1e-4:return []
    pts=top+[(y1,0.0),(y0,0.0)]
    k=IC.FACE[2] if o=='h' else IC.FACE[1]
    def deco(x,y,z):
        U=y if o=='h' else x;za=ph+z
        r=16+int(((-za)%0.5)*64);c=front[min(63,max(0,r)),math.floor(U*64)%64]*k
        return tuple(np.clip(c,0,255))
    d=(pts,0.63,0.65,'x') if o=='h' else ([(a,b) for a,b in pts],0.63,0.65,'y')
    return [(Part('妻','prism',d,(200,200,200),grp='g'),deco)]
def crop(im):
    bb=im.getbbox()
    if not bb:return None
    return im.crop(bb),IC.PX0-bb[0],IC.PY0-bb[1],bb
# ---- 家の形 → マスごとの部品（ゲームの iqRoofCells と同じ。かえるときは両方） ----
def rects(F):
    """家の形の中の、いちばん大きな長方形ぜんぶ（[x0,y0,x1,y1]、両はしをふくむ）"""
    xs=[x for x,y in F];ys=[y for x,y in F];X0,X1,Y0,Y1=min(xs),max(xs),min(ys),max(ys)
    full=lambda a,b,c,d:all((x,y) in F for x in range(a,c+1) for y in range(b,d+1))
    R=[]
    for b in range(Y0,Y1+1):
        for a in range(X0,X1+1):
            if (a,b) not in F:continue
            for d in range(b,Y1+1):
                if not full(a,b,a,d):break
                for c in range(a,X1+1):
                    if not full(a,b,c,d):break
                    if full(a-1,b,c,d) or full(a,b,c+1,d) or full(a,b-1,c,d) or full(a,b,c,d+1):continue
                    R.append((a,b,c,d))
    return R
def wings(F):
    """うで：棟の向き ew（長いほう。正方形は東西）。かさなる2つのうでが同じ向きなら、小さいほうを直角に（クロスゲーブル）"""
    W_=[]
    for a,b,c,d in rects(F):W_.append(dict(a=a,b=b,c=c,d=d,ew=c-a>=d-b,ar=(c-a+1)*(d-b+1)))
    ov=lambda p,q:not(p['c']<q['a'] or q['c']<p['a'] or p['d']<q['b'] or q['d']<p['b'])
    for i,p in enumerate(W_):
        for q in W_[:i]:
            if ov(p,q) and p['ew']==q['ew']:
                sm=p if p['ar']<q['ar'] else q;sm['ew']=not sm['ew']   # 同じ大きさなら、先のほう（ゲームと同じ）
    for r in W_:
        n=r['d']-r['b']+1 if r['ew'] else r['c']-r['a']+1;r['n']=n;r['m']=(r['b']+r['d']+1)/2 if r['ew'] else (r['a']+r['c']+1)/2;r['D']=(n-1)/2
    return W_
def pri(p,q):return (p['D'],p['ar'],p['ew'])>(q['D'],q['ar'],q['ew'])
def cells(F):
    """{(x,y):[(o,t,e,z)]}（z：ずらす高さ、だん）と、妻 [(x,y,o,t,z)]（t の z はその行のふちの高さ）"""
    R=wings(F);out={};gab=[]
    for r in R:
        U0,U1,V0,V1=(r['a'],r['c'],r['b'],r['d']) if r['ew'] else (r['b'],r['d'],r['a'],r['c']);o='h' if r['ew'] else 'v'
        lo,hi,cl,ch=U0,U1,None,None
        for q in R:
            if q is r or q['ew']==r['ew'] or not pri(q,r):continue
            qa,qc,qv0,qv1=(q['a'],q['c'],q['b'],q['d']) if r['ew'] else (q['b'],q['d'],q['a'],q['c'])
            if qv1<V0 or qv0>V1 or qc<U0 or qa>U1:continue
            mq=q['m']
            if U0<qa and U1<=qc:   # 高いうでの、u の小さいがわ：その棟まで
                if mq%1==0:hi=min(hi,int(mq)-1)
                else:hi=min(hi,int(mq-0.5));ch=int(mq-0.5)
            elif U1>qc and U0>=qa:
                if mq%1==0:lo=max(lo,int(mq))
                else:lo=max(lo,int(mq-0.5));cl=int(mq-0.5)
        hv=lambda v:K*(r['D']-abs(v-r['m']))
        for v in range(V0,V1+1):
            if r['n']==1:t,z='fl',0.0
            elif v==V0:t,z='upe',0.0
            elif v==V1:t,z=('dnec' if r['n']==2 else 'dne'),0.0
            elif r['m']==v+0.5:t,z='tent',hv(v)
            elif r['m']==v:t,z='dnc',hv(v+1)
            elif v+1<=r['m']:t,z='up',hv(v)
            else:t,z='dn',hv(v+1)
            for u in range(lo,hi+1):
                e='l' if u==cl else 'r' if u==ch else 'a' if u==U0==lo else 'b' if u==U1==hi else 'm'
                cx,cy=(u,v) if r['ew'] else (v,u)
                out.setdefault((cx,cy),[]).append((o,t,e,z))
            if hi==U1:gab.append(((U1,v) if r['ew'] else (v,U1),o,{'dnc':'dn','dnec':'dne'}.get(t,t),z))
    return out,gab
def hgt(p,x,y):
    """部品 p の、マスの中の点 (x,y) の屋根の上の面の高さ（なければ None）"""
    o,t,e,z=p;y0,y1,f=prof(t)[:3];X,Y=(x,y) if o=='h' else (y,x);x0,x1=xr(e)
    if not(y0<=Y<=y1 and x0<=X<=x1):return None
    return z+f(Y)
SAMP=[(i/8+1/16,j/8+1/16) for i in range(8) for j in range(8)]
def pick(ps):
    """2つ以上のうでがかさなるマス：見える部品が1つなら (その部品, None)、2つ以上なら (None, 谷のチップの名前)"""
    win=set()
    for x,y in SAMP:
        hs=[(hgt(p,x,y),k) for k,p in enumerate(ps)];hs=[h for h in hs if h[0] is not None]
        if hs:win.add(max(hs)[1])
    if len(win)<=1:return ps[min(win) if win else 0],None
    vs=[ps[k] for k in sorted(win)];zm=min(p[3] for p in vs)
    return None,'x-'+'+'.join(sorted('%s-%s-%s-%d'%(p[0],p[1],p[2],round((p[3]-zm)/(K/2))) for p in vs))
def junctions():
    """L字・T字の家（うでのはば3〜7・長さ〜9）で出る、谷のチップの名前ぜんぶ。これより大きい家・ほかの形で、ない組み合わせのマスは、
    ゲームが2つの部品を、低いほうから順に置く"""
    J=set();shapes=set()
    for n1 in range(3,8):
        for n2 in range(3,8):
            for L1 in range(n2,10):
                for L2 in range(n1,10):
                    A={(x,y) for x in range(L1) for y in range(n1)}
                    for o in sorted({0,(L1-n2)//2,L1-n2}):shapes.add(frozenset(A|{(x,y) for x in range(o,o+n2) for y in range(L2)}))   # L（西・東）・T
    for F in shapes:
        cs,_=cells(F)
        for ps in cs.values():
            if len(ps)>1:
                _,k=pick(ps)
                if k:J.add(k)
    return sorted(J)
def jparts(k,col,snow=None):
    P=[]
    for q in k[2:].split('+'):
        o,t,e,d=q.split('-');P+=roof_parts(o,t,e,col,int(d)*K/2,snow)
    return P
def build_all(out):
    frame(140,120,280,220);res={}
    pieces=['%s-%s-%s'%(o,t,e) for o in('h','v') for t in TYPES for e in ENDS]
    J=junctions();print('junctions',len(J),flush=True)
    for col in COLS:
        for k in pieces+J:
            P=jparts(k,col) if k.startswith('x-') else roof_parts(*k.split('-'),col)
            c=crop(render(P))
            if c:res['iso:roof-%s:%s'%(col,k)]=c[:3]
        print('roof',col,flush=True)
    for k in pieces+J:
        for lv in('a','f'):
            P=jparts(k,'d',lv) if k.startswith('x-') else roof_parts(*k.split('-'),'d',0.0,lv)
            c=crop(render(P,key=True))
            if c:res['iso:roofsn:%s-%s'%(k,lv)]=c[:3]
    print('snow',flush=True)
    C=IC.chipsrc()
    for wall in IC.WALLS:
        top,front=IC.wall_tex(C,wall)
        for o in('h','v'):
            for t in GTYPES:
                for p in(0,1):
                    P=gable_parts(o,t,p,front,wall)
                    if not P:continue
                    c=crop(render(P,outer=False))
                    if c:res['iso:%s:gab-%s-%s-%d'%(wall,o,t,p)]=c[:3]
        print('gable',wall,flush=True)
    for k,(im,ax,ay) in res.items():im.save(os.path.join(out,k.replace(':','_').replace('+','_')+'.png'))
    json.dump({'junctions':J,'chips':{k:[ax,ay,im.width,im.height] for k,(im,ax,ay) in res.items()}},open(os.path.join(out,'_info.json'),'w'))
    return res
if __name__=='__main__':
    a=[q for q in sys.argv[1:] if not q.startswith('--')];out=a[0];os.makedirs(out,exist_ok=True)
    res=build_all(out)
    if '--chips' in sys.argv:IC.to_chips(res)
