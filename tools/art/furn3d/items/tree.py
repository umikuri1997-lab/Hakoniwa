# 木（tree：植えた木・ntree：森の木。同じ絵）。ドラゴンクエストビルダーズのような、自然な構造とかわいいデフォルメの広葉樹（持ち主の指示）。
# 前の枝・根の形は引き継がず、作りなおした（幹 → 根 → 主枝 → 側枝 → 小枝 → 葉群、が1本の木としてつながる）。
# 設計図（単位はマス。地面 z=0。根もと (0.5, 0.62)）：
#   樹冠：大きなふくらみ LOBES をつなげた、かさの形（お手本：ビルダーズの木）。ふくらみごとに、てっぺんから面にそって外・下へ、葉のついた細枝（スプレー）。
#   内がわにも細枝と葉の層（暗い色。むこうがすけない）。
#   葉：細枝の左右に、たがいちがいに、細枝から同じ角度（45度）でひらき、面にそってねかせる。上の葉ほど少し外がわ（かわらのように重なり、交差しない）。
#   幹：根もとから TRUNK まで、ゆるくまがる。半径 0.13 → 0.085。根もとは、角度ごとにちがう大きさのなめらかなふくらみ（4〜6本）で、
#     なだらかに太くなり、地面へ広がる（幹と1つづきの面。板・台座にしない：trunkmesh）。
#   主枝 MAIN：幹の上のほうから、ななめ上へ（向き・立ち上がり・長さ・つけ根の高さはまちまち）。半径 0.060 → 0.030。
#   側枝：主枝の 0.40〜0.85 の所から2〜3本（長さ 0.28〜0.40、半径 0.030 → 0.016）。小枝：側枝の先のほうから1〜2本（長さ 0.14〜0.20、半径 0.015 → 0.007）。
#   どの枝も、曲がりがだんだんかわる曲線（curve3）：太い枝はゆるく上へ、細い枝の先は葉の重さで少し下がる。子の枝は親より細く、つけ根にえり。
#   枝先（主枝・側枝・小枝の先）には、かならず葉群（葉のない枝先を作らない）。
#   葉：もらった葉1まいのモデル（tripo/kit_leaf.glb）。葉柄の立ち上がりを面へもどし、葉ごとにしなり（裏がわへ曲げる）をつける（持ち主の指示：形をかえてよい）。大きさは1つ。枝先のまわりに、枝の先の6割にそって、左右たがいちがいに、細い枝は14〜20まい・主枝は10〜14まい。
#     向きは枝ののびる向きを基本に外へ、重さで少し下へ。表は上へ（裏が上を向かない）。葉先が樹冠の形の外へ出る葉は置かない（外がわがなめらか）。
#   骨格は1回だけ作って tree_skel.json に固定する（python3 tools/art/furn3d/items/tree.py --skel）。葉つきは読んで葉をたすだけ。SKEL=True で骨格だけ。
import math,json,os
import numpy as np
import natcommon as N
ID='tree';GRAD=True;PARALLEL=True;BOTTOM=56
VIEWS=[('tree',0),('ntree',0)]
CX,CY=0.5,0.62;SEED=4;SKEL=False
TRUNK=0.72
CROWN=((0.50,0.60,1.25),0.74,0.64,0.60)
LEAFL=0.24   # 葉の長さ（マス。どの葉も同じ。お手本の絵では、樹冠のはばに7〜8まい）
MAIN=[   # 向き（上から見て）・立ち上がり（度）・長さ・つけ根の高さ（幹にたいする割合）
    (200,40,0.66,0.66),(335,44,0.62,0.78),(275,50,0.54,0.88),(110,42,0.52,0.72),(40,72,0.56,1.0)]
SKELF=os.path.join(os.path.dirname(os.path.abspath(__file__)),'tree_skel.json')
UP=np.array([0,0,1.0])
def curve3(p,d,L,bend_up,droop,rs,n=8,wob=0.04):
    """曲がりがだんだんかわる曲線：はじめは d、なかほどまで上へ（bend_up）、先は下へ（droop）。かえす：点の一覧"""
    pts=[np.array(p,float)];dd=np.array(d,float)/np.linalg.norm(d)
    for k in range(n):
        t=(k+0.5)/n;dd=dd+UP*(bend_up*(1-t)-droop*t*t)/n*4+rs.normal(0,wob,3)/n*2;dd/=np.linalg.norm(dd)
        pts.append(pts[-1]+dd*L/n)
    return pts
def rot(v,ax,a):
    ax=ax/np.linalg.norm(ax);return v*math.cos(a)+np.cross(ax,v)*math.sin(a)+ax*(ax@v)*(1-math.cos(a))
