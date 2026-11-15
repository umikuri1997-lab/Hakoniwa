#!/usr/bin/env python3
"""持ち主のトリポのモデル（生き物15こ、色なしの FBX）を、1つずつの glb（色つき）にする。家畜（にわとり・ひつじ・やぎ）と小動物。
  1) python3 tools/art/models/tripo_split.py <FBX> <フォルダ> --faces 20000   → <フォルダ>/_all.glb
  2) python3 tools/art/animals/animal_prep.py <フォルダ>/_all.glb             → tools/art/models/animals/<名前>.glb
わけ方：点のつながりで部品にし、3Dで重なる部品を1つの生き物にまとめる（上から見ただけで重なる物はまとめない）。
向き：モデルの生き物は、どれも、おく（北東）を向いているので、180度まわして顔を手前（南西）へ。
色：目は2つとも EYE（片がわを CHEEK にして、片目がピンクになった）。部品ごと（SPEC の parts：部品の番号→色、'drop' はすてる）と、からだの場所ごと（region）。部品の番号は、部品のラベルの小さい順（tools/art/animals の seglab で見た番号）。
構造の直し（fix）：みつばちの羽を小さく（お手本の大きさ）。ねずみのしっぽの先の玉は、お手本ではわた毛なので、白くしてのこす。
色は、写すときに白に MODEL_SOFT（0.3）まぜるので、こくして（deep）しまう。"""
import sys,os,numpy as np,trimesh
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
HERE=os.path.dirname(os.path.abspath(__file__));OUT=os.path.join(HERE,'..','models','animals')
EYE=(70,58,66);CHEEK=(246,170,180);MOUTH=(156,96,96)
def deep(c,k=0.3):return tuple(max(0,min(255,round((v-255*k)/(1-k)))) for v in c)
# 生き物ごと：名前・からだの色・部品の色・場所の色（x,y：まん中から・z：地面から。どれも高さ H でわった数）
SPEC={   # 色は、持ち主のお手本の絵（生き物15この絵）に合わせる
 0:dict(name='usagi',body=(248,240,226),parts={3:EYE,6:EYE,5:EYE,4:(252,248,240)}),
 1:dict(name='kaeru',body=(184,208,122),parts={6:EYE,5:EYE},region=lambda x,y,z:(242,238,204) if (0.9*y-0.4*x)>0.12 and z<0.6 else None),   # おなか：顔のがわ（手前・左）の下
 2:dict(name='niwatori',body=(250,244,226),parts={3:(244,182,84),7:EYE,6:EYE,1:(242,170,96),2:(242,170,96)}),
 3:dict(name='harinezumi',body=(222,204,170),parts={8:(120,84,70),6:EYE,7:EYE,12:CHEEK,9:(246,226,202)},region=lambda x,y,z:(246,226,202) if (x<-0.12 and z<0.62) or z<0.18 else None),
 4:dict(name='hitsuji',body=(238,224,238),parts={17:(246,226,204),18:(246,226,204),19:EYE,14:EYE,15:MOUTH,12:(246,226,204),13:(246,226,204),16:(246,226,204)},small=(246,178,198)),
 5:dict(name='mitsubachi',body=(250,224,124),parts={7:(246,248,250),9:(246,248,250),6:EYE,1:EYE,5:MOUTH,8:(250,220,110),10:(250,220,110),12:(170,130,96),13:(170,130,96),2:(196,150,110),3:(196,150,110),4:(196,150,110),11:(196,150,110)},fix='bee'),
 6:dict(name='tentoumushi',body=(246,232,200),parts={4:(228,98,88),6:(244,222,190),14:EYE,12:EYE,13:MOUTH,1:(170,130,100)},keep=(4,6,14,12,13,1)),
 7:dict(name='hotaru',body=(196,152,112),parts={3:(252,244,170),6:(252,244,170),8:(196,152,112),1:(246,248,250),2:(246,248,250),4:(206,164,124),10:EYE,12:EYE,9:MOUTH,5:(250,220,110),11:(250,220,110),13:(170,130,96),14:(170,130,96),0:(170,130,96)}),
 8:dict(name='yagi',body=(248,240,222),parts={4:(188,198,112),1:(188,198,112),5:EYE,3:EYE,2:MOUTH},region=lambda x,y,z:(170,140,112) if z<0.07 else (200,206,128) if (hash((round(x*7),round(y*7),round(z*7)))%8==0 and z>0.3) else None),
 9:dict(name='katatsumuri',body=(244,190,198),parts={3:(246,230,202),0:EYE,1:CHEEK,9:(250,220,110),8:(250,220,110),13:(246,230,202),14:(246,230,202),5:EYE,4:MOUTH,2:CHEEK}),
 10:dict(name='mogura',body=(206,202,196),parts={16:EYE,17:EYE,7:CHEEK,0:(242,202,192),9:(242,202,192),10:(242,202,192),13:(242,202,192)},region=lambda x,y,z:(176,150,130),spot=(206,202,196)),
 # 11 ちょう：持ち主のきめで、ゲームのいまのちょう（critter3d）を使う。ここでは作らない
 11:dict(name=None,skip=1,body=(248,236,214),parts={7:(246,190,204),0:(246,190,204),11:(246,190,204),1:(246,190,204),6:EYE,4:EYE,5:MOUTH,8:(230,200,160),3:(230,200,160),10:(220,190,150),9:(220,190,150)}),
 12:dict(name='risu',body=(236,180,120),parts={10:(186,140,96),12:(166,122,84),7:(236,180,120),2:(246,224,196),1:(246,224,196),13:(232,172,112),11:EYE,8:EYE,9:MOUTH}),
 13:dict(name='tonbo',body=(172,206,120),parts={7:(222,240,226),10:(222,240,226),2:(222,240,226),1:(222,240,226),0:(222,240,226),11:(172,206,120),3:(150,212,204),12:(150,212,204),9:EYE,8:EYE,6:EYE}),
 14:dict(name='nezumi',body=(240,196,150),parts={5:(252,250,246),10:(252,250,246),11:(244,196,190),4:(244,196,190),13:(232,186,140),6:EYE,7:MOUTH,8:MOUTH,0:(244,196,190),1:(244,196,190),2:(244,196,190),12:(244,196,190)}),
}
def comps(V,F):
    e=np.r_[F[:,[0,1]],F[:,[1,2]]];g=coo_matrix((np.ones(len(e)),(e[:,0],e[:,1])),shape=(len(V),)*2)
    return connected_components(g,directed=False)[1][F[:,0]]
