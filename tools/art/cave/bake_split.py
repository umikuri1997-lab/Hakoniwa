"""洞窟のバケモノのモデル（tools/art/models/cave/bk_<名前>.glb）で、たれたうでと足が1まいの面でくっついている所を、モデルで切りはなす。
  python3 tools/art/cave/bake_split.py tame
1. 骨の重み（bake_rig.weights）で、点ごとにいちばん重い骨をきめる。
2. うでの骨と足の骨（木の上ではなれた骨）にまたがる面は、先のほうの骨（うで）の物にする。
3. うでの面と足の面の両方が使う点は、うでのがわに点をふやして分ける（同じ場所だと重みでまたつながるので、うでの骨のほうへ少しだけずらす）。
4. 分けてできた、あいたふち（うでがわ・足がわ）を、ふちのまん中の点からの三角形でふさぐ（外を向くように）。色は、ふちの点の色の平均。
直したモデルは同じ名前で書きなおす（もとは git にのこる）。"""
import sys,os
HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE);sys.path.insert(0,os.path.join(HERE,'..'))
import numpy as np,trimesh
import blueprint as bp,bake_rig as br
SHIFT=.004   # ふやした点を、自分の骨のほうへずらす長さ（モデルの高さを1として）

def segpt(P,a,b):
    a=np.asarray(a,float);b=np.asarray(b,float);d=b-a;t=np.clip(((P-a)@d)/max(d@d,1e-9),0,1);return a+t[:,None]*d

def main(name):
    path=os.path.join(bp.MODELS,'cave','bk_%s.glb'%name)
    sc=trimesh.load(path,force='scene');(node,),=[list(sc.graph.nodes_geometry)];T,gn=sc.graph[node];g=sc.geometry[gn]
    RV=np.asarray(g.vertices,float);RF=np.asarray(g.faces);RC=np.asarray(g.visual.vertex_colors)
    V,F,C=bp.model_tris('cave/bk_%s.glb'%name,.5,.5,0,1.0,0,0)
    assert len(V)==len(RV) and (F==RF).all()
    W,P,B,H,cx,cy=br.weights(name,V,F);TD=br._TD[name];dm=W.argmax(1);nb=len(B)
    k=(V[:,2].max()-V[:,2].min())/(RV[:,1].max()-RV[:,1].min())   # model_tris の大きさ（もとのモデル→ゲームの点）
    d3=dm[F];cf=(TD[d3[:,0],d3[:,1]]>2)|(TD[d3[:,1],d3[:,2]]>2)|(TD[d3[:,0],d3[:,2]]>2)
    # 面ごとの持ち主の骨：ふつうは点の骨のいちばん多い物。またがる面は、まん中に近いほうの骨
    fo=np.array([np.bincount(f,minlength=nb).argmax() for f in d3])
    cen=P[F].mean(1);ix={B[i][0]:i for i in range(nb)}
    def depth(b):
        d=0
        while B[b][1]:b=ix[B[b][1]];d+=1
        return d
    dep=[depth(b) for b in range(nb)]
    for i in np.where(cf)[0]:
        cand=sorted(set(d3[i]));fo[i]=min(cand,key=lambda b:(-dep[b],np.linalg.norm(cen[i]-segpt(cen[i][None],B[b][2],B[b][3])[0])))   # 先のほうの骨（うで）の物にする。足のがわは、ふちをふさぐ（足に、うでの面のきれはしがのこらない）
    # 点ごとに、使う面の持ち主の骨を、木の上で2いないでつながるまとまりに分ける。2つ以上なら、点の骨のまとまりいがいに点をふやす
    vo={}
    for i,f in enumerate(RF):
        for v in f:vo.setdefault(v,set()).add(fo[i])
    NV=[RV];NC=[RC];newid={};n=len(RV)
    def gameDelta(v,b):
        q=segpt(P[v][None],B[b][2],B[b][3])[0]-P[v];l=np.linalg.norm(q);return q/l*SHIFT if l>1e-9 else np.zeros(3)
    vgrp={}   # (点, 持ち主の骨) → まとまりの代表
    for v,os_ in vo.items():
        os_=sorted(os_);cl=[]
        for o in os_:
            hit=[c for c in cl if any(TD[o,x]<=2 for x in c)]
            nc={o}
            for c in hit:nc|=c;cl.remove(c)
            cl.append(nc)
        if len(cl)<2:continue
        home=next((c for c in cl if any(TD[dm[v],x]<=2 for x in c)),max(cl,key=len))
        for c in cl:
            if c is home:continue
            b=min(c,key=lambda b:np.linalg.norm(P[v]-segpt(P[v][None],B[b][2],B[b][3])[0]))
            dg=gameDelta(v,b)*H/k   # ゲームの点（高さで正規化）→もとのモデル
            NV.append((RV[v]+np.array([dg[0],dg[2],dg[1]]))[None]);NC.append(RC[v][None])
            for o in c:newid[(v,o)]=n
            n+=1
    NF=RF.copy()
    for i,f in enumerate(RF):
        for j in range(3):
            key=(f[j],fo[i])
            if key in newid:NF[i,j]=newid[key]
    NV=np.concatenate(NV);NC=np.concatenate(NC)
    # あいたふち（もとからあいていた所もふくむ）を、ふちのまん中の点からの三角形でふさぐ。面の向きは、となりの面と反対まわり
    m=trimesh.Trimesh(NV,NF,vertex_colors=NC,process=False);m.merge_vertices()
    NV=np.array(m.vertices);NF=np.array(m.faces);NC=np.array(m.visual.vertex_colors)
    de=set()
    for f in NF:de|={(f[0],f[1]),(f[1],f[2]),(f[2],f[0])}
    caps=[];addV=[];addC=[];nn=len(NV)
    fl=trimesh.graph.connected_component_labels(m.face_adjacency,node_count=len(NF));vl=np.full(len(NV),-1)
    for i,f in enumerate(NF):vl[f]=fl[i]
    loops=[]
    for e in m.outline().entities:   # ふちを、つながった部品ごとにわける（うでと足のふちをいっしょにふさがない）
        pts=list(e.points)
        if e.closed and pts[0]==pts[-1]:pts=pts[:-1]
        prs=list(zip(pts,pts[1:]+([pts[0]] if e.closed else [])))
        for c_ in set(vl[pts]):
            pr=[(p,q) for p,q in prs if vl[p]==c_ and vl[q]==c_]
            if len(pr)>=2:loops.append(pr)
    for prs in loops:
        pts=sorted(set(x for pq in prs for x in pq))
        addV.append(NV[pts].mean(0));addC.append(NC[pts].mean(0).astype(np.uint8));ci=nn;nn+=1
        for p,q in prs:caps.append([q,p,ci] if (p,q) in de else [p,q,ci])
    if addV:NV=np.concatenate([NV,np.array(addV)]);NC=np.concatenate([NC,np.array(addC)])
    NF2=np.concatenate([NF,np.array(caps,int).reshape(-1,3)])
    m=trimesh.Trimesh(NV,NF2,vertex_colors=NC,process=False)
    print(name,'またがる面',int(cf.sum()),'ふやした点',len(set(newid.values())),'ふさいだ面',len(caps))
    m.export(path)

if __name__=='__main__':
    for a in sys.argv[1:]:main(a)
