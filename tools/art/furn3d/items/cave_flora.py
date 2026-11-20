# 洞窟の植物を、1まいずつの葉から組む道具（持ち主のたのみ：地面の植物を、ちゃんとした形に）。玉で葉を作らない（CLAUDE.md）。
# 葉は、平らなリボン（芯にそって、はばのかわる、うすい面。両面）。くきは管（tube）、光る実だけ玉。
import math
import numpy as np
def ribbon(sc,sp,ws,col,gi,up=(0,0,1.0)):
    """芯 sp（3Dの点のならび）にそって、はば ws（それぞれの点の半はば）の平らな葉。面は up の向きに近いほうを上に"""
    sp=[np.array(p,float) for p in sp];U=np.array(up,float);L,R=[],[]
    for i,p in enumerate(sp):
        tg=sp[min(i+1,len(sp)-1)]-sp[max(i-1,0)];tg/=np.linalg.norm(tg)+1e-12;s=np.cross(tg,U)
        if np.linalg.norm(s)<1e-6:s=np.array([1.0,0,0])
        s/=np.linalg.norm(s);L.append(p+s*ws[i]);R.append(p-s*ws[i])
    sc.texture(None);sc.material(None);sc.group(gi);sc.part()
    for i in range(len(sp)-1):
        for a,b,c in((L[i],R[i],R[i+1]),(L[i],R[i+1],L[i+1])):sc.tri(a,b,c,col);sc.tri(a,c,b,col)
    sc.group(None)
def arc(base,ang,R,H,n=8,droop=0.35):
    """根もとから、ang（度）の向きへ、半径 R・高さ H の弓なり（先は少したれる）"""
    a=math.radians(ang);d=np.array([math.cos(a),math.sin(a),0.0]);pts=[]
    for i in range(n+1):
        t=i/n;pts.append(np.array(base,float)+d*R*t+np.array([0,0,H*(math.sin(math.pi*t*(1-droop*0.5)))-H*droop*t*t]))
    return pts
def fern(sc,c,R,H,col,col2,nf=7,seed=0,gi='f',z0=0.01):
    """シダ：根もとから nf 本の葉（葉軸＋左右の小葉）。小葉は、先ほど小さい"""
    rs=np.random.RandomState(seed)
    for f in range(nf):
        ang=f*360/nf+rs.uniform(-18,18);r=R*rs.uniform(.75,1.1);h=H*rs.uniform(.8,1.15);sp=arc((c[0],c[1],z0),ang,r,h)
        g='%s%d'%(gi,f);ribbon(sc,sp,[0.012*(1-i/len(sp))+0.004 for i in range(len(sp))],col2,g)
        for i in range(1,len(sp)-1):
            t=i/(len(sp)-1);p=sp[i];tg=sp[i+1]-sp[i-1];tg/=np.linalg.norm(tg);side=np.cross(tg,[0,0,1.0]);side/=np.linalg.norm(side)+1e-12
            ln=r*0.34*(1-t)**0.7+0.02
            for sg in(-1,1):
                q=[p,p+side*sg*ln*0.5+tg*ln*0.18+np.array([0,0,0.01]),p+side*sg*ln+tg*ln*0.35-np.array([0,0,0.015])]
                ribbon(sc,q,[0.012,0.018*(1-t*0.4),0.002],col,g)
def rosette(sc,c,R,col,n=9,seed=0,gi='r'):
    """地面をおおう、まるい葉のロゼット（ひくい）"""
    rs=np.random.RandomState(seed)
    for f in range(n):
        ang=f*360/n+rs.uniform(-12,12);r=R*rs.uniform(.7,1.05);sp=arc((c[0],c[1],0.005),ang,r,0.05*r/R+0.02,n=6,droop=0.6)
        ws=[0.01,0.045,0.06,0.055,0.04,0.02,0.002];ribbon(sc,sp,[w*r/R*1.1 for w in ws],col,'%s%d'%(gi,f))
def bulbs(sc,c,H,stem,bulb,leaf,n=5,seed=0,gi='b'):
    """光る実の植物：根もとに広い葉、まがった細いくきの先に、光る実（玉）"""
    from blueprint import Part
    rs=np.random.RandomState(seed);rosette(sc,c,0.28,leaf,n=6,seed=seed+3,gi=gi+'l')
    for f in range(n):
        ang=f*360/n+rs.uniform(-20,20);a=math.radians(ang);r=rs.uniform(.04,.16);h=H*rs.uniform(.55,1.0)
        p0=np.array([c[0],c[1],0.02]);p1=p0+np.array([math.cos(a)*r*0.5,math.sin(a)*r*0.5,h*0.6]);p2=p0+np.array([math.cos(a)*r,math.sin(a)*r,h])
        sc.texture(None);sc.material(None);sc.group(None);sc.tube([tuple(p0),tuple(p1),tuple(p2)],0.009,stem)
        sc.sphere(p2[0],p2[1],p2[2]+0.025,0.035+rs.uniform(0,.015),bulb,n=10,m=6)
