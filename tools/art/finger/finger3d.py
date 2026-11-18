# タップの案内の指（#tutHand）を、3Dの手から写したドット絵にする（持ち主のたのみ。前は finger.png をちぢめた絵 finger_art.py）。
# 使い方：python3 tools/art/finger/finger3d.py <出力フォルダ> [--game]
#   --game：ゲームの絵（assets/g、名前は中身のハッシュ）に書き出し、index.html の #tutHand の3つの絵の名前を書きかえる。
# 設計図（マス。x=右・y=手前・z=上。人さし指を上に向けた右手を、手のこうがわから見る）：
#   手のひら：だ円の玉（よこ0.21・おく0.09・たて0.17の半径）。人さし指：手のひらの上のまん中より左から、まっすぐ上へ（半径0.055、長さ0.38）。
#   中指・くすり指・小指：手のひらの上のふちで、手前へまげた3つの玉（半径0.050・0.048・0.044、右へいくほど少し下）。
#   親指：手のひらの左の手前から、人さし指のねもとへ、ななめにねかせた玉（よこ0.042・たて0.09）。どの数も、前の絵の大きさに合わせて K 倍する。
# 写し方：ほぼ正面（見おろし8度）・遠近なし・1マス64ドット（ちぢめない）。光は左上。色は、前の絵と同じ5色（輪郭・かげ・はだ・明るいはだ・つやの白）にわける。
# 向き：上むき（そのまま）・下むき（画面の奥の軸のまわりに180度）・左むき（90度）。下むきの「おす」コマは、少し下へおして、指先の下にタップの線（前の絵と同じ）。
# 絵の大きさと指先の場所は、前の絵と同じ（CSS の大きさ・場所をかえない）：上むき 24×33・下むき 48×39（ふつう・おすの2コマ）・左むき 34×24。
import sys,os,math,hashlib,re
HERE=os.path.dirname(os.path.abspath(__file__));ART=os.path.join(HERE,'..');ROOT=os.path.join(ART,'..','..')
sys.path.insert(0,ART)
import numpy as np
from PIL import Image
import oblique3d as O
SKIN=(245,197,168);OL=(192,115,92);SH=(223,164,138);LT=(252,228,197);HL=(255,255,255)   # 前の絵の色（輪郭・かげ・はだ・明るいはだ・つや）
OLD={'up':'old-up','down':'old-down','left':'old-left'}   # 前の絵（finger_art.py で作った絵）。大きさと指先の場所・おすコマのタップの線は、この絵から
def ell(c,r,R=np.eye(3),n=20,m=12):
    """だ円の玉の三角形：中心 c・半径 r=(rx,ry,rz)・向き R（3×3）"""
    c=np.array(c,float);out=[]
    P=lambda t,a:c+R@np.array([r[0]*math.sin(t)*math.cos(a),r[1]*math.sin(t)*math.sin(a),r[2]*math.cos(t)])
    for j in range(m):
        t0,t1=math.pi*j/m,math.pi*(j+1)/m
        for i in range(n):
            a0,a1=2*math.pi*i/n,2*math.pi*(i+1)/n
            out.append((P(t0,a0),P(t1,a0),P(t1,a1)));out.append((P(t0,a0),P(t1,a1),P(t0,a1)))
    return out
def roty(d):   # 画面の奥の軸（y）のまわりに d 度（+で、上が右へたおれる）
    a=math.radians(d);return np.array([[math.cos(a),0,math.sin(a)],[0,1,0],[-math.sin(a),0,math.cos(a)]])
def rotx(d):   # よこの軸のまわり（+で、上が手前へ）
    a=math.radians(d);return np.array([[1,0,0],[0,math.cos(a),-math.sin(a)],[0,math.sin(a),math.cos(a)]])
