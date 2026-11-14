# 木（tree：植えた木・ntree：森の木。同じ絵）。ドラゴンクエストビルダーズのような、自然な構造とかわいいデフォルメの広葉樹（持ち主の指示）。
# 前の枝・根の形は引き継がず、作りなおした（幹 → 根 → 主枝 → 側枝 → 小枝 → 葉群、が1本の木としてつながる）。
# 設計図（単位はマス。地面 z=0。根もと (0.5, 0.62)）：
#   樹冠の形 CROWN：まるくコンパクトな形（よこはば≒たかさ、重心は幹の近く）。枝はこの中まで、葉はこの外へはみ出さない。
#   幹：根もとから TRUNK まで、ゆるくまがる。半径 0.13 → 0.085。根もとは、角度ごとにちがう大きさのなめらかなふくらみ（4〜6本）で、
#     なだらかに太くなり、地面へ広がる（幹と1つづきの面。板・台座にしない：trunkmesh）。
#   主枝 MAIN：幹の上のほうから、ななめ上へ（向き・立ち上がり・長さ・つけ根の高さはまちまち）。半径 0.060 → 0.030。
#   側枝：主枝の 0.40〜0.85 の所から2〜3本（長さ 0.28〜0.40、半径 0.030 → 0.016）。小枝：側枝の先のほうから1〜2本（長さ 0.14〜0.20、半径 0.015 → 0.007）。
#   どの枝も、曲がりがだんだんかわる曲線（curve3）：太い枝はゆるく上へ、細い枝の先は葉の重さで少し下がる。子の枝は親より細く、つけ根にえり。
#   枝先（主枝・側枝・小枝の先）には、かならず葉群（葉のない枝先を作らない）。
#   葉：もらった葉1まいのモデル（tripo/kit_leaf.glb、形も大きさもかえない）。枝先のまわりに、枝の先の6割にそって、左右たがいちがいに、細い枝は14〜20まい・主枝は10〜14まい。
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
LEAFL=0.19   # 葉の長さ（マス。どの葉も同じ）
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
def skeleton():
    rs=np.random.RandomState(SEED);B=[]   # 枝：{'pts','r0','r1','lv','leaf','par'}
    tr=curve3((CX,CY,0),(0.05,0.0,1.0),TRUNK,0.0,0.0,rs,n=10,wob=0.03);B.append({'pts':tr,'r0':0.13,'r1':0.085,'lv':0,'leaf':False})
    for az,el,ln,h in MAIN:
        p,d0,_=at(tr,h);d=N.dirv(az+rs.uniform(-12,12),el+rs.uniform(-6,6))
        m=clip(curve3(p,d,ln*rs.uniform(0.9,1.1),0.10,0.10,rs));B.append({'pts':m,'r0':0.060,'r1':0.030,'lv':1,'leaf':True});mi=len(B)-1
        ns=rs.randint(2,4);used=[]
        for k in range(ns):
            t=rs.uniform(0.40,0.85)
            if any(abs(t-u)<0.15 for u in used):continue
            used.append(t);q,dm,_=at(m,t);cd=child_dir(dm,rs.uniform(30,50),rs.uniform(0,6.28))
            out=q-np.array([CX,CY,q[2]]);out=out/np.linalg.norm(out) if np.linalg.norm(out)>1e-6 else cd;cd=cd*0.7+out*0.3;cd/=np.linalg.norm(cd)   # 外がわへ
            if cd[2]<-0.1:cd=cd+UP*0.4;cd/=np.linalg.norm(cd)
            sb=clip(curve3(q-cd*0.02,cd,rs.uniform(0.28,0.40),0.25,0.25,rs,n=7));B.append({'pts':sb,'r0':0.030,'r1':0.016,'lv':2,'leaf':True})
            for kk in range(rs.randint(1,3)):   # 小枝：側枝の先のほうから
                q2,d2,_=at(sb,rs.uniform(0.55,0.85));cd2=child_dir(d2,rs.uniform(25,40),rs.uniform(0,6.28))
                tw=clip(curve3(q2-cd2*0.01,cd2,rs.uniform(0.14,0.20),0.1,0.35,rs,n=6));B.append({'pts':tw,'r0':0.015,'r1':0.007,'lv':3,'leaf':True})
    return B
def makeskel():
    B=skeleton();json.dump([{'pts':[list(map(float,p)) for p in b['pts']],'r0':b['r0'],'r1':b['r1'],'lv':b['lv'],'leaf':b['leaf']} for b in B],open(SKELF,'w'))
def loadskel():
    return [{'pts':np.array(b['pts']),'r0':b['r0'],'r1':b['r1'],'lv':b['lv'],'leaf':b['leaf']} for b in json.load(open(SKELF))]
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
    _KL.append(Q[np.asarray(m.faces)]);return _KL[0]
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
    Q=kitleaf();rs=np.random.RandomState(SEED+100);C0=np.array(CROWN[0]);zl,zh=C0[2]-CROWN[3],C0[2]+CROWN[3]
    sc.outline(None,0.86);sc.material('flat')
    for b in B:
        if not b['leaf']:continue
        pts=b['pts'];side=1;nL=rs.randint(14,21) if b['lv']>=2 else rs.randint(10,15);az=rs.uniform(0,6.28)
        for k in range(nL):
            t=0.4+0.6*(k/(nL-1))**0.8 if nL>1 else 1.0
            p,d,_=at(pts,min(t,0.999))
            side=-side;az+=math.pi+rs.uniform(-0.7,0.7)
            u=np.cross(d,UP);u=u/np.linalg.norm(u) if np.linalg.norm(u)>1e-6 else np.array([1.0,0,0]);v=np.cross(d,u)
            rad=u*math.cos(az)+v*math.sin(az)
            o=d*0.65+rad*0.7-UP*0.15+rs.normal(0,0.08,3);o/=np.linalg.norm(o)   # 枝の向きを基本に外へ、重さで少し下へ
            nn=UP*0.75+rs.normal(0,0.12,3);nn-=o*(nn@o);nn/=np.linalg.norm(nn)
            if nn[2]<0.3:o=o+UP*0.6;o/=np.linalg.norm(o);nn=UP-o*(UP@o);nn/=np.linalg.norm(nn)   # 表が上（裏が上を向かない）
            if not inside(p+o*LEAFL*1.0):continue   # 葉先が樹冠の形の外へ出る葉は置かない
            sd=np.cross(nn,o);h=(p[2]-zl)/max(zh-zl,1e-6)
            tone=int(np.clip(round((1-h)*1.6+(1-nn[2])*0.8-0.3),0,len(N.LEAFB)-2))
            W3=Q@np.stack([o,sd,nn],0)*LEAFL+p;sc.part()
            for q in W3:sc.tri(q[0],q[1],q[2],N.LEAFB[tone])
    sc.material(None);sc.outline()
def PARTS():return []
def POST(im):return N.specks(im)
if __name__=='__main__':
    import sys
    if '--skel' in sys.argv:makeskel();print('骨格を書いた',SKELF)