def blades(sc,c,H,col,n=12,spread=0.16,seed=0,gi='g',bend=0.5):
    """細長い草の葉のむら：根もとから、少しまがりながら上へのびる、細い葉"""
    rs=np.random.RandomState(seed)
    for f in range(n):
        ang=rs.uniform(0,360);a=math.radians(ang);r=rs.uniform(.02,spread);h=H*rs.uniform(.5,1.0);b=rs.uniform(.3,1.0)*bend*h
        base=np.array([c[0]+math.cos(a)*r*0.4,c[1]+math.sin(a)*r*0.4,0.0]);d=np.array([math.cos(a),math.sin(a),0.0])
        sp=[base+d*b*(t*t)+np.array([0,0,h*t]) for t in np.linspace(0,1,6)]
        ribbon(sc,sp,[0.018,0.016,0.013,0.01,0.006,0.001],col,'%s%d'%(gi,f),up=(-d[1],d[0],0.0))
def broad(sc,c,R,H,col,n=6,seed=0,gi='w'):
    """広い葉の草：短いくきの先に、上へそりかえる、だ円の大きな葉"""
    rs=np.random.RandomState(seed)
    for f in range(n):
        ang=f*360/n+rs.uniform(-15,15);r=R*rs.uniform(.75,1.05);h=H*rs.uniform(.7,1.1);sp=arc((c[0],c[1],0.01),ang,r,h,n=7,droop=0.5)
        ribbon(sc,sp,[0.006,0.03,0.07,0.085,0.075,0.05,0.02,0.002],col,'%s%d'%(gi,f))
def reeds(sc,c,H,stem,head,n=7,seed=0,gi='e'):
    """アシ：細いまっすぐなくきの先に、ほそながい穂"""
    rs=np.random.RandomState(seed)
    for f in range(n):
        a=rs.uniform(0,6.28);r=rs.uniform(0,.12);h=H*rs.uniform(.6,1.0);lean=rs.uniform(-.08,.08)
        p0=np.array([c[0]+math.cos(a)*r,c[1]+math.sin(a)*r,0.0]);p1=p0+np.array([lean,0,h])
        sc.texture(None);sc.material(None);sc.group(None);sc.tube([tuple(p0),tuple(p1)],0.006,stem)
        ribbon(sc,[p1,p1+np.array([lean*0.3,0,0.06]),p1+np.array([lean*0.5,0,0.12])],[0.016,0.02,0.004],head,'%s%d'%(gi,f),up=(0,1.0,0))
    blades(sc,c,H*0.45,stem,n=6,spread=0.12,seed=seed+1,gi=gi+'b')
def glowcaps(sc,c,H,stem,cap,n=7,seed=0,gi='m'):
    """光るきのこの小さなむれ：細いじくに、ひらいた小さなかさ（玉にしない）"""
    rs=np.random.RandomState(seed)
    for f in range(n):
        a=rs.uniform(0,6.28);r=rs.uniform(0,.16);h=H*rs.uniform(.35,1.0);cr=0.03+h*0.12
        x,y=c[0]+math.cos(a)*r,c[1]+math.sin(a)*r
        sc.texture(None);sc.material(None);sc.group(None);sc.tube([(x,y,0.0),(x,y,h)],0.007,stem)
        sc.revolve(x,y,[(cr,h-0.004),(cr*0.95,h+cr*0.25),(cr*0.6,h+cr*0.5),(0.0,h+cr*0.6)],lambda k_,i:cap,n=14)
def flowers(sc,c,H,stem,petal,center,n=6,seed=0,gi='h'):
    """小さな花：細いくきの先に、5まいの花びら（リボン）と、まん中"""
    rs=np.random.RandomState(seed);blades(sc,c,H*0.5,stem,n=7,spread=0.14,seed=seed+2,gi=gi+'b')
    for f in range(n):
        a=rs.uniform(0,6.28);r=rs.uniform(0,.16);h=H*rs.uniform(.6,1.0);x,y=c[0]+math.cos(a)*r,c[1]+math.sin(a)*r;top=np.array([x,y,h])
        sc.texture(None);sc.material(None);sc.group(None);sc.tube([(x,y,0.0),(x+rs.uniform(-.03,.03),y,h)],0.005,stem)
        for k in range(5):
            b=k*2*math.pi/5+rs.uniform(0,.3);d=np.array([math.cos(b),math.sin(b),0.25])
            ribbon(sc,[top,top+d*0.025,top+d*0.045],[0.004,0.016,0.002],petal,'%s%d_%d'%(gi,f,k))
        sc.sphere(x,y,h+0.008,0.011,center,n=8,m=5)