CX,CY=0.5,0.5
K=1.0   # 大きさ（前の絵の高さに合わせて main がきめる）
def parts():
    k=K;e=lambda c,r,R=np.eye(3):ell((CX+(c[0]-CX)*k,CY+(c[1]-CY)*k,c[2]*k),tuple(x*k for x in r),R)
    P=[('手のひら',e((CX+0.01,CY,0.17),(0.21,0.09,0.17)))]
    P.append(('人さし指',e((CX-0.06,CY+0.01,0.47),(0.055,0.05,0.19))))   # ねもとは手のひらの中
    for i,(dx,z,r) in enumerate(((-0.005,0.31,0.05),(0.06,0.30,0.048),(0.115,0.275,0.044))):
        P.append(('まげた指%d'%(i+1),e((CX+dx,CY+0.06,z),(r,r*0.95,r*1.05))))
    P.append(('親指',e((CX-0.13,CY+0.05,0.19),(0.042,0.04,0.09),roty(-30)@rotx(15))))
    return P
_P0=O.persp(8,10,None,(0.5,0.5,0.2))[0];ZF=np.array((1,1,1/abs(_P0((0,0,1))[1]-_P0((0,0,0))[1])))   # ほぼ正面の写し方では、たての1マスが画面で1.27マスになるので、たてをちぢめて、手の形をそのまま見せる
def scene(rot):
    sc=O.Scene();sc.smooth(True)
    for nm,tris in parts():
        sc.part()
        for a,b,c in tris:
            ce=np.array((CX,CY,0.22))
            f=lambda v:ce+ZF*(roty(rot)@(np.array(v)-ce))
            sc.tri(f(a),f(b),f(c),SKIN)
    sc.smooth(False);return sc
LIGHTV=np.array((-0.55,0.35,0.75))/np.linalg.norm((-0.55,0.35,0.75))   # 左上・手前からの光
TONEL=(0.86,0.24,-0.18)   # 面の向きと光の内積：つやの白・明るいはだ・はだ（それより下は、かげ）
def shot(rot):
    """写した絵と、ドットごとの面の向き・部品のさかいの線（oblique3d.LAST_N・LAST_LINE）を、絵のある所で切ってかえす"""
    O.GRAD=True;O.LIGHT=LIGHTV
    sc=scene(rot);V=np.array([v for t in sc.t for v in t[:3]]);c=(V[:,0].mean(),V[:,1].mean(),V[:,2].mean())
    PROJ,DEPTH=O.persp(8,10,None,c);P=np.array([PROJ(v) for v in V]);m=2/64;ext=(P[:,0].min()-m,P[:,0].max()+m,P[:,1].min()-m,P[:,1].max()+m);O.S=64
    im=O.render_px(sc,PROJ,ext,DEPTH,k=0.80,lw=1,k2=0.90,merge=6);bb=im.getbbox()
    cut=lambda a:a[bb[1]:bb[3],bb[0]:bb[2]]
    return im.crop(bb),cut(O.LAST_N.copy()),cut(O.LAST_LINE.copy())
def tone(r):
    """前の絵の5色にする：まわりのふちと部品のさかいは輪郭。中は、面の向きと光の内積（TONEL）で、つや・明るいはだ・はだ・かげ"""
    im,N,LN=r;a=np.array(im);A=a[...,3]>0
    pad=np.pad(A,1);edge=A&~(pad[:-2,1:-1]&pad[2:,1:-1]&pad[1:-1,:-2]&pad[1:-1,2:])
    d=N@LIGHTV;out=np.zeros_like(a);out[A,3]=255;inn=A&~edge&~LN
    out[A,:3]=OL
    for col,m in ((SH,inn),(SKIN,inn&(d>=TONEL[2])),(LT,inn&(d>=TONEL[1])),(HL,inn&(d>=TONEL[0]))):out[m,:3]=col
    return Image.fromarray(out)