def objects(G,F,fl):
    ids=np.unique(fl);bb={c:np.r_[G[np.unique(F[fl==c])].min(0),G[np.unique(F[fl==c])].max(0)] for c in ids};par={c:c for c in ids}
    def f(i):
        while par[i]!=i:i=par[i]
        return i
    L=list(ids)
    for i in range(len(L)):
        a=bb[L[i]]
        for j in range(i+1,len(L)):
            b=bb[L[j]]
            if all(a[k]-0.003<=b[k+3] and b[k]-0.003<=a[k+3] for k in range(3)):par[f(L[i])]=f(L[j])
    grp={}
    for c in ids:grp.setdefault(f(c),[]).append(c)
    objs=[np.flatnonzero(np.isin(fl,v)) for v in grp.values()];objs=[o for o in objs if len(o)>50]
    objs.sort(key=lambda o:(round(-G[np.unique(F[o])][:,1].mean()*20),G[np.unique(F[o])][:,0].mean()))   # もとのならび（180度まわす前の、手前の列から・左から。seglab の番号）
    return objs
def ball(c,r,n=2):
    s=trimesh.creation.icosphere(subdivisions=n,radius=r);return np.asarray(s.vertices)+c,np.asarray(s.faces)
def run(src):
    m=trimesh.load(src,force='mesh');V=np.asarray(m.vertices);F=np.asarray(m.faces)
    G=np.c_[-V[:,0],V[:,2],V[:,1]]   # 180度まわして（顔を手前へ）、x東・y南・z上
    fl=comps(V,F);objs=objects(np.c_[V[:,0],-V[:,2],V[:,1]],F,fl);os.makedirs(OUT,exist_ok=True)
    for k,o in enumerate(objs):
        sp=SPEC[k]
        if sp.get('skip'):continue
        vi=np.unique(F[o]);c=G[vi].mean(0);z0=G[vi][:,2].min();H=G[vi][:,2].max()-z0
        cs=fl[o];u=list(np.unique(cs));idx=np.array([u.index(x) for x in cs]);T=G[F[o]].copy()
        body=max((i for i in range(len(u)) if sp['parts'].get(i)!='drop'),key=lambda i:(idx==i).sum())   # からだ：すてない部品で、いちばん大きい物
        cols=[];tris=[]
        for fi,(t,i) in enumerate(zip(T,idx)):
            col=sp['parts'].get(i)
            if col=='drop':continue
            if 'keep' in sp and i not in sp['keep'] and i!=body:col=sp['body']   # てんとう虫：のこりの小さな部品（もよう）は、黒い点
            if col is None:
                p=t.mean(0);x,y,z=(p[0]-c[0])/H,(p[1]-c[1])/H,(p[2]-z0)/H
                if i==body and sp.get('region'):col=sp['region'](x,y,z)
                if col is None and i!=body and sp.get('small'):col=sp['small']
                if col is None and i!=body and sp.get('spot'):col=sp['spot']
                if col is None:col=sp['body']
            cols.append(col);tris.append(t)
        tris=np.array(tris)
        if sp.get('fix')=='bee':   # みつばちの羽（大きすぎる）：からだに近いはしを中心に、0.6倍に
            for i in(7,9):
                sel=np.array([idx[j]==i for j in range(len(T)) if sp['parts'].get(idx[j])!='drop'])
                P=tris[sel].reshape(-1,3);bc=G[F[o][idx==body]].reshape(-1,3).mean(0);root=P[np.linalg.norm(P-bc,axis=1).argmin()]
                tris[sel]=root+(tris[sel]-root)*0.6
        # 目：左右で形・大きさがちがうので、どの目も、同じ大きさの、たいらな玉にかえる（目の場所と向きは、もとの目から）
        ei=[i for i in range(len(u)) if sp['parts'].get(i)==EYE]
        if ei:
            bc=G[F[o][idx==body]].reshape(-1,3).mean(0);info=[]
            for i in ei:
                P=T[idx==i].reshape(-1,3);ec=P.mean(0);r=np.percentile(np.linalg.norm(P-ec,axis=1),80);info.append((i,ec,r))
            R=float(np.median([r for _,_,r in info]))
            keep=np.array([sp['parts'].get(idx[j])!=EYE for j in range(len(T)) if sp['parts'].get(idx[j])!='drop'])
            tris=tris[keep];cols=[c_ for c_,k_ in zip(cols,keep) if k_]
            for i,ec,r in info:
                nrm=ec-bc;nrm/=np.linalg.norm(nrm)+1e-12
                bv,bf=ball(np.zeros(3),1.0);bv=bv*R;bv-=np.outer(bv@nrm,nrm)*0.55   # 向きの方向に、うすく
                tris=np.concatenate([tris,(bv+ec)[bf]]);cols+=[EYE]*len(bf)
        Vt=tris.reshape(-1,3).copy();Vt[:,0]-=c[0];Vt[:,1]-=c[1];Vt[:,2]-=z0
        out=np.c_[Vt[:,0],Vt[:,2],Vt[:,1]]   # glTF：x 右・y 上・+z 手前
        CC=np.repeat(np.array([deep(q) for q in cols]),3,0)
        tm=trimesh.Trimesh(out,np.arange(len(out)).reshape(-1,3),vertex_colors=np.c_[CC,np.full(len(CC),255)].astype(np.uint8),process=False)
        tm.export(os.path.join(OUT,sp['name']+'.glb'));print(k,sp['name'],len(tris),'面')
if __name__=='__main__':run(sys.argv[1])