def child_dir(d,ang,az):
    u=np.cross(d,UP);u=u/np.linalg.norm(u) if np.linalg.norm(u)>1e-6 else np.array([1.0,0,0]);v=np.cross(d,u)
    s=u*math.cos(az)+v*math.sin(az);c=d*math.cos(math.radians(ang))+s*math.sin(math.radians(ang));return c/np.linalg.norm(c)
def at(pts,t):
    f=t*(len(pts)-1);i=min(len(pts)-2,int(f));return pts[i]+(pts[i+1]-pts[i])*(f-i),(pts[i+1]-pts[i])/np.linalg.norm(pts[i+1]-pts[i]),i
def inside(p):
    c,rx,ry,rz=CROWN;return ((p[0]-c[0])/rx)**2+((p[1]-c[1])/ry)**2+((p[2]-c[2])/rz)**2<1
def clip(pts):
    """樹冠の形の外へ出る所で枝を止める（いちどでも中に入ったあと）"""
    out=[pts[0]];was=inside(pts[0])
    for q in pts[1:]:
        if was and not inside(q):break
        out.append(q);was=was or inside(q)
    return out
# ---- かさの樹冠（持ち主のお手本の絵：ビルダーズの木）：ふちがたれた、きのこのかさのようなドーム ----
# ---- 樹冠：大きなふくらみ（LOBES）をつなげた、かさの形（お手本：ビルダーズの木） ----
# ふくらみ：まん中・半径（たてはその0.8倍）。てっぺんに1つ、まわりに4つ（少し低い）。となりとかさなって1つの樹冠
LOBES=[((0.50,0.60,1.66),0.46),((0.06,0.66,1.36),0.42),((0.92,0.62,1.38),0.42),((0.52,0.20,1.42),0.40),((0.48,1.00,1.30),0.40)]
LZ=0.8;LUMAX=1.12   # ふくらみのたてのつぶし・ふちまでの角度（1をこえると下へまわりこむ：ふちがたれる）
def lobept(k,u,th,dk=0.0):
    c,r=LOBES[k];r=r*(1+dk);a=u*LUMAX*math.pi/2
    return np.array(c)+np.array([r*math.sin(a)*math.cos(th),r*math.sin(a)*math.sin(th),r*LZ*math.cos(a)])
def lobenorm(k,u,th):
    a=u*LUMAX*math.pi/2;n=np.array([math.sin(a)*math.cos(th),math.sin(a)*math.sin(th),math.cos(a)/LZ]);return n/np.linalg.norm(n)
def inlobe(p,k0,sh=0.985):
    """ほかのふくらみの中か（そこには細枝・葉を置かない：ふくらみどうしで葉が交差しない）"""
    for k,(c,r) in enumerate(LOBES):
        if k==k0:continue
        d=(np.array(p)-np.array(c))/np.array([r,r,r*LZ])
        if np.linalg.norm(d)<sh:return True
    return False
