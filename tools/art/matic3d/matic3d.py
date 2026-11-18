"""素材のアイコン（木材 wood・石材 stone・竹 bamboo）：3Dに組んで、ドット絵に写す（スキル model3d-pixel、見え方は家具と同じ furn3d.shot。布 nuno3d と同じやり方）。
ならびは、前のアイコン（もらった絵）と同じ。単位はマス。アイコンは、写した絵（1マス64ドット）を3倍にのばす。
設計図
  木材：丸太3本。太さ0.17（半径0.085）・長さ0.34。上から見て、手前のはしが左手前を向くように、ななめにねかせる（向き (-0.6,0.8)）。
        下の列に2本（となりどうしをつける）、上の1本は下の2本のあいだにのせる（下の2本にふれる高さ）。手前のはしは少しずつずらす。皮は木の皮のテクスチャ、切り口は年輪（blueprint の log）。
  石材：まるい石3こ（トリポの stone_round・stone_big）。おくに大きい石（高さ0.30）、左手前に中くらい（0.20）、右手前に小さい石（0.13）。灰色。
  竹：竹3本。太さ0.10（半径0.05）・長さ0.62。木材と同じ向きにねかせ、下に2本・上に1本。節は0.16ごと（ふくらんだ輪・こい緑）。
        手前のはしは切り口（うすい緑のふち・中は空洞のこい色）。まん中を、ひも（茶色、太さ0.012）で1まわりしばる。
  python3 tools/art/matic3d/matic3d.py <出力フォルダ>            # 絵（<名前>.png・<名前>_x10.png）を書き出す
  python3 tools/art/matic3d/matic3d.py <出力フォルダ> --icon     # assets/g に入れ、js/draw-spirits.js の ICONS に書く"""
import sys,os,io,re,math,hashlib
D=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(D,'..');ROOT=os.path.join(ART,'..','..')
sys.path.insert(0,ART);sys.path.insert(0,os.path.join(ART,'furn3d'));sys.path.insert(0,os.path.join(ART,'furn3d','items'))
import numpy as np
from PIL import Image
import oblique3d as O
import furn3d as F
from blueprint import Part as P
from common import LOG
from blueprint import LOGEND
def dirs(ax):
    a=np.array((ax[0],ax[1],0.0));a/=np.linalg.norm(a);return a,np.array((a[1],-a[0],0.0))
AX,UX=dirs((-0.5,0.87))   # 丸太ののびる向き（手前が左）と、それにちょっかくのよこ向き
def bundle(R,L,base=(0.6,0.3),shift=(0.0,0.03,0.015),ax=None):
    """下2本・上1本の束：それぞれの (うしろのはし, 手前のはし)"""
    AX,UX=dirs(ax) if ax else (globals()['AX'],globals()['UX'])
    b=np.array((base[0],base[1],0.0));out=[]
    for k,(u,z) in enumerate(((-R,R),(R,R),(0.0,R+R*math.sqrt(3)))):
        a=b+u*UX+np.array((0,0,z));out.append((a,a+AX*(L+shift[k])))
    return out
RING=(206,150,96);HEART=(206,150,96)
def rings(a,e,R):
    """切り口のもよう：年輪の線1本と、しん（小さいので1本）（前のアイコンと同じ）"""
    d=e-a;Ln=float(np.linalg.norm(d));d=d/Ln
    def f(x,y,z):
        q=np.array((x,y,z))-a;t=float(q@d)
        if 0.004<t<Ln-0.004:return None
        r=float(np.linalg.norm(q-d*t))/R
        if r<0.2:return HEART
        if 0.48<r<0.62:return RING
        return LOGEND
    return f
class Wood:
    GRAD=True;TONE5=True;BOTTOM=0;ELEV=25
    @staticmethod
    def PARTS():
        L=[];R=0.085
        for k,(a,e) in enumerate(bundle(R,0.34)):
            on=('ground',) if k<2 else ('丸太1','丸太2')
            p=P('丸太%d'%(k+1),'log',(tuple(a),tuple(e),R),LOG,on=on,note='地面にねかせる' if k<2 else '下の2本のあいだにのせる');p.decal=rings(a,e,R);L.append(p)
        return L