def clean(im):
    """写したあと：まわり8ドットに何もない、ぽつんとした1ドット（細い葉の先の切れはし）をけす"""
    from PIL import Image
    a=np.array(im);al=a[...,3]>0;P=np.pad(al,1);nb=sum(P[1+dy:1+dy+al.shape[0],1+dx:1+dx+al.shape[1]] for dy in(-1,0,1) for dx in(-1,0,1) if dy or dx)
    a[al&(nb==0)]=0;return Image.fromarray(a)
def twigs(sc,c,H,col,depth=3,n=4,seed=0):
    """かれた枝のしげみ：根もとから、えだわかれしながら上・外へのびる、細い枝（葉はない）"""
    rs=np.random.RandomState(seed);sc.texture(None);sc.material(None);sc.group(None)
    def br(p,d,l,r,k):
        q=p+d*l;sc.tube([tuple(p),tuple(q)],r,col)
        if k<=0:return
        for _ in range(2):
            a=rs.uniform(-0.9,0.9);b=rs.uniform(0,6.28);nd=d+np.array([math.cos(b)*a,math.sin(b)*a,0.15]);nd/=np.linalg.norm(nd)
            br(q,nd,l*rs.uniform(.55,.75),r*0.7,k-1)
    for f in range(n):
        b=f*6.28/n+rs.uniform(-.4,.4);d=np.array([math.cos(b)*0.45,math.sin(b)*0.45,1.0]);d/=np.linalg.norm(d)
        br(np.array([c[0],c[1],0.0]),d,H*0.45,0.012,depth)
def horsetail(sc,c,H,col,col2,n=7,seed=0):
    """トクサ：ふしのある、まっすぐな細いくきの、ふしごとに、細い葉が輪になって生える"""
    rs=np.random.RandomState(seed);sc.texture(None);sc.material(None);sc.group(None)
    for f in range(n):
        a=rs.uniform(0,6.28);r=rs.uniform(0,.15);h=H*rs.uniform(.55,1.0);x,y=c[0]+math.cos(a)*r,c[1]+math.sin(a)*r;lean=rs.uniform(-.05,.05)
        sc.tube([(x,y,0.0),(x+lean,y,h)],0.011,col)
        for k in range(1,6):
            z=h*k/6;xx=x+lean*k/6
            for m in range(6):
                b=m*6.28/6;d=np.array([math.cos(b),math.sin(b),-0.5]);p0=np.array([xx,y,z])
                ribbon(sc,[p0,p0+d*0.035,p0+d*0.06],[0.004,0.004,0.001],col2,'h%d_%d_%d'%(f,k,m))
            sc.sphere(xx,y,z,0.013,col2,n=8,m=4)
def cycad(sc,c,H,trunk,frond,frond2,nf=10,seed=0):
    """ソテツ：太く短いみき（うろこのある lathe）の上に、まわりへ広がる、かたい羽の葉"""
    rs=np.random.RandomState(seed);sc.texture(None);sc.material(None);sc.group(None)
    prof=[(0.0,0.0),(0.11,0.0)]+[(0.1+0.012*((i%2)*2-1),H*0.45*i/8) for i in range(1,9)]+[(0.0,H*0.47)]
    sc.revolve(c[0],c[1],prof,lambda k_,i:trunk,n=16)
    top=(c[0],c[1],H*0.45)
    for f in range(nf):
        ang=f*360/nf+rs.uniform(-10,10);sp=arc(top,ang,H*rs.uniform(.55,.7),H*0.3,n=8,droop=0.7)
        ribbon(sc,sp,[0.01*(1-i/len(sp))+0.003 for i in range(len(sp))],frond2,'y%d'%f)
        for i in range(1,len(sp)-1):
            p=sp[i];tg=sp[i+1]-sp[i-1];tg/=np.linalg.norm(tg);side=np.cross(tg,[0,0,1.0]);side/=np.linalg.norm(side)+1e-12;ln=0.08*(1-i/len(sp))+0.03
            for sg in(-1,1):ribbon(sc,[p,p+side*sg*ln*0.6+tg*0.01,p+side*sg*ln+tg*0.03],[0.006,0.01,0.002],frond,'y%d'%f)
def treefern(sc,c,H,trunk,col,col2,seed=0):
    """木のようなシダ：細いみきの先から、大きなシダの葉が、かさのように広がる"""
    sc.texture(None);sc.material(None);sc.group(None)
    sc.tube([(c[0],c[1],0.0),(c[0]+0.02,c[1],H*0.55),(c[0]+0.03,c[1],H*0.7)],0.03,trunk)
    fern(sc,(c[0]+0.03,c[1]),H*0.75,H*0.18,col,col2,nf=9,seed=seed,gi='t',z0=H*0.7)
