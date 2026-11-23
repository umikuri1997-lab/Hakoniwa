# クォータービューの家の屋根のタイルセット：屋根の部品を3Dで組んで、マスごとのチップに写す（壁の iso_conn.py と同じ写し方）。
# 使い方：python3 tools/art/iso/iso_roof.py <出力フォルダ> [--chips]
#
# 屋根の作り（持ち主がえらんだ：うでごとの切妻＋谷、タイルセットで）
#   家の形を長方形のうでに分け、うでごとに切妻。棟はうでの長いほうの向き（正方形は東西）。勾配はどのうでも同じ K。
#   のき（棟とならぶふち）は、壁のまん中の線から OVR 外（壁の外の面 0.15 ＋ のきの出 0.22）。屋根の下の面は、壁の外の面で壁のてっぺんにのる
#   （屋根の上の面の高さは、壁のまん中の線で Z0）。けらば（妻のがわのふち）も OVR 出す。
#   ゲーム（js/iso-conn.js）は、マスごとに部品をえらび、その高さ（棟までのきょり×K）だけ上にずらしてならべる。
#   2つのうでがかさなるマスは、部品ごとの奥行きの絵（カメラに近いほど明るい）で、近いほうをのこす（谷ができる）。
#   低いほう（同じ高さなら小さいほう）のうでは、高いうでの棟の所で止める（ゲームが、はんぶんの部品をえらぶ）。
#
# 部品（チップ iso:roof:<o>-<t>-<e>、奥行き iso:roofz:<o>-<t>-<e>。g64。ax・ay はマスのまん中の地面の点。高さ0は、ずらす前の高さ）
#   o：h 棟が東西（坂は南北）・v 棟が南北（坂は東西。h を、x と y をいれかえて組む）
#   t（坂の向きの切り口。h のとき y にそって）：
#     up  0〜1 で K*y（北むきの坂。ずらすのは北のふちの高さ）    dn  0〜1 で K*(1-y)（南むき。南のふちの高さ）
#     dnc dn の北のふちに棟がわら（うでの奥行きが2の倍数）       tent 0〜1 で K*(0.5-|y-0.5|)（まん中に棟がわら）
#     upe 北ののき（0.5-OVR〜1 で K*(y-0.5)）                    dne 南ののき（0〜0.5+OVR で K*(0.5-y)）
#     dnec dne の北のふちに棟がわら（奥行き2のうで）              fl  平ら（はば1のうで。0.5-OVR〜0.5+OVR）
#   e（棟の向きにそって）：m まん中（0〜1）・a 西（北）のはし（けらば：0.5-OVR から）・b 東（南）のはし（0.5+OVR まで）・
#     l はんぶん（0.5〜1。高いうでの棟が西（北）にあるとき）・r はんぶん（0〜0.5）
#   瓦の列：のきから IQRROW ごとの線（どの部品も、y=0.1+0.2k）。色は灰色で写し、ゲームが屋根の色をかける（かけ算）。
# 妻（三角の壁。チップ iso:<壁>:gab-<o>-<t>-<p>）：h のうでの東のはし（x=0.65 の面、東むき）・v のうでの南のはし（y=0.65、南むき）。
#   t：up・dn・tent・upe・dne・fl（屋根の下の面まで）と blk（高さ K/2 の四角。下につむ）。p：かべの絵のもようの高さのずれ（0・1 → 0・K/2）。
#   面の絵は壁（iso_conn.py の wall_tex）と同じ。奥行きはゲームが面の式で出す（x=0.65 の面）。
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
G=200          # 灰色のもと（ゲームが屋根の色をかける。200 が、もとの色）
TONE={'n':1.06,'s':0.94,'w':1.0,'e':0.82}   # 坂の向きの明るさ（光は左上）
EDGE,LINE,CAP=0.72,0.72,0.66               # のき・けらばのあつみ・瓦の列の線・棟がわら
TYPES=['up','dn','dnc','tent','upe','dne','dnec','fl']
ENDS=['m','a','b','l','r']
GTYPES=['up','dn','tent','upe','dne','fl','blk']
def prof(t):
    """切り口：(y0, y1, 上の面の高さ z(y)（Z0 をのぞく）, 棟がわらの y（なければ None）)"""
    if t=='up':return 0.0,1.0,lambda y:K*y,None
    if t in('dn','dnc'):return 0.0,1.0,lambda y:K*(1-y),(0.0 if t=='dnc' else None)
    if t=='tent':return 0.0,1.0,lambda y:K*(0.5-abs(y-0.5)),0.5
    if t=='upe':return 0.5-OVR,1.0,lambda y:K*(y-0.5),None
    if t in('dne','dnec'):return 0.0,0.5+OVR,lambda y:K*(0.5-y),(0.0 if t=='dnec' else None)
    if t=='fl':return 0.5-OVR,0.5+OVR,lambda y:0.0,None
def xr(e):
    return{'m':(-0.003,1.003),'a':(0.5-OVR,1.003),'b':(-0.003,0.5+OVR),'l':(0.5,1.003),'r':(-0.003,0.5)}[e]
def frame(px0,py0,wp,hp):
    IC.PX0,IC.PY0,IC.WP,IC.HP,IC.OWN=px0,py0,wp,hp,(0,1,0,1)
    IC.EXTS=(0.5-px0/S,0.5+(wp-px0)/S,0.5-py0/S,0.5+(hp-py0)/S)