def tip(im,d):
    """指先の点：d='up' いちばん上の行のまん中・'down' いちばん下・'left' いちばん左の列のまん中"""
    a=np.array(im)[...,3]>0;ys,xs=np.nonzero(a)
    if d=='up':y=ys.min();x=xs[ys==y].mean();return x,y
    if d=='down':y=ys.max();x=xs[ys==y].mean();return x,y
    x=xs.min();y=ys[xs==x].mean();return x,y
def place(im,d,size,at):
    """size の絵に、指先が at にくるように置く"""
    can=Image.new('RGBA',size,(0,0,0,0));tx,ty=tip(im,d);can.alpha_composite(im,(int(round(at[0]-tx)),int(round(at[1]-ty))));return can
def main(out,game=False):
    os.makedirs(out,exist_ok=True);old={k:Image.open(os.path.join(HERE,v+'.webp')).convert('RGBA') for k,v in OLD.items()}
    global K
    def fit(rot,ref):   # 前の絵の手の大きさ（はば・高さ）に入る、いちばん大きな K で写す
        global K;hb=ref.getbbox();ww,hh=hb[2]-hb[0],hb[3]-hb[1];K=1.0
        for _ in range(5):im=shot(rot)[0];K*=min(ww/im.width,hh/im.height)
        r=tone(shot(rot));print('向き',rot,'大きさ',round(K,3),r.size,'前の絵',(ww,hh));return r
    od0=old['down'].crop((0,0,old['down'].width//2,old['down'].height))
    up=fit(0,old['up']);dn=fit(180,od0);lf=fit(-90,old['left'])
    U=place(up,'up',old['up'].size,tip(old['up'],'up'))
    od=old['down'];w=od.width//2;o0=od.crop((0,0,w,od.height));o1=od.crop((w,0,od.width,od.height))
    t0=tip(o0,'down');D0=place(dn,'down',o0.size,t0)
    a1=np.array(o1);hand1=a1.copy();lines=a1.copy()
    hy=tip(o0,'down')[1]+2   # おすコマの指先（前の絵：ふつうより2ドット下）
    lines[:int(hy)+1]=0;hand1[int(hy)+1:]=0   # 前の絵の、指先より下（タップの線）だけのこす
    D1=place(dn,'down',o1.size,(t0[0],t0[1]+2));D1.alpha_composite(Image.fromarray(lines))
    D=Image.new('RGBA',od.size,(0,0,0,0));D.alpha_composite(D0,(0,0));D.alpha_composite(D1,(w,0))
    Lf=place(lf,'left',old['left'].size,tip(old['left'],'left'))
    res={'up':U,'down':D,'left':Lf}
    for k,v in res.items():
        v.save(os.path.join(out,'finger3d-%s.png'%k));
        cmp=Image.new('RGBA',(old[k].width*2+6,old[k].height),(150,190,120,255));cmp.alpha_composite(old[k],(0,0));cmp.alpha_composite(v,(old[k].width+6,0))
        cmp.resize((cmp.width*10,cmp.height*10),Image.NEAREST).save(os.path.join(out,'cmp-%s_x10.png'%k))
    if game:
        idx=os.path.join(ROOT,'index.html');s=open(idx,encoding='utf8').read()
        for k,v in res.items():
            import io;b=io.BytesIO();v.save(b,'WEBP',lossless=True,exact=True,quality=100,method=6);data=b.getvalue()
            nm=hashlib.sha1(data).hexdigest()[:10];open(os.path.join(ROOT,'assets','g',nm+'.webp'),'wb').write(data)
            cur=re.search(r'#tutHand \.fing \.%s\{[^}]*?url\(assets/g/([0-9a-f]{10})\.webp\)'%{'up':'fu','down':'fd','left':'fl'}[k],s).group(1)
            s=s.replace('assets/g/%s.webp'%cur,'assets/g/%s.webp'%nm);print(k,cur,'→',nm)
        open(idx,'w',encoding='utf8').write(s)
if __name__=='__main__':main(sys.argv[1],'--game' in sys.argv)