SPRAYGAP=0.13   # 細枝（スプレー）どうしの、ふちでの間かく（マス）
def skeleton():
    rs=np.random.RandomState(SEED);B=[]
    FORK=1.02
    tr=curve3((CX,CY,0),(0.03,0.0,1.0),FORK,0.0,0.0,rs,n=10,wob=0.02);B.append({'pts':tr,'r0':0.15,'r1':0.11,'lv':0,'leaf':False})
    top=tr[-1]
    for k,(c,r) in enumerate(LOBES):
        c=np.array(c);inn=c-np.array([0,0,r*LZ*0.35])   # ふくらみの中の、枝が分かれる所
        d=inn-top;L=np.linalg.norm(d);d0=d/L*0.75+UP*0.25;d0/=np.linalg.norm(d0)
        m=curve3(top-UP*0.06,d0,L,0.0,0.0,rs,n=8,wob=0.02);m[-1]=inn;B.append({'pts':m,'r0':0.07,'r1':0.04,'lv':1,'leaf':False})
        # 細枝（スプレー）：ふくらみのてっぺん近くから、面にそって外・下へ。本数は、ふちでの間かく SPRAYGAP から
        for layer,dk in ((0,-0.03),(1,-0.20)):   # 外の層と、内がわの層（むこうがすけない）
          ns=max(6,int(2*math.pi*r*(1+dk)/SPRAYGAP));ph=rs.uniform(0,6.28)
          for j in range(ns):
            th=ph+2*math.pi*j/ns+rs.uniform(-0.08,0.08);u0=rs.uniform(0.08,0.16)
            path=[lobept(k,u,th,dk) for u in np.linspace(u0,LUMAX*0.92,9)]
            if inlobe(path[len(path)//2],k,0.95) and inlobe(path[-1],k,0.95):continue   # ほかのふくらみにうまる細枝は作らない
            start=inn+(path[0]-inn)*0.15
            pts=[start]+[inn+(path[0]-inn)*t for t in (0.5,0.85)]+path   # ふくらみの中の分かれ目から、面へ出て、面にそって下へ
            B.append({'pts':pts,'r0':0.014,'r1':0.006,'lv':3,'leaf':True,'lobe':k,'th':th,'u0':u0,'dk':dk})
    return B
def makeskel():
    B=skeleton();json.dump([{'pts':[list(map(float,p)) for p in b['pts']],'r0':b['r0'],'r1':b['r1'],'lv':b['lv'],'leaf':b['leaf'],'lobe':b.get('lobe'),'th':b.get('th'),'u0':b.get('u0'),'dk':b.get('dk')} for b in B],open(SKELF,'w'))
def loadskel():
    return [{'pts':np.array(b['pts']),'r0':b['r0'],'r1':b['r1'],'lv':b['lv'],'leaf':b['leaf'],'lobe':b.get('lobe'),'th':b.get('th'),'u0':b.get('u0'),'dk':b.get('dk')} for b in json.load(open(SKELF))]
def trunkmesh(T,pts,r0,r1,rs,n=28):
    """幹：根もとは、角度ごとにちがう大きさのなめらかなふくらみ（根）で、なだらかに太くなり、地面へ広がる（1つづきの面）"""
    lobes=[(rs.uniform(0,6.28),rs.uniform(0.06,0.16),rs.uniform(0.35,0.6)) for _ in range(rs.randint(4,7))]   # 向き・大きさ・はば（ラジアン）
    P=[np.array(p) for p in pts];P=[P[0]-np.array([0,0,0.03])]+P;m=len(P);R=[]
    for i,c in enumerate(P):
        d=P[min(i+1,m-1)]-P[max(i-1,0)];d/=np.linalg.norm(d);u=np.cross(d,[0,1.0,0]);u/=np.linalg.norm(u);v=np.cross(d,u)
        z=max(0.0,c[2]);t=min(1,i/(m-1));ring=[]
        for j in range(n):
            a=2*math.pi*j/n;r=r0+(r1-r0)*t
            for la,amp,wd in lobes:
                da=(a-la+math.pi)%(2*math.pi)-math.pi;r+=amp*math.exp(-(da/wd)**2)*math.exp(-z/0.09)   # 根：下ほど大きく、なめらかに
            r*=1+0.03*math.sin(3*a+i)   # 断面は少しいびつ
            ring.append(c+r*(math.cos(a)*u+math.sin(a)*v))
        R.append(ring)
    for i in range(m-1):
        for j in range(n):
            a,b,c,e=R[i][j],R[i+1][j],R[i+1][(j+1)%n],R[i][(j+1)%n];T+=[(a,b,c),(a,c,e)]
_KL=[]
def kitleaf():
    """葉のモデルを読み、葉の軸にそろえる：のびる向き e1（葉柄のはしが原点、葉先が +）・はばの向き e2・表の向き e3（もらったセットで、うしろを向いていた面が表）。長さ1"""
    if _KL:return _KL[0]
    import trimesh
    m=trimesh.load(os.path.join(os.path.dirname(N.__file__),'..','..','models','tripo','kit_leaf.glb'),force='mesh')
    V=np.asarray(m.vertices,float)   # glTF のまま
    c=V.mean(0);_,_,vt=np.linalg.svd(V-c,full_matrices=False);e1,e3=vt[0],vt[2]
    if e3[2]>0:e3=-e3   # 表の向き：もらったセットで、うしろ（−Z）を向いていたがわ（持ち主が見て、手前がわは裏だった）
    Q0=(V-c)@e1;a,b=Q0.min(),Q0.max();L_=b-a;w=(V-c)@np.cross(e3,e1)
    if np.abs(w[Q0<a+0.15*L_]).max()>np.abs(w[Q0>b-0.15*L_]).max():e1=-e1   # 細いほう（葉柄）を、−のはしに
    e2=np.cross(e3,e1)   # 右手の向き（e1・e2・e3）：置くときの (o, sd=nn×o, nn) と同じならび
    Q=(V-c)@np.stack([e1,e2,e3],1);Q[:,0]-=Q[:,0].min();Q/=L_
    F_=np.asarray(m.faces)
    # 葉柄の立ち上がりをなおす（持ち主の指示：モデルの形をかえてよい）：つけ根から葉の長さの2割までを、葉の面（その先の葉のまん中の高さ）へ、なだらかにもどす
    zc=float(np.median(Q[(Q[:,0]>0.25)&(Q[:,0]<0.45)&(np.abs(Q[:,1])<0.05),2])) if ((Q[:,0]>0.25)&(Q[:,0]<0.45)&(np.abs(Q[:,1])<0.05)).any() else 0.0
    w=np.clip(1-Q[:,0]/0.22,0,1);w=w*w*(3-2*w);Q[:,2]=Q[:,2]*(1-w)+zc*w+(Q[:,2]-zc)*w*0.25   # 葉柄は面のすぐそばへ（太さは少しのこす）
    base=Q[Q[:,0]<0.06];tip=base.mean(0)   # 葉柄のはし
    _KL.append(Q[F_]);_KL.append(tip);return _KL[0]
def stemtip():kitleaf();return _KL[1]
def EXTRA(sc):
    B=loadskel();rs=np.random.RandomState(SEED+50);T=[]
    for b in B:
        pts=b['pts'];k=len(pts);rr=[b['r0']+(b['r1']-b['r0'])*(i/(k-1))**0.8 for i in range(k)]
        if b['lv']==0:trunkmesh(T,pts,b['r0'],b['r1'],rs);continue
        rr[0]*=1.15   # えり
        rr[-1]=min(rr[-1],0.006)   # 先は細く（葉群の中）
        N.limb(T,pts,rr,n=10 if b['lv']<=1 else 7 if b['lv']==2 else 5)
    N.barkmesh(sc,T)
    if SKEL:return
    Q=kitleaf();rs=np.random.RandomState(SEED+100)
    sc.outline(None,0.86);sc.material('flat')
    S=stemtip()
    LEAFANG=math.radians(45);STEP=LEAFL*0.32   # 細枝からひらく角度（どの葉も同じ）・葉と葉の、細枝にそった間かく
    for b in B:   # 細枝（スプレー）の、面にそった所に、左右たがいちがいに。葉は面にそってねかせ、外・下へ。上の葉ほど外がわ（かわらのように、上の葉が下の葉のつけ根にかさなる。交差しない）
        if not b['leaf']:continue
        k=b['lobe'];th=b['th'];u0=b['u0'];pts=b['pts'][3:];Ls=np.cumsum([0]+[np.linalg.norm(pts[i+1]-pts[i]) for i in range(len(pts)-1)]);tot=Ls[-1]
        n=int(tot/STEP);side=1 if (int(th*100)%2) else -1
        for i in range(n):
            sdist=(i+0.5)*STEP;j=min(len(pts)-2,int(np.searchsorted(Ls,sdist))-1);j=max(j,0);t=(sdist-Ls[j])/max(Ls[j+1]-Ls[j],1e-9)
            a_pt=pts[j]+(pts[j+1]-pts[j])*t;dd=pts[j+1]-pts[j];dd/=np.linalg.norm(dd)
            u=u0+(LUMAX*0.92-u0)*sdist/tot;nn=lobenorm(k,u,th);dd-=nn*(dd@nn);dd/=np.linalg.norm(dd)
            side=-side;sd0=np.cross(nn,dd);o=dd*math.cos(LEAFANG)+sd0*side*math.sin(LEAFANG);o/=np.linalg.norm(o)   # 細枝の向きから、左右へ同じ角度
            tipp=a_pt+o*LEAFL
            if inlobe(tipp,k,0.99) or inlobe(a_pt,k,0.99):continue   # ほかのふくらみにうまる葉は置かない（ふくらみどうしで交差しない）
            M=np.stack([o,np.cross(nn,o),nn],0)
            lift=0.004*(n-i)+0.003*(k%2)   # 上（細枝のつけ根がわ）の葉ほど、少し外へ：下の葉のつけ根の上にかさなる
            base=a_pt+nn*(0.035+lift)-(S@M)*LEAFL
            lt=float(nn@N.LIGHTV);tone=int(np.clip(round((1-lt)*1.8+u*0.6-0.4+(0.5 if LOBES[k][0][2]<1.4 else 0)+(1.2 if b.get('dk',0)<-0.1 else 0)),0,len(N.LEAFB)-2))   # 内がわの層は暗い
            Qb=Q.copy();Qb[...,2]-=0.12*np.clip(Qb[...,0]-0.25,0,None)**2   # しなり（少し、どの葉も同じ）。ねじらない
            W3=Qb@M*LEAFL+base;sc.part()
            for q in W3:sc.tri(q[0],q[1],q[2],N.LEAFB[tone])
    sc.material(None);sc.outline()
def PARTS():return []
def POST(im):return N.specks(im)
if __name__=='__main__':
    import sys
    if '--skel' in sys.argv:makeskel();print('骨格を書いた',SKELF)