STONE=(132,134,150)
class Stone:
    GRAD=True;TONE5=True;BOTTOM=0;ELEV=25
    @staticmethod
    def PARTS():
        L=[]
        for nm,f,x,y,h,rot in(('大きい石','stone_round.glb',0.54,0.42,0.30,20),('中くらいの石','stone_round.glb',0.38,0.60,0.20,-40),('小さい石','stone_round.glb',0.68,0.64,0.13,70)):
            p=P(nm,'model',('tripo/'+f,x,y,0,h,rot,0,0.72),STONE,note='地面に置く');p.recol=STONE;p.recolk=0.5;p.tex=False;L.append(p)
        return L
BAM=(150,206,110);NODE=(100,156,74);CUT=(200,230,160);HOLE=(84,124,64);TIE=(196,140,86)
def stalk(sc,a,e,r,step=0.2):
    """竹1本：a（うしろ）→ e（手前）。節は step ごと、こい緑のふくらんだ輪"""
    d=e-a;Ln=np.linalg.norm(d);d=d/Ln;u=np.cross(d,[0,0,1.0]);u/=np.linalg.norm(u);v=np.cross(d,u);n=20
    Q=lambda c,t,f=1.0:c+r*f*(math.cos(t)*u+math.sin(t)*v)
    nodes=[s for s in np.arange(step*0.6,Ln-0.03,step)]
    cuts=sorted(set([0.0,Ln]+[s+o for s in nodes for o in(-0.009,0.009)]))
    sc.smooth(True);sc.part()
    for s0,s1 in zip(cuts,cuts[1:]):
        nd=any(abs((s0+s1)/2-s)<0.010 for s in nodes);f=1.0;col=NODE if nd else BAM
        for i in range(n):
            t0,t1=2*math.pi*i/n,2*math.pi*(i+1)/n
            sc.quad(Q(a+d*s0,t0,f),Q(a+d*s1,t0,f),Q(a+d*s1,t1,f),Q(a+d*s0,t1,f),col)
    sc.smooth(False);sc.part()
    for c in(a,e):   # 切り口：ふちはうすい緑、中は空洞（こい色）
        for i in range(n):
            t0,t1=2*math.pi*i/n,2*math.pi*(i+1)/n
            sc.quad(Q(c,t0),Q(c,t1),Q(c,t1,0.62),Q(c,t0,0.62),CUT);sc.tri(c,Q(c,t0,0.62),Q(c,t1,0.62),HOLE)
class Bamboo:
    GRAD=True;TONE5=True;BOTTOM=0;ELEV=25
    @staticmethod
    def PARTS():return[]
    @staticmethod
    def EXTRA(sc):
        R=0.05;AXB=(-0.6,0.8);B=bundle(R,0.62,base=(0.78,0.20),shift=(0.0,0.04,0.02),ax=AXB);AX,UX=dirs(AXB)
        for a,e in B:stalk(sc,a,e,R)
        s=0.30;C=[a+AX*s for a,e in B]   # ひも：3本のまわりを1まわり（まん中の少しうしろ）
        rr=R+0.002;cen=sum(C)/3;pts=[]
        for k in range(25):
            t=2*math.pi*k/24;w=math.cos(t)*UX+np.array((0,0,math.sin(t)))
            best=max(float(w@(c-cen))+rr for c in C);pts.append(cen+w*best)
        sc.tube([tuple(p) for p in pts],0.009,TIE,n=6)
ITEMS={'wood':Wood,'stone':Stone,'bamboo':Bamboo}
def render(M):
    O.GRAD=True;im=F.shot(M,0)[0];return im.crop(im.getbbox())
def icon(k,im):
    im=im.resize((im.width*3,im.height*3),Image.NEAREST);b=io.BytesIO();im.save(b,'WEBP',lossless=True,exact=True);data=b.getvalue()
    name='assets/g/'+hashlib.sha1(data).hexdigest()[:10]+'.webp';open(os.path.join(ROOT,name),'wb').write(data)
    js=os.path.join(ROOT,'js','draw-spirits.js');s=open(js,encoding='utf-8').read()
    m=re.search(r"""(["']?)%s\1: ?(["'])assets/g/[0-9a-f]+\.webp\2"""%k,s)
    s=s[:m.start()]+"%s:'%s'"%(k,name)+s[m.end():];open(js,'w',encoding='utf-8').write(s);print('アイコン',k,name,im.size)
if __name__=='__main__':
    out=sys.argv[1];os.makedirs(out,exist_ok=True)
    for k,M in ITEMS.items():
        im=render(M);im.save(os.path.join(out,k+'.png'));im.resize((im.width*10,im.height*10),Image.NEAREST).save(os.path.join(out,k+'_x10.png'));print(k,im.size)
        if '--icon' in sys.argv:icon(k,im)