def render(parts):
    """parts：[(Part, 色の関数)]。マスの中にかぎらず、ぜんぶのこす（となりの部品とは、ゲームが奥行きでかさねる）。もどすのは 絵・奥行き（x+y）"""
    sc=O.Scene();sc.material('flat')
    for p,f in parts:sc.decal(f);build(sc,[p]);sc.decal(None)
    sc.material(None)
    sc.t=[(IC.rot(a),IC.rot(b),IC.rot(c),col,pid) for a,b,c,col,pid in sc.t]
    sc.dc={pid:(lambda f:(lambda x,y,z:f(*IC.unrot(x,y),z)))(f) for pid,f in sc.dc.items()}
    O.S=S;im=O.render_px(sc,IC.PROJ,IC.EXTS,IC.DEPTH,k=0.86,lw=1,k2=0.93,merge=0)
    zb=O.LAST_ZB.copy();obj=zb>-1e8;wx,wy=IC.world_of(np.where(obj,zb,0))
    return im,np.where(obj,wx+wy,np.nan)
def sw(o,x,y,z):return (x,y,z) if o=='h' else (y,x,z)   # v は h の x と y をいれかえる
def roof_parts(o,t,e):
    y0,y1,zf,cap=prof(t);x0,x1=xr(e)
    ys=sorted({y0,y1}|({0.5} if t in('tent',) else set()))
    top=[(y,Z0+zf(y)) for y in ys];bot=[(y,z-TH) for y,z in reversed(top)]
    def tone(y):
        if t=='fl':return TONE['n' if o=='h' else 'w']
        up=(zf(min(y1,y+1e-3))-zf(max(y0,y-1e-3)))>0   # y がふえると高くなる＝北（西）むき
        return TONE[('n' if up else 's') if o=='h' else ('w' if up else 'e')]
    def deco(x,y,z):
        X,Y,_=sw(o,x,y,z)   # h の向きの場所
        zt=Z0+zf(min(y1,max(y0,Y)))
        if abs(z-zt)<2e-3 and y0+1e-4<Y<y1-1e-4:
            k=tone(Y)
            if ((Y-0.1)/0.2)%1<0.12 or ((Y-0.1)/0.2)%1>0.97:k*=LINE/0.94
        else:k=EDGE
        return (G*k,)*3
    pts=[(y,z) for y,z in top]+bot
    P=[(Part('屋根','prism',(pts,x0,x1,'x') if o=='h' else ([(a,b) for a,b in pts],x0,x1,'y'),(200,200,200),grp='r'),deco)]
    if cap is not None:   # 棟がわら：棟の上の、はば0.08・高さ0.04の角材
        zc=Z0+zf(cap)
        d=(x0,cap-0.04,zc-0.01,x1,cap+0.04,zc+0.04) if o=='h' else (cap-0.04,x0,zc-0.01,cap+0.04,x1,zc+0.04)
        P.append((Part('棟がわら','box',d,(200,200,200),grp='c'),lambda x,y,z:(G*CAP,)*3))
    return P
def gable_parts(o,t,p,front,wall):
    """妻：h は x 0.63〜0.65 の板（東むき）、v は y 0.63〜0.65（南むき）。下は0（壁のてっぺん）"""
    ph=p*K/2
    if t=='blk':y0,y1,zt=0.0,1.0,(lambda y:K/2)
    else:
        _,_,zf,_=prof(t);zt=lambda y,zf=zf:Z0+zf(y)-TH   # 屋根の下の面まで
        y0,y1={'upe':(0.35,1.0),'dne':(0.0,0.65),'fl':(0.35,0.65)}.get(t,(0.0,1.0))   # のきの行は、壁の外の面まで
    n=48;ys=np.linspace(y0,y1,n+1);top=[(y,max(0.0,zt(y))) for y in ys]
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
def depth_img(D,bb):
    """奥行き（x+y、-0.5〜2.5）を、灰色の明るさに（0〜255）。形の外は透明"""
    a=D[bb[1]:bb[3],bb[0]:bb[2]];ok=~np.isnan(a);v=np.clip(np.round((np.nan_to_num(a)+0.5)/3*255),0,255).astype(np.uint8)
    out=np.zeros(a.shape+(4,),np.uint8);out[...,0]=out[...,1]=out[...,2]=v;out[...,3]=np.where(ok,255,0);return Image.fromarray(out)
def build_all(out):
    frame(140,110,280,200);res={}
    for o in('h','v'):
        for t in TYPES:
            for e in ENDS:
                im,D=render(roof_parts(o,t,e));c=crop(im)
                if not c:continue
                img,ax,ay,bb=c;a=np.array(img);dz=depth_img(D,bb);dz_a=np.array(dz);dz_a[...,3]=np.where(a[...,3]>0,255,0)
                k='%s-%s-%s'%(o,t,e);res['iso:roof:'+k]=(img,ax,ay);res['iso:roofz:'+k]=(Image.fromarray(dz_a),ax,ay)
        print('roof',o,flush=True)
    C=IC.chipsrc()
    for wall in IC.WALLS:
        top,front=IC.wall_tex(C,wall)
        for o in('h','v'):
            for t in GTYPES:
                for p in(0,1):
                    P=gable_parts(o,t,p,front,wall)
                    if not P:continue
                    im,_=render(P);c=crop(im)
                    if not c:continue
                    img,ax,ay,bb=c;res['iso:%s:gab-%s-%s-%d'%(wall,o,t,p)]=(img,ax,ay)
        print('gable',wall,flush=True)
    for k,(im,ax,ay) in res.items():im.save(os.path.join(out,k.replace(':','_')+'.png'))
    json.dump({k:[ax,ay,im.width,im.height] for k,(im,ax,ay) in res.items()},open(os.path.join(out,'_info.json'),'w'))
    return res
if __name__=='__main__':
    a=[q for q in sys.argv[1:] if not q.startswith('--')];out=a[0];os.makedirs(out,exist_ok=True)
    res=build_all(out)
    if '--chips' in sys.argv:IC.to_chips(res)
